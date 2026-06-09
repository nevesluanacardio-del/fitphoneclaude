import { motion } from "motion/react";
import { MetricCard } from "../components/MetricCard";
import { Clock, Ship, Activity, AlertTriangle, Cloud, TrendingUp } from "lucide-react";
import { useDadosOperacionais } from "../data/DadosContext";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";

export function Home() {
  const { navios, bercos, indicadores } = useDadosOperacionais();

  const bercoData = bercos.map(b => ({
    nome: b.id,
    utilizacao: b.utilizacao,
  }));

  const tempoEsperaData = [
    { hora: "00:00", espera: 6.2 },
    { hora: "04:00", espera: 5.8 },
    { hora: "08:00", espera: 7.5 },
    { hora: "12:00", espera: 8.9 },
    { hora: "16:00", espera: 8.4 },
    { hora: "20:00", espera: 7.1 },
  ];

  const cargaData = (["Grãos", "Contêineres", "Combustíveis", "Multiuso"] as const)
    .map((tipo) => ({
      tipo,
      quantidade: navios.filter((n) => n.tipoCarga === tipo).length,
    }))
    .filter((d) => d.quantidade > 0);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6"];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Dashboard Operacional</h2>
          <p className="text-slate-600 mt-1">Visão geral em tempo real do Porto do Itaqui</p>
        </div>
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2">
          <p className="text-sm text-blue-700">Status: <span className="font-semibold">Operacional</span></p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <MetricCard
          title="Tempo Médio de Espera"
          value={`${indicadores.tempoMedioEspera}h`}
          icon={Clock}
          color="blue"
          trend="down"
          trendValue="12% vs ontem"
        />
        <MetricCard
          title="Navios na Fila"
          value={indicadores.tamanhoFila}
          icon={Ship}
          color="slate"
        />
        <MetricCard
          title="Utilização de Berços"
          value={`${indicadores.utilizacaoBercos}%`}
          icon={Activity}
          color="green"
          trend="up"
          trendValue="5%"
        />
        <MetricCard
          title="Atraso Crítico"
          value={indicadores.naviosAtrasoCritico}
          subtitle="navios"
          icon={AlertTriangle}
          color="red"
        />
        <MetricCard
          title="Risco Climático"
          value={`${indicadores.riscoClimatico}%`}
          icon={Cloud}
          color="yellow"
        />
        <MetricCard
          title="Congestionamento"
          value={`${indicadores.congestionamentoPrevisto}%`}
          icon={TrendingUp}
          color="yellow"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Utilização dos Berços */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Utilização dos Berços</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={bercoData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="nome" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                }}
              />
              <Bar dataKey="utilizacao" fill="#3b82f6" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Tempo Médio de Espera */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Evolução do Tempo de Espera (24h)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tempoEsperaData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="hora" stroke="#64748b" />
              <YAxis stroke="#64748b" />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#fff",
                  border: "1px solid #e2e8f0",
                  borderRadius: "0.5rem",
                }}
              />
              <Line
                type="monotone"
                dataKey="espera"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: "#3b82f6", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Additional Info Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribuição por Tipo de Carga */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Navios por Tipo de Carga</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={cargaData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ tipo, quantidade }) => `${tipo}: ${quantidade}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="quantidade"
                >
                  {cargaData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Próximos Navios a Atracar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
        >
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Próximos Navios - Prioridade</h3>
          <div className="space-y-3">
            {navios
              .filter(n => n.prioridade === "Crítica" || n.prioridade === "Alta")
              .slice(0, 4)
              .map((navio, index) => (
                <div
                  key={navio.id}
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-100 text-blue-700 rounded-full w-8 h-8 flex items-center justify-center font-semibold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{navio.nome}</p>
                      <p className="text-sm text-slate-600">{navio.tipoCarga}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-semibold ${
                        navio.prioridade === "Crítica"
                          ? "bg-red-100 text-red-700"
                          : "bg-orange-100 text-orange-700"
                      }`}
                    >
                      {navio.prioridade}
                    </span>
                    <p className="text-xs text-slate-500 mt-1">{navio.tempoEspera.toFixed(1)}h</p>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      </div>

      {/* Status dos Berços */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
      >
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Status Atual dos Berços</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {bercos.map((berco) => (
            <div
              key={berco.id}
              className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h4 className="font-semibold text-slate-900">{berco.id}</h4>
                  <p className="text-sm text-slate-600">{berco.tipo}</p>
                </div>
                <span
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    berco.status === "Livre"
                      ? "bg-green-100 text-green-700"
                      : berco.status === "Ocupado"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {berco.status}
                </span>
              </div>
              {berco.navioAtual && (
                <div className="mb-3 p-2 bg-slate-50 rounded">
                  <p className="text-sm font-medium text-slate-700">{berco.navioAtual}</p>
                  <p className="text-xs text-slate-500">Ocupado há {berco.tempoOcupacao?.toFixed(1)}h</p>
                </div>
              )}
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Utilização:</span>
                  <span className="font-semibold text-slate-900">{berco.utilizacao}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${
                      berco.utilizacao > 80 ? "bg-red-500" : berco.utilizacao > 50 ? "bg-yellow-500" : "bg-green-500"
                    }`}
                    style={{ width: `${berco.utilizacao}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
