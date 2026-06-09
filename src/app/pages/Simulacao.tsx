import { motion } from "motion/react";
import { useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Clock, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";

type Policy = "FIFO" | "Prioridade Fixa" | "Fila por Tipo" | "Índice Dinâmico";

export function Simulacao() {
  const [selectedPolicy, setSelectedPolicy] = useState<Policy>("Índice Dinâmico");

  // Simulation data comparing different policies
  const policyComparison = [
    {
      politica: "FIFO",
      tempoMedio: 10.5,
      utilizacao: 68,
      satisfacao: 72,
      atrasoCritico: 4,
      custo: 85,
    },
    {
      politica: "Prioridade Fixa",
      tempoMedio: 9.2,
      utilizacao: 71,
      satisfacao: 78,
      atrasoCritico: 3,
      custo: 78,
    },
    {
      politica: "Fila por Tipo",
      tempoMedio: 8.8,
      utilizacao: 73,
      satisfacao: 81,
      atrasoCritico: 2,
      custo: 72,
    },
    {
      politica: "Índice Dinâmico",
      tempoMedio: 7.4,
      utilizacao: 82,
      satisfacao: 91,
      atrasoCritico: 1,
      custo: 62,
    },
  ];

  const radarData = [
    {
      metrica: "Tempo de Espera",
      FIFO: 65,
      "Prioridade Fixa": 72,
      "Fila por Tipo": 75,
      "Índice Dinâmico": 90,
    },
    {
      metrica: "Utilização",
      FIFO: 68,
      "Prioridade Fixa": 71,
      "Fila por Tipo": 73,
      "Índice Dinâmico": 82,
    },
    {
      metrica: "Satisfação",
      FIFO: 72,
      "Prioridade Fixa": 78,
      "Fila por Tipo": 81,
      "Índice Dinâmico": 91,
    },
    {
      metrica: "Atrasos",
      FIFO: 60,
      "Prioridade Fixa": 70,
      "Fila por Tipo": 80,
      "Índice Dinâmico": 95,
    },
    {
      metrica: "Eficiência",
      FIFO: 67,
      "Prioridade Fixa": 74,
      "Fila por Tipo": 78,
      "Índice Dinâmico": 88,
    },
  ];

  const policies = [
    {
      name: "FIFO",
      title: "First In, First Out",
      description: "Navios são atendidos na ordem de chegada, sem considerar outros fatores.",
      pros: ["Simples de implementar", "Justo temporalmente", "Previsível"],
      cons: ["Ignora urgências", "Baixa otimização", "Mais atrasos críticos"],
      color: "red",
    },
    {
      name: "Prioridade Fixa",
      title: "Prioridade Fixa por Carga",
      description: "Define prioridades fixas baseadas apenas no tipo de carga (ex: combustíveis > grãos).",
      pros: ["Considera tipo de carga", "Melhor que FIFO", "Fácil de entender"],
      cons: ["Pouco flexível", "Ignora contexto operacional", "Desbalanceamento"],
      color: "orange",
    },
    {
      name: "Fila por Tipo",
      title: "Filas Separadas por Tipo",
      description: "Mantém filas separadas para cada tipo de carga, otimizando uso de berços especializados.",
      pros: ["Otimiza berços", "Reduz conflitos", "Melhor utilização"],
      cons: ["Pode gerar espera maior", "Menos flexível", "Complexidade média"],
      color: "yellow",
    },
    {
      name: "Índice Dinâmico",
      title: "Índice Dinâmico de Atracação",
      description:
        "Algoritmo inteligente que pondera múltiplos fatores: tempo de espera, prioridade, clima, berço disponível e congestionamento.",
      pros: ["Otimização global", "Adapta-se ao contexto", "Menor tempo médio", "Menos atrasos críticos"],
      cons: ["Mais complexo", "Requer dados em tempo real"],
      color: "green",
    },
  ];

  const selectedPolicyData = policies.find((p) => p.name === selectedPolicy);
  const selectedMetrics = policyComparison.find((p) => p.politica === selectedPolicy);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Simulação de Políticas</h2>
        <p className="text-slate-600 mt-1">Comparação entre diferentes estratégias de sequenciamento</p>
      </div>

      {/* Policy Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {policies.map((policy, index) => (
          <motion.button
            key={policy.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => setSelectedPolicy(policy.name as Policy)}
            className={`text-left p-5 rounded-lg border-2 transition-all ${
              selectedPolicy === policy.name
                ? "border-blue-500 bg-blue-50 shadow-lg"
                : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"
            }`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-slate-900">{policy.title}</h3>
              {selectedPolicy === policy.name && <CheckCircle className="w-5 h-5 text-blue-600" />}
            </div>
            <p className="text-sm text-slate-600">{policy.description.split(".")[0]}.</p>
          </motion.button>
        ))}
      </div>

      {/* Selected Policy Details */}
      {selectedPolicyData && (
        <motion.div
          key={selectedPolicy}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-lg border-2 border-blue-200 shadow-lg p-6"
        >
          <div className="flex items-start gap-4 mb-6">
            <div
              className={`p-3 rounded-lg ${
                selectedPolicyData.color === "green"
                  ? "bg-green-100"
                  : selectedPolicyData.color === "yellow"
                  ? "bg-yellow-100"
                  : selectedPolicyData.color === "orange"
                  ? "bg-orange-100"
                  : "bg-red-100"
              }`}
            >
              <TrendingUp
                className={`w-8 h-8 ${
                  selectedPolicyData.color === "green"
                    ? "text-green-600"
                    : selectedPolicyData.color === "yellow"
                    ? "text-yellow-600"
                    : selectedPolicyData.color === "orange"
                    ? "text-orange-600"
                    : "text-red-600"
                }`}
              />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedPolicyData.title}</h3>
              <p className="text-slate-700 mb-4">{selectedPolicyData.description}</p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4" /> Vantagens
                  </p>
                  <ul className="space-y-1">
                    {selectedPolicyData.pros.map((pro, i) => (
                      <li key={i} className="text-sm text-green-700">
                        • {pro}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> Desvantagens
                  </p>
                  <ul className="space-y-1">
                    {selectedPolicyData.cons.map((con, i) => (
                      <li key={i} className="text-sm text-orange-700">
                        • {con}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics for selected policy */}
          {selectedMetrics && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 border-t border-slate-200">
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-600">{selectedMetrics.tempoMedio}h</p>
                <p className="text-sm text-slate-600 mt-1">Tempo Médio</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{selectedMetrics.utilizacao}%</p>
                <p className="text-sm text-slate-600 mt-1">Utilização</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-purple-600">{selectedMetrics.satisfacao}%</p>
                <p className="text-sm text-slate-600 mt-1">Satisfação</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{selectedMetrics.atrasoCritico}</p>
                <p className="text-sm text-slate-600 mt-1">Atrasos Críticos</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-slate-900">{selectedMetrics.custo}</p>
                <p className="text-sm text-slate-600 mt-1">Custo Relativo</p>
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Comparative Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart Comparison */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Comparação de Tempo Médio de Espera</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={policyComparison}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="politica" stroke="#64748b" angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#64748b" label={{ value: "Horas", angle: -90, position: "insideLeft" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                }}
              />
              <Bar dataKey="tempoMedio" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Análise Multidimensional</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metrica" stroke="#64748b" />
              <PolarRadiusAxis stroke="#64748b" />
              <Radar name="FIFO" dataKey="FIFO" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
              <Radar
                name="Prioridade Fixa"
                dataKey="Prioridade Fixa"
                stroke="#f97316"
                fill="#f97316"
                fillOpacity={0.1}
              />
              <Radar name="Fila por Tipo" dataKey="Fila por Tipo" stroke="#eab308" fill="#eab308" fillOpacity={0.1} />
              <Radar
                name="Índice Dinâmico"
                dataKey="Índice Dinâmico"
                stroke="#10b981"
                fill="#10b981"
                fillOpacity={0.3}
              />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Detailed Comparison Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Comparação Detalhada de Métricas</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Política</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">
                  <div className="flex items-center justify-center gap-1">
                    <Clock className="w-4 h-4" />
                    Tempo Médio
                  </div>
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Utilização Berços</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Satisfação</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Atrasos Críticos</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Custo Relativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {policyComparison.map((policy, index) => (
                <tr key={policy.politica} className={index === 3 ? "bg-green-50" : "hover:bg-slate-50"}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{policy.politica}</span>
                      {index === 3 && (
                        <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">Recomendado</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-slate-900">{policy.tempoMedio}h</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${policy.utilizacao}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-900 w-10">{policy.utilizacao}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-slate-900">{policy.satisfacao}%</span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span
                      className={`inline-block px-3 py-1 rounded-full font-semibold ${
                        policy.atrasoCritico <= 1
                          ? "bg-green-100 text-green-700"
                          : policy.atrasoCritico <= 2
                          ? "bg-yellow-100 text-yellow-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {policy.atrasoCritico}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-semibold text-slate-900">{policy.custo}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Conclusion */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-green-200 p-6"
      >
        <div className="flex items-start gap-4">
          <div className="bg-green-500 p-3 rounded-lg">
            <CheckCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Conclusão da Simulação</h3>
            <p className="text-slate-700 mb-3">
              O <span className="font-semibold text-green-700">Índice Dinâmico de Atracação</span> demonstra
              desempenho superior em todas as métricas avaliadas, reduzindo o tempo médio de espera em{" "}
              <span className="font-semibold">29.5%</span> comparado ao FIFO e melhorando a utilização de berços em{" "}
              <span className="font-semibold">14%</span>.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="text-sm text-slate-600">Redução de Tempo</p>
                <p className="text-xl font-bold text-green-600">-29.5%</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="text-sm text-slate-600">Aumento de Utilização</p>
                <p className="text-xl font-bold text-green-600">+14%</p>
              </div>
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <p className="text-sm text-slate-600">Redução Atrasos</p>
                <p className="text-xl font-bold text-green-600">-75%</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
