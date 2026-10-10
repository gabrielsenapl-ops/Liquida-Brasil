// data.js - TODOS os dados do jogo: golpes, aliados, ações, eventos, faixas, finais e números.
// Quem for editar textos ou balanceamento: é aqui. Valores em R$ milhões (caixa) e R$ bilhões (rombo).
(function (root) {
  const GM = root.GM = root.GM || {};

  // ------------------------------------------------------------------
  // Parâmetros de balanceamento (SPEC seções 5 e 6)
  // ------------------------------------------------------------------
  const params = {
    mesMax: 60,
    romboMeta: 100,              // R$ bi para "País Quebrado"
    inicio: { caixa: 200, suspeita: 5, rombo: 0 },
    acoesPorMes: 2,

    // Suspeita (6.2)
    heatDivisor: 55,             // heat = 1 + rombo / heatDivisor
    inspecaoMult: 1.5,           // multiplicador com inspeção total
    fundoMult: 0.8,              // Fundo de Fundo de Fundo
    blindagemDivisor: 200,       // redução = blindagem / divisor
    blindagemReducaoMax: 0.5,    // teto da redução (metade com inspeção total)
    decaimento: 1.0,             // "ciclo de notícia" por mês

    // Lealdade (6.4)
    lealdadeDeriva: -1,
    lealdadeDerivaAlta: -3,      // extra por mês com suspeita >= faixaAlta
    faixaAlta: 61,
    banqueiroDePe: 60,           // só visual: com suspeita >= isto o Banqueiro de Bolso levanta e aparece a mala de fuga
    mesadaNaoPaga: -15,
    lealdadeMimo: 25,
    lealdadeFesta: 20,
    delacaoLimite: 20,           // abaixo disso, chance de delatar
    delacaoChance: 0.5,
    delacaoSuspeita: 10,

    // Primeira Instância: só valem no modo difícil (números de partida; a calibração é da fase G6)
    caloteLealdade: -12,         // "Não pagar os aliados": todos perdem isto de lealdade no fechamento do mês
    caloteMeses: 3,              // por quantos meses (contando o do calote) a delação fica mais provável
    caloteDelacaoLimite: 15,     // + isto no limite de delação enquanto durar (20 -> 35)
    caloteDelacaoChance: 0.2,    // + isto na chance de delação enquanto durar (0,5 -> 0,7)
    propinaChance: 0.5,          // chance por mês de chegar um pedido de propina (além do evento do mês). Calibrado na G6
    modoPadrao: 'foro',          // modo de quem não escolheu (e de todo save antigo)
    cenarioPadrao: 'atual',      // cenário de quem nunca escolheu outro (Escritório Clássico; os demais são conquistas)
    confirmarAcimaDe: 50,        // ação que custa mais que isso (R$ mi) pede confirmação sempre (3.2)
    dispensaSuspeita: 3,         // ex-aliado dispensado "dá entrevista" (evita dispensar para fugir da delação)

    // Faixas (7.5)
    vazamentoFaixaChance: 0.6,   // 31-60: vazamento extra por mês
    vazamentoFaixaSuspeita: 5,
    operacaoChance: 0.15,        // 61-85
    operacaoChanceHeli: 0.30,    // 86-99 (dobrada)
    operacaoSuspeita: 5,
    operacaoCongela: 3,
    heliDelacaoLealdade: 40,     // 86-99: aliados abaixo disso podem delatar
    heliDelacaoChance: 0.5,

    // Reduções de vazamento
    juristaCaroVazamento: 0.7,    // -30%
    fieisVazamento: 0.75,        // -25%
    videoOperacao: 0.5,
    barraPesadaOperacao: 0.5,
    barraPesadaLimite: 85,       // acima disso o diretor perde o efeito

    // Soltura
    solturaLealdade: 40,
    solturaSuspeita: 70,
    solturaCaixaPerda: 0.3,

    // Inspeção e finais
    inspecaoRotinaRombo: 50,
    inspecaoTotalRombo: 75,
    anistiaBlindagem: 55,
    anistiaMeses: 6,
    partidoElasticoBonus: 8,
    partidoElasticoMinPoliticos: 2,

    // Eventos
    chanceEvento: 1.0,           // um evento por mês
    semRepetirMeses: 6,          // evento não repete dentro desta janela (se houver outro)
    pesoTipo: { gasto: 3, vazamento: 2, aliado: 2, sorte: 1.5, sistema: 1 },
    pesoVazamentoPorFaixa: 0.5,  // +50% no peso de vazamento a cada faixa acima da calmaria
    bonusReceita: { calculadora: 0.10, gavetaPrev: 0.25, cofreAbertoCdb: 0.50, selicCdb: 0.20 },
    principeFilme: -15,
    reajusteFracao: 0.5,

    // Pontuação (7.4)
    pontos: { romboVitoria: 100, mesRestante: 50, blindagem: 5, romboDerrota: 50, romboDelacao: 75 }
  };

  // ------------------------------------------------------------------
  // Golpes (7.1)
  // ------------------------------------------------------------------
  const golpes = [
    { id: 'cdb', nome: 'CDB Absurdo a 140%', tipo: 'recorrente', custo: 20, caixa: 10, rombo: 0.33, suspeita: 0.4,
      icone: 'moeda', desc: 'Rende 140% do CDI. Ninguém pergunta de onde vem o resto.' },
    { id: 'consignado', nome: 'Consignado de Associação', tipo: 'recorrente', custo: 50, caixa: 17, rombo: 0.66, suspeita: 0.8,
      icone: 'bolo', desc: 'Aposentados associados a uma associação que eles não sabem que existe.' },
    { id: 'precatorios', nome: 'Precatórios Turbinados', tipo: 'recorrente', custo: 40, caixa: 23, rombo: 0.43, suspeita: 0.5,
      icone: 'jornal', desc: 'Compra dívida do governo a preço de banana e vende a preço de caviar.' },
    { id: 'gospel', nome: 'Banco Digital Gospel', tipo: 'recorrente', custo: 60, caixa: 15, rombo: 0.85, suspeita: 1.0,
      exigeAliado: 'bispo', icone: 'igreja', desc: 'Conta com cashback em bênçãos. Dízimo em débito automático.' },
    { id: 'fundofundo', nome: 'Fundo de Fundo de Fundo', tipo: 'recorrente', custo: 80, caixa: 0, rombo: 0, suspeita: 0,
      exigeRecorrentes: 2, icone: 'escudo', desc: 'Ninguém sabe o que tem dentro, nem o próprio fundo. Suspeita passiva x0,8.' },
    { id: 'carteira', nome: 'Carteira Fantasma', tipo: 'unica', caixa: 125, rombo: 3.3, suspeita: 12, recarga: 8,
      exigeAliado: 'quadradinho', icone: 'taca', desc: 'Vendida a um banco estatal que jura ter conferido.' },
    { id: 'previdencia', nome: 'Previdência dos Outros', tipo: 'unica', caixa: 60, rombo: 2.1, suspeita: 8, recarga: 6,
      exigeAliado: 'aposentadoriaalheia', icone: 'cadeia', desc: 'O fundo dos servidores estaduais investe em confiança.' },
    // Golpes passivos: só na Primeira Instância (soModo). Rendem caixa todo mês, sem rombo; só abrem com o aliado
    // exigido e param se ele sair ou delatar (precisa abrir de novo). rendaSobe/rendaTeto: a renda cresce por mês rendendo.
    { id: 'assinatura', nome: 'Assinatura Eterna', tipo: 'recorrente', passivo: true, soModo: 'primeirainstancia', custo: 40, caixa: 8, rombo: 0, suspeita: 1,
      exigeAliado: 'controleremoto', icone: 'filmadora', desc: 'O canal que ninguém assinou e todo mundo paga. Cancelamento só por carta, em outro país.' },
    { id: 'taxanada', nome: 'Taxa de Manutenção do Nada', tipo: 'recorrente', passivo: true, soModo: 'primeirainstancia', custo: 60, caixa: 12, rombo: 0, suspeita: 2,
      exigeAliado: 'calculadora', icone: 'moeda', desc: 'Cobrada todo mês para manter uma conta que não faz nada. Com muito zelo.' },
    { id: 'emendaelastica', nome: 'Emenda Elástica', tipo: 'recorrente', passivo: true, soModo: 'primeirainstancia', custo: 90, caixa: 10, rendaSobe: 2, rendaTeto: 30, rombo: 0, suspeita: 2,
      exigeAliado: 'partidoelastico', icone: 'jornal', desc: 'Uma emenda que estica todo mês. Se o Partido Elástico sair, ela encolhe de volta.' }
  ];

  // ------------------------------------------------------------------
  // Aliados (7.2). Frases do epílogo: caiu / delatou / ganhou.
  // artigo: usado por engine.nomeCom para montar "do Jurista Caro", "para o Ministro Tofu" ("" = sem artigo).
  // ------------------------------------------------------------------
  const aliados = [
    { id: 'cofreaberto', nome: 'Senador Cofre-Aberto', artigo: 'o', curto: 'Senador', campo: 'direita/centrão', politico: true, custo: 30, mesada: 6, blindagem: 12, lealdade: 70,
      poder: 'Emenda do Cofre: CDB rende +50%.',
      epilogo: { caiu: 'Senador Cofre-Aberto alega que a emenda era "para a obra". A obra nega.',
        delatou: 'Senador Cofre-Aberto lembrou de tudo, com datas, na terceira hora de depoimento.',
        ganhou: 'Senador Cofre-Aberto foi reeleito com o slogan "experiência em cofres".' } },
    { id: 'principe', nome: 'Príncipe do Patriotismo', artigo: 'o', curto: 'Príncipe', campo: 'direita', politico: true, custo: 20, mesada: 4, blindagem: 8, lealdade: 60,
      poder: 'Filme de campanha: filmes baixam 15 de suspeita, mas ele pede dinheiro (10%/mês).',
      epilogo: { caiu: 'Príncipe do Patriotismo diz que o filme era "baseado em fatos irreais".',
        delatou: 'Príncipe do Patriotismo vendeu os direitos da delação para uma série.',
        ganhou: 'Príncipe do Patriotismo lançou a parte 2 do filme. Bilheteria: os próprios assessores.' } },
    { id: 'aposentadoriaalheia', nome: 'Governador Aposentadoria Alheia', artigo: 'o', campo: 'direita', politico: true, custo: 40, mesada: 8, blindagem: 6, lealdade: 65,
      poder: 'Libera a Previdência dos Outros.',
      epilogo: { caiu: 'Governador Aposentadoria Alheia descobriu que a previdência era de areia. A dele era de ouro, e noutro nome.',
        delatou: 'Governador Aposentadoria Alheia entregou a planilha do fundo, com uma aba secreta chamada "a minha".',
        ganhou: 'Governador Aposentadoria Alheia se aposentou aos 45 anos como "conselheiro vitalício do próprio fundo".' } },
    { id: 'quadradinho', nome: 'Chefe do Quadradinho', artigo: 'o', campo: 'centro', politico: true, custo: 40, mesada: 8, blindagem: 6, lealdade: 65,
      poder: 'Libera a Carteira Fantasma.',
      epilogo: { caiu: 'Chefe do Quadradinho jura que conferiu a carteira. Estava vazia, mas conferiu.',
        delatou: 'Chefe do Quadradinho disse que só assinou "o que o técnico mandou". O técnico era você.',
        ganhou: 'Chefe do Quadradinho virou consultor de "gestão de ativos invisíveis".' } },
    { id: 'partidoelastico', nome: 'Presidente do Partido Elástico', artigo: 'o', campo: 'centrão', politico: true, custo: 20, mesada: 5, blindagem: 6, lealdade: 60,
      poder: 'Legenda de Aluguel: +8 blindagem com 2 ou mais políticos ativos.',
      epilogo: { caiu: 'Presidente do Partido Elástico trocou de legenda três vezes no caminho até a delegacia.',
        delatou: 'Presidente do Partido Elástico alugou a própria delação para quem pagou mais.',
        ganhou: 'Presidente do Partido Elástico abriu uma locadora de partidos. Diárias acessíveis.' } },
    { id: 'gaveta', nome: 'Guardião da Gaveta', artigo: 'o', campo: 'centro', politico: true, custo: 30, mesada: 6, blindagem: 7, lealdade: 60,
      poder: 'Previdência dos Outros rende +25%.',
      epilogo: { caiu: 'Guardião da Gaveta segurou o processo na gaveta até a gaveta cair junto.',
        delatou: 'Guardião da Gaveta pautou a própria delação em regime de urgência.',
        ganhou: 'Guardião da Gaveta presidiu a comissão que investigou... a comissão.' } },
    { id: 'calculadora', nome: 'Ex-Ministro da Calculadora', artigo: 'o', campo: 'esquerda', politico: true, custo: 30, mesada: 8, blindagem: 7, lealdade: 60,
      poder: 'Conselho Econômico: golpes recorrentes rendem +10%.',
      epilogo: { caiu: 'Ex-Ministro da Calculadora culpou "a conjuntura internacional" e a conjuntura não se defendeu.',
        delatou: 'Ex-Ministro da Calculadora explicou tudo num gráfico que ninguém entendeu, nem o delegado.',
        ganhou: 'Ex-Ministro da Calculadora lançou curso on-line: "Nova Matriz Patrimonial".' } },
    { id: 'juristacaro', nome: 'O Jurista Caro', artigo: 'o', curto: 'Jurista', campo: 'jurídico', politico: false, custo: 35, mesada: 6, blindagem: 8, lealdade: 65,
      poder: 'Parecer Caríssimo: vazamentos de imprensa -30%.',
      epilogo: { caiu: 'O Jurista Caro emitiu parecer de 400 páginas concluindo que ele não estava lá.',
        delatou: 'O Jurista Caro cobrou honorários do delegado pela delação.',
        ganhou: 'O Jurista Caro foi contratado pelo outro lado. E pelo outro. E pelo outro.' } },
    { id: 'tofu', nome: 'Ministro Tofu', artigo: 'o', campo: 'judiciário', politico: false, custo: 60, mesada: 15, blindagem: 10, lealdade: 60,
      poder: 'Habeas Amigo: solta você uma vez; cancela 1 operação por semestre.',
      epilogo: { caiu: 'Ministro Tofu se declarou impedido de julgar a si mesmo. Depois mudou de ideia.',
        delatou: 'Ministro Tofu concedeu habeas corpus preventivo à própria delação.',
        ganhou: 'Ministro Tofu tirou férias em resort. Pagas por um resort.' } },
    { id: 'inquerito', nome: 'Ministro Inquérito Eterno', artigo: 'o', campo: 'judiciário', politico: false, custo: 80, mesada: 20, blindagem: 15, lealdade: 55,
      poder: 'Cancela 1 operação por semestre. O mais forte e o mais caro.',
      epilogo: { caiu: 'Ministro Inquérito Eterno abriu inquérito sobre quem abriu inquérito sobre ele.',
        delatou: 'Ministro Inquérito Eterno delatou em sigilo. O sigilo vazou em 4 minutos.',
        ganhou: 'Ministro Inquérito Eterno seguiu severo, sem sorriso e com um relógio novo.' } },
    { id: 'bispo', nome: 'Bispo do Rendimento Celestial', artigo: 'o', curto: 'Bispo', campo: 'igreja', politico: false, custo: 25, mesada: 5, blindagem: 4, lealdade: 70,
      poder: 'Libera o Banco Digital Gospel e "Comprar fiéis".',
      epilogo: { caiu: 'Bispo do Rendimento Celestial disse que o rombo foi "provação". A provação foi ao inquérito.',
        delatou: 'Bispo do Rendimento Celestial confessou tudo, ao vivo, em culto com dízimo digital.',
        ganhou: 'Bispo do Rendimento Celestial abriu mais 40 templos. Todos com agência bancária.' } },
    { id: 'barrapesada', nome: 'Diretor Barra-Pesada', artigo: 'o', campo: 'regulador', politico: false, custo: 70, mesada: 20, blindagem: 10, lealdade: 55,
      poder: 'Metade da chance de operação policial (perde o efeito acima de 85 de suspeita).',
      epilogo: { caiu: 'Barra-Pesada foi fiscalizado pelo próprio crachá.',
        delatou: 'Barra-Pesada entregou uma lupa e um relatório: "eu avisei (a ele)".',
        ganhou: 'Barra-Pesada foi promovido por "conhecer o mercado por dentro".' } },
    // Só na Primeira Instância (soModo): no Foro Privilegiado não aparece e não pode ser recrutado.
    { id: 'controleremoto', nome: 'Dono do Controle Remoto', artigo: 'o', curto: 'Dono do Controle', campo: 'mídia', politico: false, soModo: 'primeirainstancia',
      custo: 35, mesada: 8, blindagem: 8, lealdade: 60,
      poder: 'Manda em todos os canais. Na Primeira Instância, sem ele não tem Fake news.',
      epilogo: { caiu: 'Dono do Controle Remoto saiu do ar "por problemas técnicos". Volta depois dos comerciais. Ou não.',
        delatou: 'Dono do Controle Remoto transmitiu a própria delação em horário nobre, com intervalo a cada cinco minutos.',
        ganhou: 'Dono do Controle Remoto estreou um programa de domingo: "Quem Quer Ser Anistiado?". Audiência recorde.' } }
  ];

  // ------------------------------------------------------------------
  // Ações de proteção (7.3). Atalhos 1 a 6 na ordem desta lista.
  // ------------------------------------------------------------------
  const acoes = [
    { id: 'festa', nome: 'Festa e jatinho', custoMin: 12, custoMax: 25, suspeita: -6, alvo: 'opcional', lealdade: 20,
      colateral: { chance: 0.3, suspeita: 8, texto: 'Foto da festa vaza: banqueiro de sunga no jatinho com metade da Esplanada.' },
      icone: 'jatinho', cena: 'boate', desc: 'Suspeita -6 e +20 de lealdade num aliado. 30%: foto vazada (+8).' },
    { id: 'filme', nome: 'Financiar filme amigo', custoMin: 40, custoMax: 60, suspeita: -10,
      colateral: { chance: 0.25, suspeita: 15, emMin: 1, emMax: 6, texto: 'Descobrem quem pagou o filme: os créditos finais tinham o CNPJ.' },
      icone: 'claquete', desc: 'Suspeita -10 (-15 com o Príncipe do Patriotismo). 25%: vaza depois (+15).' },
    { id: 'fakenews', nome: 'Fake news', custoMin: 8, custoMax: 8, suspeita: -5,
      colateral: { chance: 0.3, suspeita: 8, emMin: 1, emMax: 1, texto: '"O banco é da oposição" vira meme; todas as oposições se ofendem ao mesmo tempo.' },
      icone: 'jornal', desc: '"O banco é da oposição". Suspeita -5. 30%: vira meme (+8 no mês seguinte).' },
    { id: 'fieis', nome: 'Comprar fiéis', exigeAliado: 'bispo', exigeTexto: 'Preciso do Bispo', custoMin: 5, custoMax: 5, suspeita: -3, flag: 'fieisAte', meses: 6,
      icone: 'igreja', desc: 'Igreja e influenciador, via Bispo. Suspeita -3; vazamentos -25% por 6 meses.' },
    { id: 'video', nome: 'Vídeo para o delegado', custoMin: 8, custoMax: 8, suspeita: -2, flag: 'videoAte', meses: 3,
      icone: 'filmadora', desc: 'Vídeo institucional. Suspeita -2; chance de operação x0,5 por 3 meses.' },
    { id: 'mimo', nome: 'Mimo a um aliado', custoMin: 10, custoMax: 10, alvo: 'obrigatorio', lealdade: 25,
      icone: 'taca', desc: '+25 de lealdade num aliado.' }
  ];

  // ------------------------------------------------------------------
  // Faixas de Suspeita (7.5)
  // ------------------------------------------------------------------
  const faixas = [
    { id: 'estagiario', min: 0, max: 30, nome: 'Estagiário da Fiscalização (no celular)', cor: 'verde' },
    { id: 'reporter', min: 31, max: 60, nome: 'Repórter Curioso', cor: 'amarelo' },
    { id: 'delegado', min: 61, max: 85, nome: 'Delegado de Óculos Escuros', cor: 'laranja' },
    { id: 'helicoptero', min: 86, max: 99, nome: 'Helicóptero da Federal', cor: 'vermelho' },
    { id: 'guarulhos', min: 100, max: 100, nome: 'Guarulhos', cor: 'vermelho' }
  ];

  // Manchetes do vazamento extra da faixa "Repórter Curioso"
  const vazamentosFaixa = [
    'Repórter pergunta "de onde vem tanto dinheiro?" e ninguém responde a tempo.',
    'Coluna de bastidores cita "um banqueiro de terno transparente".',
    'Podcast de economia dedica episódio inteiro ao CDB de 140%.',
    'Estagiário da redação descobre que o banco tem mais festas que agências.',
    'Jornal publica infográfico do rombo; ninguém entende, todos compartilham.',
    'Economista pergunta no ar se 140% não seria "um pouquinho demais".'
  ];

  // Manchetes do sistema
  const textos = {
    calote: 'Mês sem mesada: o grupo dos aliados ficou em silêncio. Silêncio de quem está anotando.',
    operacao: 'Operação Antes do Que Nunca: polícia bate na porta às 6h e leva até o vaso de planta.',
    operacaoCancelada: 'Habeas Amigo: operação suspensa porque o delegado "não tinha competência para ter competência".',
    operacaoSemGolpe: 'Operação Antes do Que Nunca não acha nada congelável e congela o cafezinho.',
    soltura: 'Tribunal solta o banqueiro às 3h da manhã: "ele tem residência fixa em vários países".',
    delacaoAliado: '{nome} procura o Ministério Público "só para conversar". Conversou 11 horas.',
    mesadaAtrasada: 'Mesada {deNome} atrasa; ele passa a atender o telefone de jornalistas.',
    inspecaoTotal: 'Doutor Liquidação declara inspeção total: "vamos olhar até embaixo do tapete persa".',
    faixaSobe: 'O inimigo mudou: agora quem te vigia é o {nome}.',
    faixaDesce: 'Respiro: o {nome} voltou a cuidar da própria vida.',
    comecar: 'Mês 1. O Glass Bank abre as portas com um CDB irresistível e um cofre sem fundo.'
  };

  // ------------------------------------------------------------------
  // Eventos (7.6). DSL de efeitos:
  //  {caixa:n} {suspeita:n} {rombo:n} {blindagem:n} {lealdadeTodos:n} {lealdadeAliado:n}
  //  {lealdadeAlvo:n} {lealdadeDe:{id,n}} {mesadaExtraAlvo:fração} {congelarGolpe:meses}
  //  {pendente:{em,suspeita,texto}} {flag:nome, ate:meses} {inspecaoTotal:true}
  //  {chance:p, entao:[...], texto?}
  // Condição (cond): chaves combinadas com E -> minAliados, aliado (id ou lista: algum ativo),
  //  minFaixa, minSuspeita, minRombo, minCaixa, golpe (ativo), usouGolpe, mesMod:[m,r],
  //  minPoliticos, alvoLealdadeMax, uma (só uma vez por partida).
  // alvo: 'aleatorio' | 'politico' | 'fraco' (lealdade < cond.alvoLealdadeMax) | id de aliado | lista de ids.
  // forcaChance: chance de o evento ser o do mês, antes do sorteio (se elegível).
  // campo: quem leva a pancada (para conferir o equilíbrio).
  // ------------------------------------------------------------------
  const eventos = [
    // --- Gastos absurdos ---
    { id: 'festa_satanas', tipo: 'gasto', campo: 'todos', cond: { minAliados: 2 },
      manchete: 'Noite de gala na Madame Satanás termina com Brasília inteira de óculos escuros',
      escolhas: [
        { rotulo: 'Bancar a festa', custo: 25, efeitos: [{ suspeita: 4 }, { lealdadeTodos: 10 },
          { chance: 0.3, entao: [{ suspeita: 8 }], texto: 'Alguém tirou foto. Alguém sempre tira foto.' }] },
        { rotulo: 'Cancelar', efeitos: [{ lealdadeTodos: -10 }] }
      ] },
    { id: 'jatinho_lima', tipo: 'gasto', campo: 'mercado', cena: 'jatinho', manchete: 'Voo de negócios: destino, o mesmo do dono do jatinho',
      efeitos: [{ caixa: -12 }, { suspeita: 6 }] },
    { id: 'cofre_trava', tipo: 'gasto', campo: 'mercado', cena: 'cofre', cond: { minCaixa: 40, minRombo: 2 },
      manchete: 'Cofre trava com o dinheiro dentro; o suporte técnico promete voltar "em até 3 dias úteis"',
      escolhas: [
        { rotulo: 'Chamar o suporte', custo: 8, efeitos: [] },
        { rotulo: 'Forçar a porta', efeitos: [{ chance: 0.5, entao: [{ suspeita: 4 }], texto: 'Furadeira às 3 da manhã no prédio do banco. O vizinho gravou.' }] }
      ] },
    { id: 'resort_fundo', tipo: 'gasto', campo: 'mercado', cond: { minCaixa: 60 },
      manchete: 'Sócio oculto descobre hotel com vista para o rombo', efeitos: [{ caixa: -40 }, { suspeita: 5 }] },
    { id: 'bolo_gabinete', tipo: 'gasto', campo: 'direita', cond: { aliado: 'cofreaberto' },
      manchete: 'Aniversário do chefe de gabinete do senador tem bolo de quatro andares e nenhum imposto',
      efeitos: [{ caixa: -5 }, { suspeita: 2 }] },
    { id: 'contrato_escritorio', tipo: 'gasto', campo: 'judiciário', cond: { aliado: ['tofu', 'inquerito'] },
      manchete: 'Escritório de advocacia tem ótima carteira e um só cliente', efeitos: [{ caixa: -15 }, { suspeita: 4 }] },
    { id: 'haras', tipo: 'gasto', campo: 'mercado', manchete: 'Haras oferece cavalo de R$ 8 mi "para lazer institucional"',
      efeitos: [{ caixa: -8 }, { suspeita: 3 }] },
    { id: 'quadro_galeria', tipo: 'gasto', campo: 'mercado', cond: { minCaixa: 50 },
      manchete: 'Banqueiro compra quadro de artista desconhecido por preço de galeria', efeitos: [{ caixa: -20 }, { suspeita: -2 }] },
    { id: 'pizza_helicoptero', tipo: 'gasto', campo: 'mercado', manchete: 'Pizza de R$ 2 mil chega de helicóptero à reunião do conselho',
      efeitos: [{ caixa: -3 }, { suspeita: 1 }] },
    { id: 'camarote', tipo: 'gasto', campo: 'centro', cond: { minAliados: 2 },
      manchete: 'Camarote VIP recebe 40 políticos "em reunião de trabalho"', efeitos: [{ caixa: -18 }, { suspeita: 3 }] },
    { id: 'casamento_gospel', tipo: 'gasto', campo: 'igreja', manchete: 'Casamento do ano reúne pastor, banqueiro e metade dos sócios',
      efeitos: [{ caixa: -15 }, { lealdadeDe: { id: 'bispo', n: 15 } }] },

    // --- Vazamentos ---
    { id: 'celular', tipo: 'vazamento', campo: 'mídia', cond: { minFaixa: 1 },
      manchete: 'Mensagens revelam que o dono era, de fato, o dono', efeitos: [{ suspeita: 12 }] },
    { id: 'interceptador', tipo: 'vazamento', campo: 'mídia', cond: { minRombo: 2 },
      manchete: 'O Interceptador publica áudio: "isso aqui não pode aparecer"', efeitos: [{ suspeita: 10 }] },
    { id: 'desvelando', tipo: 'vazamento', campo: 'mídia', cond: { minRombo: 20 },
      manchete: 'Humorista do Canal Desvelando explica o rombo em 30 minutos e vira o vídeo mais visto do país', efeitos: [{ suspeita: 15 }] },
    { id: 'planilha', tipo: 'vazamento', campo: 'mercado', cond: { minRombo: 2 },
      manchete: 'Planilha esquecida em restaurante vira anexo do inquérito', efeitos: [{ suspeita: 8 }] },
    { id: 'backup_nuvem', tipo: 'vazamento', campo: 'mercado', cond: { minFaixa: 1 },
      manchete: 'Estagiário da TI descobre o backup na nuvem e o compartilha com "todos da empresa"', efeitos: [{ suspeita: 9 }] },
    { id: 'auditoria_lastro', tipo: 'vazamento', campo: 'regulador', cond: { usouGolpe: 'carteira' },
      manchete: 'Auditoria pergunta onde estão os bilhões da carteira; carteira responde "fui ali"', efeitos: [{ suspeita: 7 }] },
    { id: 'cpi', tipo: 'vazamento', campo: 'centro', cond: { minSuspeita: 40 },
      manchete: 'CPI é proposta; líder do governo "perde" as assinaturas',
      escolhas: [
        { rotulo: 'Pagar o sumiço', custo: 15, efeitos: [] },
        { rotulo: 'Deixar rolar', efeitos: [{ suspeita: 10 }] }
      ] },

    // --- Aliados ---
    { id: 'reajuste', tipo: 'aliado', campo: 'todos', cond: { minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo} pede reajuste "por conta da inflação institucional"',
      escolhas: [
        { rotulo: 'Pagar (+50% de mesada)', efeitos: [{ mesadaExtraAlvo: 0.5 }] },
        { rotulo: 'Negar', efeitos: [{ lealdadeAlvo: -20 }] }
      ] },
    { id: 'ameaca', tipo: 'aliado', campo: 'todos', cond: { minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo} ameaça "falar" se o cheque atrasar',
      escolhas: [
        { rotulo: 'Mandar um mimo', custo: 10, efeitos: [{ lealdadeAlvo: 5 }] },
        { rotulo: 'Ignorar', efeitos: [{ lealdadeAlvo: -25 }] }
      ] },
    { id: 'troca_partido', tipo: 'aliado', campo: 'centrão', cond: { minPoliticos: 1 }, alvo: 'politico',
      manchete: '{alvo} troca de partido e esquece de avisar o banco', efeitos: [{ lealdadeAlvo: -15 }] },
    { id: 'advogado_caro', tipo: 'aliado', campo: 'jurídico', cond: { minAliados: 1, alvoLealdadeMax: 50 }, alvo: 'fraco',
      manchete: '{alvo} contrata advogado caro demais para quem "não fez nada"', efeitos: [{ lealdadeAlvo: -20 }] },
    { id: 'promovido', tipo: 'aliado', campo: 'todos', cond: { minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo} é promovido a cargo maior sem mudar de hábitos', efeitos: [{ blindagemAlvo: 5 }] },
    // grupo 'ultima': as 4 variantes dividem a mesma chance forçada e saem na ordem da menos vista
    { id: 'so_mais_uma', grupo: 'ultima', tipo: 'aliado', campo: 'todos', estilo: 'chat', cond: { minAliados: 1, alvoLealdadeMax: 55 }, alvo: 'fraco', forcaChance: 0.12,
      manchete: '{alvo}: "Oi, tudo bem? Só mais uma. Só mais UMA. Prometo que é a última." (digitando...)',
      escolhas: [
        { rotulo: 'Pagar a última (de novo)', custo: 10, efeitos: [{ lealdadeAlvo: 10 }, { mesadaExtraAlvo: 0.25 }] },
        { rotulo: 'Negociar "no carinho"', efeitos: [{ chance: 0.5, entao: [{ lealdadeAlvo: 5 }], texto: 'Acordo fechado por áudio de 4 minutos.' }, { chance: 0.5, entao: [{ lealdadeAlvo: -10 }], texto: 'Visualizou e não respondeu. Pior: respondeu "kkk".' }] },
        { rotulo: 'Deixar no vácuo', efeitos: [{ lealdadeAlvo: -15 }] }
      ] },
    { id: 'ultima_penultima', grupo: 'ultima', tipo: 'aliado', campo: 'todos', estilo: 'chat', cond: { minAliados: 1, alvoLealdadeMax: 55 }, alvo: 'fraco', forcaChance: 0.12,
      manchete: '{alvo}: "Sei que eu disse que era a última. Me expressei mal. Era a penúltima." (digitando...)',
      escolhas: [
        { rotulo: 'Pagar a penúltima', custo: 10, efeitos: [{ lealdadeAlvo: 10 }, { mesadaExtraAlvo: 0.25 }] },
        { rotulo: 'Pedir desconto de fidelidade', efeitos: [{ chance: 0.5, entao: [{ lealdadeAlvo: 5 }], texto: 'Ele deu 5% de desconto e cobrou 6% de taxa de desconto.' }, { chance: 0.5, entao: [{ lealdadeAlvo: -10 }], texto: '"Desconto? Depois de tudo que eu fiz por você?" (áudio de 9 minutos)' }] },
        { rotulo: 'Mandar print da promessa', efeitos: [{ lealdadeAlvo: -15 }] }
      ] },
    { id: 'ultima_boleto', grupo: 'ultima', tipo: 'aliado', campo: 'todos', estilo: 'chat', cond: { minAliados: 1, alvoLealdadeMax: 55 }, alvo: 'fraco', forcaChance: 0.12,
      manchete: '{alvo} mandou a foto de um boleto vencido: "Olha só o que chegou aqui. Que coincidência, né?"',
      escolhas: [
        { rotulo: 'Pagar o boleto (e os juros)', custo: 10, efeitos: [{ lealdadeAlvo: 10 }, { mesadaExtraAlvo: 0.25 }] },
        { rotulo: 'Perguntar de que é o boleto', efeitos: [{ chance: 0.5, entao: [{ lealdadeAlvo: 5 }], texto: 'Era da academia. Ele prometeu ir. Você pagou mesmo assim.' }, { chance: 0.5, entao: [{ lealdadeAlvo: -10 }], texto: 'Era o boleto de um jet ski. Ele ficou ofendido com a pergunta.' }] },
        { rotulo: 'Responder "que coincidência"', efeitos: [{ lealdadeAlvo: -15 }] }
      ] },
    { id: 'ultima_bomdia', grupo: 'ultima', tipo: 'aliado', campo: 'todos', estilo: 'chat', cond: { minAliados: 1, alvoLealdadeMax: 55 }, alvo: 'fraco', forcaChance: 0.12,
      manchete: '{alvo}: "Bom dia, flor do dia! Passando só para lembrar daquele assunto. Aquele. O de sempre. Com correção."',
      escolhas: [
        { rotulo: 'Pagar o de sempre', custo: 10, efeitos: [{ lealdadeAlvo: 10 }, { mesadaExtraAlvo: 0.25 }] },
        { rotulo: 'Mandar "bom dia" de volta', efeitos: [{ chance: 0.5, entao: [{ lealdadeAlvo: 5 }], texto: 'Ele mandou uma figurinha de café. A paz durou até o almoço.' }, { chance: 0.5, entao: [{ lealdadeAlvo: -10 }], texto: '"Bom dia não paga boleto." Ele tem razão, e isso irrita.' }] },
        { rotulo: 'Silenciar o contato por 8 horas', efeitos: [{ lealdadeAlvo: -15 }] }
      ] },
    // Pedidos de propina por mensagem: só na Primeira Instância (cond.modo), sorteados à parte (params.propinaChance).
    // Calibrados na G6: pagar quase não compra lealdade (só evita perder); ignorar custa caro.
    { id: 'propina_pix', tipo: 'propina', campo: 'todos', estilo: 'chat', cond: { modo: 'primeirainstancia', minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo}: "Me manda um pix aí. A chave é meu CPF. Não, pera: é o CPF do meu motorista." (digitando...)',
      escolhas: [
        { rotulo: 'Mandar o pix', custo: 12, efeitos: [{ lealdadeAlvo: 2 }] },
        { rotulo: 'Fingir que não viu', efeitos: [{ lealdadeAlvo: -12 }] }
      ] },
    { id: 'propina_emenda', tipo: 'propina', campo: 'todos', estilo: 'chat', cond: { modo: 'primeirainstancia', minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo}: "Tem uma emendinha aqui precisando de um empurrãozinho. Empurrãozinho de uns R$ 15 mi."',
      escolhas: [
        { rotulo: 'Empurrar', custo: 23, efeitos: [{ lealdadeAlvo: 4 }] },
        { rotulo: 'Responder "não"', efeitos: [{ lealdadeAlvo: -15 }, { chance: 0.3, entao: [{ suspeita: 4 }], texto: 'O print do seu "não" vazou com a frase anterior, que era bem pior.' }] }
      ] },
    { id: 'propina_aniversario', tipo: 'propina', campo: 'todos', estilo: 'chat', cond: { modo: 'primeirainstancia', minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo}: "Domingo é meu aniversário. Não precisa trazer nada. Só um envelope. Grosso."',
      escolhas: [
        { rotulo: 'Mandar o envelope', custo: 15, efeitos: [{ lealdadeAlvo: 3 }] },
        { rotulo: 'Mandar um bolo', efeitos: [{ lealdadeAlvo: -9 }] }
      ] },
    { id: 'propina_audio', tipo: 'propina', campo: 'todos', estilo: 'chat', cond: { modo: 'primeirainstancia', minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo} mandou um áudio de 7 minutos. Resumo: "quanto você acha justo? (pausa longa) Eu acho o dobro."',
      escolhas: [
        { rotulo: 'Pagar o dobro', custo: 30, efeitos: [{ lealdadeAlvo: 5 }] },
        { rotulo: 'Pagar o justo', custo: 15, efeitos: [{ lealdadeAlvo: 1 }] },
        { rotulo: 'Ouvir em 2x e não responder', efeitos: [{ lealdadeAlvo: -18 }] }
      ] },
    { id: 'propina_figurinha', tipo: 'propina', campo: 'todos', estilo: 'chat', cond: { modo: 'primeirainstancia', minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo} mandou a figurinha de um cofrinho chorando. Depois outra. Depois mais 14.',
      escolhas: [
        { rotulo: 'Mandar um trocado', custo: 9, efeitos: [{ lealdadeAlvo: 2 }] },
        { rotulo: 'Responder com outra figurinha', efeitos: [{ chance: 0.5, entao: [{ lealdadeAlvo: 1 }], texto: 'Ele mandou "kkkk". Acordo selado por figurinha.' }, { chance: 0.5, entao: [{ lealdadeAlvo: -12 }], texto: 'A figurinha era a de um palhaço. Ele entendeu como pessoal.' }] }
      ] },
    { id: 'propina_cozinha', tipo: 'propina', campo: 'todos', estilo: 'chat', cond: { modo: 'primeirainstancia', minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo}: "Tô reformando a cozinha. Coisa simples: ilha de mármore, adega e um cofre embutido. O cofre é decorativo."',
      escolhas: [
        { rotulo: 'Pagar a ilha (e o cofre)', custo: 18, efeitos: [{ lealdadeAlvo: 3 }] },
        { rotulo: 'Mandar o contato de um pedreiro', efeitos: [{ lealdadeAlvo: -12 }] }
      ] },
    { id: 'propina_vaquinha', tipo: 'propina', campo: 'todos', estilo: 'chat', cond: { modo: 'primeirainstancia', minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo} criou o grupo "Vaquinha do Amigo". Participantes: você. Meta: R$ 10 mi. Arrecadado: R$ 0.',
      escolhas: [
        { rotulo: 'Bater a meta sozinho', custo: 10, efeitos: [{ lealdadeAlvo: 2 }] },
        { rotulo: 'Sair do grupo', efeitos: [{ lealdadeAlvo: -14 }] }
      ] },
    { id: 'propina_consultoria', tipo: 'propina', campo: 'todos', estilo: 'chat', cond: { modo: 'primeirainstancia', minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo}: "Abri uma consultoria. Primeiro cliente: você. O serviço a gente define depois, com calma."',
      escolhas: [
        { rotulo: 'Contratar a consultoria', custo: 20, efeitos: [{ lealdadeAlvo: 4 }] },
        { rotulo: 'Pedir o portfólio', efeitos: [{ chance: 0.5, entao: [{ lealdadeAlvo: -4 }], texto: 'O portfólio era um PDF de uma página escrito "confia".' }, { chance: 0.5, entao: [{ lealdadeAlvo: -14 }], texto: 'Ele respondeu que portfólio é coisa de quem precisa provar algo.' }] }
      ] },
    { id: 'propina_cachorro', tipo: 'propina', campo: 'todos', estilo: 'chat', cond: { modo: 'primeirainstancia', minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo}: "O cachorro precisa de um tratamento. Em Paris. Ele é um cachorro exigente."',
      escolhas: [
        { rotulo: 'Pagar o veterinário parisiense', custo: 14, efeitos: [{ lealdadeAlvo: 3 }] },
        { rotulo: 'Mandar um petisco', efeitos: [{ lealdadeAlvo: -10 }] }
      ] },
    { id: 'propina_jatinho', tipo: 'propina', campo: 'todos', estilo: 'chat', cond: { modo: 'primeirainstancia', minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo}: "Me empresta o jatinho no fim de semana? E o piloto? E o combustível? E a ilha?"',
      escolhas: [
        { rotulo: 'Emprestar tudo', custo: 22, efeitos: [{ lealdadeAlvo: 4 }, { chance: 0.3, entao: [{ suspeita: 4 }], texto: 'Ele postou um story de dentro do jatinho. Com a matrícula no fundo.' }] },
        { rotulo: 'Emprestar só o piloto', custo: 6, efeitos: [{ lealdadeAlvo: -4 }] },
        { rotulo: 'Dizer que está na revisão', efeitos: [{ lealdadeAlvo: -13 }] }
      ] },
    { id: 'propina_mba', tipo: 'propina', campo: 'todos', estilo: 'chat', cond: { modo: 'primeirainstancia', minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo}: "Me inscrevi num MBA de liderança ética em Genebra. A mensalidade é em francos. Os francos são o problema."',
      escolhas: [
        { rotulo: 'Pagar os francos', custo: 16, efeitos: [{ lealdadeAlvo: 3 }] },
        { rotulo: 'Indicar um curso on-line grátis', efeitos: [{ lealdadeAlvo: -11 }] }
      ] },
    { id: 'propina_interrogacao', tipo: 'propina', campo: 'todos', estilo: 'chat', cond: { modo: 'primeirainstancia', minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo} mandou só "?". Depois "??". Agora mandou o seu saldo, que ninguém tinha contado para ele.',
      escolhas: [
        { rotulo: 'Responder com um pix', custo: 12, efeitos: [{ lealdadeAlvo: 2 }] },
        { rotulo: 'Responder "?"', efeitos: [{ lealdadeAlvo: -12 }] }
      ] },
    // grupo 'filme': o poder do Príncipe ("ele pede dinheiro, 10%/mês"); 4 variantes com o mesmo custo e efeito
    { id: 'pedido_filme', grupo: 'filme', tipo: 'aliado', campo: 'direita', cond: { aliado: 'principe' }, alvo: 'principe', forcaChance: 0.10,
      manchete: 'Príncipe do Patriotismo pede "só uns milhões" para a continuação do filme',
      escolhas: [
        { rotulo: 'Pagar o filme', custo: 40, efeitos: [{ lealdadeAlvo: 30 }] },
        { rotulo: 'Recusar', efeitos: [{ lealdadeAlvo: -20 },
          { chance: 0.2, entao: [{ suspeita: 10 }], texto: 'O Príncipe do Patriotismo reclama no ar: "nem o banqueiro quis pagar".' }] }
      ] },
    { id: 'filme_trailer', grupo: 'filme', tipo: 'aliado', campo: 'direita', estilo: 'chat', cond: { aliado: 'principe' }, alvo: 'principe', forcaChance: 0.10,
      manchete: 'Príncipe do Patriotismo: "O trailer ficou pronto! Agora só falta o filme. E o dinheiro do filme."',
      escolhas: [
        { rotulo: 'Pagar o resto do filme', custo: 40, efeitos: [{ lealdadeAlvo: 30 }] },
        { rotulo: 'Dizer que o trailer já basta', efeitos: [{ lealdadeAlvo: -20 },
          { chance: 0.2, entao: [{ suspeita: 10 }], texto: 'O Príncipe do Patriotismo lança só o trailer, com os créditos: "patrocínio: um banco covarde".' }] }
      ] },
    { id: 'filme_estreia', grupo: 'filme', tipo: 'aliado', campo: 'direita', cond: { aliado: 'principe' }, alvo: 'principe', forcaChance: 0.10,
      manchete: 'Príncipe do Patriotismo quer estreia de gala com tapete verde-amarelo, fogos e plateia paga por hora',
      escolhas: [
        { rotulo: 'Bancar a gala', custo: 40, efeitos: [{ lealdadeAlvo: 30 }] },
        { rotulo: 'Sugerir sessão no auditório do banco', efeitos: [{ lealdadeAlvo: -20 },
          { chance: 0.2, entao: [{ suspeita: 10 }], texto: 'A sessão no auditório do banco foi filmada. O público viu o filme e o cofre ao fundo.' }] }
      ] },
    { id: 'filme_streaming', grupo: 'filme', tipo: 'aliado', campo: 'direita', estilo: 'ligacao', cond: { aliado: 'principe' }, alvo: 'principe', forcaChance: 0.10,
      manchete: 'Príncipe do Patriotismo liga: "Nenhum streaming quis o filme. Vamos criar o nosso. Só precisa de um banco."',
      escolhas: [
        { rotulo: 'Fundar o streaming', custo: 40, efeitos: [{ lealdadeAlvo: 30 }] },
        { rotulo: 'Indicar um canal de vídeos grátis', efeitos: [{ lealdadeAlvo: -20 },
          { chance: 0.2, entao: [{ suspeita: 10 }], texto: 'O filme sai num canal grátis, com propaganda do Glass Bank no meio. Ninguém pediu.' }] }
      ] },

    // --- Sorte e mercado ---
    { id: 'selic', tipo: 'sorte', campo: 'mercado', cond: { golpe: 'cdb' },
      manchete: 'Juros sobem; CDB de 140% passa a parecer prudência', efeitos: [{ flag: 'cdbBonusAte', ate: 6 }] },
    { id: 'caixaingenuos_calma', tipo: 'sorte', campo: 'regulador',
      manchete: 'Caixa Coletivo dos Ingênuos diz que "está tudo sob controle"; ninguém acredita, mas ninguém prova',
      efeitos: [{ suspeita: -3 }] },
    { id: 'outro_escandalo', tipo: 'sorte', campo: 'todos',
      manchete: 'Outro escândalo rouba a manchete: dessa vez é um vereador com 14 cunhados no gabinete', efeitos: [{ suspeita: -8 }] },
    { id: 'final_campeonato', tipo: 'sorte', campo: 'mídia',
      manchete: 'Final de campeonato ocupa 100% do noticiário; comentarista pede VAR para o rombo', efeitos: [{ suspeita: -6 }] },
    { id: 'carnaval', tipo: 'sorte', campo: 'todos', cond: { mesMod: [12, 2] },
      manchete: 'Carnaval! Ninguém lê nada por 3 dias', efeitos: [{ suspeita: -5 }, { flag: 'carnavalAte', ate: 1 }] },
    { id: 'pacificacao', tipo: 'sorte', campo: 'todos', cond: { minPoliticos: 3 },
      manchete: 'Deputados de todos os lados discutem projeto "de pacificação nacional"', efeitos: [{ blindagem: 8 }] },

    // --- Fase 4: mais eventos, com pancada distribuída entre todos os campos ---
    // Gastos
    { id: 'seminario_resort', tipo: 'gasto', campo: 'judiciário', cond: { aliado: ['tofu', 'inquerito', 'juristacaro'] },
      manchete: 'Seminário internacional em resort europeu debate "segurança jurídica" entre um vinho e outro',
      efeitos: [{ caixa: -20 }, { suspeita: 3 }, { lealdadeTodos: 5 }] },
    { id: 'palestra_cara', tipo: 'gasto', campo: 'esquerda', cond: { aliado: 'calculadora' },
      manchete: 'Ex-ministro cobra R$ 2 mi por palestra sobre "distribuição de renda"; o banco paga à vista',
      efeitos: [{ caixa: -15 }, { suspeita: 2 }, { lealdadeDe: { id: 'calculadora', n: 10 } }] },
    { id: 'congresso_partido', tipo: 'gasto', campo: 'esquerda', cond: { minRombo: 5 },
      manchete: 'Congresso partidário pede "patrocínio progressista" e promete citar o banco no manifesto',
      escolhas: [
        { rotulo: 'Patrocinar o manifesto', custo: 20, efeitos: [{ suspeita: 2 }, { lealdadeTodos: 3 }] },
        { rotulo: 'Recusar', efeitos: [{ suspeita: 4 }] }
      ] },
    { id: 'iate_reveillon', tipo: 'gasto', campo: 'centrão', cond: { minAliados: 3, mesMod: [12, 1] },
      manchete: 'Réveillon no iate: "reunião de alinhamento estratégico" dura cinco dias',
      efeitos: [{ caixa: -30 }, { suspeita: 4 }, { lealdadeTodos: 8 }] },
    { id: 'relogio_luxo', tipo: 'gasto', campo: 'todos', cond: { minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo} aparece com relógio que custa um hospital e jura que é "réplica"',
      efeitos: [{ caixa: -10 }, { suspeita: 4 }, { lealdadeAlvo: 5 }] },
    // Vazamentos
    { id: 'live_oposicao', tipo: 'vazamento', campo: 'esquerda', cond: { minRombo: 10 },
      manchete: 'Deputado de oposição faz live de seis horas lendo o balanço do banco em voz alta', efeitos: [{ suspeita: 6 }] },
    { id: 'influencer_patriota', tipo: 'vazamento', campo: 'direita', cond: { minRombo: 15 },
      manchete: 'Influenciador patriota descobre o rombo, culpa o comunismo e viraliza mesmo assim', efeitos: [{ suspeita: 7 }] },
    { id: 'podcast_regulador', tipo: 'vazamento', campo: 'regulador', cond: { minRombo: 8 },
      manchete: 'Ex-diretor do regulador vai a podcast e diz que "avisou em três anos seguidos, por escrito"', efeitos: [{ suspeita: 6 }] },
    { id: 'delator_outro_caso', tipo: 'vazamento', campo: 'judiciário', cond: { minFaixa: 2 },
      manchete: 'Réu de outro caso oferece delação e cita "um banqueiro de terno transparente"', efeitos: [{ suspeita: 9 }] },
    { id: 'convocacao_cpi', tipo: 'vazamento', campo: 'centro', cond: { minSuspeita: 50 },
      manchete: 'CPI convoca o banqueiro; ele promete ir "com a verdade e 14 advogados"',
      escolhas: [
        { rotulo: 'Ir com os 14 advogados', custo: 30, efeitos: [{ suspeita: 2 }] },
        { rotulo: 'Faltar com atestado', efeitos: [{ suspeita: 8 }] }
      ] },
    // Aliados
    { id: 'culto_prosperidade', tipo: 'aliado', campo: 'igreja', cond: { aliado: 'bispo' }, alvo: 'bispo',
      manchete: 'Bispo do Rendimento Celestial faz culto pela "prosperidade do sistema financeiro"; o sistema agradece',
      efeitos: [{ blindagemAlvo: 3 }, { suspeita: 2 }] },
    { id: 'nao_conheco', tipo: 'aliado', campo: 'judiciário', cond: { aliado: ['tofu', 'inquerito'] }, alvo: ['tofu', 'inquerito'],
      manchete: '{alvo} diz que "não conhece" o banqueiro; circula foto dos dois no mesmo camarote',
      efeitos: [{ suspeita: 5 }, { lealdadeAlvo: -5 }] },
    { id: 'livro_ex_ministro', tipo: 'aliado', campo: 'esquerda', cond: { aliado: 'calculadora' }, alvo: 'calculadora',
      manchete: 'Ex-Ministro da Calculadora lança o livro "Como quebrar sem cair" e agradece ao banco no prefácio',
      efeitos: [{ suspeita: 5 }, { lealdadeAlvo: 10 }] },
    { id: 'emenda_moderniza', tipo: 'aliado', campo: 'centrão', cond: { minPoliticos: 1 }, alvo: 'politico',
      manchete: '{alvo} apresenta emenda que "moderniza" a fiscalização até ela desaparecer',
      efeitos: [{ blindagemAlvo: 4 }, { suspeita: 2 }] },
    // Sorte
    { id: 'feriadao', tipo: 'sorte', campo: 'todos',
      manchete: 'Feriadão prolongado: a capital some por onze dias e ninguém sente falta', efeitos: [{ suspeita: -3 }] },
    { id: 'final_novela', tipo: 'sorte', campo: 'mídia',
      manchete: 'Último capítulo da novela empata com o rombo em audiência e vence no desempate', efeitos: [{ suspeita: -3 }] },
    { id: 'recesso', tipo: 'sorte', campo: 'judiciário',
      manchete: 'Recesso forense: os prazos tiram férias, e o seu inquérito vai junto',
      efeitos: [{ suspeita: -3 }, { flag: 'videoAte', ate: 2 }] },
    { id: 'greve_regulador', tipo: 'sorte', campo: 'regulador',
      manchete: 'Servidores do regulador entram em greve; a fiscalização vira "atendimento por formulário"', efeitos: [{ suspeita: -3 }] },
    { id: 'analistas', tipo: 'sorte', campo: 'mercado', cond: { golpe: 'cdb' },
      manchete: 'Analistas recomendam o CDB de 140%: "risco? que risco?"', efeitos: [{ caixa: 30 }] },

    // --- Sistema ---
    { id: 'inspecao_rotina', tipo: 'sistema', campo: 'regulador', cond: { minRombo: 50 },
      manchete: 'Doutor Liquidação manda "inspeção de rotina"; o regulador descobre que existe',
      efeitos: [{ suspeita: 8 }, { congelarGolpe: 2 }] },

    // --- Aliados que dão trabalho (V3 seção 3: E02 a E05) ---
    { id: 'ameaca_prazo', tipo: 'aliado', campo: 'todos', cond: { minFaixa: 1, minAliados: 1, alvoLealdadeMax: 50 }, alvo: 'fraco',
      manchete: '{alvo} manda recado: "tenho um HD e um prazo. O HD é grande; o prazo, curto"',
      escolhas: [
        { rotulo: 'Pagar o silêncio', custo: 20, efeitos: [{ lealdadeAlvo: 15 }] },
        { rotulo: 'Pagar para ver', efeitos: [{ lealdadeAlvo: -10 }, { pendente: { em: 2, suspeita: 12, texto: 'O prazo venceu: o tal HD apareceu num programa de domingo à noite, com trilha de suspense.' } }] }
      ] },
    { id: 'ligacao_3h', tipo: 'aliado', campo: 'centrão', estilo: 'ligacao', cond: { minFaixa: 1, minPoliticos: 1 }, alvo: 'politico',
      manchete: '{alvo} liga às 3h da manhã: "tá acordado? Tenho uma emenda que é a sua cara"',
      escolhas: [
        { rotulo: 'Atender e aceitar a emenda', custo: 12, efeitos: [{ blindagemAlvo: 4 }, { suspeita: 3 }] },
        { rotulo: 'Desligar e fingir que dormia', efeitos: [{ lealdadeAlvo: -10 }] }
      ] },
    { id: 'print_vazado', tipo: 'vazamento', campo: 'mídia', estilo: 'chat', cond: { minFaixa: 1 },
      manchete: 'Vaza print do grupo "Diretoria Raiz": "apaga isso aqui depois". Ninguém apagou.',
      escolhas: [
        { rotulo: 'Mandar apagar tudo (e o grupo)', custo: 15, efeitos: [] },
        { rotulo: 'Negar: "é montagem"', efeitos: [{ chance: 0.5, entao: [{ suspeita: 8 }], texto: 'A perícia confirma: não é montagem. É pior.' }] }
      ] },
    { id: 'cargo_cunhado', tipo: 'aliado', campo: 'todos', cond: { minAliados: 1, minPoliticos: 1 }, alvo: 'politico',
      manchete: '{alvo} nomeia o cunhado "consultor de assuntos gerais"; os assuntos são gerais, o salário, específico',
      escolhas: [
        { rotulo: 'Nomear o cunhado', efeitos: [{ lealdadeAlvo: 25 }, { mesadaExtraAlvo: 0.25 }, { chance: 0.3, entao: [{ suspeita: 4 }], texto: 'O cunhado posta foto da sala nova. Com o crachá. E a legenda.' }] },
        { rotulo: 'Recusar: "aqui é meritocracia"', efeitos: [{ lealdadeAlvo: -15 }] }
      ] },

    // --- Pedidos de dinheiro dos aliados (nos dois modos; um por campo) ---
    { id: 'pedido_congresso', tipo: 'aliado', campo: 'judiciário', estilo: 'chat', cond: { aliado: ['tofu', 'inquerito', 'juristacaro'] }, alvo: ['tofu', 'inquerito', 'juristacaro'],
      manchete: '{alvo}: "Fui convidado para um congresso sobre ética em Lisboa. A passagem é executiva; a ética, econômica."',
      escolhas: [
        { rotulo: 'Pagar a executiva', custo: 14, efeitos: [{ lealdadeAlvo: 12 }] },
        { rotulo: 'Mandar de econômica', efeitos: [{ lealdadeAlvo: -10 }, { chance: 0.25, entao: [{ suspeita: 3 }], texto: 'Ele postou foto na econômica com a legenda "perseguição". O banco aparece no fundo do copo.' }] }
      ] },
    { id: 'pedido_campanha', tipo: 'aliado', campo: 'centrão', estilo: 'ligacao', cond: { minPoliticos: 1 }, alvo: 'politico',
      manchete: '{alvo} liga: "Ano que vem tem eleição. Santinho, jingle, carro de som e um carro de som para o carro de som."',
      escolhas: [
        { rotulo: 'Doar "por fora"', custo: 25, efeitos: [{ lealdadeAlvo: 15 }, { blindagemAlvo: 2 }, { chance: 0.25, entao: [{ suspeita: 6 }], texto: 'O carro de som tocou o jingle na frente da sede do banco. Com o nome do banco na letra.' }] },
        { rotulo: 'Doar "por dentro", com recibo', custo: 15, efeitos: [{ lealdadeAlvo: 5 }, { suspeita: 2 }] },
        { rotulo: 'Dizer que o caixa está apertado', efeitos: [{ lealdadeAlvo: -12 }] }
      ] },
    { id: 'pedido_templo', tipo: 'aliado', campo: 'igreja', estilo: 'chat', cond: { aliado: 'bispo' }, alvo: 'bispo',
      manchete: 'Bispo do Rendimento Celestial: "Recebi em sonho a planta de um templo novo. Com estacionamento. O sonho foi bem específico no estacionamento."',
      escolhas: [
        { rotulo: 'Pagar templo e estacionamento', custo: 25, efeitos: [{ lealdadeAlvo: 25 }] },
        { rotulo: 'Pagar só o templo', custo: 12, efeitos: [{ lealdadeAlvo: 8 }] },
        { rotulo: 'Dizer que vai orar sobre isso', efeitos: [{ lealdadeAlvo: -12 }] }
      ] },
    { id: 'pedido_blog', tipo: 'aliado', campo: 'mídia', estilo: 'chat', cond: { minAliados: 1 }, alvo: 'aleatorio',
      manchete: '{alvo}: "Tem um blog escrevendo coisas sobre mim. Coisas verdadeiras! É urgente."',
      escolhas: [
        { rotulo: 'Comprar o blog', custo: 18, efeitos: [{ lealdadeAlvo: 10 }, { suspeita: -2 }] },
        { rotulo: 'Pagar um processo contra o blog', custo: 8, efeitos: [{ lealdadeAlvo: 5 }, { chance: 0.5, entao: [{ suspeita: 5 }], texto: 'O processo virou notícia. Maior que o blog. Maior que tudo.' }] },
        { rotulo: 'Dizer que ninguém lê blog', efeitos: [{ lealdadeAlvo: -10 }] }
      ] },
    { id: 'pedido_lupa', tipo: 'aliado', campo: 'regulador', estilo: 'chat', cond: { aliado: 'barrapesada' }, alvo: 'barrapesada',
      manchete: 'Diretor Barra-Pesada: "A fiscalização comprou lupas novas. Seria uma pena se elas embaçassem."',
      escolhas: [
        { rotulo: 'Patrocinar o embaçamento', custo: 20, efeitos: [{ lealdadeAlvo: 15 }, { flag: 'videoAte', ate: 2 }] },
        { rotulo: 'Mandar um paninho de óculos', efeitos: [{ lealdadeAlvo: -15 }] }
      ] },
    { id: 'pedido_instituto', tipo: 'aliado', campo: 'esquerda', estilo: 'ligacao', cond: { aliado: 'calculadora' }, alvo: 'calculadora',
      manchete: 'Ex-Ministro da Calculadora: "Vou abrir um instituto de estudos sobre desigualdade. A sede é uma cobertura, para estudar a desigualdade de cima."',
      escolhas: [
        { rotulo: 'Financiar a cobertura', custo: 18, efeitos: [{ lealdadeAlvo: 15 }] },
        { rotulo: 'Doar uma sala comercial', custo: 6, efeitos: [{ lealdadeAlvo: 3 }] },
        { rotulo: 'Recusar por "contenção de gastos"', efeitos: [{ lealdadeAlvo: -12 }] }
      ] },
    { id: 'pedido_ponte', tipo: 'aliado', campo: 'direita', estilo: 'chat', cond: { aliado: 'cofreaberto' }, alvo: 'cofreaberto',
      manchete: 'Senador Cofre-Aberto: "Minha base eleitoral pediu uma ponte. Não tem rio, mas pediu com muito carinho."',
      escolhas: [
        { rotulo: 'Pagar a ponte sem rio', custo: 20, efeitos: [{ lealdadeAlvo: 15 }, { blindagemAlvo: 2 }] },
        { rotulo: 'Sugerir um viaduto, mais barato', custo: 10, efeitos: [{ lealdadeAlvo: 5 }] },
        { rotulo: 'Perguntar onde fica o rio', efeitos: [{ lealdadeAlvo: -12 }] }
      ] },
    { id: 'pedido_conferir', tipo: 'aliado', campo: 'centro', estilo: 'chat', cond: { aliado: 'quadradinho' }, alvo: 'quadradinho',
      manchete: 'Chefe do Quadradinho: "Preciso conferir a carteira de novo. Para conferir direito, preciso de um adiantamento."',
      escolhas: [
        { rotulo: 'Adiantar a conferência', custo: 15, efeitos: [{ lealdadeAlvo: 12 }] },
        { rotulo: 'Pedir para conferir de graça', efeitos: [{ lealdadeAlvo: -10 }, { chance: 0.3, entao: [{ suspeita: 4 }], texto: 'Ele conferiu de graça e, sem querer, conferiu direito.' }] }
      ] }
  ];

  // ------------------------------------------------------------------
  // Finais (7.7)
  // ------------------------------------------------------------------
  const finais = {
    pais_quebrado: { titulo: 'País Quebrado', vitoria: true,
      texto: 'O Caixa Coletivo dos Ingênuos agora é seu. O país, nem tanto.',
      extra: 'O Ministro Caneta-Lenta pede vista do processo. Vista para o mar, de preferência.' },
    guarulhos: { titulo: 'Guarulhos', vitoria: false,
      texto: 'Jatinho na pista, polícia na escada. Malta pode esperar.',
      extra: 'O Ministro Caneta-Lenta relata o caso sem pressa e sem desconto.' },
    delacao: { titulo: 'Delação Premiada', vitoria: false,
      texto: 'Você entrega todos os aliados. O prêmio da delação é uma tornozeleira edição limitada.',
      extra: 'O Portal O Interceptador publica a íntegra antes de você terminar de assinar.' },
    anistia: { titulo: 'Anistia Geral', vitoria: true,
      texto: 'Aprovaram uma lei que perdoa a todos. Todos comemoram, principalmente os que já estavam soltos.',
      extra: 'O Canal Desvelando faz um vídeo de 3 horas. Ninguém é preso, mas todos assistem.' },
    liquidado: { titulo: 'Liquidado', vitoria: false,
      texto: 'Doutor Liquidação assina a liquidação: "Prazo esgotado. O regulador agradece a colaboração."',
      extra: 'O Caixa Coletivo dos Ingênuos paga a conta. Ou seja: você, leitor.' }
  };

  // ------------------------------------------------------------------
  // Tutorial da primeira partida (alvo = id do elemento destacado) e "Como jogar".
  // {chave} é trocado pelo número de params.
  // ------------------------------------------------------------------
  const tutorial = [
    { alvo: 'hud', texto: 'Este é o seu extrato: caixa (com o saldo previsto do mês), rombo, blindagem e ações que restam no mês. Meta: rombo {romboMeta} antes que a suspeita chegue a 100.' },
    { alvo: 'painel-esq', texto: 'Aba Golpes: golpes rendem caixa e rombo todo mês, mas atraem suspeita. As ações de proteção, no Início (teclas 1 a 6), compram silêncio.' },
    { alvo: 'painel-dir', texto: 'Aba Aliados: aliados dão blindagem e liberam golpes, mas cobram mesada todo mês. Lealdade abaixo de {delacaoLimite} vira delação.' },
    { alvo: 'termometro', texto: 'A barra de Suspeita. O inimigo muda por faixa: Estagiário, Repórter, Delegado, Helicóptero. Acima de 60 vem a polícia.' },
    { alvo: 'btn-proximo', texto: 'Gastou as {acoesPorMes} ações? Próximo mês (Espaço). Boa sorte, e bons advogados.' }
  ];
  const comoJogar = [
    'Você é <b>o Banqueiro de Bolso</b>, também chamado de Banqueiro de Vidro. Objetivo: encher o <b>Rombo</b> até R$ {romboMeta} bi antes que a <b>Suspeita</b> chegue a 100.',
    'Cada turno é um mês, e você tem <b>{acoesPorMes} ações</b> por mês: abrir golpes, recrutar aliados, executar operações e comprar silêncio. Dispensar aliado é grátis.',
    '<b>Golpes</b> rendem caixa e rombo todo mês, mas atraem suspeita. <b>Aliados</b> dão blindagem (cortam a suspeita) e liberam golpes, mas cobram mesada. Mesada atrasada derruba a lealdade; aliado com lealdade abaixo de {delacaoLimite} pode delatar você.',
    'O inimigo muda conforme a suspeita: Estagiário, Repórter, Delegado, Helicóptero. Acima de 60 vêm as operações policiais; um ministro amigo pode cancelar uma por semestre.',
    '<b>Finais:</b> País Quebrado (vitória), Anistia Geral (blindagem {anistiaBlindagem}+ por {anistiaMeses} meses seguidos), Guarulhos, Delação Premiada e Liquidado (o prazo de {mesMax} meses acabou).',
    '<b>Cenários:</b> novos escritórios são conquistas. Abra certos golpes para liberá-los e troque em Opções → Cenário.'
  ];

  // ------------------------------------------------------------------
  // Cenários do escritório, liberados como conquistas (Opções → Cenário).
  // id = nome do estilo em js/sprites.js (ESTILOS). "liberar.golpe": golpe recorrente aberto ou golpe único já executado.
  // Sem "liberar" = sempre disponível.
  // ------------------------------------------------------------------
  const cenarios = [
    { id: 'atual', nome: 'Escritório Clássico', desc: 'O escritório de sempre.', dica: '' },
    { id: 'feirao', nome: 'Feirão do CDB', desc: 'Bandeirinhas, placa de 140% e um boneco inflável que não para.',
      liberar: { golpe: 'cdb' }, dica: 'abra o CDB Absurdo a 140%' },
    { id: 'reparticao', nome: 'Repartição Decadente', desc: 'Fila, carimbo e um ventilador soprando processo pelo chão.',
      liberar: { golpe: 'consignado' }, dica: 'abra o Consignado de Associação' },
    { id: 'biblioteca', nome: 'Biblioteca de Precatórios', desc: 'Chuva lá fora, Justiça torta e uma tartaruga levando o seu processo.',
      liberar: { golpe: 'precatorios' }, dica: 'abra os Precatórios Turbinados' },
    { id: 'dourado', nome: 'Cobertura Dourada', desc: 'Lustre, autorretrato com coroa e um porquinho alado.',
      liberar: { golpe: 'gospel' }, dica: 'abra o Banco Digital Gospel' },
    { id: 'matrioska', nome: 'Matrioska Financeira', desc: 'Cofre dentro de cofre dentro de cofre, e ninguém acha o fundo.',
      liberar: { golpe: 'fundofundo' }, dica: 'abra o Fundo de Fundo de Fundo' },
    { id: 'neon', nome: 'Neon Anos 80', desc: 'Fliperama, fax infinito e um letreiro que não decide se é LEGAL.',
      liberar: { golpe: 'carteira' }, dica: 'execute a Carteira Fantasma' },
    { id: 'aposentadoria', nome: 'Aposentadoria de Luxo', desc: 'Praia, boia de flamingo e um caranguejo com a sua moeda.',
      liberar: { golpe: 'previdencia' }, dica: 'execute a Previdência dos Outros' }
  ];

  // ------------------------------------------------------------------
  // Explicação de cada ação (3.2): a mesma fonte para a confirmação da 1ª vez e para "Como jogar".
  // {chave} vem do próprio golpe/ação ou de params (engine.explicacao); {chancePct}/{colSuspeita} = efeito colateral.
  // ------------------------------------------------------------------
  const explicacoes = {
    cdb: 'Você promete 140% do CDI e paga quem saiu com o dinheiro de quem entrou. Abrir custa R$ {custo} mi; depois rende R$ {caixa} mi, rombo +{rombo} e suspeita +{suspeita} todo mês.',
    consignado: 'Associa aposentados a uma associação e desconta a mensalidade direto no benefício. Abrir custa R$ {custo} mi; rende R$ {caixa} mi, rombo +{rombo} e suspeita +{suspeita} por mês.',
    precatorios: 'Compra dívida do governo barata e revende cara para o próprio banco. Abrir custa R$ {custo} mi; rende R$ {caixa} mi, rombo +{rombo} e suspeita +{suspeita} por mês.',
    gospel: 'Conta digital com dízimo no débito automático. Só abre com o Bispo do Rendimento Celestial no time. Custa R$ {custo} mi; rende R$ {caixa} mi, rombo +{rombo} e suspeita +{suspeita} por mês.',
    fundofundo: 'Um fundo que investe num fundo que investe num fundo. Não rende nada, mas multiplica a suspeita passiva por {fundoMult}. Exige {exigeRecorrentes} golpes rendendo. Custa R$ {custo} mi.',
    carteira: 'Vende para um banco estatal uma carteira de créditos que não existe. Na hora: +R$ {caixa} mi, rombo +{rombo} e suspeita +{suspeita}. Depois, {recarga} meses de recarga. Exige o Chefe do Quadradinho.',
    previdencia: 'Põe o fundo de aposentadoria dos servidores no seu banco. Na hora: +R$ {caixa} mi, rombo +{rombo} e suspeita +{suspeita}. Recarga de {recarga} meses. Exige o Governador Aposentadoria Alheia.',
    festa: 'Festa no jatinho com metade da capital. Custa de R$ {custoMin} a {custoMax} mi; suspeita {suspeita} e +{lealdade} de lealdade em quem você levar. {chancePct}% de chance de vazar foto (+{colSuspeita}).',
    filme: 'Patrocina um filme sobre "um homem de bem". Custa de R$ {custoMin} a {custoMax} mi; suspeita {suspeita} ({principeFilme} com o Príncipe do Patriotismo). {chancePct}% de descobrirem quem pagou, meses depois (+{colSuspeita}).',
    fakenews: 'Espalha que o banco é da oposição. Custa R$ {custoMin} mi; suspeita {suspeita}. {chancePct}% de virar meme no mês seguinte (+{colSuspeita}).',
    fieis: 'Compra o apoio de uma igreja e de um influenciador. Só libera com o Bispo do Rendimento Celestial no time. Custa R$ {custoMin} mi; suspeita {suspeita} e vazamentos 25% menores por {meses} meses.',
    video: 'Um vídeo institucional com trilha emocionante, feito sob medida para o delegado. Custa R$ {custoMin} mi; suspeita {suspeita} e metade da chance de operação por {meses} meses.',
    mimo: 'Um presente "sem segundas intenções" para um aliado. Custa R$ {custoMin} mi e dá +{lealdade} de lealdade. Aliado feliz não delata.',
    recrutar: 'Contrata um aliado: paga a entrada agora e a mesada todo mês. Ele dá blindagem (corta a suspeita que entra) e às vezes libera golpes. Lealdade abaixo de {delacaoLimite} vira delação.',
    dispensar: 'Manda o aliado embora. Não gasta ação nem caixa, mas ele "dá entrevista": suspeita +{dispensaSuspeita}, e a blindagem dele vai junto.',
    assinatura: 'Só na Primeira Instância, com o Dono do Controle Remoto. Abrir custa R$ {custo} mi; rende R$ {caixa} mi e suspeita +{suspeita} por mês, sem rombo. Se ele sair ou delatar, o golpe para.',
    taxanada: 'Só na Primeira Instância, com o Ex-Ministro da Calculadora. Abrir custa R$ {custo} mi; rende R$ {caixa} mi e suspeita +{suspeita} por mês, sem rombo. Se ele sair ou delatar, o golpe para.',
    emendaelastica: 'Só na Primeira Instância, com o Presidente do Partido Elástico. Abrir custa R$ {custo} mi; rende R$ {caixa} mi no 1º mês e +{rendaSobe} a cada mês, até R$ {rendaTeto} mi; suspeita +{suspeita} por mês, sem rombo. Se ele sair ou delatar, o golpe para e a renda volta a {caixa}.',
    calote: 'Só na Primeira Instância. Neste fechamento de mês ninguém recebe mesada: você economiza o total, mas a lealdade de todos os aliados muda {caloteLealdade} e, por {caloteMeses} meses, quem estiver abaixo de {delacaoLimiteCalote} pode delatar (normal: {delacaoLimite}).',
    delatar: 'Você entrega todo mundo ao Ministério Público. A partida acaba na hora, com pontuação parcial. Não tem volta.'
  };

  // ------------------------------------------------------------------
  // Diário do Rombo (páginas e textos em js/diario.js). Os valores reais das páginas são FIXOS; só o gatilho escala.
  // ESCALA = R$ reais por R$ 1 bi de rombo do jogo (meta do jogo = meta real do caso). Caixa em R$ mi: x ESCALA / 1000.
  // ------------------------------------------------------------------
  // Modos de dificuldade (Rodada 2). A Primeira Instância começa bloqueada e libera com um dos finais de liberaCom
  // (vale para todas as partidas, chave primeiraLiberada no save). Na G4 ela ainda joga igual ao Foro Privilegiado.
  const modos = [
    { id: 'foro', nome: 'Foro Privilegiado', curto: 'Foro',
      desc: 'O modo normal. Seu processo anda devagar, num tribunal cheio de amigos.' },
    { id: 'primeirainstancia', nome: 'Primeira Instância', curto: '1ª Inst.', liberaCom: ['pais_quebrado', 'anistia'],
      desc: 'O modo difícil. Sem foro, sem amigo no tribunal: o processo cai na mesa de um juiz de primeira instância.',
      dica: 'Quebre o país ou consiga a anistia para liberar.',
      // ações que neste modo exigem um aliado comprado (Comprar fiéis já exige o Bispo nos dois modos)
      exigeAliados: { fakenews: 'controleremoto', filme: 'principe', festa: 'cofreaberto', video: 'juristacaro' },
      regras: 'Neste modo: dá para não pagar os aliados no mês (eles anotam), chegam pedidos de propina por mensagem (pagar quase não compra lealdade; ignorar custa caro), existe o Dono do Controle Remoto, há três golpes passivos (Assinatura Eterna, Taxa de Manutenção do Nada, Emenda Elástica) que só rendem com o aliado deles, e Fake news, Financiar filme, Festa e Vídeo para o delegado exigem um aliado específico.' }
  ];

  const ROMBO_REAL_META = 51.8e9;
  const ESCALA = ROMBO_REAL_META / params.romboMeta;
  const diarioLuxo = ['festa', 'mimo'];   // ações que somam em luxoAcumulado / luxoMaiorUnico (estatística de leitura)
  const diarioLuxoEvento = 'gasto';       // eventos deste tipo (festa, iate, resort, relógio...) também somam

  const data = { params, golpes, aliados, acoes, faixas, eventos, finais, textos, vazamentosFaixa, tutorial, comoJogar, explicacoes, cenarios, modos, ROMBO_REAL_META, ESCALA, diarioLuxo, diarioLuxoEvento };
  // índices por id
  data.golpePorId = {}; golpes.forEach(g => { data.golpePorId[g.id] = g; });
  data.aliadoPorId = {}; aliados.forEach(a => { data.aliadoPorId[a.id] = a; });
  // Minigames: abrem 1 vez por partida quando o gatilho vale; o nível (0..3) sai da jogada.
  const minigames = [
    { id: 'cueca', nome: 'Nota na Cueca', desc: 'Esconda o máximo de notas enquanto o agente está de costas.',
      dica: 'Acontece depois da primeira operação policial da partida.',
      gatilho: { operacao: true }, nivelPadrao: 2,
      textos: { operacao: 'A polícia está na sala com mandado de busca. O dinheiro vivo continua na mesa e o agente só precisa virar de costas por um minuto.' },
      niveis: [
        { nome: 'Flagrado', texto: 'Agente encontra maço de notas na cueca do banqueiro e pede "só um minutinho" para a foto', efeitos: [{ caixa: -60 }, { suspeita: 8 }] },
        { nome: 'Bronze', texto: 'Busca leva metade do dinheiro e devolve o vaso de planta', efeitos: [{ caixa: -35 }] },
        { nome: 'Prata', texto: 'Busca leva só o dinheiro da mesa; o resto estava "em lugar seguro"', efeitos: [{ caixa: -15 }] },
        { nome: 'Ouro', texto: 'Polícia revira a casa inteira e sai com uma planta e um pedido de desculpas', efeitos: [{ suspeita: -4 }] }
      ] },
    { id: 'mala', nome: 'Mala Certa', desc: 'Pare o ponteiro na faixa verde para fechar a mala do aliado.',
      dica: 'Acontece quando um aliado está com a lealdade abaixo de 25.',
      gatilho: { lealdadeMax: 25 }, nivelPadrao: 2,
      textos: { lealdade: '{nome} está com o telefone do promotor na mão e o dedo no botão. Uma mala bem fechada pode fazê-lo repensar.' },
      niveis: [
        { nome: 'Flagrado', texto: 'Aliado abre a mala na frente de todo mundo, conta as notas em voz alta e chama o advogado', efeitos: [{ delataAlvo: true }] },
        { nome: 'Bronze', texto: 'Aliado aceita a mala, mas "vai pensar" e pede um café', efeitos: [{ lealdadeAlvo: 10 }] },
        { nome: 'Prata', texto: 'Aliado aceita a mala e lembra que sempre foi um homem leal', efeitos: [{ lealdadeAlvo: 25 }] },
        { nome: 'Ouro', texto: 'Aliado aceita a mala e jura amizade eterna, ou pelo menos até o fim do mês', efeitos: [{ lealdadeAlvo: 40 }] }
      ] },
    { id: 'coletiva', nome: 'Coletiva de Imprensa', desc: 'Dê a resposta mais evasiva antes de o tempo acabar.',
      dica: 'Acontece quando um vazamento derruba a suspeita acima de 40.',
      gatilho: { vazou: 40 }, nivelPadrao: 2,
      textos: { vazamento: 'O vazamento virou assunto e a imprensa lotou a sala. Microfones na cara, e ninguém aceita "sem comentários".' },
      niveis: [
        { nome: 'Flagrado', texto: 'Banqueiro dá resposta sincera na coletiva e o vídeo vira meme antes do fim da frase', efeitos: [{ suspeita: 10 }] },
        { nome: 'Bronze', texto: 'Coletiva termina sem novidade e sem ninguém entender nada', efeitos: [{ suspeita: -3 }] },
        { nome: 'Prata', texto: 'Jornalistas saem da coletiva sem saber o que perguntaram', efeitos: [{ suspeita: -8 }] },
        { nome: 'Ouro', texto: 'Resposta tão evasiva que o repórter agradece e pede desculpas', efeitos: [{ suspeita: -14 }] }
      ] },
    { id: 'fuga', nome: 'Fuga de Jatinho', desc: 'Desvie dos helicópteros em três pistas por 30 segundos.',
      dica: 'Acontece quando o rombo passa de 40 bilhões.',
      gatilho: { minRombo: 40 }, nivelPadrao: 2,
      textos: { rombo: 'O rombo já passou de 40 bi e o jatinho está abastecido. O problema é o helicóptero que decidiu acompanhar o voo.' },
      niveis: [
        { nome: 'Flagrado', texto: 'Jatinho pousa escoltado, e o combustível foi pago com o dinheiro do fundo', efeitos: [{ suspeita: 12 }, { caixa: -30 }] },
        { nome: 'Bronze', texto: 'Jatinho pousa com um rombo na asa e outro no caixa', efeitos: [{ suspeita: -3 }] },
        { nome: 'Prata', texto: 'Jatinho some do radar por dois dias e volta com um bronzeado', efeitos: [{ suspeita: -8 }, { caixa: 20 }] },
        { nome: 'Ouro', texto: 'Jatinho some do radar e reaparece com uma mala a mais', efeitos: [{ suspeita: -15 }, { caixa: 40 }] }
      ] },
    { id: 'chuva', nome: 'Chuva de Notas', desc: 'Pegue as notas que caem e desvie das falsas.',
      dica: 'Acontece quando o caixa passa de R$ 300 mi.',
      gatilho: { minCaixa: 300 }, nivelPadrao: 2,
      textos: { caixa: 'O caixa passou de R$ 300 mi e o teto do cofre, por algum motivo, começou a chover nota. Tem nota falsa no meio.' },
      niveis: [
        { nome: 'Flagrado', texto: 'Banqueiro sai da chuva de notas com os bolsos cheios de nota falsa e uma multa', efeitos: [{ caixa: -40 }, { suspeita: 6 }] },
        { nome: 'Bronze', texto: 'Banqueiro junta uns trocados e escorrega numa nota', efeitos: [{ caixa: 15 }] },
        { nome: 'Prata', texto: 'Banqueiro sai da chuva molhado e bem mais rico', efeitos: [{ caixa: 40 }] },
        { nome: 'Ouro', texto: 'Banqueiro sai da chuva de guarda-chuva aberto e mala cheia', efeitos: [{ caixa: 80 }] }
      ] },
    { id: 'trituradora', nome: 'Tritura Fácil', desc: 'Destrua as provas antes que a fiscalização chegue.',
      dica: 'Acontece quando a suspeita passa de 70 ou quando um aliado delata.',
      gatilho: { minSuspeita: 70, delacao: true }, nivelPadrao: 2,
      textos: {
        suspeita: 'A fiscalização está a dois quarteirões e as provas continuam na mesa. A trituradora do escritório ainda funciona.',
        delacao: '{nome} delatou e citou uma planilha. Ela ainda está na sua mesa, junto com o resto.'
      },
      niveis: [
        { nome: 'Flagrado', texto: 'Faxineiro flagra banqueiro com a trituradora ligada às 3 da manhã', efeitos: [{ suspeita: 10 }] },
        { nome: 'Bronze', texto: 'Perícia encontra só metade das provas, mas gosta do que achou', efeitos: [{ suspeita: -6 }] },
        { nome: 'Prata', texto: 'Perícia encontra bastante papel picado e pouca prova', efeitos: [{ suspeita: -12 }] },
        { nome: 'Ouro', texto: 'Perícia encontra só confete e uma receita de bolo', efeitos: [{ suspeita: -18 }, { blindagem: 2 }] }
      ] }
  ];
  data.minigames = minigames;
  data.minigamePorId = {}; minigames.forEach(m => { data.minigamePorId[m.id] = m; });

  data.modoPorId = {}; modos.forEach(m => { data.modoPorId[m.id] = m; });
  data.cenarioPorId = {}; cenarios.forEach(c => { data.cenarioPorId[c.id] = c; });
  data.acaoPorId = {}; acoes.forEach(a => { data.acaoPorId[a.id] = a; });
  data.eventoPorId = {}; eventos.forEach(e => { data.eventoPorId[e.id] = e; });

  GM.data = data;
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
})(typeof window !== 'undefined' ? window : globalThis);
