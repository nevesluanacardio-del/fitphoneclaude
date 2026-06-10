// Contexto que distribui os dados operacionais para toda a aplicação.
//
// A fonte (/api/dados) é uma SIMULAÇÃO M/G/4 ao vivo: a cada polling o estado
// evolui sozinho (navios chegam, atracam e liberam berços). O botão "Acelerar"
// adianta o relógio da simulação (fast-forward), útil para apresentações.

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
  /** Fast-forward da simulação ao vivo. */
  acelerar: boolean;
  setAcelerar: (v: boolean) => void;
  /** Força uma releitura imediata. */
  atualizar: () => void;
}

const DadosContext = createContext<DadosContextValue | null>(null);

const POLL_INTERVAL = Number(import.meta.env.VITE_POLL_INTERVAL) || 5000;
const FATOR_ACELERACAO = Number(import.meta.env.VITE_ACELERACAO) || 8;

export function DadosProvider({ children }: { children: ReactNode }) {
  // Semente com os dados mock: a primeira pintura nunca fica vazia e, se o
  // fetch falhar, a aplicação continua exibindo dados coerentes.
  const [navios, setNavios] = useState<Navio[]>(naviosMock);
  const [bercos, setBercos] = useState<Berco[]>(bercosMock);
  const [indicadores, setIndicadores] = useState<IndicadorOperacional>(indicadoresMock);
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [acelerar, setAcelerar] = useState(false);

  const [tick, setTick] = useState(0);
  const montadoRef = useRef(true);
  const acelerarRef = useRef(acelerar);
  acelerarRef.current = acelerar;

  useEffect(() => {
    montadoRef.current = true;
    let timer: ReturnType<typeof setTimeout>;

    async function carregar() {
      try {
        const dados = await fetchDadosOperacionais(acelerarRef.current ? FATOR_ACELERACAO : 1);
        if (!montadoRef.current) return;
        setNavios(dados.navios);
        setBercos(dados.bercos);
        setIndicadores(dados.indicadores);
        setUltimaAtualizacao(new Date());
        setErro(null);
      } catch (e) {
        if (!montadoRef.current) return;
        setErro(e instanceof Error ? e.message : "Erro ao carregar dados");
      } finally {
        if (montadoRef.current) {
          setCarregando(false);
          // Acelerado → polling mais frequente, para ver a fila evoluir rápido.
          timer = setTimeout(carregar, acelerarRef.current ? POLL_INTERVAL / 2.5 : POLL_INTERVAL);
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
    acelerar,
    setAcelerar: (v: boolean) => {
      setAcelerar(v);
      setTick((t) => t + 1); // reinicia o loop com o novo ritmo imediatamente
    },
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
