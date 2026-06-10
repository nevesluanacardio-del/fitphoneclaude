// Compõe a resposta da API: simulação M/G/4 ao vivo (gerarDados) + clima real
// (Open-Meteo). Ponto único usado por todos os ambientes (Vite dev/preview,
// Vercel, Netlify e o coletor AIS), garantindo a mesma resposta em todos.
//
// `aceleracao` adianta o relógio da simulação (fast-forward do dashboard).

import { gerarDados, type DadosResponse } from "./gerarDados.js";
import { obterClima, aplicarClima, type Clima } from "./clima.js";

export interface DadosComClima extends DadosResponse {
  clima: Clima;
}

export async function obterDados(
  now: number = Date.now(),
  aceleracao = 1
): Promise<DadosComClima> {
  const base = gerarDados(now, aceleracao);
  const clima = await obterClima();
  return { ...aplicarClima(base, clima), clima };
}
