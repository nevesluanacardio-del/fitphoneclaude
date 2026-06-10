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
} from "./baseDados.js";
import { alocarNavios } from "./alocacao.js";

export interface DadosResponse {
  geradoEm: string;
  navios: NavioDTO[];
  bercos: BercoDTO[];
  indicadores: IndicadoresDTO;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));
const round1 = (v: number) => Math.round(v * 10) / 10;

// Navios que rotacionam atracando nos berços ao longo dos ciclos.
const NAVIO_POOL = [
  "Soja Express", "Oil Tanker 5", "General Cargo III", "MSC Itaqui",
  "Cereal Star", "Atlântico Trader", "Petro Max", "Asia Connect II",
  "Marília Cargo", "Iron Carrier", "Pan Ocean", "Bulk Voyager",
];

// Ciclo de cada berço (em segundos) e frações do ciclo em cada estado.
// Períodos curtos e distintos → atracações/desatracações visíveis e
// dessincronizadas. O B2 tem o ciclo mais curto (ocupa com frequência).
const CICLO = [
  { periodo: 44, ocup: 0.62, manut: 0.0, horasMax: 16 }, // B1
  { periodo: 28, ocup: 0.58, manut: 0.0, horasMax: 10 }, // B2
  { periodo: 54, ocup: 0.70, manut: 0.08, horasMax: 20 }, // B3
  { periodo: 36, ocup: 0.52, manut: 0.06, horasMax: 13 }, // B4
];

// Gera o estado dinâmico de cada berço em função do tempo: cada berço cicla
// entre Ocupado → Livre → (às vezes) Manutenção. Os navios que atracam são
// alocados a partir da fila (navios), respeitando a prioridade de cada um.
function gerarBercos(now: number, t: number, navios: NavioDTO[]): BercoDTO[] {
  // 1) Plano de ocupação de cada berço neste instante.
  const planos = baseBercos.map((b, i) => {
    const c = CICLO[i];
    const fase = (t % c.periodo) / c.periodo; // 0..1 dentro do ciclo
    if (c.manut > 0 && fase >= 1 - c.manut) {
      return { b, i, status: "Manutenção" as const, progresso: 0 };
    }
    if (fase < c.ocup) {
      return { b, i, status: "Ocupado" as const, progresso: fase / c.ocup };
    }
    return { b, i, status: "Livre" as const, progresso: 0 };
  });

  // 2) Aloca navios da fila aos berços ocupados, por prioridade.
  const ocupados = planos.filter((p) => p.status === "Ocupado").map((p) => p.b.id);
  const alocacao = alocarNavios(navios, ocupados);

  // 3) Monta cada berço.
  return planos.map(({ b, i, status, progresso }) => {
    const base = {
      id: b.id,
      nome: b.nome,
      tipo: b.tipo,
      capacidadeMaxima: b.capacidadeMaxima,
    };
    if (status !== "Ocupado") {
      return { ...base, status, utilizacao: 0 };
    }
    const c = CICLO[i];
    const navio = alocacao.get(b.id);
    // Sem navio compatível na fila → mostra um navio genérico do pool.
    const navioAtual =
      navio?.nome ?? NAVIO_POOL[(Math.floor(t / c.periodo) + i * 5) % NAVIO_POOL.length];
    const horasRestantes = (1 - progresso) * c.horasMax;
    return {
      ...base,
      status,
      navioAtual,
      tempoOcupacao: round1(progresso * c.horasMax),
      previsaoLiberacao: new Date(now + horasRestantes * 3_600_000).toISOString(),
      utilizacao: Math.round(clamp(50 + progresso * 40 + osc(t, 7, i, 8), 30, 100)),
    };
  });
}

// Oscilador suave: período em segundos, fase, amplitude (compartilhado).
function osc(t: number, periodo: number, fase: number, amp: number) {
  return Math.sin((2 * Math.PI * t) / periodo + fase) * amp;
}

export function gerarDados(now: number = Date.now()): DadosResponse {
  const t = now / 1000; // segundos

  const navios: NavioDTO[] = baseNavios.map((n, i) => ({
    ...n,
    tempoEspera: round1(clamp(n.tempoEspera + osc(t, 35, i, 1.2), 0, 48)),
    indiceDinamico: round1(clamp(n.indiceDinamico + osc(t, 30, i * 0.7, 4), 0, 100)),
  }));

  const bercos = gerarBercos(now, t, navios);

  // Navios que estão ATRACADOS saem da fila de espera (não aparecem em ambos).
  const atracados = new Set(
    bercos.filter((b) => b.status === "Ocupado" && b.navioAtual).map((b) => b.navioAtual)
  );
  const fila = navios.filter((n) => !atracados.has(n.nome));

  // KPI de utilização derivado dos berços, mantendo coerência entre as telas.
  const ativos = bercos.filter((b) => b.status !== "Manutenção");
  const utilizacaoBercos = ativos.length
    ? Math.round(ativos.reduce((a, b) => a + b.utilizacao, 0) / ativos.length)
    : baseIndicadores.utilizacaoBercos;

  const indicadores: IndicadoresDTO = {
    tempoMedioEspera: round1(clamp(baseIndicadores.tempoMedioEspera + osc(t, 40, 0, 1.8), 1, 24)),
    tamanhoFila: fila.length, // navios efetivamente aguardando atracação
    utilizacaoBercos,
    naviosAtrasoCritico: fila.filter((n) => n.prioridade === "Crítica").length,
    riscoClimatico: Math.round(clamp(baseIndicadores.riscoClimatico + osc(t, 55, 0.5, 12), 0, 100)),
    congestionamentoPrevisto: Math.round(clamp(baseIndicadores.congestionamentoPrevisto + osc(t, 48, 3, 12), 0, 100)),
  };

  return { geradoEm: new Date(now).toISOString(), navios: fila, bercos, indicadores };
}
