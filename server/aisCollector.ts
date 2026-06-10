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

// Bounding box cobrindo a Baía de São Marcos e fundeadouros do Itaqui.
const BBOX: number[][][] = [[[-3.3, -44.7], [-2.2, -43.8]]];

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
      console.log("[ais] conectado ao aisstream — ouvindo a Baía de São Marcos");
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
  const navios = construirFila(vessels.values(), agora).map((n) => ({
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
