import { motion } from "motion/react";
import { useDadosOperacionais } from "../data/DadosContext";
import { Ship, Clock, AlertTriangle, Cloud, Anchor, TrendingUp } from "lucide-react";

export function FilaNavios() {
  const { navios } = useDadosOperacionais();

  const getStatusClimaticoColor = (status: string) => {
    switch (status) {
      case "Favorável":
        return "bg-green-100 text-green-700 border-green-200";
      case "Atenção":
        return "bg-yellow-100 text-yellow-700 border-yellow-200";
      case "Desfavorável":
        return "bg-red-100 text-red-700 border-red-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  const getPrioridadeColor = (prioridade: string) => {
    switch (prioridade) {
      case "Crítica":
        return "bg-red-500 text-white";
      case "Alta":
        return "bg-orange-500 text-white";
      case "Média":
        return "bg-blue-500 text-white";
      case "Baixa":
        return "bg-slate-500 text-white";
      default:
        return "bg-slate-500 text-white";
    }
  };

  const sortedNavios = [...navios].sort((a, b) => {
    const prioridadeOrder = { Crítica: 0, Alta: 1, Média: 2, Baixa: 3 };
    return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Fila de Navios</h2>
          <p className="text-slate-600 mt-1">Navios aguardando atracação no Porto do Itaqui</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
            <p className="text-sm text-blue-700">
              Total na Fila: <span className="font-semibold">{navios.length} navios</span>
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-red-50 to-red-100 rounded-lg border-2 border-red-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-red-500 p-2 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">
                {navios.filter((n) => n.prioridade === "Crítica").length}
              </p>
              <p className="text-sm text-red-600">Prioridade Crítica</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border-2 border-orange-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-orange-500 p-2 rounded-lg">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-orange-700">
                {navios.filter((n) => n.prioridade === "Alta").length}
              </p>
              <p className="text-sm text-orange-600">Prioridade Alta</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border-2 border-yellow-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500 p-2 rounded-lg">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-700">
                {navios.filter((n) => n.statusClimatico !== "Favorável").length}
              </p>
              <p className="text-sm text-yellow-600">Risco Climático</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg border-2 border-blue-200 p-4"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-500 p-2 rounded-lg">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {(navios.reduce((acc, n) => acc + n.tempoEspera, 0) / navios.length).toFixed(1)}h
              </p>
              <p className="text-sm text-blue-600">Tempo Médio</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Índice Dinâmico de Atracação Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border-2 border-purple-200 p-6 shadow-lg"
      >
        <div className="flex items-start gap-4">
          <div className="bg-purple-500 p-3 rounded-lg">
            <TrendingUp className="w-8 h-8 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold text-slate-900 mb-2">Índice Dinâmico de Atracação (IDA)</h3>
            <p className="text-slate-700 mb-4">
              O IDA é calculado com base em múltiplos fatores: tempo de espera, prioridade da carga, condições
              climáticas, compatibilidade com berço disponível e impacto no congestionamento portuário. Quanto maior o
              índice, maior a prioridade sugerida para atracação.
            </p>
            <div className="bg-white rounded-lg p-4 border border-purple-200">
              <p className="text-sm font-semibold text-slate-700 mb-2">Top 3 Navios por IDA:</p>
              <div className="space-y-2">
                {sortedNavios
                  .sort((a, b) => (b.indiceDinamico || 0) - (a.indiceDinamico || 0))
                  .slice(0, 3)
                  .map((navio, index) => (
                    <div key={navio.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="bg-purple-100 text-purple-700 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {index + 1}
                        </div>
                        <span className="font-medium text-slate-900">{navio.nome}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-32 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full"
                            style={{ width: `${navio.indiceDinamico}%` }}
                          />
                        </div>
                        <span className="font-bold text-purple-600 w-12 text-right">{navio.indiceDinamico?.toFixed(1)}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Ships List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b-2 border-slate-200">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Navio</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tipo de Carga</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Tempo de Espera</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Prioridade</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Berço Compatível</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Status Climático</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">IDA</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">Detalhes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {sortedNavios.map((navio, index) => (
                <motion.tr
                  key={navio.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.6 + index * 0.05 }}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-100 p-2 rounded-lg">
                        <Ship className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900">{navio.nome}</p>
                        <p className="text-xs text-slate-500">{navio.id}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 rounded-full text-sm font-medium bg-slate-100 text-slate-700">
                      {navio.tipoCarga}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-500" />
                      <span className="font-semibold text-slate-900">{navio.tempoEspera.toFixed(1)}h</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getPrioridadeColor(navio.prioridade)}`}>
                      {navio.prioridade}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <Anchor className="w-4 h-4 text-slate-500" />
                      <span className="text-slate-900 font-medium">{navio.bercoCompativel.join(", ")}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-lg text-sm font-medium border ${getStatusClimaticoColor(navio.statusClimatico)}`}>
                      {navio.statusClimatico}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            (navio.indiceDinamico || 0) > 85
                              ? "bg-green-500"
                              : (navio.indiceDinamico || 0) > 70
                              ? "bg-blue-500"
                              : "bg-slate-500"
                          }`}
                          style={{ width: `${navio.indiceDinamico}%` }}
                        />
                      </div>
                      <span className="font-bold text-slate-900 w-10">{navio.indiceDinamico?.toFixed(0)}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs text-slate-600 space-y-1">
                      <p>Tamanho: {navio.tamanho}m</p>
                      <p>Carga: {navio.cargaToneladas.toLocaleString()}t</p>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
