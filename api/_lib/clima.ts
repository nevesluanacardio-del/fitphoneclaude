// Integração de clima real via Open-Meteo (gratuito, sem chave de API).
// Busca altura de onda (Marine API) e vento (Forecast API) nas coordenadas do
// Porto do Itaqui e deriva statusClimatico / riscoClimatico. O resultado é
// cacheado por alguns minutos para não exceder limites e não pesar no polling.

import type { IndicadoresDTO, NavioDTO, BercoDTO } from "./baseDados.js";

const ITAQUI = { lat: -2.575, lon: -44.371 };
const TTL_MS = 10 * 60 * 1000; // 10 min

export interface Clima {
  statusClimatico: NavioDTO["statusClimatico"];
  riscoClimatico: number; // 0-100
  detalhe: {
    alturaOndaM: number | null;
    ventoNo: number | null;
    rajadaNo: number | null;
    fonte: "open-meteo" | "indisponível";
    atualizadoEm: string;
  };
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

function classificar(alturaOndaM: number, ventoNo: number): Clima {
  // Onda de ~3 m e vento de ~30 nós já representam condição severa.
  const risco = Math.round(
    clamp((alturaOndaM / 3) * 55 + (ventoNo / 30) * 45, 0, 100)
  );
  const statusClimatico =
    risco < 30 ? "Favorável" : risco < 60 ? "Atenção" : "Desfavorável";
  return {
    statusClimatico,
    riscoClimatico: risco,
    detalhe: {
      alturaOndaM,
      ventoNo,
      rajadaNo: null,
      fonte: "open-meteo",
      atualizadoEm: new Date().toISOString(),
    },
  };
}

const CLIMA_NEUTRO: Clima = {
  statusClimatico: "Favorável",
  riscoClimatico: 30,
  detalhe: {
    alturaOndaM: null,
    ventoNo: null,
    rajadaNo: null,
    fonte: "indisponível",
    atualizadoEm: new Date(0).toISOString(),
  },
};

let cache: { at: number; data: Clima } | null = null;

export async function obterClima(): Promise<Clima> {
  if (cache && Date.now() - cache.at < TTL_MS) return cache.data;

  const marineUrl =
    `https://marine-api.open-meteo.com/v1/marine?latitude=${ITAQUI.lat}` +
    `&longitude=${ITAQUI.lon}&current=wave_height`;
  const windUrl =
    `https://api.open-meteo.com/v1/forecast?latitude=${ITAQUI.lat}` +
    `&longitude=${ITAQUI.lon}&current=wind_speed_10m,wind_gusts_10m&wind_speed_unit=kn`;

  try {
    const [marineRes, windRes] = await Promise.all([
      fetch(marineUrl),
      fetch(windUrl),
    ]);
    const marine = marineRes.ok ? await marineRes.json() : null;
    const wind = windRes.ok ? await windRes.json() : null;

    const altura = Number(marine?.current?.wave_height);
    const vento = Number(wind?.current?.wind_speed_10m);
    const rajada = Number(wind?.current?.wind_gusts_10m);

    if (!Number.isFinite(altura) && !Number.isFinite(vento)) {
      throw new Error("resposta sem dados utilizáveis");
    }

    const clima = classificar(
      Number.isFinite(altura) ? altura : 0,
      Number.isFinite(vento) ? vento : 0
    );
    if (Number.isFinite(rajada)) clima.detalhe.rajadaNo = rajada;

    cache = { at: Date.now(), data: clima };
    return clima;
  } catch {
    // Mantém o último valor válido ou cai para um neutro, sem quebrar a API.
    return cache?.data ?? CLIMA_NEUTRO;
  }
}

// Aplica o clima real sobre um conjunto de dados: ajusta o KPI de risco, o
// status climático de todos os navios e — quando o clima está DESFAVORÁVEL —
// INTERROMPE a operação dos berços ocupados (condições climáticas podem parar
// operações, conforme o cenário do desafio).
export function aplicarClima<
  T extends { navios: NavioDTO[]; bercos: BercoDTO[]; indicadores: IndicadoresDTO }
>(dados: T, clima: Clima): T {
  const interrompe = clima.statusClimatico === "Desfavorável";
  return {
    ...dados,
    navios: dados.navios.map((n) => ({
      ...n,
      statusClimatico: clima.statusClimatico,
    })),
    bercos: dados.bercos.map((b) => ({
      ...b,
      operacaoInterrompida: interrompe && b.status === "Ocupado",
    })),
    indicadores: { ...dados.indicadores, riscoClimatico: clima.riscoClimatico },
  };
}
