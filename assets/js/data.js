/*
 * Diagnóstico do Gargalo Oculto
 * Base de conteúdo: dimensões, perguntas, pesos e leituras de diagnóstico.
 *
 * Pontuação (fiel ao material original, com granularidade extra):
 *   "Existe e é satisfatório"        -> peso cheio
 *   "Existe, mas não é satisfatório" -> metade do peso
 *   "Não existe"                     -> 0
 *
 * Cada dimensão vale no máximo 100 pontos, então o valor já é a % do radar.
 *   Processos: 10 itens x 10 pts
 *   Resultados: 5 itens x 20 pts
 *   Sistema de Gestão: 5 itens x 20 pts
 *   Pessoas: 10 itens x 10 pts
 */

const ANSWER_OPTIONS = [
  { id: 'full', label: 'Existe e é satisfatório', factor: 1 },
  { id: 'partial', label: 'Existe, mas não é satisfatório', factor: 0.5 },
  { id: 'none', label: 'Não existe', factor: 0 },
];

const DIMENSIONS = [
  {
    id: 'processos',
    name: 'Processos',
    weight: 10,
    color: '#3b82f6',
    intro: 'Como o trabalho realmente acontece no dia a dia.',
    questions: [
      'Os principais processos do negócio estão documentados.',
      'Quando aparecem problemas, não somente apagamos incêndios — as causas são investigadas.',
      'Os colaboradores têm clareza da missão, visão, valores, políticas, ações e objetivos.',
      'Existem indicadores mapeados e monitorados.',
      'Acontecem reuniões de alinhamento das tarefas com as equipes (gerenciamento da rotina).',
      'Os colaboradores sabem exatamente o que fazer, pois existe um manual (ou documento) de cultura/orientações.',
      'São realizados planos de ação para alcançar as metas/objetivos.',
      'Existe uma dose adequada de planejamento antes da execução.',
      'Temos uma mentalidade de melhoria contínua, utilizando a ferramenta PDCA.',
      'Temos um organograma documentado e compartilhado com todos.',
    ],
    // Leitura quando ESTA dimensão é o gargalo oculto.
    bottleneck: {
      titulo: 'Seu gargalo oculto está nos PROCESSOS',
      diagnostico:
        'Seu negócio cresceu, mas a operação ainda depende de você e de alguns "heróis". ' +
        'Sem processos documentados e rotina gerenciada, cada novo cliente adiciona caos em vez de lucro. ' +
        'O faturamento parou de crescer porque a empresa não consegue entregar mais sem quebrar — você atingiu o teto da sua própria capacidade operacional.',
      sintomas: [
        'Tudo trava quando você sai de férias ou fica um dia fora.',
        'As mesmas falhas se repetem todo mês e ninguém sabe a causa raiz.',
        'Cada pessoa faz do seu jeito, porque não há padrão documentado.',
      ],
    },
  },
  {
    id: 'resultados',
    name: 'Resultados',
    weight: 20,
    color: '#10b981',
    intro: 'O que o negócio efetivamente entrega e mede.',
    questions: [
      'A margem de lucro do negócio é mensurada e está em nível satisfatório.',
      'A satisfação do cliente é mensurada e está em nível satisfatório.',
      'A satisfação do colaborador é mensurada e está em nível satisfatório.',
      'Existe remuneração atrelada ao desempenho (ao menos para as pessoas-chave) na organização.',
      'A taxa de crescimento da empresa geralmente é maior que a esperada/planejada.',
    ],
    bottleneck: {
      titulo: 'Seu gargalo oculto está nos RESULTADOS',
      diagnostico:
        'Você está ocupado o tempo todo, mas não sabe ao certo se está lucrando. ' +
        'Sem medir margem, satisfação de cliente e de equipe, você pilota a empresa no escuro. ' +
        'O faturamento estagnou porque você otimiza o que sente, não o que os números mostram — e o que não é medido não pode ser multiplicado.',
      sintomas: [
        'Você fatura mais, mas o dinheiro "some" e a margem nunca melhora.',
        'Decisões importantes são tomadas no "achismo", sem dados.',
        'Não há clareza de qual cliente, produto ou serviço realmente dá lucro.',
      ],
    },
  },
  {
    id: 'gestao',
    name: 'Sistema de Gestão',
    weight: 20,
    color: '#f59e0b',
    intro: 'O leme estratégico que conduz a empresa.',
    questions: [
      'É feito planejamento anualmente para curto, médio e longo prazo (1 a 3 ou 1 a 5 anos).',
      'Os sistemas de informação (softwares) são adequados para o nível de maturidade/momento da empresa.',
      'As metas são bem estabelecidas, sempre contemplando: indicador, prazo e valor.',
      'Existe por parte dos donos/líderes alocação de tempo adequado para a parte estratégica da empresa.',
      'Os indicadores são acompanhados e comunicados para a equipe.',
    ],
    bottleneck: {
      titulo: 'Seu gargalo oculto está no SISTEMA DE GESTÃO',
      diagnostico:
        'Falta o leme estratégico. Sem planejamento, metas claras (indicador, prazo e valor) e tempo dedicado a pensar o negócio, ' +
        'a empresa vive presa no operacional e apenas reage ao mercado. ' +
        'O crescimento travou porque ninguém está, de fato, pilotando o longo prazo — o dono virou o funcionário mais ocupado da empresa.',
      sintomas: [
        'O dia é consumido por urgências; sobra zero tempo para estratégia.',
        'As metas existem na cabeça, mas não no papel com prazo e número.',
        'A empresa reage ao que o mercado faz, em vez de seguir um plano próprio.',
      ],
    },
  },
  {
    id: 'pessoas',
    name: 'Pessoas',
    weight: 10,
    color: '#a855f7',
    intro: 'Time, liderança e cultura que sustentam o crescimento.',
    questions: [
      'Existem ações de comunicação interna/endomarketing para gerar engajamento nas pessoas.',
      'O processo de recrutamento, seleção e integração é adequadamente conduzido.',
      'Os colaboradores recebem feedback periódico sobre seu desempenho.',
      'Talento e perfil dos colaboradores são mapeados com alguma ferramenta de Assessment (DISC, MBTI ou outros).',
      'É feito um planejamento e descrição de cada cargo.',
      'A liderança (incluindo os donos) tem uma comunicação clara, flexível e adequada.',
      'A liderança (incluindo os donos) realiza e oportuniza treinamentos técnicos e comportamentais.',
      'A liderança (incluindo os donos) executa estratégias de engajamento da equipe.',
      'A liderança (incluindo os donos) delega de forma efetiva.',
      'O ambiente físico da empresa está adequado às necessidades das atividades e dos funcionários.',
    ],
    bottleneck: {
      titulo: 'Seu gargalo oculto está nas PESSOAS',
      diagnostico:
        'Seu time é seu maior ativo — e, hoje, seu maior gargalo. ' +
        'Sem uma liderança que delega, engaja e desenvolve, tudo volta para o dono e a empresa não escala além da capacidade de uma única pessoa. ' +
        'O faturamento parou porque você é, ao mesmo tempo, o motor e o limite do negócio.',
      sintomas: [
        'Você delega, mas refaz tudo depois — então prefere fazer sozinho.',
        'Bons profissionais entram e saem; falta processo de gente.',
        'A equipe espera ordens em vez de assumir responsabilidade.',
      ],
    },
  },
];

// Faixas de interpretação da maturidade geral (média das 4 dimensões).
const MATURITY_BANDS = [
  {
    max: 40,
    label: 'Sobrevivência',
    resumo:
      'A empresa funciona na base do esforço pessoal e da reação. Há gargalos em quase todas as frentes, ' +
      'mas isso também significa que pequenos ajustes estruturais geram saltos rápidos de faturamento.',
  },
  {
    max: 70,
    label: 'Organização',
    resumo:
      'Você já saiu do caos e tem estrutura em algumas frentes, mas um gargalo específico está segurando o crescimento ' +
      'do restante. Destravá-lo é o que separa você do próximo patamar.',
  },
  {
    max: 101,
    label: 'Escala',
    resumo:
      'A base está sólida. O gargalo aqui é fino e específico — o tipo de ajuste que, bem executado, ' +
      'transforma uma empresa boa em uma empresa que cresce de forma previsível e sustentável.',
  },
];

if (typeof module !== 'undefined') {
  module.exports = { ANSWER_OPTIONS, DIMENSIONS, MATURITY_BANDS };
}
