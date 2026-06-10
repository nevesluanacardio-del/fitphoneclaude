// Compõe a resposta da API: dados operacionais (gerarDados) + clima real
// (Open-Meteo). É o ponto único usado por todos os ambientes (Vite dev/preview,
// Vercel, Netlify e o coletor AIS), garantindo a mesma resposta em todos.

import { gerarDados, type DadosResponse } from "./gerarDados";
import { obterClima, aplicarClima, type Clima } from "./clima";

export interface DadosComClima extends DadosResponse {
  clima: Clima;
}

export async function obterDados(now: number = Date.now()): Promise<DadosComClima> {
  const base = gerarDados(now);
  const clima = await obterClima();
  return { ...aplicarClima(base, clima), clima };
}
