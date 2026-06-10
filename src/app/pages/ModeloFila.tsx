import { useMemo, useState } from "react";
import { motion } from "motion/react";
import { Sigma, Server, Clock, Layers, ArrowDownUp } from "lucide-react";
import { parametrosPorTipo, metricasErlangC, type Cenario } from "../lib/filas/modelo";

export function ModeloFila() {
  const [cenario, setCenario] = useState<Cenario>("normal");
  const params = useMemo(() => parametrosPorTipo(cenario), [cenario]);
  const erlang = useMemo(() => metricasErlangC(cenario), [cenario]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Modelo Matemático da Fila</h2>
          <p className="text-slate-600 mt-1">Parâmetros (λ, μ), disciplina, capacidade e métricas analíticas de Teoria das Filas</p>
        </div>
        <div className="flex rounded-lg border border-slate-300 overflow-hidden">
          {(["normal", "pico"] as Cenario[]).map((c) => (
            <button key={c} onClick={() => setCenario(c)} className={`px-4 py-2 text-sm font-medium ${cenario === c ? "bg-blue-600 text-white" : "bg-white text-slate-600 hover:bg-slate-50"}`}>
              {c === "normal" ? "Cenário Normal" : "Cenário de Pico"}
            </button>
          ))}
        </div>
      </div>

      {/* Caracterização do modelo */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-blue-50 to-slate-50 rounded-lg border-2 border-blue-200 p-6">
        <div className="flex items-start gap-4">
          <div className="bg-blue-500 p-3 rounded-lg"><Sigma className="w-8 h-8 text-white" /></div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">Classificação: <span className="text-blue-700">M/G/4 com prioridade não preemptiva e servidores restritos</span></h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2 text-sm text-slate-700 mt-3">
              <p><strong>Chegadas (M):</strong> processo de Poisson — intervalos exponenciais, navios chegam aleatoriamente.</p>
              <p><strong>Atendimento (G):</strong> tempo de operação varia por tipo de carga (geral, não exponencial).</p>
              <p><strong>Servidores (c = 4):</strong> os 4 berços do Porto do Itaqui.</p>
              <p><strong>Disciplina:</strong> prioridade <em>não preemptiva</em> (Crítica &gt; Alta &gt; Média &gt; Baixa) + compatibilidade de berço.</p>
              <p><strong>Capacidade:</strong> fila praticamente ilimitada (fundeadouro) — modelo …/∞.</p>
              <p><strong>Restrição:</strong> cada navio só opera em berços compatíveis; B4 é flexível (transbordo).</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Indicadores agregados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: ArrowDownUp, cor: "text-blue-600", rotulo: "λ total (chegadas)", valor: `${(erlang.lambdaTotal * 24).toFixed(1)}/dia` },
          { icon: Clock, cor: "text-green-600", rotulo: "μ médio (atendimento)", valor: `${(erlang.muMedio * 24).toFixed(2)}/dia` },
          { icon: Server, cor: "text-purple-600", rotulo: "ρ do sistema (ocupação)", valor: `${(erlang.rho * 100).toFixed(0)}%` },
          { icon: Layers, cor: "text-yellow-600", rotulo: "Prob. de esperar (Erlang-C)", valor: `${(erlang.Pwait * 100).toFixed(0)}%` },
        ].map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-lg border border-slate-200 p-5 shadow-sm">
            <kpi.icon className={`w-6 h-6 mb-2 ${kpi.cor}`} />
            <p className="text-2xl font-bold text-slate-900">{kpi.valor}</p>
            <p className="text-sm text-slate-600 mt-1">{kpi.rotulo}</p>
          </motion.div>
        ))}
      </div>

      {/* Tabela de parâmetros por tipo (M/M/1) */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Parâmetros e Métricas por Tipo de Carga (fila M/M/1 por berço)</h3>
          <p className="text-sm text-slate-600 mt-1">λ e μ em navios/hora · Wq, W em horas · Lq, L em número de navios</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {["Tipo / Berço", "Serviço médio", "μ", "λ", "ρ", "Wq (espera)", "Lq (na fila)", "W (sistema)", "L"].map((h) => (
                  <th key={h} className="px-4 py-3 text-center font-semibold text-slate-700 first:text-left">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {params.map((p) => (
                <tr key={p.tipo} className="hover:bg-slate-50">
                  <td className="px-4 py-3"><span className="font-semibold text-slate-900">{p.tipo}</span> <span className="text-slate-500">· {p.berco}</span></td>
                  <td className="px-4 py-3 text-center">{p.servicoH}h</td>
                  <td className="px-4 py-3 text-center">{p.mu.toFixed(3)}</td>
                  <td className="px-4 py-3 text-center">{p.lambda.toFixed(3)}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-block px-2 py-0.5 rounded-full font-semibold ${p.rho < 0.7 ? "bg-green-100 text-green-700" : p.rho < 0.85 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>{(p.rho * 100).toFixed(0)}%</span>
                  </td>
                  <td className="px-4 py-3 text-center font-semibold">{p.Wq.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-center">{p.Lq.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">{p.W.toFixed(1)}h</td>
                  <td className="px-4 py-3 text-center">{p.L.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Visão agregada Erlang-C */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Visão Agregada M/M/c (c = 4) — Fórmula de Erlang-C</h3>
        <p className="text-sm text-slate-600 mb-4">Trata os 4 berços como um pool único, com chegada total e atendimento médio. Serve como referência analítica para a simulação.</p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            ["c (servidores)", erlang.c.toString()],
            ["r = λ/μ", erlang.r.toFixed(2)],
            ["ρ = r/c", `${(erlang.rho * 100).toFixed(0)}%`],
            ["P₀ (sistema vazio)", `${(erlang.P0 * 100).toFixed(1)}%`],
            ["Wq", `${erlang.Wq.toFixed(2)}h`],
            ["Lq", erlang.Lq.toFixed(2)],
          ].map(([k, v]) => (
            <div key={k} className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-center">
              <p className="text-2xl font-bold text-slate-900">{v}</p>
              <p className="text-xs text-slate-600 mt-1">{k}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4 text-sm text-slate-700">
          <strong className="text-blue-900">Leitura:</strong> com ρ = {(erlang.rho * 100).toFixed(0)}%, há {(erlang.Pwait * 100).toFixed(0)}% de chance de um navio encontrar todos os berços ocupados e esperar. No <strong>cenário de pico</strong>, ρ e a espera sobem — é quando a política de priorização mais importa (ver aba Simulação).
        </div>
      </motion.div>
    </div>
  );
}
