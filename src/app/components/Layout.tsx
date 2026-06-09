import { Outlet, NavLink } from "react-router";
import { Anchor, BarChart3, Ship, Layers, Lightbulb, Radio } from "lucide-react";
import { DadosProvider, useDadosOperacionais } from "../data/DadosContext";

function StatusAtualizacao() {
  const { ultimaAtualizacao, carregando, erro, simular, setSimular } = useDadosOperacionais();

  const corPonto = erro ? "bg-amber-400" : simular ? "bg-fuchsia-400" : "bg-emerald-400";
  const rotulo = erro
    ? "Dados em cache"
    : simular
      ? "Simulação ao vivo"
      : "Atualizado em tempo real";
  const horario = ultimaAtualizacao
    ? ultimaAtualizacao.toLocaleString("pt-BR")
    : carregando
      ? "Carregando..."
      : "—";

  return (
    <div className="flex items-center gap-4">
      <button
        type="button"
        onClick={() => setSimular(!simular)}
        aria-pressed={simular}
        title={simular ? "Voltar a ler os dados dos CSVs" : "Variar os números automaticamente"}
        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
          simular
            ? "border-fuchsia-300 bg-fuchsia-500/20 text-white hover:bg-fuchsia-500/30"
            : "border-white/20 bg-white/10 text-blue-100 hover:bg-white/20"
        }`}
      >
        <Radio className="h-4 w-4" />
        {simular ? "Simulação ON" : "Simular ao vivo"}
      </button>
      <div className="text-right">
        <p className="flex items-center justify-end gap-2 text-sm text-blue-200">
          <span className="relative flex h-2 w-2">
            {!erro && (
              <span className={`absolute inline-flex h-full w-full animate-ping rounded-full ${corPonto} opacity-75`} />
            )}
            <span className={`relative inline-flex h-2 w-2 rounded-full ${corPonto}`} />
          </span>
          {rotulo}
        </p>
        <p className="font-semibold">{horario}</p>
      </div>
    </div>
  );
}

export function Layout() {
  return (
    <DadosProvider>
      <LayoutInterno />
    </DadosProvider>
  );
}

function LayoutInterno() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-900 to-blue-800 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm">
                <Anchor className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">PortoFlow 4.0</h1>
                <p className="text-blue-200 text-sm">Sistema Inteligente de Atracação - Porto do Itaqui</p>
              </div>
            </div>
            <StatusAtualizacao />
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="bg-white border-b border-slate-200 shadow-sm">
        <div className="container mx-auto px-6">
          <div className="flex gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-blue-600 hover:border-slate-300"
                }`
              }
            >
              <BarChart3 className="w-4 h-4" />
              <span className="font-medium">Dashboard</span>
            </NavLink>
            
            <NavLink
              to="/bercos"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-blue-600 hover:border-slate-300"
                }`
              }
            >
              <Anchor className="w-4 h-4" />
              <span className="font-medium">Berços</span>
            </NavLink>

            <NavLink
              to="/fila"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-blue-600 hover:border-slate-300"
                }`
              }
            >
              <Ship className="w-4 h-4" />
              <span className="font-medium">Fila de Navios</span>
            </NavLink>

            <NavLink
              to="/simulacao"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-blue-600 hover:border-slate-300"
                }`
              }
            >
              <Layers className="w-4 h-4" />
              <span className="font-medium">Simulação</span>
            </NavLink>

            <NavLink
              to="/recomendacao"
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
                  isActive
                    ? "border-blue-600 text-blue-600"
                    : "border-transparent text-slate-600 hover:text-blue-600 hover:border-slate-300"
                }`
              }
            >
              <Lightbulb className="w-4 h-4" />
              <span className="font-medium">Recomendação</span>
            </NavLink>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-slate-800 text-slate-300 py-6 mt-12">
        <div className="container mx-auto px-6 text-center">
          <p className="text-sm">
            PortoFlow 4.0 - Sistema de Otimização de Atracação | Engenharia de Software & Pesquisa Operacional
          </p>
        </div>
      </footer>
    </div>
  );
}
