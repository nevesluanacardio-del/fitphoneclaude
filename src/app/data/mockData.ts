export interface Navio {
  id: string;
  nome: string;
  tipoCarga: "Grãos" | "Contêineres" | "Combustíveis" | "Multiuso";
  tempoEspera: number; // em horas
  prioridade: "Alta" | "Média" | "Baixa" | "Crítica";
  bercoCompativel: string[];
  statusClimatico: "Favorável" | "Atenção" | "Desfavorável";
  tamanho: number; // em metros
  cargaToneladas: number;
  chegada: Date;
  previsaoAtracacao?: Date;
  indiceDinamico?: number;
}

export interface Berco {
  id: string;
  nome: string;
  tipo: "Grãos" | "Contêineres" | "Combustíveis" | "Multiuso";
  status: "Ocupado" | "Livre" | "Manutenção";
  navioAtual?: string;
  tempoOcupacao?: number; // em horas
  previsaoLiberacao?: Date;
  capacidadeMaxima: number; // em toneladas
  utilizacao: number; // percentual
  operacaoInterrompida?: boolean; // operação parada por clima desfavorável
}

export interface IndicadorOperacional {
  tempoMedioEspera: number;
  tamanhoFila: number;
  utilizacaoBercos: number;
  naviosAtrasoCritico: number;
  riscoClimatico: number;
  congestionamentoPrevisto: number;
}

// Mock data
export const naviosMock: Navio[] = [
  {
    id: "N001",
    nome: "Atlântico Trader",
    tipoCarga: "Grãos",
    tempoEspera: 8.5,
    prioridade: "Alta",
    bercoCompativel: ["B1"],
    statusClimatico: "Favorável",
    tamanho: 225,
    cargaToneladas: 45000,
    chegada: new Date(2026, 5, 3, 14, 30),
    indiceDinamico: 87.5,
  },
  {
    id: "N002",
    nome: "Container Express VII",
    tipoCarga: "Contêineres",
    tempoEspera: 12.2,
    prioridade: "Crítica",
    bercoCompativel: ["B2"],
    statusClimatico: "Atenção",
    tamanho: 280,
    cargaToneladas: 38000,
    chegada: new Date(2026, 5, 3, 10, 15),
    indiceDinamico: 94.2,
  },
  {
    id: "N003",
    nome: "Petro Max",
    tipoCarga: "Combustíveis",
    tempoEspera: 4.8,
    prioridade: "Média",
    bercoCompativel: ["B3"],
    statusClimatico: "Favorável",
    tamanho: 195,
    cargaToneladas: 52000,
    chegada: new Date(2026, 5, 4, 1, 45),
    indiceDinamico: 72.8,
  },
  {
    id: "N004",
    nome: "Marília Cargo",
    tipoCarga: "Multiuso",
    tempoEspera: 15.7,
    prioridade: "Alta",
    bercoCompativel: ["B4"],
    statusClimatico: "Desfavorável",
    tamanho: 210,
    cargaToneladas: 28000,
    chegada: new Date(2026, 5, 3, 6, 0),
    indiceDinamico: 88.9,
  },
  {
    id: "N005",
    nome: "Cereal Star",
    tipoCarga: "Grãos",
    tempoEspera: 6.3,
    prioridade: "Média",
    bercoCompativel: ["B1"],
    statusClimatico: "Favorável",
    tamanho: 240,
    cargaToneladas: 51000,
    chegada: new Date(2026, 5, 3, 18, 20),
    indiceDinamico: 76.4,
  },
  {
    id: "N006",
    nome: "Asia Connect II",
    tipoCarga: "Contêineres",
    tempoEspera: 9.1,
    prioridade: "Alta",
    bercoCompativel: ["B2"],
    statusClimatico: "Favorável",
    tamanho: 295,
    cargaToneladas: 42000,
    chegada: new Date(2026, 5, 3, 13, 50),
    indiceDinamico: 83.7,
  },
  {
    id: "N007",
    nome: "Multi Carrier",
    tipoCarga: "Multiuso",
    tempoEspera: 3.2,
    prioridade: "Baixa",
    bercoCompativel: ["B4"],
    statusClimatico: "Favorável",
    tamanho: 185,
    cargaToneladas: 22000,
    chegada: new Date(2026, 5, 4, 3, 30),
    indiceDinamico: 65.1,
  },
];

export const bercosMock: Berco[] = [
  {
    id: "B1",
    nome: "Berço 1 - Grãos Sólidos",
    tipo: "Grãos",
    status: "Ocupado",
    navioAtual: "Soja Express",
    tempoOcupacao: 6.5,
    previsaoLiberacao: new Date(2026, 5, 4, 14, 30),
    capacidadeMaxima: 60000,
    utilizacao: 78,
  },
  {
    id: "B2",
    nome: "Berço 2 - Contêineres",
    tipo: "Contêineres",
    status: "Livre",
    capacidadeMaxima: 50000,
    utilizacao: 0,
  },
  {
    id: "B3",
    nome: "Berço 3 - Combustíveis",
    tipo: "Combustíveis",
    status: "Ocupado",
    navioAtual: "Oil Tanker 5",
    tempoOcupacao: 11.2,
    previsaoLiberacao: new Date(2026, 5, 4, 18, 45),
    capacidadeMaxima: 70000,
    utilizacao: 92,
  },
  {
    id: "B4",
    nome: "Berço 4 - Multiuso",
    tipo: "Multiuso",
    status: "Ocupado",
    navioAtual: "General Cargo III",
    tempoOcupacao: 4.8,
    previsaoLiberacao: new Date(2026, 5, 4, 11, 20),
    capacidadeMaxima: 45000,
    utilizacao: 65,
  },
];

export const indicadoresMock: IndicadorOperacional = {
  tempoMedioEspera: 8.4,
  tamanhoFila: 7,
  utilizacaoBercos: 75,
  naviosAtrasoCritico: 2,
  riscoClimatico: 35,
  congestionamentoPrevisto: 62,
};
