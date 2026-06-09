// Contexto que distribui os dados operacionais para toda a aplicação.
//
// Dois modos:
//  - CSV (padrão): faz polling dos arquivos em /data e reflete edições.
//  - Simulação ao vivo: a partir da base atual, varia os números sozinho a
//    cada poucos segundos (útil para apresentações). Liga/desliga pela UI.

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchDadosOperacionais, type DadosOperacionais } from "./dataSource";
import { simulateStep } from "./simulacao";
import { naviosMock, bercosMock, indicadoresMock } from "./mockData";
import type { Navio, Berco, IndicadorOperacional } from "./mockData";

interface DadosContextValue {
  navios: Navio[];
  bercos: Berco[];
  indicadores: IndicadorOperacional;
  ultimaAtualizacao: Date | null;
  carregando: boolean;
  erro: string | null;
  /** Modo simulação ao vivo (variação automática dos números). */
  simular: boolean;
  setSimular: (v: boolean) => void;
  /** Força uma releitura imediata dos CSVs. */
  atualizar: () => void;
}

const DadosContext = createContext<DadosContextValue | null>(null);

// Intervalos (ms). Podem ser sobrescritos via variáveis de ambiente.
const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL) || 5000;
const SIM_INTERVAL = Number(import.meta.env.VITE_SIM_INTERVAL) || 2500;

const dadosIniciais: DadosOperacionais = {
  navios: naviosMock,
  bercos: bercosMock,
  indicadores: indicadoresMock,
};

export function DadosProvider({ children }: { children: ReactNode }) {
  // Semente com os dados mock: a primeira pintura nunca fica vazia e, se o
  // fetch falhar, a aplicação continua exibindo dados coerentes.
  const [dados, setDados] = useState<DadosOperacionais>(dadosIniciais);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [simular, setSimular] = useState(false);

  // Disparador usado por atualizar() para forçar uma releitura dos CSVs.
  const [tick, setTick] = useState(0);
  const montadoRef = useRef(true);

  // ---- Modo CSV: polling dos arquivos (pausado durante a simulação) ----
  useEffect(() => {
    if (simular) return;
    montadoRef.current = true;
    let timer: ReturnType<typeof setTimeout>;

    async function carregar() {
      try {
        const novos = await fetchDadosOperacionais();
        if (!montadoRef.current) return;
        setDados(novos);
        setUltimaAtualizacao(new Date());
        setErro(null);
      } catch (e) {
        if (!montadoRef.current) return;
        // Mantém os últimos dados válidos e sinaliza o erro.
        setErro(e instanceof Error ? e.message : "Erro ao carregar dados");
      } finally {
        if (montadoRef.current) {
          setCarregando(false);
          timer = setTimeout(carregar, POLL_INTERVAL);
        }
      }
    }

    carregar();

    return () => {
      montadoRef.current = false;
      clearTimeout(timer);
    };
  }, [tick, simular]);

  // ---- Modo simulação: random walk sobre a base atual ----
  useEffect(() => {
    if (!simular) return;
    setErro(null);
    const id = setInterval(() => {
      setDados((prev) => simulateStep(prev));
      setUltimaAtualizacao(new Date());
    }, SIM_INTERVAL);

    return () => clearInterval(id);
  }, [simular]);

  const value: DadosContextValue = {
    navios: dados.navios,
    bercos: dados.bercos,
    indicadores: dados.indicadores,
    ultimaAtualizacao,
    carregando,
    erro,
    simular,
    setSimular,
    atualizar: () => setTick((t) => t + 1),
  };

  return <DadosContext.Provider value={value}>{children}</DadosContext.Provider>;
}

export function useDadosOperacionais(): DadosContextValue {
  const ctx = useContext(DadosContext);
  if (!ctx) {
    throw new Error("useDadosOperacionais deve ser usado dentro de <DadosProvider>");
  }
  return ctx;
}
