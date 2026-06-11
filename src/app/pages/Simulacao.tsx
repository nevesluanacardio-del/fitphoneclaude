import { motion } from "motion/react";
import { useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { Clock, TrendingUp, AlertCircle, CheckCircle, RefreshCw, Activity } from "lucide-react";
import { simularTodas, type Politica, type ResultadoPolitica } from "../lib/filas/des";
import type { Cenario } from "../lib/filas/modelo";

// Descrições qualitativas das políticas (os NÚMEROS vêm da simulação).
const POLICIES: { name: Politica; title: string; description: string; pros: string[]; cons: string[]; color: string }[] = [
  { name: "FIFO", title: "First In, First Out", description: "Fila única: navios atendidos na ordem de chegada, sem considerar prioridade nem berço. Um navio no topo aguardando berço bloqueia os demais.", pros: ["Simples e justo no tempo", "Previsível"], cons: ["Bloqueio de cabeça de fila", "Ignora urgências", "Pior tempo e mais atrasos críticos"], color: "red" },
  { name: "Prioridade Fixa", title: "Prioridade Fixa por Carga", description: "Ordem fixa por tipo de carga (ex.: combustíveis > grãos > contêineres > multiuso), independente do contexto.", pros: ["Considera tipo de carga", "Melhor que FIFO"], cons: ["Rígida", "Pode penalizar tipos de baixa prioridade", "Não reage ao congestionamento"], color: "orange" },
  { name: "Fila por Tipo", title: "Filas Separadas por Tipo", description: "Cada berço atende seu tipo em FCFS; não-bloqueante entre tipos. Minimiza a espera MÉDIA (conservação de trabalho).", pros: ["Menor espera média", "Boa utilização", "Sem bloqueio entre filas"], cons: ["Não diferencia urgência", "Navio crítico espera como os demais"], color: "yellow" },
  { name: "Índice Dinâmico", title: "Índice Dinâmico de Atracação (IDA)", description: "Pondera prioridade + tempo de espera para sequenciar. Mesma espera média da Fila por Tipo, mas protege os navios críticos (menor espera ponderada).", pros: ["Menor espera dos críticos", "Menor custo ponderado", "Adapta-se ao contexto"], cons: ["Mais complexo", "Exige dados em tempo real"], color: "green" },
];

const norm = (v: number, todos: number[], maiorMelhor: boolean) => {
  const min = Math.min(...todos), max = Math.max(...todos);
  if (max === min) return 100;
  const s = (v - min) / (max - min); // 0..1
  return Math.round(40 + 60 * (maiorMelhor ? s : 1 - s)); // 40..100
};

export function Simulacao() {
  const [cenario, setCenario] = useState<Cenario>("normal");
  const [seed, setSeed] = useState(7);
  const [selectedPolicy, setSelectedPolicy] = useState<Politica>("Índice Dinâmico");

  // Roda a Simulação de Eventos Discretos para as 4 políticas.
  const resultados = useMemo(
    () => simularTodas(cenario, { seed, horizonteH: 24 * 120 }),
    [cenario, seed]
  );
  const por = (p: Politica) => resultados.find((r) => r.politica === p)!;

  const fifo = por("FIFO");
  const ida = por("Índice Dinâmico");
  const recomendada = resultados.reduce((a, b) => (b.custoPonderado < a.custoPonderado ? b : a));

  const selectedPolicyData = POLICIES.find((p) => p.name === selectedPolicy);
  const selectedMetrics = por(selectedPolicy);

  // Dados dos gráficos derivados da simulação.
  const wqs = resultados.map((r) => r.Wq);
  const crit = resultados.map((r) => r.esperaCritica);
  const utis = resultados.map((r) => r.utilizacao);
  const sats = resultados.map((r) => r.satisfacao);
  const custos = resultados.map((r) => r.custo);

  const radarData = [
    { metrica: "Espera Média", ...Object.fromEntries(resultados.map((r) => [r.politica, norm(r.Wq, wqs, false)])) },
    { metrica: "Proteção Crítica", ...Object.fromEntries(resultados.map((r) => [r.politica, norm(r.esperaCritica, crit, false)])) },
    { metrica: "Utilização", ...Object.fromEntries(resultados.map((r) => [r.politica, norm(r.utilizacao, utis, true)])) },
    { metrica: "Satisfação", ...Object.fromEntries(resultados.map((r) => [r.politica, norm(r.satisfacao, sats, true)])) },
    { metrica: "Custo", ...Object.fromEntries(resultados.map((r) => [r.politica, norm(r.custo, custos, false)])) },
  ];

  const redWq = Math.round(((fifo.Wq - ida.Wq) / fifo.Wq) * 100);
  const redCrit = Math.round(((fifo.esperaCritica - ida.esperaCritica) / fifo.esperaCritica) * 100);
  const redCusto = Math.round(((fifo.custoPonderado - ida.custoPonderado) / fifo.custoPonderado) * 100);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Simulação de Políticas</h2>
          <p className="text-slate-600 mt-1">Comparação por Simulação de Eventos Discretos (M/G/4, chegadas de Poisson, prioridade não preemptiva)</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-slate-300 overflow-hidden">
            {(["normal", "pico"] as Cenario[]).map((c) => (
              <button
                key={c}
                onClick={() => setCenario(c)}
                className={`px-4 py-2 text-sm font-medium capitalize ${cenario === c ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}
              >
                {c === "normal" ? "Cenário Normal" : "Cenário de Pico"}
              </button>
            ))}
          </div>
          <button
            onClick={() => setSeed((s) => s + 1)}
            title="Gerar nova amostra aleatória"
            className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw className="w-4 h-4" /> Re-simular
          </button>
        </div>
      </div>

      {/* Nota metodológica */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-sm text-blue-800 flex items-start gap-2">
        <Activity className="w-4 h-4 mt-0.5 shrink-0" />
        <p>Os números abaixo são <strong>resultados de simulação</strong> (≈120 dias, {fifo.atendidos} navios atendidos por política), não valores fixos. Use <strong>Re-simular</strong> para gerar outra amostra e <strong>Cenário de Pico</strong> para aumentar a demanda (λ).</p>
      </div>

      {/* Policy Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {POLICIES.map((policy, index) => (
          <motion.button
            key={policy.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            onClick={() => setSelectedPolicy(policy.name)}
            className={`text-left p-5 rounded-lg border-2 transition-all ${selectedPolicy === policy.name ? "border-blue-500 bg-blue-50 shadow-lg" : "border-slate-200 bg-white hover:border-blue-300 hover:shadow-md"}`}
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-bold text-slate-900">{policy.title}</h3>
              {selectedPolicy === policy.name && <CheckCircle className="w-5 h-5 text-blue-600" />}
            </div>
            <p className="text-sm text-slate-600">{policy.description.split(".")[0]}.</p>
            <p className="text-xs text-slate-500 mt-2">Wq {por(policy.name).Wq}h · espera crítica {por(policy.name).esperaCritica}h</p>
          </motion.button>
        ))}
      </div>

      {/* Selected Policy Details */}
      {selectedPolicyData && selectedMetrics && (
        <motion.div key={selectedPolicy} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border-2 border-blue-200 shadow-lg p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className={`p-3 rounded-lg ${selectedPolicyData.color === "green" ? "bg-green-100" : selectedPolicyData.color === "yellow" ? "bg-yellow-100" : selectedPolicyData.color === "orange" ? "bg-orange-100" : "bg-red-100"}`}>
              <TrendingUp className={`w-8 h-8 ${selectedPolicyData.color === "green" ? "text-green-600" : selectedPolicyData.color === "yellow" ? "text-yellow-600" : selectedPolicyData.color === "orange" ? "text-orange-600" : "text-red-600"}`} />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedPolicyData.title}</h3>
              <p className="text-slate-700 mb-4">{selectedPolicyData.description}</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <p className="font-semibold text-green-800 mb-2 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Vantagens</p>
                  <ul className="space-y-1">{selectedPolicyData.pros.map((pro, i) => <li key={i} className="text-sm text-green-700">• {pro}</li>)}</ul>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                  <p className="font-semibold text-orange-800 mb-2 flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Desvantagens</p>
                  <ul className="space-y-1">{selectedPolicyData.cons.map((con, i) => <li key={i} className="text-sm text-orange-700">• {con}</li>)}</ul>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 pt-6 border-t border-slate-200">
            <div className="text-center"><p className="text-3xl font-bold text-blue-600">{selectedMetrics.Wq}h</p><p className="text-sm text-slate-600 mt-1">Espera Média (Wq)</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-red-600">{selectedMetrics.esperaCritica}h</p><p className="text-sm text-slate-600 mt-1">Espera dos Críticos</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-green-600">{selectedMetrics.rho.toFixed(2)}</p><p className="text-sm text-slate-600 mt-1">Utilização ρ (0–1)</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-purple-600">{selectedMetrics.satisfacao}%</p><p className="text-sm text-slate-600 mt-1">Satisfação</p></div>
            <div className="text-center"><p className="text-3xl font-bold text-slate-900">{selectedMetrics.custo}</p><p className="text-sm text-slate-600 mt-1">Custo Relativo</p></div>
          </div>
        </motion.div>
      )}

      {/* Comparative Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Espera: Média (Wq) × Críticos</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={resultados}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="politica" stroke="#64748b" angle={-15} textAnchor="end" height={80} />
              <YAxis stroke="#64748b" label={{ value: "Horas", angle: -90, position: "insideLeft" }} />
              <Tooltip contentStyle={{ backgroundColor: "#fff", border: "1px solid #e2e8f0", borderRadius: "0.5rem" }} />
              <Legend />
              <Bar dataKey="Wq" name="Espera média" fill="#3b82f6" radius={[8, 8, 0, 0]} />
              <Bar dataKey="esperaCritica" name="Espera dos críticos" fill="#ef4444" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Análise Multidimensional (maior = melhor)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="metrica" stroke="#64748b" />
              <PolarRadiusAxis stroke="#64748b" domain={[0, 100]} />
              <Radar name="FIFO" dataKey="FIFO" stroke="#ef4444" fill="#ef4444" fillOpacity={0.1} />
              <Radar name="Prioridade Fixa" dataKey="Prioridade Fixa" stroke="#f97316" fill="#f97316" fillOpacity={0.1} />
              <Radar name="Fila por Tipo" dataKey="Fila por Tipo" stroke="#eab308" fill="#eab308" fillOpacity={0.1} />
              <Radar name="Índice Dinâmico" dataKey="Índice Dinâmico" stroke="#10b981" fill="#10b981" fillOpacity={0.3} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Detailed Comparison Table */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Comparação Detalhada (resultados da simulação)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-slate-700">Política</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700"><div className="flex items-center justify-center gap-1"><Clock className="w-4 h-4" />Espera Média</div></th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Espera Críticos</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Utilização</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Atrasos Críticos/sem</th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-slate-700">Custo Relativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {resultados.map((r) => (
                <tr key={r.politica} className={r.politica === recomendada.politica ? "bg-green-50" : "hover:bg-slate-50"}>
                  <td className="px-6 py-4"><div className="flex items-center gap-2"><span className="font-semibold text-slate-900">{r.politica}</span>{r.politica === recomendada.politica && <span className="px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">Recomendado</span>}</div></td>
                  <td className="px-6 py-4 text-center"><span className="font-semibold text-slate-900">{r.Wq}h</span></td>
                  <td className="px-6 py-4 text-center"><span className="font-semibold text-slate-900">{r.esperaCritica}h</span></td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="w-20 h-2 bg-slate-200 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${r.utilizacao}%` }} /></div>
                      <span className="font-semibold text-slate-900 w-10">{r.utilizacao}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center"><span className={`inline-block px-3 py-1 rounded-full font-semibold ${r.atrasoCritico <= 1 ? "bg-green-100 text-green-700" : r.atrasoCritico <= 2 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{r.atrasoCritico}</span></td>
                  <td className="px-6 py-4 text-center"><span className="font-semibold text-slate-900">{r.custo}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Conclusion */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }} className="bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border-2 border-green-200 p-6">
        <div className="flex items-start gap-4">
          <div className="bg-green-500 p-3 rounded-lg"><CheckCircle className="w-8 h-8 text-white" /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Conclusão da Simulação</h3>
            <p className="text-slate-700 mb-3">
              O <span className="font-semibold text-green-700">Índice Dinâmico</span> empata com a melhor política em <span className="font-semibold">espera média</span> (conservação de trabalho), mas <span className="font-semibold">protege os navios críticos</span>: reduz a espera dos críticos em <span className="font-semibold">{redCrit}%</span> e o custo ponderado em <span className="font-semibold">{redCusto}%</span> frente ao FIFO ({cenario === "pico" ? "cenário de pico" : "cenário normal"}).
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-white rounded-lg p-3 border border-green-200"><p className="text-sm text-slate-600">Espera média vs FIFO</p><p className="text-xl font-bold text-green-600">-{redWq}%</p></div>
              <div className="bg-white rounded-lg p-3 border border-green-200"><p className="text-sm text-slate-600">Espera dos críticos vs FIFO</p><p className="text-xl font-bold text-green-600">-{redCrit}%</p></div>
              <div className="bg-white rounded-lg p-3 border border-green-200"><p className="text-sm text-slate-600">Custo ponderado vs FIFO</p><p className="text-xl font-bold text-green-600">-{redCusto}%</p></div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
