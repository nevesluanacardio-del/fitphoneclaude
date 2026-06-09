// Gerador de dados da API. A partir da base, aplica uma variação suave e
// determinística no tempo (osciladores senoidais com períodos/fases distintos),
// de modo que cada requisição reflita valores "vivos" sem precisar manter
// estado entre chamadas — ideal para funções serverless (stateless).

import {
  baseNavios,
  baseBercos,
  baseIndicadores,
  type NavioDTO,
  type BercoDTO,
  type IndicadoresDTO,
} from "./baseDados";

export interface DadosResponse {
  geradoEm: string;
  navios: NavioDTO[];
  bercos: BercoDTO[];
  indicadores: IndicadoresDTO;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

export function gerarDados(now: number = Date.now()): DadosResponse {
  const t = now / 1000; // segundos
  // Oscilador suave: período em segundos, fase, amplitude.
  const osc = (periodo: number, fase: number, amp: number) =>
    Math.sin((2 * Math.PI * t) / periodo + fase) * amp;

  const navios: NavioDTO[] = baseNavios.map((n, i) => ({
    ...n,
    tempoEspera: round1(clamp(n.tempoEspera + osc(35, i, 1.2), 0, 48)),
    indiceDinamico: round1(clamp(n.indiceDinamico + osc(30, i * 0.7, 4), 0, 100)),
  }));

  const bercos: BercoDTO[] = baseBercos.map((b, i) =>
    b.status === "Ocupado"
      ? { ...b, utilizacao: Math.round(clamp(b.utilizacao + osc(33, i, 8), 0, 100)) }
      : b
  );

  // KPI de utilização derivado dos berços, mantendo coerência entre as telas.
  const ativos = bercos.filter((b) => b.status !== "Manutenção");
  const utilizacaoBercos = ativos.length
    ? Math.round(ativos.reduce((a, b) => a + b.utilizacao, 0) / ativos.length)
    : baseIndicadores.utilizacaoBercos;

  const indicadores: IndicadoresDTO = {
    tempoMedioEspera: round1(clamp(baseIndicadores.tempoMedioEspera + osc(40, 0, 1.8), 1, 24)),
    tamanhoFila: Math.round(clamp(baseIndicadores.tamanhoFila + osc(70, 1, 1.5), 0, 20)),
    utilizacaoBercos,
    naviosAtrasoCritico: Math.round(clamp(baseIndicadores.naviosAtrasoCritico + osc(90, 2, 1.2), 0, 10)),
    riscoClimatico: Math.round(clamp(baseIndicadores.riscoClimatico + osc(55, 0.5, 12), 0, 100)),
    congestionamentoPrevisto: Math.round(clamp(baseIndicadores.congestionamentoPrevisto + osc(48, 3, 12), 0, 100)),
  };

  return { geradoEm: new Date(now).toISOString(), navios, bercos, indicadores };
}
