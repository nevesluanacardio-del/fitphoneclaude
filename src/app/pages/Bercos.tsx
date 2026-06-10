import { motion } from "motion/react";
import { useDadosOperacionais } from "../data/DadosContext";
import { Anchor, Clock, Package, AlertCircle } from "lucide-react";

export function Bercos() {
  const { bercos } = useDadosOperacionais();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Berços Operacionais</h2>
        <p className="text-slate-600 mt-1">Visualização detalhada dos 4 berços do Porto do Itaqui</p>
      </div>

      {/* Mapa Simplificado dos Berços */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg border-2 border-blue-200 p-8 shadow-lg"
      >
        <h3 className="text-xl font-semibold text-slate-900 mb-6 text-center">Layout dos Berços</h3>
        <div className="relative">
          {/* Ocean representation */}
          <div className="bg-gradient-to-b from-blue-400 to-blue-600 rounded-lg p-8 min-h-[300px]">
            <div className="grid grid-cols-4 gap-6 h-full">
              {bercos.map((berco, index) => (
                <motion.div
                  key={berco.id}
                  initial={{ opacity: 0, y: 50 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative"
                >
                  {/* Pier */}
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 bg-amber-700 h-full rounded-t-lg shadow-lg" />
                  
                  {/* Berth Platform */}
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-16 bg-slate-700 rounded-lg shadow-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{berco.id}</span>
                  </div>

                  {/* Ship if occupied */}
                  {berco.status === "Ocupado" && (
                    <motion.div
                      initial={{ x: -100, opacity: 0 }}
                      animate={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-20 h-32 bg-slate-800 rounded-t-lg shadow-2xl flex items-center justify-center"
                    >
                      <Anchor className="w-8 h-8 text-white" />
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
          
          {/* Coast/Dock */}
          <div className="bg-amber-800 h-8 rounded-b-lg shadow-inner" />
        </div>
      </motion.div>

      {/* Detalhes dos Berços */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {bercos.map((berco, index) => (
          <motion.div
            key={berco.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 + index * 0.1 }}
            className="bg-white rounded-lg border-2 border-slate-200 shadow-sm hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div
              className={`p-4 rounded-t-lg ${
                berco.status === "Livre"
                  ? "bg-green-50 border-b-2 border-green-200"
                  : berco.status === "Ocupado"
                  ? "bg-blue-50 border-b-2 border-blue-200"
                  : "bg-yellow-50 border-b-2 border-yellow-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      berco.status === "Livre"
                        ? "bg-green-100"
                        : berco.status === "Ocupado"
                        ? "bg-blue-100"
                        : "bg-yellow-100"
                    }`}
                  >
                    <Anchor
                      className={`w-6 h-6 ${
                        berco.status === "Livre"
                          ? "text-green-600"
                          : berco.status === "Ocupado"
                          ? "text-blue-600"
                          : "text-yellow-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{berco.nome}</h3>
                    <p className="text-sm text-slate-600">{berco.tipo}</p>
                  </div>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    berco.status === "Livre"
                      ? "bg-green-500 text-white"
                      : berco.status === "Ocupado"
                      ? "bg-blue-500 text-white"
                      : "bg-yellow-500 text-white"
                  }`}
                >
                  {berco.status}
                </span>
              </div>
            </div>

            {/* Body */}
            <div className="p-6 space-y-4">
              {/* Operação interrompida por clima */}
              {berco.operacaoInterrompida && (
                <div className="bg-red-50 rounded-lg p-4 border border-red-200">
                  <div className="flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-5 h-5" />
                    <p className="text-sm font-semibold">Operação interrompida por condições climáticas desfavoráveis</p>
                  </div>
                </div>
              )}

              {/* Current Ship */}
              {berco.navioAtual && (
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Package className="w-4 h-4 text-slate-600" />
                    <span className="text-sm font-semibold text-slate-700">Navio Atracado:</span>
                  </div>
                  <p className="text-lg font-bold text-slate-900 mb-1">{berco.navioAtual}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Clock className="w-4 h-4" />
                    <span>Ocupado há {berco.tempoOcupacao?.toFixed(1)} horas</span>
                  </div>
                  {berco.previsaoLiberacao && (
                    <div className="mt-2 pt-2 border-t border-slate-200">
                      <p className="text-sm text-slate-600">
                        Previsão de liberação:{" "}
                        <span className="font-semibold text-slate-900">
                          {berco.previsaoLiberacao.toLocaleString("pt-BR", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}

              {berco.status === "Livre" && (
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-green-600" />
                    <p className="text-sm font-semibold text-green-700">Berço disponível para atracação</p>
                  </div>
                </div>
              )}

              {/* Capacity Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Capacidade Máxima</p>
                  <p className="text-lg font-bold text-slate-900">{berco.capacidadeMaxima.toLocaleString()} t</p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-1">Tipo de Carga</p>
                  <p className="text-lg font-bold text-slate-900">{berco.tipo}</p>
                </div>
              </div>

              {/* Utilization */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-slate-700">Taxa de Utilização</span>
                  <span className="text-lg font-bold text-slate-900">{berco.utilizacao}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${berco.utilizacao}%` }}
                    transition={{ duration: 1, delay: 0.5 + index * 0.1 }}
                    className={`h-3 rounded-full ${
                      berco.utilizacao > 80
                        ? "bg-red-500"
                        : berco.utilizacao > 50
                        ? "bg-yellow-500"
                        : "bg-green-500"
                    }`}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Summary Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Resumo Operacional</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <p className="text-3xl font-bold text-green-600">
              {bercos.filter((b) => b.status === "Livre").length}
            </p>
            <p className="text-sm text-slate-600 mt-1">Berços Livres</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-blue-600">
              {bercos.filter((b) => b.status === "Ocupado").length}
            </p>
            <p className="text-sm text-slate-600 mt-1">Berços Ocupados</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">
              {Math.round(bercos.reduce((acc, b) => acc + b.utilizacao, 0) / bercos.length)}%
            </p>
            <p className="text-sm text-slate-600 mt-1">Utilização Média</p>
          </div>
          <div className="text-center">
            <p className="text-3xl font-bold text-slate-900">
              {bercos.reduce((acc, b) => acc + b.capacidadeMaxima, 0).toLocaleString()}t
            </p>
            <p className="text-sm text-slate-600 mt-1">Capacidade Total</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
