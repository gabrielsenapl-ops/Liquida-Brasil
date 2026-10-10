// diario.js - Diário do Rombo: 22 páginas que mostram o que o rombo compraria na vida real.
// Exceção autorizada (CLAUDE.md, 30/09/2026): só aqui os textos usam valores reais do caso e citam fontes,
// sempre com a ressalva escrita. Os valores reais são FIXOS; só o gatilho escala (GM.data.ESCALA).
// Funções puras: sem DOM e sem aleatório. Rodam no Node (tools/test.js e tools/sim.js).
(function (root) {
  const GM = root.GM = root.GM || {};
  const D = GM.data || (typeof require === 'function' ? require('./data.js') : null);

  // Gatilho >= valor real do texto: "o rombo já paga isso" continua verdade quando a página abre mais tarde.
  // Exceção (Rodada 2, decisão do Gabriel): páginas 20 e 21 abrem em 44 e 48 bi; o texto delas não diz que o rombo do jogo paga o valor.
  // Alguns gatilhos foram subidos para espaçar o ritmo (tools/sim.js mostra o mês médio de cada página).
  // Ordem = ordem das páginas. valor em R$ reais (tipo rombo/luxo/luxo_unico). real = bloco "NA VIDA REAL...".
  const PAGINAS_DIARIO = [
    { id: 'upa_fantasma', ordem: 1, titulo: 'UPA Fantasma', tipo: 'rombo', valor: 14.5e6,
      dica: 'Uma obra de saúde que levaria 18 meses.',
      real: 'Uma UPA 24h custa cerca de R$ 14,5 mi e leva 18 meses para ficar pronta.',
      fonte: 'Prefeitura de São Paulo' },
    { id: 'hospital_brinquedo', ordem: 2, titulo: 'Hospital de Brinquedo', tipo: 'rombo', valor: 20e6,
      dica: 'Quase uma UPA e meia.',
      real: 'R$ 20 mi constroem um hospital municipal de cerca de 3,4 mil m².',
      fonte: 'Prefeitura de Indaiatuba (orçamento de 2023)' },
    { id: 'showzinho', ordem: 3, titulo: 'Só um Showzinho Particular', tipo: 'luxo_unico', valor: 11.4e6,   // gatilho (etapa 8): luxo: uma festa de R$ 22 mi ou mais no jogo (o texto cita o valor real); antes 65e6
      dica: 'Gaste muito em UMA festa só.',
      real: 'Uma atração internacional custou cerca de US$ 11,4 mi (R$ 65 mi) numa festa privada, segundo documentos citados na imprensa (a defesa nega). Dá mais de 13 creches.',
      fonte: 'Reportagem (Jovem Pan)' },
    { id: 'fim_de_semana', ordem: 4, titulo: 'Fim de Semana Improdutivo', tipo: 'luxo', valor: 50e6,   // gatilho (etapa 8): luxo: cerca de R$ 97 mi do jogo em festas e mimos; antes 340e6
      dica: 'Festa, iate e ilha: some tudo.',
      real: 'R$ 340 mi dariam cerca de 72 creches, ou 23 UPAs, ou merenda para 2 milhões de alunos por um ano.',
      fonte: 'Contratos FNDE 2026; MEC; Pref. de São Paulo' },
    { id: 'buffet', ordem: 5, titulo: 'Buffet sem Fundo', tipo: 'luxo', valor: 100e6,   // gatilho (etapa 8): luxo: cerca de R$ 193 mi do jogo em festas e mimos; antes 390e6
      dica: 'Mais luxo ainda.',
      real: 'Reportagem aponta ao menos R$ 390 mi em festas, iates e viagens entre 2021 e 2023 (a defesa nega): cerca de 83 creches ou 27 UPAs.',
      fonte: 'Reportagem (Jovem Pan)' },
    { id: 'professor_ano', ordem: 6, titulo: 'Professor do Ano (Todos)', tipo: 'rombo', valor: 1e9,
      dica: 'O primeiro bilhão.',
      real: 'R$ 1 bi paga cerca de 15 mil professores por um ano, no piso nacional de R$ 5.130,63 (só salário e 13º, sem encargos).',
      fonte: 'MEC, Lei 15.437/2026' },
    { id: 'vacina', ordem: 7, titulo: 'Vacina? Só no Catálogo', tipo: 'rombo', valor: 1.2e9,
      dica: 'O preço de uma vacina que o SUS negou.',
      real: 'O SUS negou a vacina contra herpes-zóster por custar R$ 1,2 bi por ano. Com o rombo final seriam 43 anos.',
      fonte: 'Poder360' },
    { id: 'creche_papel', ordem: 8, titulo: 'Creche Só no Papel', tipo: 'rombo', valor: 5e9,
      dica: 'Cinco bilhões, e nenhuma criança.',
      real: 'R$ 5 bi dariam cerca de 1.060 creches padrão FNDE (R$ 4,7 mi cada). É o prejuízo mínimo estimado de um banco público, segundo auditoria citada pela Polícia Federal.',
      fonte: 'Contratos FNDE 2026; Jornal de Brasília' },
    { id: 'familia_vermelho', ordem: 9, titulo: 'Família Inteira no Vermelho', tipo: 'rombo', valor: 5e9,
      dica: 'O mesmo valor, outro uso.',
      real: 'R$ 5 bi pagam o Bolsa Família por um ano a cerca de 536 mil famílias (média de R$ 777 por mês).',
      fonte: 'MDS; InfoMoney' },
    { id: 'farmacia_fechada', ordem: 10, titulo: 'Farmácia Fechada para Balanço', tipo: 'rombo', valor: 6e9,
      dica: 'Remédio de graça, por um ano.',
      real: 'Cerca de um ano de Farmácia Popular, que atendeu mais de 24 milhões de pessoas em 2026 (as fontes variam entre R$ 4,7 e 6,8 bi).',
      fonte: 'Ministério da Saúde; Câmara dos Deputados' },
    { id: 'piso_pobre', ordem: 11, titulo: 'Piso é Coisa de Pobre', tipo: 'rombo', valor: 6.4e9,
      dica: 'O aumento que os professores esperaram.',
      real: 'R$ 6,4 bi é o custo do reajuste do piso dos professores em 2026 (estimativa do Senado). O rombo final paga 8 reajustes.',
      fonte: 'Senado Federal' },
    { id: 'merenda_premium', ordem: 12, titulo: 'Merenda Premium', tipo: 'rombo', valor: 9.5e9,   // gatilho (etapa 8): ritmo: separa da página 11; antes 6.7e9
      dica: 'Um ano de almoço escolar.',
      real: 'R$ 6,7 bi é o orçamento de um ano de merenda para cerca de 40 milhões de alunos (R$ 0,57 por aluno por dia no fundamental e médio). O rombo final paga 7,7 anos.',
      fonte: 'MEC; Correio Braziliense' },
    { id: 'carteira_mentira', ordem: 13, titulo: 'Carteira de Mentira', tipo: 'rombo', valor: 12.2e9,
      dica: 'Crédito que só existia em planilha.',
      real: 'A Polícia Federal diz que um banco público comprou R$ 12,2 bi em créditos considerados falsos (cerca de 2.600 creches). Apurações em andamento; a defesa nega.',
      fonte: 'Jornal de Brasília; Agência Brasil' },
    { id: 'bolsa_banqueiro', ordem: 14, titulo: 'Bolsa Banqueiro', tipo: 'rombo', valor: 17.5e9,   // gatilho (etapa 8): ritmo; antes 13e9
      dica: 'Um mês de transferência de renda.',
      real: 'R$ 13 bi são um mês inteiro de Bolsa Família para cerca de 18,8 milhões de famílias.',
      fonte: 'Secom (fev/2026)' },
    { id: 'quadro_negro', ordem: 15, titulo: 'Quadro Negro, Cofre Cheio', tipo: 'rombo', valor: 20e9,   // gatilho (etapa 8): ritmo; antes 13.8e9
      dica: 'Falta dinheiro na escola.',
      real: 'R$ 13,8 bi é a restrição orçamentária da Educação em 2026, segundo a consultoria do Senado.',
      fonte: 'Poder360 (nota técnica do Senado)' },
    { id: 'fila_sus', ordem: 16, titulo: 'Fila do SUS Virou Cassino', tipo: 'rombo', valor: 22e9,   // gatilho (etapa 8): ritmo; antes 15.1e9
      dica: 'Falta dinheiro no hospital.',
      real: 'R$ 15,1 bi é a restrição orçamentária da Saúde em 2026, segundo a consultoria do Senado.',
      fonte: 'Poder360 (nota técnica do Senado)' },
    { id: 'postinho_luxo', ordem: 17, titulo: 'Postinho de Luxo', tipo: 'rombo', valor: 27e9,
      dica: 'Postos de saúde em escala industrial.',
      real: 'R$ 27 bi pagam cerca de 14 mil UBS Porte I (R$ 1,9 mi cada). Com o rombo final, cerca de 27 mil.',
      fonte: 'Ministério da Saúde (tabela do Novo PAC)' },
    { id: 'a_conta_chegou', ordem: 18, titulo: 'A Conta Chegou', tipo: 'rombo', valor: 32.5e9,
      dica: 'Alguém vai pagar. Não é você, ainda.',
      real: 'Os bancos anteciparam 5 anos de contribuições (R$ 32,5 bi) para recompor o fundo garantidor. O custo chega aos clientes de forma indireta.',
      fonte: 'Seu Dinheiro; CNN Brasil' },
    { id: 'rombo_recorde', ordem: 19, titulo: 'Rombo Recorde', tipo: 'rombo', valor: 40.6e9,
      dica: 'O maior da história.',
      real: 'R$ 40,6 bi só do banco principal. Com os outros dois, R$ 51,8 bi: o maior acionamento da história do fundo garantidor, cerca de 40% do caixa que ele tinha antes da crise.',
      fonte: 'Poder360; CNN Brasil' },
    { id: 'um_terco', ordem: 20, titulo: 'Um Terço do Prato', tipo: 'rombo', valor: 44e9,   // gatilho (Rodada 2): antes 51.8e9
      dica: 'Quase o fim do diário.',
      real: 'R$ 51,8 bi são cerca de 33% do orçamento anual inteiro do Bolsa Família (R$ 158,6 bi).',
      fonte: 'Senado Federal (LOA 2026)' },
    { id: 'lucro_gigante', ordem: 21, titulo: 'Lucro de Gigante', tipo: 'rombo', valor: 48e9,   // gatilho (Rodada 2): antes 51.8e9
      dica: 'Compare com quem lucra.',
      real: 'O rombo equivale a 48% do lucro de 2025 dos quatro maiores bancos do país somados (R$ 107,7 bi).',
      fonte: 'Business Moment' },
    { id: 'jogo_zerado', ordem: 22, titulo: 'Jogo Zerado, País Quebrado', tipo: 'fim_vitoria', valor: null,
      dica: 'Termine o serviço.',
      real: 'R$ 51,8 bi dariam cerca de 11 mil creches, 27 mil postos de saúde, 4 meses de Bolsa Família para todas as famílias do programa ou 8 anos de Farmácia Popular. Foi só um jogo.',
      fonte: 'Soma das páginas anteriores' },
  ];

  const paginaPorId = {}; PAGINAS_DIARIO.forEach(p => { paginaPorId[p.id] = p; });

  // rombo do jogo convertido para R$ reais (o rombo do motor nunca diminui, então não precisa de máximo)
  const romboReal = estado => estado.rombo * D.ESCALA;

  function cruzou(p, estado) {
    switch (p.tipo) {
      case 'rombo': return romboReal(estado) >= p.valor;
      case 'luxo': return (estado.luxoAcumulado || 0) >= p.valor;
      case 'luxo_unico': return (estado.luxoMaiorUnico || 0) >= p.valor;
      case 'fim_vitoria': return !!(estado.fim && estado.fim.vitoria);
      default: return false;
    }
  }
  // ids que acabaram de cruzar o gatilho, na ordem das páginas, sem repetir os já desbloqueados
  function checarPaginas(estado, desbloqueadas) {
    const ja = desbloqueadas || [];
    return PAGINAS_DIARIO.filter(p => ja.indexOf(p.id) < 0 && cruzou(p, estado)).map(p => p.id);
  }

  // save do navegador (chave 'diario'): lista de ids. Save antigo sem a chave ou estragado = lista vazia, sem erro.
  const normalizarSalvo = v => (Array.isArray(v) ? v.filter((id, i) => paginaPorId[id] && v.indexOf(id) === i) : []);

  GM.diario = { PAGINAS_DIARIO, paginaPorId, romboReal, checarPaginas, normalizarSalvo };
  if (typeof module !== 'undefined' && module.exports) module.exports = GM.diario;
})(typeof window !== 'undefined' ? window : globalThis);
