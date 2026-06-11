// Coletor AIS: mantém uma conexão WebSocket com o aisstream.io, acumula as
// embarcações na Baía de São Marcos (aproximações do Porto do Itaqui) e expõe
// o MESMO contrato /api/dados que a aplicação já consome.
//
// Por que um serviço à parte? O AIS exige conexão persistente — não cabe em
// função serverless. Rode com `npm run ais` e aponte o app via VITE_API_URL.
//
// Configuração (variáveis de ambiente):
//   AISSTREAM_API_KEY  chave grátis do aisstream.io (login GitHub). Obrigatória
//                      para dados reais; sem ela, serve os dados simulados.
//   PORT               porta HTTP (padrão 8787)
//
// Sem a chave, o serviço continua funcionando com os dados simulados, então o
// app nunca fica sem resposta.

import "dotenv/config"; // carrega .env automaticamente (ignorado se não existir)
import http from "node:http";
import WebSocket from "ws";
import { obterDados } from "../api/_lib/obterDados";
import { construirFila, type VesselState } from "./aisMapping";

const API_KEY = process.env.AISSTREAM_API_KEY;
const PORT = Number(process.env.PORT) || 8787;
const STALE_MS = 15 * 60 * 1000; // descarta embarcações sem atualização há 15min

// Região monitorada (bounding box). Padrão: Baía de São Marcos / Itaqui.
// Configurável via AIS_BBOX="sul,oeste,norte,leste" (graus decimais) para apontar
// para uma área mais movimentada — ex.: Estreito de Singapura, Canal da Mancha.
function lerBbox(): number[][][] {
  const env = process.env.AIS_BBOX;
  if (env) {
    const n = env.split(",").map((x) => Number(x.trim()));
    if (n.length === 4 && n.every(Number.isFinite)) {
      const [sul, oeste, norte, leste] = n;
      return [[[sul, oeste], [norte, leste]]];
    }
    console.warn(`[ais] AIS_BBOX inválido ("${env}") — usando o padrão (São Marcos).`);
  }
  return [[[-3.3, -44.7], [-2.2, -43.8]]];
}
const BBOX: number[][][] = lerBbox();
// Ponto de referência (centro da região) para estimar espera/ETA dos navios.
const REF = {
  lat: (BBOX[0][0][0] + BBOX[0][1][0]) / 2,
  lon: (BBOX[0][0][1] + BBOX[0][1][1]) / 2,
};

const vessels = new Map<number, VesselState>();

function upsert(mmsi: number, patch: Partial<VesselState>) {
  const agora = Date.now();
  const atual = vessels.get(mmsi);
  if (atual) {
    Object.assign(atual, patch, { ultimaVez: agora });
  } else {
    vessels.set(mmsi, {
      mmsi,
      primeiraVez: agora,
      ultimaVez: agora,
      ...patch,
    });
  }
}

function prune() {
  const limite = Date.now() - STALE_MS;
  for (const [mmsi, v] of vessels) {
    if (v.ultimaVez < limite) vessels.delete(mmsi);
  }
}
setInterval(prune, 60_000).unref();

// ---- Conexão AIS (com reconexão e backoff) ----
function conectarAis() {
  if (!API_KEY) return;
  let backoff = 1000;
  const conectar = () => {
    const ws = new WebSocket("wss://stream.aisstream.io/v0/stream");

    ws.on("open", () => {
      backoff = 1000;
      ws.send(
        JSON.stringify({
          APIKey: API_KEY,
          BoundingBoxes: BBOX,
          FilterMessageTypes: ["PositionReport", "ShipStaticData"],
        })
      );
      const [[s, w], [n, e]] = BBOX[0];
      console.log(`[ais] conectado ao aisstream — região: lat ${s}..${n}, lon ${w}..${e}`);
    });

    ws.on("message", (data: WebSocket.RawData) => {
      try {
        const msg = JSON.parse(data.toString());
        const mmsi: number | undefined = msg?.MetaData?.MMSI;
        if (!mmsi) return;

        if (msg.MessageType === "PositionReport") {
          const p = msg.Message.PositionReport;
          upsert(mmsi, {
            lat: p.Latitude,
            lon: p.Longitude,
            sog: p.Sog,
            navStatus: p.NavigationalStatus,
            nome: msg.MetaData.ShipName?.trim() || undefined,
          });
        } else if (msg.MessageType === "ShipStaticData") {
          const s = msg.Message.ShipStaticData;
          const dim = s.Dimension ?? {};
          upsert(mmsi, {
            nome: (s.Name || msg.MetaData.ShipName || "").trim() || undefined,
            tipoAis: s.Type,
            comprimento: (dim.A ?? 0) + (dim.B ?? 0) || undefined,
            caladoMax: s.MaximumStaticDraught || undefined,
          });
        }
      } catch {
        /* mensagem malformada — ignora */
      }
    });

    const reagendar = () => {
      backoff = Math.min(backoff * 2, 30_000);
      console.warn(`[ais] desconectado — reconectando em ${backoff / 1000}s`);
      setTimeout(conectar, backoff);
    };
    ws.on("close", reagendar);
    ws.on("error", (e) => {
      console.warn("[ais] erro:", (e as Error).message);
      ws.close();
    });
  };
  conectar();
}

// ---- Servidor HTTP: /api/dados ----
async function montarResposta(aceleracao = 1) {
  const agora = Date.now();
  const base = await obterDados(agora, aceleracao); // dados + clima real

  // Sem chave ou ainda sem embarcações observadas → dados simulados.
  if (!API_KEY || vessels.size === 0) {
    return { ...base, fonte: API_KEY ? "ais-aguardando" : "simulado" };
  }

  // Navios reais do AIS, com o status climático da baía (do clima real).
  const navios = construirFila(vessels.values(), agora, REF).map((n) => ({
    ...n,
    statusClimatico: base.clima.statusClimatico,
  }));
  return {
    ...base,
    navios,
    indicadores: {
      ...base.indicadores,
      tamanhoFila: navios.length,
      naviosAtrasoCritico: navios.filter((n) => n.prioridade === "Crítica").length,
    },
    fonte: "ais",
  };
}

const server = http.createServer((req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  const [path, query] = (req.url || "").split("?");
  if (path === "/api/dados") {
    const acel = Number(new URLSearchParams(query || "").get("aceleracao")) || 1;
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    montarResposta(acel)
      .then((r) => res.end(JSON.stringify(r)))
      .catch((e) => {
        res.statusCode = 500;
        res.end(JSON.stringify({ erro: String(e) }));
      });
    return;
  }
  res.statusCode = 404;
  res.end("Not found");
});

server.listen(PORT, () => {
  console.log(`[ais] /api/dados em http://localhost:${PORT}/api/dados`);
  if (!API_KEY) {
    console.warn(
      "[ais] AISSTREAM_API_KEY não definida — servindo dados SIMULADOS.\n" +
        "      Gere uma chave grátis em https://aisstream.io e rode:\n" +
        "      AISSTREAM_API_KEY=suachave npm run ais"
    );
  }
  conectarAis();
});
