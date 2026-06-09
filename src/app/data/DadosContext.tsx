// Contexto que distribui os dados operacionais para toda a aplicação e os
// mantém atualizados via polling dos CSVs em /data. Um único polling alimenta
// todas as páginas (Dashboard, Berços, Fila, Recomendação).

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { fetchDadosOperacionais } from "./dataSource";
import { naviosMock, bercosMock, indicadoresMock } from "./mockData";
import type { Navio, Berco, IndicadorOperacional } from "./mockData";

interface DadosContextValue {
  navios: Navio[];
  bercos: Berco[];
  indicadores: IndicadorOperacional;
  ultimaAtualizacao: Date | null;
  carregando: boolean;
  erro: string | null;
  /** Força uma releitura imediata dos dados. */
  atualizar: () => void;
}

const DadosContext = createContext<DadosContextValue | null>(null);

// Intervalo de polling (ms). Pode ser sobrescrito via VITE_POLL_INTERVAL.
const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL) || 5000;

export function DadosProvider({ children }: { children: ReactNode }) {
  // Semente com os dados mock: a primeira pintura nunca fica vazia e, se o
  // fetch falhar, a aplicação continua exibindo dados coerentes.
  const [navios, setNavios] = useState<Navio[]>(naviosMock);
  const [bercos, setBercos] = useState<Berco[]>(bercosMock);
  const [indicadores, setIndicadores] = useState<IndicadorOperacional>(indicadoresMock);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  // Disparador usado por atualizar() para forçar uma releitura.
  const [tick, setTick] = useState(0);
  const montadoRef = useRef(true);

  useEffect(() => {
    montadoRef.current = true;
    let timer: ReturnType<typeof setTimeout>;

    async function carregar() {
      try {
        const dados = await fetchDadosOperacionais();
        if (!montadoRef.current) return;
        setNavios(dados.navios);
        setBercos(dados.bercos);
        setIndicadores(dados.indicadores);
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
  }, [tick]);

  const value: DadosContextValue = {
    navios,
    bercos,
    indicadores,
    ultimaAtualizacao,
    carregando,
    erro,
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
