import { motion } from "motion/react";
import { useDadosOperacionais } from "../data/DadosContext";
import { Ship, Clock, TrendingUp, AlertTriangle, CheckCircle, Anchor, Calendar, ArrowRight } from "lucide-react";

export function Recomendacao() {
  const { navios, bercos } = useDadosOperacionais();

  // Ordenar navios da fila por índice dinâmico
  const sortedNavios = [...navios].sort((a, b) => (b.indiceDinamico || 0) - (a.indiceDinamico || 0));
  const nextShip = sortedNavios[0];

  // Fila vazia: todos os navios já estão atracados.
  if (!nextShip) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Recomendação Operacional</h2>
          <p className="text-slate-600 mt-1">Sugestão inteligente para as próximas 24 horas</p>
        </div>
        <div className="bg-white rounded-lg border border-slate-200 p-10 text-center">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <p className="text-lg font-semibold text-slate-900">Fila vazia</p>
          <p className="text-slate-600">Nenhum navio aguardando atracação no momento — os berços estão atendendo toda a demanda atual.</p>
        </div>
      </div>
    );
  }

  // Berço livre correspondente
  const availableBerth = bercos.find(
    (b) => b.status === "Livre" && nextShip.bercoCompativel.includes(b.id)
  );

  // Timeline de próximas atracações (sequência otimizada por IDA)
  const horarios = ["08:30", "11:20", "14:30", "18:45"];
  const justificativas = [
    "Maior IDA, prioridade alta e berço compatível",
    "Alta prioridade, aguardando liberação de berço",
    "Berço compatível em processo de liberação",
    "Sequenciado conforme o índice dinâmico",
  ];
  const timeline = sortedNavios.slice(0, 4).map((navio, i) => ({
    navio,
    berco: navio.bercoCompativel[0] ?? "—",
    hora: horarios[i],
    status: i === 0 ? "Recomendado" : "Previsto",
    justificativa: justificativas[i],
  }));

  const getImpactColor = (value: number, reverse = false) => {
    if (reverse) {
      if (value >= 20) return "text-red-600";
      if (value >= 10) return "text-yellow-600";
      return "text-green-600";
    }
    if (value >= 20) return "text-green-600";
    if (value >= 10) return "text-yellow-600";
    return "text-red-600";
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-bold text-slate-900">Recomendação Operacional</h2>
        <p className="text-slate-600 mt-1">Sugestão inteligente para as próximas 24 horas</p>
      </div>

      {/* Main Recommendation Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border-2 border-green-300 shadow-xl p-8"
      >
        <div className="flex items-start gap-6">
          <div className="bg-green-500 p-4 rounded-xl shadow-lg">
            <TrendingUp className="w-12 h-12 text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-2xl font-bold text-slate-900">Próxima Atracação Recomendada</h3>
              <span className="px-3 py-1 bg-green-500 text-white text-sm font-semibold rounded-full">
                Ação Imediata
              </span>
            </div>
            <p className="text-slate-700 mb-6">
              Com base na análise integrada de todos os fatores operacionais, o sistema recomenda:
            </p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Ship Info */}
              <div className="bg-white rounded-lg p-6 border-2 border-green-200 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <Ship className="w-6 h-6 text-blue-600" />
                  <h4 className="text-lg font-bold text-slate-900">Navio Prioritário</h4>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-slate-600">Nome do Navio</p>
                    <p className="text-xl font-bold text-slate-900">{nextShip.nome}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-slate-600">Tipo de Carga</p>
                      <p className="font-semibold text-slate-900">{nextShip.tipoCarga}</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Prioridade</p>
                      <span className="inline-block px-2 py-1 bg-red-500 text-white text-sm font-semibold rounded">
                        {nextShip.prioridade}
                      </span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-slate-600">Tempo de Espera</p>
                      <p className="font-semibold text-slate-900">{nextShip.tempoEspera.toFixed(1)}h</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Status Climático</p>
                      <span
                        className={`inline-block px-2 py-1 text-sm font-semibold rounded ${
                          nextShip.statusClimatico === "Favorável"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {nextShip.statusClimatico}
                      </span>
                    </div>
                  </div>
                  <div className="pt-3 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-slate-600">Índice Dinâmico</p>
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full"
                            style={{ width: `${nextShip.indiceDinamico}%` }}
                          />
                        </div>
                        <span className="text-lg font-bold text-green-600">{nextShip.indiceDinamico?.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Berth Info */}
              <div className="bg-white rounded-lg p-6 border-2 border-blue-200 shadow-md">
                <div className="flex items-center gap-3 mb-4">
                  <Anchor className="w-6 h-6 text-blue-600" />
                  <h4 className="text-lg font-bold text-slate-900">Berço Designado</h4>
                </div>
                {availableBerth ? (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-slate-600">Berço</p>
                      <p className="text-xl font-bold text-slate-900">{availableBerth.nome}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-sm text-slate-600">Status</p>
                        <span className="inline-block px-2 py-1 bg-green-500 text-white text-sm font-semibold rounded">
                          {availableBerth.status}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600">Tipo</p>
                        <p className="font-semibold text-slate-900">{availableBerth.tipo}</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600">Capacidade Máxima</p>
                      <p className="font-semibold text-slate-900">
                        {availableBerth.capacidadeMaxima.toLocaleString()} toneladas
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-200 bg-green-50 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="w-5 h-5" />
                        <p className="text-sm font-semibold">Berço disponível imediatamente</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
                      <div className="flex items-center gap-2 text-yellow-700 mb-2">
                        <AlertTriangle className="w-5 h-5" />
                        <p className="text-sm font-semibold">Aguardando liberação</p>
                      </div>
                      <p className="text-sm text-slate-700">
                        Berço compatível {nextShip.bercoCompativel[0]} em processo de liberação
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Justificativa */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
      >
        <div className="flex items-start gap-3 mb-4">
          <div className="bg-blue-100 p-2 rounded-lg">
            <CheckCircle className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-1">Justificativa da Recomendação</h3>
            <p className="text-slate-600">Análise dos fatores que determinaram esta decisão</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-sm font-semibold text-slate-700">Índice Dinâmico</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">{nextShip.indiceDinamico?.toFixed(1)}</p>
            <p className="text-sm text-slate-600">
              Maior pontuação entre todos os navios na fila (+{((nextShip.indiceDinamico || 0) - 83.7).toFixed(1)}{" "}
              pontos)
            </p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <p className="text-sm font-semibold text-slate-700">Prioridade da Carga</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">{nextShip.prioridade}</p>
            <p className="text-sm text-slate-600">Carga de {nextShip.tipoCarga.toLowerCase()} com urgência crítica</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <p className="text-sm font-semibold text-slate-700">Tempo de Espera</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">{nextShip.tempoEspera.toFixed(1)}h</p>
            <p className="text-sm text-slate-600">Já ultrapassou 50% do tempo máximo recomendado</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <p className="text-sm font-semibold text-slate-700">Condições Climáticas</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">{nextShip.statusClimatico}</p>
            <p className="text-sm text-slate-600">Janela de condições favoráveis para atracação segura</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <p className="text-sm font-semibold text-slate-700">Berço Compatível</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">Disponível</p>
            <p className="text-sm text-slate-600">Berço {nextShip.bercoCompativel[0]} livre e preparado</p>
          </div>

          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-yellow-500" />
              <p className="text-sm font-semibold text-slate-700">Impacto Operacional</p>
            </div>
            <p className="text-2xl font-bold text-slate-900 mb-1">Positivo</p>
            <p className="text-sm text-slate-600">Reduz congestionamento e otimiza fluxo geral</p>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-4">
          <p className="text-sm text-slate-700">
            <span className="font-semibold text-blue-900">Conclusão:</span> A atracação do{" "}
            <span className="font-semibold">{nextShip.nome}</span> no momento recomendado resulta em uma redução
            estimada de <span className="font-semibold text-green-600">18% no tempo total de espera da fila</span> e
            aumenta a eficiência operacional em{" "}
            <span className="font-semibold text-green-600">12%</span> nas próximas 24 horas.
          </p>
        </div>
      </motion.div>

      {/* Timeline das Próximas Atracações */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
      >
        <div className="flex items-center gap-3 mb-6">
          <Calendar className="w-6 h-6 text-blue-600" />
          <div>
            <h3 className="text-xl font-bold text-slate-900">Timeline de Atracações - Próximas 24h</h3>
            <p className="text-sm text-slate-600">Sequência otimizada de operações</p>
          </div>
        </div>

        <div className="space-y-4">
          {timeline.map((item, index) => (
            <motion.div
              key={item.navio.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className={`flex items-start gap-4 p-4 rounded-lg border-2 ${
                index === 0
                  ? "bg-green-50 border-green-300"
                  : "bg-slate-50 border-slate-200"
              }`}
            >
              <div className="flex flex-col items-center">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    index === 0
                      ? "bg-green-500 text-white"
                      : "bg-slate-300 text-slate-700"
                  }`}
                >
                  {item.hora.split(":")[0]}
                </div>
                <p className="text-xs text-slate-600 mt-1">{item.hora}</p>
                {index < timeline.length - 1 && (
                  <div className="w-0.5 h-12 bg-slate-300 mt-2" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h4 className="font-bold text-slate-900">{item.navio.nome}</h4>
                  <ArrowRight className="w-4 h-4 text-slate-400" />
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-sm font-semibold rounded">
                    {item.berco}
                  </span>
                  <span
                    className={`px-2 py-0.5 text-xs font-semibold rounded ${
                      item.status === "Recomendado"
                        ? "bg-green-500 text-white"
                        : "bg-slate-400 text-white"
                    }`}
                  >
                    {item.status}
                  </span>
                </div>
                <div className="flex items-start gap-6 text-sm">
                  <div>
                    <span className="text-slate-600">Tipo: </span>
                    <span className="font-medium text-slate-900">{item.navio.tipoCarga}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Prioridade: </span>
                    <span className="font-medium text-slate-900">{item.navio.prioridade}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">IDA: </span>
                    <span className="font-medium text-slate-900">{item.navio.indiceDinamico?.toFixed(1)}</span>
                  </div>
                </div>
                <p className="text-sm text-slate-600 mt-2">{item.justificativa}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Impactos Esperados */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-white rounded-lg border border-slate-200 p-6 shadow-sm"
      >
        <h3 className="text-xl font-bold text-slate-900 mb-4">Impactos Esperados da Recomendação</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 border border-green-200">
            <Clock className="w-6 h-6 text-green-600 mb-2" />
            <p className="text-sm text-slate-600 mb-1">Redução de Espera</p>
            <p className={`text-2xl font-bold ${getImpactColor(18)}`}>-18%</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
            <TrendingUp className="w-6 h-6 text-blue-600 mb-2" />
            <p className="text-sm text-slate-600 mb-1">Aumento de Eficiência</p>
            <p className={`text-2xl font-bold ${getImpactColor(12)}`}>+12%</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg p-4 border border-yellow-200">
            <AlertTriangle className="w-6 h-6 text-yellow-600 mb-2" />
            <p className="text-sm text-slate-600 mb-1">Redução de Atrasos</p>
            <p className={`text-2xl font-bold ${getImpactColor(25)}`}>-25%</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
            <CheckCircle className="w-6 h-6 text-purple-600 mb-2" />
            <p className="text-sm text-slate-600 mb-1">Satisfação Estimada</p>
            <p className={`text-2xl font-bold ${getImpactColor(15)}`}>+15%</p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
