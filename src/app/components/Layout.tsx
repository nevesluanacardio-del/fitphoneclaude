import { Outlet, NavLink } from "react-router";
import { Anchor, BarChart3, Ship, Layers, Lightbulb } from "lucide-react";

export function Layout() {
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
            <div className="text-right">
              <p className="text-sm text-blue-200">Atualizado em tempo real</p>
              <p className="font-semibold">{new Date().toLocaleString('pt-BR')}</p>
            </div>
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
