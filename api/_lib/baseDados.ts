// Base de dados da API (a "fonte da verdade" do backend).
// Datas em ISO 8601 para serialização direta em JSON.

export interface NavioDTO {
  id: string;
  nome: string;
  tipoCarga: "Grãos" | "Contêineres" | "Combustíveis" | "Multiuso";
  tempoEspera: number;
  prioridade: "Alta" | "Média" | "Baixa" | "Crítica";
  bercoCompativel: string[];
  statusClimatico: "Favorável" | "Atenção" | "Desfavorável";
  tamanho: number;
  cargaToneladas: number;
  chegada: string;
  indiceDinamico: number;
}

export interface BercoDTO {
  id: string;
  nome: string;
  tipo: "Grãos" | "Contêineres" | "Combustíveis" | "Multiuso";
  status: "Ocupado" | "Livre" | "Manutenção";
  navioAtual?: string;
  tempoOcupacao?: number;
  previsaoLiberacao?: string;
  capacidadeMaxima: number;
  utilizacao: number;
}

export interface IndicadoresDTO {
  tempoMedioEspera: number;
  tamanhoFila: number;
  utilizacaoBercos: number;
  naviosAtrasoCritico: number;
  riscoClimatico: number;
  congestionamentoPrevisto: number;
}

export const baseNavios: NavioDTO[] = [
  { id: "N001", nome: "Atlântico Trader", tipoCarga: "Grãos", tempoEspera: 8.5, prioridade: "Alta", bercoCompativel: ["B1"], statusClimatico: "Favorável", tamanho: 225, cargaToneladas: 45000, chegada: "2026-06-03T14:30:00", indiceDinamico: 87.5 },
  { id: "N002", nome: "Container Express VII", tipoCarga: "Contêineres", tempoEspera: 12.2, prioridade: "Crítica", bercoCompativel: ["B2"], statusClimatico: "Atenção", tamanho: 280, cargaToneladas: 38000, chegada: "2026-06-03T10:15:00", indiceDinamico: 94.2 },
  { id: "N003", nome: "Petro Max", tipoCarga: "Combustíveis", tempoEspera: 4.8, prioridade: "Média", bercoCompativel: ["B3"], statusClimatico: "Favorável", tamanho: 195, cargaToneladas: 52000, chegada: "2026-06-04T01:45:00", indiceDinamico: 72.8 },
  { id: "N004", nome: "Marília Cargo", tipoCarga: "Multiuso", tempoEspera: 15.7, prioridade: "Alta", bercoCompativel: ["B4"], statusClimatico: "Desfavorável", tamanho: 210, cargaToneladas: 28000, chegada: "2026-06-03T06:00:00", indiceDinamico: 88.9 },
  { id: "N005", nome: "Cereal Star", tipoCarga: "Grãos", tempoEspera: 6.3, prioridade: "Média", bercoCompativel: ["B1"], statusClimatico: "Favorável", tamanho: 240, cargaToneladas: 51000, chegada: "2026-06-03T18:20:00", indiceDinamico: 76.4 },
  { id: "N006", nome: "Asia Connect II", tipoCarga: "Contêineres", tempoEspera: 9.1, prioridade: "Alta", bercoCompativel: ["B2"], statusClimatico: "Favorável", tamanho: 295, cargaToneladas: 42000, chegada: "2026-06-03T13:50:00", indiceDinamico: 83.7 },
  { id: "N007", nome: "Multi Carrier", tipoCarga: "Multiuso", tempoEspera: 3.2, prioridade: "Baixa", bercoCompativel: ["B4"], statusClimatico: "Favorável", tamanho: 185, cargaToneladas: 22000, chegada: "2026-06-04T03:30:00", indiceDinamico: 65.1 },
];

export const baseBercos: BercoDTO[] = [
  { id: "B1", nome: "Berço 1 - Grãos Sólidos", tipo: "Grãos", status: "Ocupado", navioAtual: "Soja Express", tempoOcupacao: 6.5, previsaoLiberacao: "2026-06-04T14:30:00", capacidadeMaxima: 60000, utilizacao: 78 },
  { id: "B2", nome: "Berço 2 - Contêineres", tipo: "Contêineres", status: "Livre", capacidadeMaxima: 50000, utilizacao: 0 },
  { id: "B3", nome: "Berço 3 - Combustíveis", tipo: "Combustíveis", status: "Ocupado", navioAtual: "Oil Tanker 5", tempoOcupacao: 11.2, previsaoLiberacao: "2026-06-04T18:45:00", capacidadeMaxima: 70000, utilizacao: 92 },
  { id: "B4", nome: "Berço 4 - Multiuso", tipo: "Multiuso", status: "Ocupado", navioAtual: "General Cargo III", tempoOcupacao: 4.8, previsaoLiberacao: "2026-06-04T11:20:00", capacidadeMaxima: 45000, utilizacao: 65 },
];

export const baseIndicadores: IndicadoresDTO = {
  tempoMedioEspera: 8.4,
  tamanhoFila: 7,
  utilizacaoBercos: 75,
  naviosAtrasoCritico: 2,
  riscoClimatico: 35,
  congestionamentoPrevisto: 62,
};
