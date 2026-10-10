// ui.js - tela do jogo: desenha o estado do motor e traduz cliques/teclas em ações.
// Layout de app de banco, celular em pé: Início, Golpes, Aliados, Extrato (abas) e Opções (botão no topo).
// Todo botão clicável tem data-act="tipo:id[:alvo]"; um único ouvinte no #stage trata tudo.
// O modo ?selftest=1 (main.js) joga clicando nesses mesmos botões (mesmo os de abas escondidas).
(function (root) {
  const GM = root.GM = root.GM || {};
  const E = GM.engine;
  const D = GM.data;
  const P = D.params;
  const DI = GM.diario;   // Diário do Rombo (js/diario.js)

  const $ = id => document.getElementById(id);
  const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const num = v => (Math.round(v * 10) / 10).toLocaleString('pt-BR');
  const sinal = v => (v > 0 ? '+' : '') + num(v);

  // ---------------- Preferências e recordes (localStorage sempre em try/catch) ----------------
  // Chaves 'liquida-brasil.*'. Migração (G7, troca de nome): copia toda chave antiga 'grao-mestre.*' que ainda não
  // existe no prefixo novo, sem apagar a antiga. Recorde, finais, Primeira Instância, Diário e preferências seguem.
  const PREFIXO = 'liquida-brasil.', PREFIXO_ANTIGO = 'grao-mestre.';
  (function migrarSave() {
    try {
      const ls = root.localStorage, velhas = [];
      for (let i = 0; i < ls.length; i++) { const k = ls.key(i); if (k && k.indexOf(PREFIXO_ANTIGO) === 0) velhas.push(k); }
      velhas.forEach(k => { const nova = PREFIXO + k.slice(PREFIXO_ANTIGO.length); if (ls.getItem(nova) == null) ls.setItem(nova, ls.getItem(k)); });
    } catch (e) { /* sem storage: segue */ }
  })();
  const store = {
    get(k, def) { try { const v = root.localStorage.getItem(PREFIXO + k); return v == null ? def : JSON.parse(v); } catch (e) { return def; } },
    set(k, v) { try { root.localStorage.setItem(PREFIXO + k, JSON.stringify(v)); } catch (e) { /* sem storage: segue */ } }
  };

  const TEMAS = [['claro', 'Claro'], ['escuro', 'Escuro'], ['auto', 'Auto']];
  const VISUALIZACOES = [['auto', 'Auto'], ['pc', 'Modo PC'], ['celular', 'Modo celular']];
  const ABAS = [['inicio', 'Início'], ['golpes', 'Golpes'], ['aliados', 'Aliados'], ['extrato', 'Diário']];

  const ui = {
    s: null,            // estado do motor
    modal: null,        // {tipo, ...}
    vistas: 0,          // manchetes do mês já mostradas
    tela: 'titulo',
    tutorialPasso: -1,
    prefs: { som: store.get('som', true), musica: store.get('musica', true), crt: store.get('crt', false), cenario: store.get('cenario', P.cenarioPadrao),
      tema: store.get('tema', 'auto'), grande: store.get('grande', false),
      visualizacao: store.get('visualizacao', 'auto'),
      modo: store.get('modo', P.modoPadrao) },   // último modo escolhido no menu
    modoForcado: null,  // ?modo= na URL (testes e capturas): ignora o bloqueio e não salva   // auto (detecção) | pc | celular, salvo no aparelho
    liberados: store.get('cenarios', {}),   // cenários já conquistados (vale para todas as partidas)
    mgs: store.get('minigames', {}),       // minigames descobertos: {id:{descoberto, recorde}}
    aba: 'inicio',
    diario: DI.normalizarSalvo(store.get('diario', [])),   // páginas do Diário do Rombo (vale para todas as partidas)
    subDiario: 'extrato',   // aba Diário: 'extrato' (registro) ou 'paginas'
    paginasNovas: [],       // ids das páginas abertas ainda não avisadas (aviso só no fim do mês)
    pontoDiario: false,     // bolinha na aba Diário
    avisoPendente: false,
    acoesVistas: (v => (Array.isArray(v) ? v : []))(store.get('acoesVistas', [])),   // ids já confirmados uma vez (3.2)
    pc: null,           // true = computador (tela na horizontal); detectado em detectarAparelho()
    ultimoFim: null,
    store
  };

  const sfx = nome => { if (GM.audio && GM.audio.play) GM.audio.play(nome); };
  // meme (assets/audio/memes/, uso local); sem o arquivo toca o som sintetizado de reserva
  const meme = (nome, reserva) => { if (GM.audio && GM.audio.meme) GM.audio.meme(nome, reserva); else if (reserva) sfx(reserva); };
  // Sons e memes por evento (3.4.4 e V3 seção 4). Só apresentação: o motor não sabe deles.
  const SOM_DO_EVENTO = {
    celular: () => meme('pegaram-telefone'),
    convocacao_cpi: () => meme('me-chame-de-corrupto'),
    culto_prosperidade: () => meme('ces-nao-sao-crente'),
    so_mais_uma: () => sfx('notificacao'),
    print_vazado: () => sfx('notificacao'),
    ligacao_3h: () => sfx('telefone')
  };
  // Memes por ação do jogador (depois que a ação deu certo)
  function memeDaAcao(act) {
    if (act.type === 'executar') meme('e-agora-vai-entra-o-grosso');
    else if ((act.type === 'abrir' && act.id === 'gospel') || (act.type === 'protecao' && act.id === 'fieis')) meme('eu-sou-crente');
    else if (act.type === 'protecao' && act.id === 'mimo') meme('abraco-lindao');
    else if (act.type === 'recrutar' && D.aliadoPorId[act.id] && D.aliadoPorId[act.id].politico) meme('defender-corrupcao');
  }
  const fmtP = t => t.replace(/\{(\w+)\}/g, (m, k) => (P[k] != null ? P[k] : m));

  // ---------------- Onde está rodando ----------------
  // Celular/tablet (toque): coluna em pé com abas. Computador (mouse e tela larga): tela na horizontal,
  // com Início, Golpes e Aliados lado a lado.
  // Auto: tem mouse/touchpad em algum lugar (any-*, e não só o ponteiro principal: notebook com tela de
  // toque diz "pointer: coarse"), janela deitada e com 860 px ou mais (notebook 1366 com zoom de 150% do
  // Windows fica com ~900 px). Celular e tablet só de toque não têm ponteiro fino: ficam na coluna.
  const CONSULTA_PC = '(any-hover: hover) and (any-pointer: fine) and (orientation: landscape) and (min-width: 860px)';
  function detectarAparelho() {
    const v = ui.prefs.visualizacao;
    const pc = v === 'pc' ? true : v === 'celular' ? false : !!(root.matchMedia && root.matchMedia(CONSULTA_PC).matches);
    const mudou = pc !== ui.pc;
    ui.pc = pc;
    document.body.classList.toggle('pc', pc);
    document.body.classList.toggle('celular', !pc);
    if (mudou && ui.s) render();
  }

  // ---------------- Tema e texto grande ----------------
  function aplicarTema() {
    document.documentElement.setAttribute('data-tema', ui.prefs.tema);
    document.body.classList.toggle('grande', !!ui.prefs.grande);
    const b = $('btn-tema-titulo');
    if (b) b.textContent = 'Tema: ' + TEMAS.find(t => t[0] === ui.prefs.tema)[1];
  }
  function definirTema(t) {
    if (!TEMAS.some(x => x[0] === t)) return;
    ui.prefs.tema = t; store.set('tema', t); aplicarTema(); render();
  }
  function definirVisualizacao(v) {
    if (!VISUALIZACOES.some(x => x[0] === v)) return;
    ui.prefs.visualizacao = v; store.set('visualizacao', v); detectarAparelho(); render();
  }

  // ---------------- Telas e abas ----------------
  function mostrarTela(nome) {
    ui.tela = nome;
    $('tela-titulo').classList.toggle('oculto', nome !== 'titulo');
    $('tela-jogo').classList.toggle('oculto', nome !== 'jogo');
    if (nome === 'titulo') renderTitulo();
  }
  function irAba(aba) {
    ui.aba = aba;
    $('tela-jogo').setAttribute('data-aba', aba);
    $('view').scrollTop = 0;
    render();
  }

  function renderTitulo() {
    $('btn-som-titulo').textContent = 'Som: ' + (ui.prefs.som ? 'ligado' : 'desligado');
    $('btn-diario-titulo').textContent = 'Diário do Rombo (' + ui.diario.length + '/' + DI.PAGINAS_DIARIO.length + ')';
    renderModoTitulo();
    aplicarTema();
    const best = store.get('recorde', null);
    const nf = Object.keys(store.get('finais', {})).length;
    $('titulo-recorde').textContent = best ? 'Recorde: ' + best.pontos.toLocaleString('pt-BR') + ' pontos · finais descobertos: ' + nf + '/5' : '';
    if (GM.sprites) GM.sprites.titulo($('titulo-arte').getContext('2d'));
  }

  // ---------------- Modos de dificuldade ----------------
  // Primeira Instância: bloqueada até um dos finais de liberaCom (chave primeiraLiberada; save antigo = bloqueada)
  const modoLiberado = m => !!m && (!m.liberaCom || !!store.get('primeiraLiberada', false));
  function modoEscolhido() {
    if (ui.modoForcado && D.modoPorId[ui.modoForcado]) return ui.modoForcado;
    return modoLiberado(D.modoPorId[ui.prefs.modo]) ? ui.prefs.modo : P.modoPadrao;
  }
  function escolherModo(id) {
    const m = D.modoPorId[id];
    if (!m) return;
    if (!modoLiberado(m)) { toast(m.nome + ': ' + m.dica, 3500); return; }
    ui.prefs.modo = id; store.set('modo', id); ui.modoForcado = null;
    renderTitulo();
  }
  function renderModoTitulo() {
    const atual = D.modoPorId[modoEscolhido()];
    $('titulo-modo').innerHTML = '<div class="l">Modo</div><div class="seg">' + D.modos.map(m =>
      '<span data-act="modo:' + m.id + '" class="' + (m.id === atual.id ? 'on' : '') + (modoLiberado(m) ? '' : ' trancado') + '">' +
      (modoLiberado(m) ? '' : spriteCanvas('icone_cadeado', 12, 12, 'cadeado-mini')) + esc(m.nome) + '</span>').join('') + '</div>' +
      '<p class="dica">' + esc(atual.desc) + D.modos.filter(m => !modoLiberado(m)).map(m => ' ' + esc(m.nome) + ': ' + esc(m.dica)).join('') + '</p>';
    pintarSprites($('titulo-modo'));
  }
  function liberarModos(fim) {
    D.modos.forEach(m => {
      if (!m.liberaCom || m.liberaCom.indexOf(fim.id) < 0 || store.get('primeiraLiberada', false)) return;
      store.set('primeiraLiberada', true);
      setTimeout(() => toast(m.nome + ' liberada! Escolha o modo no menu.', 5000), 1200);
    });
  }

  function novoJogo(seed) {
    if (seed == null) seed = Date.now() % 2147483647;
    ui.s = E.newGame(seed, modoEscolhido());
    ui.vistas = 0;
    ui.modal = null;
    ui.ultimoFim = null;
    mostrarTela('jogo');
    irAba('inicio');
    if (!store.get('tutorialVisto', false)) tutorial(0);
  }

  // ---------------- Ações (data-act) ----------------
  function parseAct(str) {
    const [type, id, alvo] = str.split(':');
    const act = { type };
    if (id) act.id = id;
    if (alvo && alvo !== '-') act.alvo = alvo;
    return act;
  }

  // executa uma operação do motor e cuida dos efeitos visuais
  function operar(fn) {
    const s = ui.s;
    const antes = { caixa: s.caixa, suspeita: s.suspeita, rombo: s.rombo, faixa: s.faixa, op: s.flags.ultimaOperacao, mes: s.mes, fim: s.fim, delatores: delatores(s) };
    const r = fn();
    if (r && r.ok === false) { toast(r.motivo); return r; }
    efeitos(antes);
    return r;
  }

  function clique(str) {
    const s = ui.s;
    const act = parseAct(str);
    if (ui.cenaEspera && ['som', 'crt', 'musica'].indexOf(act.type) < 0) return;   // cena tocando: espera o jornal
    switch (act.type) {
      case 'jogar': sfx('clique'); novoJogo(GM.main && GM.main.seedUrl != null ? GM.main.seedUrl : null); return;
      case 'novo': novoJogo(null); return;
      case 'titulo': ui.modal = null; tutorial(-2); mostrarTela('titulo'); renderModal(); return;
      case 'comojogar': abrirModal({ tipo: 'comojogar' }); return;
      case 'som': alternarSom(); return;
      case 'musica': alternarMusica(); return;
      case 'crt': alternarCrt(); return;
      case 'grande': ui.prefs.grande = !ui.prefs.grande; store.set('grande', ui.prefs.grande); aplicarTema(); render(); return;
      case 'tema': definirTema(act.id); return;
      case 'vis': definirVisualizacao(act.id); return;
      case 'modo': escolherModo(act.id); return;
      case 'tema-ciclo': { const i = TEMAS.findIndex(t => t[0] === ui.prefs.tema); definirTema(TEMAS[(i + 1) % TEMAS.length][0]); return; }
      case 'cenario': trocarCenario(); return;
      case 'aba': irAba(act.id); return;
      case 'minigames': abrirModal({ tipo: 'minigames' }); return;
      case 'mgjogar': abrirModal({ tipo: 'minigame', id: act.id, modo: 'livre' }); return;
      case 'pausa': if (ui.tela === 'jogo') irAba(ui.aba === 'opcoes' ? 'inicio' : 'opcoes'); return;   // Opções (antiga pausa)
      case 'diario': if (ui.tela === 'jogo') irAba('extrato'); return;
      case 'fechar': ui.modal = ui.modal && ui.modal.voltar ? ui.modal.voltar : null; render(); return;
      case 'diario-abrir': abrirPagina(ultimaPagina(), ui.modal && ui.modal.tipo === 'fim' ? ui.modal : null); return;
      case 'pagina': abrirPagina(parseInt(act.id, 10), null); return;
      case 'pag': if (ui.modal && ui.modal.tipo === 'pagina') { ui.modal.i = Math.max(0, Math.min(DI.PAGINAS_DIARIO.length - 1, parseInt(act.id, 10))); renderModal(); } return;
      case 'subdiario': ui.subDiario = act.id === 'paginas' ? 'paginas' : 'extrato'; render(); return;
      case 'zerar-diario': ui.modal = { tipo: 'zerar-diario' }; render(); return;
      case 'zerar-diario-sim': ui.diario = []; store.set('diario', []); ui.paginasNovas = []; ui.pontoDiario = false; ui.modal = null; toast('Páginas do Diário zeradas.'); render(); return;
      case 'tutorial': ui.modal = null; tutorial(0); return;
      case 'tutorial-prox': tutorial(ui.tutorialPasso + 1); return;
      case 'tutorial-pular': tutorial(-1); return;
      case 'seguir': ui.modal = null; render(); tentarAviso(); return;
      case 'proximo': return proximoMes();
      case 'alvo': return abrirModal({ tipo: 'alvo', acao: act.id });
      case 'delatar': return abrirModal({ tipo: 'delatar' });
      case 'calote': {   // Primeira Instância: liga/desliga "não pagar os aliados" (não gasta ação)
        const r = operar(() => E.doAction(s, { type: 'calote' }));
        if (r && r.ok) { toast(s.flags.calotePlanejado ? 'Este mês ninguém recebe mesada. Eles vão anotar.' : 'Mesadas pagas normalmente.'); render(); }
        return;
      }
      case 'delatar-sim': ui.modal = null; operar(() => E.doAction(s, { type: 'delatar' })); aposOperar(); return;
      case 'escolha': {
        const idx = parseInt(act.id, 10);
        if (s.evento && s.evento.tipo === 'minigame' && idx === 0) { ui.modal = { tipo: 'minigame', id: s.evento.minigame, modo: 'jogo' }; render(); return; }
        const r = operar(() => E.resolveEvent(s, idx));
        if (r && r.ok) { sfx('clique'); ui.modal = null; aposOperar(); }
        return;
      }
      case 'confirmar-sim': {
        const m = ui.modal;
        if (!m || m.tipo !== 'confirmar') return;
        if (ui.acoesVistas.indexOf(m.idConf) < 0) { ui.acoesVistas.push(m.idConf); store.set('acoesVistas', ui.acoesVistas); }
        ui.modal = null;
        return fazerAcao(m.act);
      }
      case 'ideologia':
        if (GM.audio && GM.audio.ideologiaTocando) GM.audio.pararIdeologia();
        else if (GM.audio && GM.audio.ideologia) GM.audio.ideologia(() => toast('Arquivo de "Ideologia" não encontrado (assets/audio/ideologia.m4a).'));
        setTimeout(render, 300); return;
      case 'rever-explicacoes': ui.acoesVistas = []; store.set('acoesVistas', []); toast('As explicações voltam a aparecer na 1ª vez de cada ação.'); return;
      default: {
        // ações do motor: abrir, executar, recrutar, dispensar, protecao
        if (!s || s.fim) return;
        const conf = precisaConfirmar(act);
        if (conf) { ui.modal = { tipo: 'confirmar', act, idConf: conf }; render(); return; }
        return fazerAcao(act);
      }
    }
  }

  // Confirmação (3.2): na 1ª vez de cada golpe, ação ou recrutamento; sempre que custar mais que params.confirmarAcimaDe.
  // Devolve o id da explicação (ou null = faz direto).
  function precisaConfirmar(act) {
    const s = ui.s;
    if (act.type === 'dispensar') return null;
    const id = act.type === 'recrutar' ? 'recrutar' : act.id;
    if (!D.explicacoes[id]) return null;
    const p = E.previewAction(s, act);
    if (!p.ok) return null;                       // indisponível: o motor mostra o motivo
    const custo = -p.caixa.min;
    return (custo > P.confirmarAcimaDe || ui.acoesVistas.indexOf(id) < 0) ? id : null;
  }

  function fazerAcao(act) {
    const r = operar(() => E.doAction(ui.s, act));
    if (r && r.ok) {
      const ac = act.type === 'protecao' && GM.data.acaoPorId[act.id];
      if (ac && ac.cena && GM.sprites && GM.sprites.mostrarCena) GM.sprites.mostrarCena(ac.cena, 24);   // S01: boate na festa
      if (ui.modal && ui.modal.tipo === 'alvo') ui.modal = null;
      memeDaAcao(act);
      aposOperar();
    }
  }

  function proximoMes() {
    const s = ui.s;
    esconderPlantao();
    if (!s || s.fim) return;
    if (s.evento) { abrirModalEvento(); return; }
    const usados = () => Object.keys(s.flags.eventosUsados).reduce((t, k) => t + s.flags.eventosUsados[k], 0);
    const antesEv = usados(), antesUsados = Object.assign({}, s.flags.eventosUsados);
    const r = operar(() => E.advanceMonth(s));
    if (!r || r.ok === false) return;
    let cenaEv = null;                              // evento do mês com cena própria (S02, S03)
    Object.keys(s.flags.eventosUsados).forEach(id => { if (s.flags.eventosUsados[id] > (antesUsados[id] || 0) && SOM_DO_EVENTO[id]) SOM_DO_EVENTO[id](); });
    if (usados() > antesEv) {
      const ev = GM.data.eventoPorId[s.flags.ultimosEventos[s.flags.ultimosEventos.length - 1]];
      if (ev && ev.cena) cenaEv = ev.cena;
    }
    const novas = s.manchetes.slice();
    ui.vistas = novas.length;
    let modal = null;
    if (s.fim) modal = { tipo: 'fim' };
    else if (s.evento) modal = { tipo: 'evento', outras: novas };
    else if (novas.length) modal = { tipo: 'jornal', outras: novas };
    if (cenaEv && modal && !s.fim && GM.sprites && GM.sprites.mostrarCena && !(GM.main && GM.main.selftest)) {
      // a cena toca sozinha por ~2,5 s e só depois abre o jornal (o modal escurece a tela toda)
      ui.modal = null; ui.cenaEspera = true;
      if (ui.aba !== 'inicio') irAba('inicio'); else render();
      GM.sprites.mostrarCena(cenaEv, 40);
      setTimeout(() => { ui.cenaEspera = false; if (ui.s === s && !ui.modal) { ui.modal = modal; render(); } ui.avisoPendente = true; tentarAviso(); }, 2600);
      return;
    }
    ui.modal = modal;
    render();
    ui.avisoPendente = true; tentarAviso();
  }

  // Diário do Rombo (opção C): páginas abertas viram UM modal no fim do mês ("N páginas novas"), depois do
  // jornal, nunca durante evento ou minigame. A bolinha pulsa na aba Diário até o jogador abrir as Páginas.
  function verificarPaginas() {
    const s = ui.s;
    if (!s) return;
    const novas = DI.checarPaginas(s, ui.diario);
    if (!novas.length) return;
    ui.diario = ui.diario.concat(novas); store.set('diario', ui.diario);
    ui.paginasNovas = ui.paginasNovas.concat(novas); ui.pontoDiario = true;
  }
  function tentarAviso() {
    const s = ui.s;
    if (!ui.avisoPendente || !s || s.evento || ui.modal || ui.cenaEspera) return;
    ui.avisoPendente = false;
    if (!ui.paginasNovas.length) return;
    ui.modal = { tipo: 'novapagina', ids: ui.paginasNovas };
    ui.paginasNovas = [];
    sfx('notificacao');
    render();
  }
  // abre na última página desbloqueada (ou na primeira)
  function ultimaPagina() {
    let i = 0;
    DI.PAGINAS_DIARIO.forEach((p, k) => { if (ui.diario.indexOf(p.id) >= 0) i = k; });
    return i;
  }
  function abrirPagina(i, voltar) {
    ui.modal = { tipo: 'pagina', i: Math.max(0, Math.min(DI.PAGINAS_DIARIO.length - 1, i || 0)), voltar: voltar || null };
    ui.pontoDiario = false;
    render();
  }

  // depois de ação ou escolha: manchetes novas viram aviso; evento na fila abre modal
  function aposOperar() {
    const s = ui.s;
    const novas = s.manchetes.slice(ui.vistas);
    ui.vistas = s.manchetes.length;
    if (s.fim) ui.modal = { tipo: 'fim' };
    else if (s.evento) ui.modal = { tipo: 'evento', outras: novas };
    else if (novas.length) plantao(novas);
    render();
    tentarAviso();
  }

  function abrirModalEvento() { ui.modal = { tipo: 'evento', outras: [] }; render(); }
  function abrirModal(m) {
    if (ui.s && (ui.s.fim || ui.s.evento) && ui.tela === 'jogo' && m.tipo !== 'comojogar' && m.tipo !== 'minigames') return;
    ui.modal = m; render();
  }

  // selftest: o minigame não é jogado de verdade; resolve com o nível padrão (igual ao motor sem tela)
  function pularMinigame() {
    if (!ui.modal || ui.modal.tipo !== 'minigame') return;
    ui.modal = null;
    const r = operar(() => E.resolveEvent(ui.s, 0));
    if (r && r.ok) aposOperar(); else render();
  }

  // ---------------- Efeitos visuais ----------------
  function efeitos(antes) {
    const s = ui.s;
    const dc = s.caixa - antes.caixa;
    if (dc) { flutuar('hud-caixa', (dc > 0 ? '+' : '') + dc + ' mi', dc > 0); sfx(dc > 0 ? 'moeda' : 'gasto'); }
    const ds = Math.round((s.suspeita - antes.suspeita) * 10) / 10;
    if (Math.abs(ds) >= 0.5) flutuar('hud-suspeita', sinal(ds), ds < 0);
    const dr = Math.round((s.rombo - antes.rombo) * 10) / 10;
    if (dr > 0) flutuar('hud-rombo', '+' + num(dr) + ' bi', true);
    if (dc > 0 && GM.sprites && GM.sprites.moedas) GM.sprites.moedas(dc);
    if (s.faixa !== antes.faixa) {
      piscar($('stage'), 'flash', 320);
      piscar($('hud'), 'hud-flash', 1300);
      if (s.faixa > antes.faixa) meme('me-chame-de-corrupto', 'alerta');
    }
    if (s.flags.ultimaOperacao !== antes.op) { piscar($('stage'), 'treme', 320); meme('toc-toc-pf', 'operacao'); }
    if (delatores(s) > antes.delatores && !s.fim) sfx('delacao');
    if (s.fim && !antes.fim) { if (s.fim.vitoria) meme('imbroxavel', 'vitoria'); else sfx('derrota'); registrarFim(s.fim); }
  }

  const delatores = s => Object.keys(s.aliados).filter(id => s.aliados[id].status === 'delatou').length;

  function piscar(el, classe, ms) {
    el.classList.remove(classe); void el.offsetWidth; el.classList.add(classe);
    setTimeout(() => el.classList.remove(classe), ms);
  }

  // número que sobe a partir do elemento (só se ele estiver visível na aba atual)
  function flutuar(alvoId, texto, bom) {
    const alvo = $(alvoId);
    if (!alvo) return;
    const st = $('stage').getBoundingClientRect(), r = alvo.getBoundingClientRect();
    if (!r.width || r.bottom < st.top || r.top > st.bottom) return;
    const el = document.createElement('div');
    el.className = 'flutua ' + (bom ? 'mais' : 'menos');
    el.textContent = texto;
    el.style.left = (r.left - st.left + 8) + 'px';
    el.style.top = (r.top - st.top) + 'px';
    $('flutuantes').appendChild(el);
    setTimeout(() => el.remove(), 1200);
  }

  // Plantão: notícia que sai durante uma ação (ex.: foto da festa vazada) vira um recorte de jornal no meio da tela.
  // Some sozinho (mais tempo se forem várias) ou com um toque. O toast fica para avisos curtos ("Falta caixa").
  let plantaoTimer = null;
  function plantao(lista) {
    const el = $('plantao');
    const perigo = lista.some(m => m.tipo === 'perigo');
    el.className = perigo ? 'perigo' : '';
    el.innerHTML = '<div class="pl-cab ft"><span>' + (perigo ? 'PLANTÃO' : 'ÚLTIMAS') + '</span><span>O DIÁRIO DO ROMBO</span></div>' +
      lista.map(m => '<p class="pl-txt ' + esc(m.tipo) + '">' + esc(m.texto) + '</p>').join('') + '<div class="pl-dica">' + (ui.pc ? 'clique' : 'toque') + ' para fechar</div>';
    void el.offsetWidth; el.classList.add('mostra');
    clearTimeout(plantaoTimer);
    plantaoTimer = setTimeout(esconderPlantao, 4500 + 2000 * (lista.length - 1));
  }
  function esconderPlantao() { clearTimeout(plantaoTimer); $('plantao').classList.remove('mostra'); }

  let toastTimer = null;
  function toast(texto, ms) {
    const t = $('toast');
    t.textContent = texto; t.classList.add('mostra');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('mostra'), ms || 2200);
  }

  // ---------------- Recordes e finais ----------------
  function registrarFim(fim) {
    const finais = store.get('finais', {});
    finais[fim.id] = true; store.set('finais', finais);
    liberarModos(fim);
    if (Object.keys(finais).length >= Object.keys(D.finais).length && !store.get('ideologiaLiberada', false)) {   // 3.4.5
      store.set('ideologiaLiberada', true);
      setTimeout(() => {
        toast('Os 5 finais foram descobertos. Tocando "Ideologia". Ela fica em Opções.', 5000);
        if (GM.audio && GM.audio.ideologia) GM.audio.ideologia();
      }, 2500);
    }
    const rank = store.get('ranking', []);
    const item = { pontos: fim.pontos, final: fim.titulo, meses: fim.meses, modo: ui.s.modo, data: new Date().toLocaleDateString('pt-BR'), t: Date.now() };
    rank.push(item);
    rank.sort((a, b) => b.pontos - a.pontos);
    store.set('ranking', rank.slice(0, 10));
    const best = store.get('recorde', null);
    if (!best || fim.pontos > best.pontos) store.set('recorde', item);
    ui.ultimoFim = item;
  }

  // ---------------- Peças de HTML ----------------
  // botão genérico; indisponível fica apagado e o motivo aparece num aviso ao tocar
  function botao(act, rotulo, st, classe, extra) {
    const off = st && !st.ok;
    return '<button class="' + (classe || 'btn') + (off ? ' off' : '') + (extra ? ' ' + extra : '') + '" data-act="' + act + '"' +
      (off ? ' aria-disabled="true"' : '') + '>' + rotulo +
      (off && st.motivo && st.motivo !== 'Fim de jogo' ? '<span class="motivo">' + esc(st.motivo) + '</span>' : '') + '</button>';
  }
  // botão pequeno à direita dos cartões: o motivo vai escondido (aparece no aviso) e também na linha de baixo do cartão
  function goBtn(act, rotulo, st, extra) {
    const off = st && !st.ok;
    return '<button class="go' + (off ? ' off' : '') + (extra ? ' ' + extra : '') + '" data-act="' + act + '"' + (off ? ' aria-disabled="true"' : '') + '>' + rotulo +
      (off && st.motivo ? '<span class="motivo oculto">' + esc(st.motivo) + '</span>' : '') + '</button>';
  }
  const motivoLinha = st => (st && !st.ok && st.motivo && st.motivo !== 'Fim de jogo' ? '<span class="motivo">' + esc(st.motivo) + '</span>' : '');
  const spriteCanvas = (nome, w, h, classe) => '<canvas class="' + classe + '" data-sprite="' + nome + '" width="' + w + '" height="' + h + '"></canvas>';
  const barra = (v, cor) => '<div class="bar" style="--c:' + cor + '"><i style="width:' + Math.max(0, Math.min(100, v)) + '%"></i></div>';
  // Chips de efeito (3.2): o que a ação faz, com os números do motor (E.previewAction). Celular não tem tooltip.
  function chipsDe(p, lealdadeFixa) {
    const c = [], pm = p.porMes;
    const mi = v => 'R$ ' + Math.abs(v).toLocaleString('pt-BR');
    if (p.caixa.min || p.caixa.max) c.push(p.caixa.min === p.caixa.max ? (p.caixa.min > 0 ? '+' : '-') + mi(p.caixa.min) + ' mi' : '-' + mi(p.caixa.max) + '-' + Math.abs(p.caixa.min) + ' mi');
    if (p.rombo) c.push('rombo +' + num(p.rombo));
    if (Math.abs(p.suspeita) >= 0.05) c.push('susp ' + sinal(p.suspeita));
    if (p.lealdade) c.push('leal. +' + p.lealdade.n); else if (lealdadeFixa) c.push('leal. +' + lealdadeFixa);
    if (p.blindagem) c.push('blind. ' + sinal(p.blindagem));
    if (pm && pm.caixa) c.push('+' + mi(pm.caixa) + '/mês');
    if (pm && pm.mesada > 0) c.push('mesada ' + pm.mesada + '/mês');
    if (pm && pm.suspeita) c.push('susp +' + num(pm.suspeita) + '/mês');
    if (pm && pm.multSuspeita) c.push('susp. passiva x' + num(pm.multSuspeita));
    if (p.chance) c.push('risco ' + p.chance.pct + '%');
    if (p.fim) c.push('fim de jogo');
    return c;
  }
  const htmlChips = (lista, max) => lista.length ? '<span class="chips">' + lista.slice(0, max || 3).map(x => '<i>' + esc(x) + '</i>').join('') + '</span>' : '';
  const corFaixa = f => ['var(--good)', 'var(--f1)', 'var(--c1)', 'var(--c2)'][Math.min(f, 3)];

  // ---------------- Cenários como conquistas ----------------
  const cenarioLiberado = c => !c.liberar || !!ui.liberados[c.id];
  function verificarCenarios() {
    const s = ui.s;
    if (!s) return;
    GM.data.cenarios.forEach(c => {
      if (cenarioLiberado(c)) return;
      const g = GM.data.golpes.find(x => x.id === c.liberar.golpe), st = g && s.golpes[g.id];
      if (!st || !(g.tipo === 'unica' ? st.ultimoUso != null : st.ativo)) return;
      ui.liberados[c.id] = true; store.set('cenarios', ui.liberados);
      sfx('vitoria');
      toast('Conquista: cenário "' + c.nome + '" liberado! Troque em Opções → Cenário.', 4500);
    });
  }
  function verificarMinigames() {
    const s = ui.s;
    if (!s) return;
    Object.keys(s.flags.minigames || {}).forEach(id => {
      if (ui.mgs[id] && ui.mgs[id].descoberto) return;
      ui.mgs[id] = Object.assign(ui.mgs[id] || {}, { descoberto: true }); store.set('minigames', ui.mgs);
      sfx('vitoria');
      toast('Minigame descoberto: "' + GM.data.minigamePorId[id].nome + '"! Ele fica em Minigames, no menu principal e em Opções.', 4500);
    });
  }
  function iniciarMinigame(m) {
    const mg = GM.minigames && GM.minigames.registro[m.id];
    if (!mg) { ui.modal = null; render(); return; }
    if (m.id === 'coletiva') meme('chega-de-frescura-e-mimimi');
    mg.iniciar($('mg-host'), { modo: m.modo, onSair: r => {
      const reg = ui.mgs[m.id] = Object.assign({ descoberto: true }, ui.mgs[m.id]);
      if (r.pontos > (reg.recorde || 0)) reg.recorde = r.pontos;
      store.set('minigames', ui.mgs);
      if (m.modo === 'livre') { ui.modal = { tipo: 'minigames' }; render(); return; }
      ui.modal = null;
      const res = operar(() => E.resolveEvent(ui.s, 0, r.nivel));
      if (res && res.ok) { sfx('clique'); aposOperar(); } else render();
    } });
  }
  function htmlMinigames() {
    const lista = GM.data.minigames.map(mg => {
      const reg = ui.mgs[mg.id];
      if (reg && reg.descoberto) return '<div class="mg-item"><b>' + esc(mg.nome) + '</b><p class="dica">' + esc(mg.desc) + '</p><p class="dica">Recorde: ' + (reg.recorde ? 'R$ ' + reg.recorde + ' mi' : 'ainda sem partida') + '</p>' +
        botao('mgjogar:' + mg.id, 'JOGAR', null, 'btn', 'ok') + '</div>';
      return '<div class="mg-item trancado"><b>? ? ?</b><p class="dica">' + esc(mg.dica) + '</p></div>';
    }).join('');
    return '<h2>Minigames</h2><p class="dica">Cada minigame aparece uma vez por partida, quando algo grave acontece. Os que você já viu ficam aqui para jogar à vontade, sem efeito na partida.</p>' + lista;
  }
  function aplicarCenario() {
    let c = GM.data.cenarioPorId[ui.prefs.cenario];
    if (!c || !cenarioLiberado(c)) { c = GM.data.cenarioPorId[P.cenarioPadrao]; ui.prefs.cenario = P.cenarioPadrao; }
    if (GM.sprites && GM.sprites.estilo) GM.sprites.estilo(c.id);
  }
  // Faixa embaixo da cena (Início): cenário atual à vista e botão de trocar
  function renderCenarioBar() {
    const lib = GM.data.cenarios.filter(cenarioLiberado), tot = GM.data.cenarios.length;
    const c = GM.data.cenarioPorId[ui.prefs.cenario];
    $('cenario-bar').innerHTML = '<span><span class="l">Cenário ' + lib.length + '/' + tot + '</span><br>' + esc(c ? c.nome : '') + '</span>' +
      '<button class="go sec' + (lib.length < 2 ? ' apagado' : '') + '" data-act="cenario">TROCAR</button>';   // sem 'off': o clique explica como liberar
  }
  function trocarCenario() {
    const lib = GM.data.cenarios.filter(cenarioLiberado);
    if (lib.length < 2) { toast('Abra golpes para liberar outros cenários'); return; }
    const i = lib.findIndex(c => c.id === ui.prefs.cenario);
    const prox = lib[(i + 1) % lib.length];
    ui.prefs.cenario = prox.id; store.set('cenario', prox.id);
    aplicarCenario(); toast('Cenário: ' + prox.nome); render();
  }

  // ---------------- Render ----------------
  function render() {
    if (ui.tela !== 'jogo' || !ui.s) { renderModal(); return; }
    verificarCenarios(); verificarMinigames(); verificarPaginas();
    $('tela-jogo').setAttribute('data-aba', ui.aba);
    renderTopo(); renderHud(); renderCenarioBar(); renderSuspeita(); renderAcoes(); renderPrevisao();
    renderGolpes(); renderAliados(); renderDiario(); renderOpcoes(); renderAbas(); renderModal();
    pintarSprites($('tela-jogo'));
    if (GM.main && GM.main.debugRender) GM.main.debugRender();
  }

  function renderTopo() {
    const s = ui.s, op = ui.aba === 'opcoes', ex = ui.aba === 'extrato';
    // no computador não há barra de abas: Extrato e Opções ficam no topo e ocupam o lugar de Golpes e Aliados
    const extrato = ui.pc ? '<button class="gear" data-act="aba:' + (ex ? 'inicio' : 'extrato') + '">' + (ex ? 'VOLTAR' : 'DIÁRIO') + (ui.pontoDiario && !ex ? ' <span class="ponto-pc">●</span>' : '') + '</button>' : '';
    $('app-top').innerHTML = '<span class="ft lg"><span>GLASS<b>BANK</b></span><small class="lg-sub">LIQUIDA BRASIL</small></span><span class="ft">' + (op ? 'OPÇÕES' : 'MÊS ' + s.mes + '/' + P.mesMax + (s.modo !== P.modoPadrao ? ' <small class="tag-modo">' + esc(D.modoPorId[s.modo].curto) + '</small>' : '')) + '</span>' +
      '<span class="top-bts">' + extrato + '<button class="gear" data-act="pausa">' + (op ? 'VOLTAR' : 'OPÇÕES') + '</button></span>';
  }

  function renderAbas() {
    $('abas').innerHTML = ABAS.map(t => '<button data-act="aba:' + t[0] + '" class="' + (ui.aba === t[0] ? 'on' : '') + (t[0] === 'extrato' && ui.pontoDiario ? ' ponto' : '') + '">' + t[1] + '</button>').join('');
  }

  function renderHud() {
    const s = ui.s, pv = E.previsao(s);
    const aps = Array.from({ length: P.acoesPorMes }, (_, i) => '<i class="' + (i < s.ap ? '' : 'g') + '"></i>').join('');
    $('hud').innerHTML =
      '<div id="hud-caixa"><div class="l">Saldo disponível</div><div class="big">R$ ' + s.caixa.toLocaleString('pt-BR') + ' mi</div>' +
      '<div class="' + (pv.saldo < 0 ? 'dn' : 'up') + '">' + (pv.saldo >= 0 ? '▲ +' : '▼ ') + pv.saldo + ' mi/mês previsto</div></div>' +
      '<div class="mini" style="margin-top:10px">' +
      '<div id="hud-rombo"><div class="l">Rombo ' + num(s.rombo) + '/' + P.romboMeta + ' bi</div>' + barra(s.rombo / P.romboMeta * 100, 'var(--c1)') + '</div>' +
      '<div id="hud-blindagem"><div class="l">Blindagem ' + num(s.blindagem) + (s.flags.anistiaMeses ? ' (anistia ' + s.flags.anistiaMeses + '/' + P.anistiaMeses + ')' : '') + '</div>' + barra(s.blindagem, 'var(--good)') + '</div></div>' +
      '<div id="hud-ap"><div class="l">Ações do mês: ' + s.ap + '/' + P.acoesPorMes + '</div><div class="ap">' + aps + '</div></div>';
  }

  function renderSuspeita() {
    const s = ui.s, fx = D.faixas[s.faixa];
    const t = $('termometro');
    t.innerHTML = '<div id="hud-suspeita" class="l">Suspeita <span class="n" style="color:' + corFaixa(s.faixa) + '">' + Math.floor(s.suspeita) + '</span> · ' + esc(fx.nome) + '</div>' +
      barra(s.suspeita, 'var(--c2)');
    t.classList.toggle('pulsa', s.suspeita >= P.faixaAlta);
    // desenho do cenário (o loop de sprites.js também redesenha ~8 vezes por segundo)
    if (GM.sprites) GM.sprites.cena($('cena').getContext('2d'), s);
  }

  function renderAcoes() {
    const s = ui.s;
    $('lista-acoes').innerHTML = D.acoes.map(a => {
      const st = E.actionStatus(s, { type: 'protecao', id: a.id });
      const act = a.alvo ? 'alvo:' + a.id : 'protecao:' + a.id;
      return botao(act, spriteCanvas('icone_' + a.icone, 12, 12, 'icone') + '<span>' + esc(a.nome) + '</span>' + htmlChips(chipsDe(E.previewAction(s, { type: 'protecao', id: a.id }), a.lealdade), 2), st, 'tl');
    }).join('');
    const stC = E.actionStatus(s, { type: 'calote' }), on = !!s.flags.calotePlanejado;
    const totMesadas = D.aliados.filter(a => s.aliados[a.id].ativo).reduce((t, a) => t + E.mesadaDe(s, a.id), 0);
    $('calote-box').innerHTML = s.modo === 'primeirainstancia' && (stC.ok || on)
      ? '<div class="row calote' + (on ? ' on' : '') + '" data-act="calote"><span>Não pagar os aliados este mês<small>Economiza R$ ' + totMesadas + ' mi · lealdade ' + P.caloteLealdade +
        ' em todos · delação mais fácil por ' + P.caloteMeses + ' meses</small></span><span class="sw' + (on ? ' on' : '') + '"><i></i></span></div>' : '';
    const stD = E.actionStatus(s, { type: 'delatar' });
    $('delatar-box').innerHTML = stD.ok ? botao('delatar', 'DELATAR TODO MUNDO', stD, 'btn', 'perigo') : '';
    $('btn-proximo').classList.toggle('off', !!s.evento || !!s.fim);
  }

  function renderPrevisao() {
    const s = ui.s, pv = E.previsao(s);
    const efeitoFaixa = ['Calmaria.', '60%/mês de vazamento extra.', 'Risco de operação policial.', 'Operações em dobro; aliados fracos delatam. Botão Delatar liberado.'][Math.min(s.faixa, 3)];
    $('previsao').innerHTML = '<b>Próximo mês</b><br>Receita +' + pv.receita + ' · mesadas -' + pv.mesadas + (s.flags.calotePlanejado ? ' (não vai pagar)' : '') + '<br>Rombo +' + num(pv.rombo) +
      ' · suspeita passiva +' + num(pv.suspeitaPassiva) + '<br>Blindagem corta ' + Math.round(E.reducaoBlindagem(s) * 100) + '% da suspeita<br><span style="color:' + corFaixa(s.faixa) + '">' + efeitoFaixa + '</span>' +
      (s.flags.inspecaoTotal ? '<span class="motivo">Inspeção total do Doutor Liquidação: suspeita x' + String(P.inspecaoMult).replace('.', ',') + '</span>' : '');
  }

  function renderGolpes() {
    const s = ui.s;
    $('lista-golpes').innerHTML = D.golpes.filter(g => !g.soModo || g.soModo === s.modo).map(g => {   // golpe de outro modo não aparece
      const st = s.golpes[g.id];
      const renda = E.rendaGolpe(s, g);
      let info, acao, stAcao = null;
      if (g.tipo === 'recorrente') {
        info = g.id === 'fundofundo' ? 'suspeita passiva x' + String(P.fundoMult).replace('.', ',') :
          '+' + renda + ' mi/mês · rombo +' + num(g.rombo) + ' · susp +' + num(g.suspeita);
        if (st.ativo) acao = st.congeladoAte >= s.mes ? '<span class="motivo">Congelado até o mês ' + st.congeladoAte + '</span>' : '<span class="on-tag">ATIVO ✓</span>';
        else { stAcao = E.actionStatus(s, { type: 'abrir', id: g.id }); acao = goBtn('abrir:' + g.id, 'R$ ' + g.custo, stAcao); }
      } else {
        info = '+' + renda + ' mi já · rombo +' + num(g.rombo) + ' · susp +' + g.suspeita + ' · recarga ' + g.recarga + ' meses';
        stAcao = E.actionStatus(s, { type: 'executar', id: g.id });
        acao = goBtn('executar:' + g.id, 'EXECUTAR', stAcao);
      }
      return '<div class="it' + (st.ativo ? ' ativo' : '') + '">' + spriteCanvas('icone_' + g.icone, 12, 12, 'icone') +
        '<div class="nm">' + esc(g.nome) + (st.ativo ? '<small>' + info + '</small>' : htmlChips(chipsDe(E.previewAction(s, { type: g.tipo === 'recorrente' ? 'abrir' : 'executar', id: g.id })), 3) + (g.tipo === 'unica' ? '<small>recarga ' + g.recarga + ' meses</small>' : '')) + '<small>' + esc(g.desc) + '</small>' + (st.ativo ? '' : motivoLinha(stAcao)) + '</div>' + acao + '</div>';
    }).join('');
  }

  function renderAliados() {
    const s = ui.s;
    const lista = D.aliados.filter(a => !a.soModo || a.soModo === s.modo).sort((a, b) => {   // aliado de outro modo não aparece
      const A = s.aliados[a.id], B = s.aliados[b.id];
      if (A.ativo !== B.ativo) return A.ativo ? -1 : 1;
      return A.ativo ? A.ordem - B.ordem : 0;
    });
    $('lista-aliados').innerHTML = lista.map(a => {
      const st = s.aliados[a.id];
      let corpo, btns = '';
      if (st.ativo) {
        const l = st.lealdade;
        const contrib = Math.round((a.blindagem + st.blindBonus) * l / 100 * 10) / 10;
        const stM = E.actionStatus(s, { type: 'protecao', id: 'mimo', alvo: a.id });
        corpo = '<small>' + esc(a.campo) + ' · mesada ' + E.mesadaDe(s, a.id) + ' · blind. +' + num(contrib) + '</small>' +
          '<div class="lealb ' + (l < P.delacaoLimite ? 'baixa' : l < 45 ? 'media' : '') + '"><i style="width:' + l + '%"></i></div>' +
          '<small>lealdade ' + l + (l < P.delacaoLimite ? ' · <span class="dn">VAI DELATAR</span>' : '') + '</small><small>' + esc(a.poder) + '</small>' +
          htmlChips(['mimo: ' + chipsDe(E.previewAction(s, { type: 'protecao', id: 'mimo', alvo: a.id })).filter(x => /leal/.test(x)).concat(['leal. +0'])[0],
            'dispensar: ' + chipsDe(E.previewAction(s, { type: 'dispensar', id: a.id })).join(', ')], 2);
        btns = '<div class="botoes">' + goBtn('protecao:mimo:' + a.id, 'MIMO R$ ' + D.acaoPorId.mimo.custoMin, stM) +
          goBtn('dispensar:' + a.id, 'DISPENSAR', E.actionStatus(s, { type: 'dispensar', id: a.id }), 'sec') + '</div>';
      } else if (st.status === 'delatou') {
        corpo = '<small>' + esc(a.campo) + '</small><small class="dn">Delatou você</small>';
      } else {
        const stR = E.actionStatus(s, { type: 'recrutar', id: a.id });
        corpo = '<small>' + esc(a.campo) + ' · leal. ' + a.lealdade + '</small>' + htmlChips(chipsDe(E.previewAction(s, { type: 'recrutar', id: a.id })), 3) + '<small>' + esc(a.poder) + '</small>' + motivoLinha(stR);
        btns = goBtn('recrutar:' + a.id, 'R$ ' + a.custo, stR);
      }
      return '<div class="it' + (st.status === 'delatou' ? ' off' : '') + '">' + spriteCanvas('corpo_' + a.id, 16, 30, 'retrato') +
        '<div class="nm">' + esc(a.nome) + corpo + '</div>' + btns + '</div>';
    }).join('');
  }

  function renderDiario() {
    const pag = ui.subDiario === 'paginas', L = DI.PAGINAS_DIARIO;
    if (pag && ui.aba === 'extrato') ui.pontoDiario = false;
    $('diario-seg').innerHTML = '<span data-act="subdiario:extrato" class="' + (pag ? '' : 'on') + '">Extrato</span>' +
      '<span data-act="subdiario:paginas" class="' + (pag ? 'on' : '') + '">Páginas ' + ui.diario.length + '/' + L.length + '</span>';
    $('extrato').classList.toggle('oculto', pag);
    $('paginas').classList.toggle('oculto', !pag);
    if (pag) {
      $('paginas').innerHTML = '<p class="dica">O que o rombo compraria na vida real. Valores reais fixos; as páginas abrem conforme o rombo do jogo cresce.</p><div class="pag-grade">' +
        L.map((p, i) => ui.diario.indexOf(p.id) >= 0
          ? '<button class="pag-mini" data-act="pagina:' + i + '"><span class="n">' + p.ordem + '</span><b>' + esc(p.titulo) + '</b></button>'
          : '<button class="pag-mini trancada" data-act="pagina:' + i + '">' + spriteCanvas('icone_cadeado', 12, 12, 'icone') + '<span class="n">' + p.ordem + '</span><b>???</b><small>' + esc(p.dica) + '</small></button>').join('') + '</div>';
    }
    renderExtrato();
  }

  function renderExtrato() {
    const s = ui.s;
    $('extrato').innerHTML = s.log.length ? s.log.slice(-60).reverse().map(l =>
      '<p class="' + esc(l.tipo) + '">▸ [' + l.mes + '] ' + esc(l.texto) + '</p>').join('') : '<p>Nada ainda. Um bom banqueiro começa discreto.</p>';
  }

  function renderOpcoes() {
    const s = ui.s;
    const linha = (act, rot, on) => '<div class="row" data-act="' + act + '"><span>' + rot + '</span><span class="sw' + (on ? ' on' : '') + '"><i></i></span></div>';
    const tr = GM.data.cenarios.filter(c => !cenarioLiberado(c));
    $('painel-opcoes').innerHTML =
      '<div class="l">Tema</div><div class="seg">' + TEMAS.map(t => '<span data-act="tema:' + t[0] + '" class="' + (ui.prefs.tema === t[0] ? 'on' : '') + '">' + t[1] + '</span>').join('') + '</div>' +
      '<p class="dica">Auto segue o tema do aparelho.</p><div class="prev"><div class="pv1">CLARO<br>papel e tinta</div><div class="pv2">ESCURO<br>tinta e papel</div></div>' +
      '<div class="l">Visualização</div><div class="seg">' + VISUALIZACOES.map(x => '<span data-act="vis:' + x[0] + '" class="' + (ui.prefs.visualizacao === x[0] ? 'on' : '') + '">' + x[1] + '</span>').join('') + '</div>' +
      '<p class="dica">Auto escolhe sozinho: tela deitada com mouse vira Modo PC; toque vira Modo celular. Agora: ' + (ui.pc ? 'Modo PC' : 'Modo celular') + '.</p>' +
      linha('grande', 'Texto grande', ui.prefs.grande) +
      linha('som', 'Som <span class="so-pc">(M)</span>', ui.prefs.som) +
      linha('musica', 'Música <span class="so-pc">(N)</span>', ui.prefs.musica) +
      linha('crt', 'Filtro de TV antiga <span class="so-pc">(C)</span>', ui.prefs.crt) +
      '<div class="row" data-act="cenario"><span>Cenário: ' + esc(GM.data.cenarioPorId[ui.prefs.cenario].nome) + '</span><span class="go sec">TROCAR</span></div>' +
      (tr.length ? '<p class="dica" style="margin-top:8px">Cenários bloqueados: ' + tr.map(c => esc(c.nome) + ' (' + esc(c.dica) + ')').join(' · ') + '.</p>' : '') +
      (store.get('ideologiaLiberada', false) ? '<div class="row" data-act="ideologia"><span>' + (GM.audio && GM.audio.ideologiaTocando ? 'Parar "Ideologia"' : 'Ouvir "Ideologia"') + '</span><span class="go sec">' + (GM.audio && GM.audio.ideologiaTocando ? 'PARAR' : 'TOCAR') + '</span></div>' : '') +
      '<div class="l secao-op">Ajuda e partida</div>' +
      botao('minigames', 'Minigames') + botao('comojogar', 'Como jogar') + botao('tutorial', 'Rever o tutorial') + botao('rever-explicacoes', 'Rever explicações das ações') + botao('zerar-diario', 'Zerar páginas do Diário') +
      botao('novo', 'Nova partida') + botao('titulo', 'Voltar ao título', null, 'btn', 'perigo') +
      '<p class="dica" style="text-align:center">Modo: ' + esc(D.modoPorId[s.modo].nome) + ' · Semente desta partida: ' + s.seed + ' (abra com ?seed=' + s.seed + ' para repetir)</p>';
  }

  // pinta todo <canvas data-sprite=nome> com o sprite (procedural ou PNG)
  function pintarSprites(cont) {
    if (!GM.sprites) return;
    cont.querySelectorAll('canvas[data-sprite]').forEach(cv => {
      const ctx = cv.getContext('2d');
      ctx.clearRect(0, 0, cv.width, cv.height);
      GM.sprites.draw(ctx, cv.getAttribute('data-sprite'), 0, 0, 1);
    });
  }

  // ---------------- Modais ----------------
  // Jornal, evento, fim e telas de leitura ficam no centro; o botão grande embaixo fecha (o evento exige escolha).
  // Minigame ocupa a tela toda.
  function renderModal() {
    const m = ui.modal, s = ui.s;
    const vel = $('modal'), box = $('modal-corpo'), grande = $('btn-fechar-grande');
    if (!m) { vel.classList.add('oculto'); box.innerHTML = ''; return; }
    if (m.tipo === 'minigame' && m.iniciado) return;   // jogo em andamento: não reconstruir o canvas
    vel.className = 'vel centro';
    let h = '', bAct = 'fechar', bRot = 'FECHAR';
    switch (m.tipo) {
      case 'evento': {
        const ev = s.evento;
        if (!ev) { ui.modal = null; vel.classList.add('oculto'); return; }
        vel.classList.add('sem-fechar');
        if (ev.estilo === 'ligacao') vel.classList.add('tremor');   // E03: o modal treme como celular tocando
        h = (ev.estilo === 'ligacao' ? '<div class="chat-topo">☎ chamada recebida · 03:02</div><p class="balao">' + esc(ev.texto) + '</p>'
          : ev.estilo === 'chat' ? '<div class="chat-topo">● online · mensagem nova</div><p class="balao">' + esc(ev.texto) + '</p><div class="chat-hora">agora ✓✓</div>'
          : cabecaJornal(s) + '<p class="manchete">' + esc(ev.texto) + '</p>') +
          '<div class="botoes">' + ev.escolhas.map((c, i) => botao('escolha:' + i, (i + 1) + '. ' + esc(c.rotulo) + (c.custo ? ' (R$ ' + c.custo + ' mi)' : ''), E.escolhaStatus(s, c), 'opc', c.custo ? '' : 'ok')).join('') + '</div>' +
          outras(m.outras);
        break;
      }
      case 'jornal': {
        const [prim, ...resto] = m.outras;
        h = cabecaJornal(s) + '<p class="manchete">' + esc(prim.texto) + '</p>' + outras(resto);
        bAct = 'seguir';
        break;
      }
      case 'alvo': {
        const a = D.acaoPorId[m.acao];
        h = '<h2>' + esc(a.nome) + '</h2><p>' + esc(a.desc) + '</p><h3>Para qual aliado?</h3><div class="botoes">' +
          D.aliados.filter(x => s.aliados[x.id].ativo).map(x =>
            botao('protecao:' + a.id + ':' + x.id, esc(x.nome) + ' (lealdade ' + s.aliados[x.id].lealdade + ')', E.actionStatus(s, { type: 'protecao', id: a.id, alvo: x.id }), 'opc')).join('') +
          (a.alvo === 'opcional' ? botao('protecao:' + a.id + ':-', 'Ninguém em especial', E.actionStatus(s, { type: 'protecao', id: a.id }), 'opc') : '') + '</div>';
        bRot = 'CANCELAR';
        break;
      }
      case 'confirmar': {
        const act = m.act, p = E.previewAction(s, act);
        const ent = act.type === 'recrutar' ? D.aliadoPorId[act.id] : (D.golpePorId[act.id] || D.acaoPorId[act.id]);
        const cara = -p.caixa.min > P.confirmarAcimaDe;
        h = '<h2>' + (act.type === 'recrutar' ? 'Recrutar ' : '') + esc(ent.nome) + '</h2>' +
          (act.alvo ? '<p class="dica">Para ' + esc(E.nomeCom(act.alvo, '')) + '</p>' : '') +
          '<p>' + esc(E.explicacao(m.idConf)) + '</p>' + (act.type === 'recrutar' ? '<p class="dica">' + esc(ent.poder) + '</p>' : '') +
          htmlChips(chipsDe(p, act.type === 'protecao' && !act.alvo ? ent.lealdade : null), 6) +
          '<p class="dica">' + (cara ? 'Passa de R$ ' + P.confirmarAcimaDe + ' mi: esta confirmação aparece sempre.' : 'Esta explicação aparece só na 1ª vez. Ela também está em Como jogar.') + '</p>' +
          '<div class="botoes">' + botao('confirmar-sim', 'FAZER', null, 'opc', 'ok') + '</div>';
        bRot = 'CANCELAR';
        break;
      }
      case 'delatar':
        h = '<h2>Delação Premiada?</h2><p>' + esc(E.explicacao('delatar')) + '</p>' + htmlChips(chipsDe(E.previewAction(s, { type: 'delatar' })), 3) +
          '<div class="botoes">' + botao('delatar-sim', 'Entregar todo mundo', null, 'opc') + '</div>';
        bRot = 'MELHOR NÃO';
        break;
      case 'fim': verificarPaginas(); h = htmlFim(s.fim); bAct = 'novo'; bRot = 'JOGAR DE NOVO'; break;
      case 'pagina': h = htmlPagina(m); break;
      case 'novapagina': h = htmlNovaPagina(m); bRot = 'DEPOIS'; break;
      case 'zerar-diario':
        h = '<h2>Zerar o Diário?</h2><p>Todas as páginas voltam a ficar fechadas, em todas as partidas. Serve para testar.</p><div class="botoes">' + botao('zerar-diario-sim', 'Zerar páginas', null, 'opc') + '</div>';
        bRot = 'CANCELAR';
        break;
      case 'comojogar': h = htmlComoJogar(); bRot = 'ENTENDI'; break;
      case 'minigames': h = htmlMinigames(); bRot = 'VOLTAR'; break;
      case 'minigame': vel.className = 'vel cheio'; h = '<h2>' + esc(GM.data.minigamePorId[m.id].nome) + '</h2><div id="mg-host" class="mg"></div>' +
        (m.modo === 'livre' ? botao('minigames', 'SAIR DO MINIGAME', null, 'opc') : ''); break;
    }
    box.innerHTML = h;
    grande.setAttribute('data-act', bAct); grande.textContent = bRot;
    pintarSprites(box);
    box.scrollTop = 0;
    if (m.tipo === 'minigame' && !m.iniciado) { m.iniciado = true; iniciarMinigame(m); }
  }

  const cabecaJornal = s => '<div class="jn"><span>Mês ' + s.mes + '/' + P.mesMax + '</span><span class="jornal-nome ft">O DIÁRIO DO ROMBO</span><span>R$ 0,50</span></div>';
  const outras = lista => (lista && lista.length ? '<div class="outras">' + lista.map(x => '<p>■ ' + esc(x.texto) + '</p>').join('') + '</div>' : '');

  function htmlFim(fim) {
    const ep = fim.epilogo;
    const secao = (t, l) => l.length ? '<h3>' + t + '</h3><ul>' + l.map(x => '<li><b>' + esc(x.nome) + ':</b> ' + esc(x.frase) + '</li>').join('') + '</ul>' : '';
    const rank = store.get('ranking', []);
    const voce = ui.ultimoFim;
    const tabela = rank.length ? '<h3>Ranking local</h3><table class="ranking">' + rank.map((r, i) =>
      '<tr class="' + (voce && r.t === voce.t ? 'voce' : '') + '"><td>' + (i + 1) + '.</td><td>' + r.pontos.toLocaleString('pt-BR') + '</td><td>' + esc(r.final) + '</td><td>' + esc((D.modoPorId[r.modo] || D.modoPorId[P.modoPadrao]).curto) + '</td><td>' + r.meses + 'm</td></tr>').join('') + '</table>' : '';
    return '<h2 class="fim-titulo ' + (fim.vitoria ? 'fim-vitoria' : 'fim-derrota') + '">' + esc(fim.titulo) + '</h2>' +
      (GM.sprites && GM.sprites.fimHtml ? GM.sprites.fimHtml(fim) : '') +
      '<p>' + esc(fim.texto) + '</p><p class="dica">' + esc(fim.extra) + '</p>' +
      '<p class="pontos">' + fim.pontos.toLocaleString('pt-BR') + ' pontos · ' + fim.meses + ' meses</p><p class="dica">Modo: ' + esc(D.modoPorId[ui.s.modo].nome) + '</p>' +
      secao('Quem caiu com você', ep.caiu) + secao('Quem delatou', ep.delatou) + secao('Quem saiu ganhando', ep.ganhou) +
      (!ep.caiu.length && !ep.delatou.length && !ep.ganhou.length ? '<p class="dica">Ninguém: você fez tudo sozinho. Os advogados agradecem.</p>' : '') +
      '<p class="pontos">Páginas do Diário: ' + ui.diario.length + '/' + DI.PAGINAS_DIARIO.length + '</p>' +
      tabela + '<div class="botoes">' + botao('diario-abrir', 'Abrir Diário') + botao('titulo', 'Voltar ao título') + '</div>';
  }

  // Aviso de página nova: a folha ainda trancada "abrindo" (cadeado balança), com a dica de cada página nova
  function htmlNovaPagina(m) {
    const L = DI.PAGINAS_DIARIO, ps = L.filter(p => m.ids.indexOf(p.id) >= 0), n = ps.length;
    const i = L.indexOf(ps[0]);
    return '<div class="caderno fechada abrindo"><div class="cad-cab ft">' + (n === 1 ? 'Página ' + ps[0].ordem + ' de ' + L.length : n + ' páginas novas') + '</div>' +
      '<div class="cad-trava">' + spriteCanvas('icone_cadeado', 12, 12, 'cadeado') + '</div>' +
      '<h2 class="cad-tit">' + (n === 1 ? 'Página nova no Diário do Rombo' : n + ' páginas novas no Diário do Rombo') + '</h2>' +
      ps.map(p => '<p class="cad-real">' + (n > 1 ? 'Página ' + p.ordem + ': ' : '') + esc(p.dica) + '</p>').join('') + '</div>' +
      '<div class="botoes">' + botao('pagina:' + i, 'VER AGORA', null, 'opc', 'ok') + '</div>';
  }

  // Página do Diário do Rombo: folha de caderno. Bloqueada mostra só o cadeado e a dica (nunca o texto real).
  function htmlPagina(m) {
    const L = DI.PAGINAS_DIARIO, p = L[m.i], aberta = ui.diario.indexOf(p.id) >= 0;
    const num = aberta ? (p.real.match(/R\$ ?[\d.,]+ ?(mi|bi)/) || [])[0] : null;   // número principal do texto
    const corpo = aberta
      ? '<h2 class="cad-tit">' + esc(p.titulo) + '</h2>' + (num ? '<div class="cad-num">' + esc(num) + '</div>' : '') +
        '<div class="cad-real"><b class="ft">NA VIDA REAL...</b><p>' + esc(p.real) + '</p></div>' +
        '<p class="cad-fonte">Fonte: ' + esc(p.fonte) + '</p><span class="carimbo ft">ANOTADO</span>'
      : '<div class="cad-trava">' + spriteCanvas('icone_cadeado', 12, 12, 'cadeado') + '</div><h2 class="cad-tit">???</h2><p class="cad-real">' + esc(p.dica) + '</p>';
    const nav = (d, rot) => { const j = m.i + d, ok = j >= 0 && j < L.length; return botao('pag:' + j, rot, ok ? null : { ok: false, motivo: d < 0 ? 'Primeira página' : 'Última página' }, 'go', 'cad-seta'); };
    return '<div class="caderno' + (aberta ? '' : ' fechada') + '"><div class="cad-cab ft">Página ' + p.ordem + ' de ' + L.length + '</div>' + corpo + '</div>' +
      '<div class="cad-nav">' + nav(-1, '◀') + '<span class="n">' + (m.i + 1) + '/' + L.length + '</span>' + nav(1, '▶') + '</div>' +
      '<p class="dica" style="text-align:center">Abertas: ' + ui.diario.length + '/' + L.length + ' · deslize para virar</p>';
  }

  function htmlComoJogar() {
    const linha = (nome, id) => '<li><b>' + esc(nome) + ':</b> ' + esc(E.explicacao(id)) + '</li>';
    const acoes = '<h3>As ações</h3><p class="dica">Golpes</p><ul>' + D.golpes.map(g => linha(g.nome, g.id)).join('') + '</ul>' +
      '<p class="dica">Proteção</p><ul>' + D.acoes.map(a => linha(a.nome, a.id)).join('') + '</ul>' +
      '<p class="dica">Aliados</p><ul>' + linha('Recrutar', 'recrutar') + linha('Dispensar', 'dispensar') +
      D.aliados.map(a => '<li><b>' + esc(a.nome) + '</b>' + (a.soModo ? ' [só ' + esc(D.modoPorId[a.soModo].nome) + ']' : '') + ' (entrada R$ ' + a.custo + ' mi, mesada ' + a.mesada + '): ' + esc(a.poder) + '</li>').join('') + '</ul>' +
      '<ul>' + linha('Delatar', 'delatar') + '</ul>' +
      D.modos.filter(m => m.regras).map(m => '<h3>' + esc(m.nome) + '</h3><p>' + esc(m.regras) + '</p><ul>' + linha('Não pagar os aliados', 'calote') +
        Object.keys(m.exigeAliados || {}).map(id => '<li><b>' + esc(D.acaoPorId[id].nome) + ':</b> exige ' + esc(E.nomeCom(m.exigeAliados[id], '')) + '.</li>').join('') + '</ul>').join('');
    return '<h2>Como jogar</h2>' + D.comoJogar.map(p => '<p>' + fmtP(p) + '</p>').join('') + acoes +
      '<p class="dica">No computador: Espaço = próximo mês · 1-6 = ações · Esc = opções · M = som · N = música · C = filtro de TV</p>';
  }

  // ---------------- Tutorial (5 passos, só na primeira partida; -1 encerra) ----------------
  const ABA_DO_ALVO = { 'painel-esq': 'golpes', 'painel-dir': 'aliados' };
  function tutorial(passo) {
    document.querySelectorAll('.tutorial-foco').forEach(el => el.classList.remove('tutorial-foco'));
    const box = $('tutorial');
    if (passo < 0 || passo >= D.tutorial.length) {
      box.classList.add('oculto');
      $('stage').classList.remove('com-tutorial');
      if (ui.tutorialPasso >= 0 && passo !== -2) store.set('tutorialVisto', true);   // -2: só esconde
      ui.tutorialPasso = -1;
      return;
    }
    ui.tutorialPasso = passo;
    const p = D.tutorial[passo];
    if (ui.tela === 'jogo') irAba(ABA_DO_ALVO[p.alvo] || 'inicio');
    const alvo = $(p.alvo);
    $('stage').classList.add('com-tutorial');
    if (alvo) {   // rola até o alvo ficar logo abaixo do topo (o balão fica embaixo)
      alvo.classList.add('tutorial-foco');
      const v = ui.pc ? (alvo.closest('.aba') || $('view')) : $('view');   // no computador cada coluna rola sozinha
      v.scrollTop += alvo.getBoundingClientRect().top - v.getBoundingClientRect().top - 16;
    }
    box.innerHTML = '<p><b>' + (passo + 1) + '/' + D.tutorial.length + '</b> ' + esc(fmtP(p.texto)) + '</p><div class="botoes">' +
      botao('tutorial-prox', passo === D.tutorial.length - 1 ? 'COMEÇAR' : 'PRÓXIMO', null, 'btn', 'ok') + botao('tutorial-pular', 'PULAR') + '</div>';
    box.classList.remove('oculto');
  }

  // ---------------- Som e CRT ----------------
  function alternarSom() {
    ui.prefs.som = !ui.prefs.som; store.set('som', ui.prefs.som);
    if (GM.audio && GM.audio.setLigado) GM.audio.setLigado(ui.prefs.som);
    if (ui.tela === 'titulo') renderTitulo();
    toast('Som ' + (ui.prefs.som ? 'ligado' : 'desligado'));
    render();
  }
  function alternarMusica() {
    ui.prefs.musica = !ui.prefs.musica; store.set('musica', ui.prefs.musica);
    if (GM.audio && GM.audio.setMusica) GM.audio.setMusica(ui.prefs.musica);
    toast('Música ' + (ui.prefs.musica ? 'ligada' : 'desligada'));
    render();
  }
  function alternarCrt() {
    ui.prefs.crt = !ui.prefs.crt; store.set('crt', ui.prefs.crt);
    $('stage').classList.toggle('crt', ui.prefs.crt);
    render();
  }

  // ---------------- Teclado (computador) ----------------
  function tecla(ev) {
    if (ev.ctrlKey || ev.altKey || ev.metaKey) return;
    const k = ev.key;
    if (GM.audio && GM.audio.desbloquear) GM.audio.desbloquear();
    const m = ui.modal;
    if (k === 'm' || k === 'M') { alternarSom(); return; }
    if (k === 'n' || k === 'N') { alternarMusica(); return; }
    if (k === 'c' || k === 'C') { alternarCrt(); return; }
    if (m && m.tipo === 'pagina') {
      if (k === 'ArrowLeft') clique('pag:' + (m.i - 1)); else if (k === 'ArrowRight') clique('pag:' + (m.i + 1)); else if (k === 'Escape') clique('fechar');
      return;
    }
    if (ui.tela !== 'jogo') { if (m) { if (k === 'Escape' && m.tipo !== 'minigame') clique('fechar'); return; } if (k === 'Enter' || k === ' ') { ev.preventDefault(); clique('jogar'); } return; }
    if (k === 'Escape' && ui.tutorialPasso >= 0) { tutorial(-1); return; }
    if (k === 'Escape') {
      if (m && (m.tipo === 'alvo' || m.tipo === 'comojogar' || m.tipo === 'delatar' || m.tipo === 'minigames' || m.tipo === 'novapagina')) clique('fechar');
      else if (m && m.tipo === 'jornal') clique('seguir');
      else if (!m) clique('pausa');
      return;
    }
    if (k === ' ') {
      ev.preventDefault();
      if (!m) clique('proximo');
      else if (m.tipo === 'jornal') clique('seguir');
      return;
    }
    if (/^[1-9]$/.test(k)) {
      const i = parseInt(k, 10) - 1;
      if (m && m.tipo === 'evento') { if (ui.s.evento && ui.s.evento.escolhas[i]) clique('escolha:' + i); return; }
      if (m) return;
      const a = D.acoes[i];
      if (a) clique(a.alvo ? 'alvo:' + a.id : 'protecao:' + a.id);
    }
  }

  // ---------------- Início ----------------
  function init() {
    detectarAparelho();
    root.addEventListener('resize', detectarAparelho);
    // ligar/desligar mouse ou girar a tela nem sempre dispara resize
    const mq = root.matchMedia && root.matchMedia(CONSULTA_PC);
    if (mq && mq.addEventListener) mq.addEventListener('change', detectarAparelho);
    aplicarTema();
    if (GM.sprites) GM.sprites.iniciar();
    if (GM.audio) { GM.audio.setMusica(ui.prefs.musica); GM.audio.setLigado(ui.prefs.som); }
    aplicarCenario();
    $('stage').classList.toggle('crt', ui.prefs.crt);
    $('stage').addEventListener('click', ev => {
      const b = ev.target.closest('[data-act]');
      if (!b) return;
      if (GM.audio && GM.audio.desbloquear) GM.audio.desbloquear();
      if (b.classList.contains('off')) { const mt = b.querySelector('.motivo'); toast(mt ? mt.textContent : 'Indisponível'); return; }
      clique(b.getAttribute('data-act'));
    });
    document.addEventListener('keydown', tecla);
    $('plantao').addEventListener('click', esconderPlantao);
    // deslizar para virar a página do Diário
    let x0 = null;
    $('modal-corpo').addEventListener('touchstart', ev => { x0 = ui.modal && ui.modal.tipo === 'pagina' ? ev.touches[0].clientX : null; }, { passive: true });
    $('modal-corpo').addEventListener('touchend', ev => {
      if (x0 == null || !ui.modal || ui.modal.tipo !== 'pagina') return;
      const dx = ev.changedTouches[0].clientX - x0; x0 = null;
      if (Math.abs(dx) > 50) clique('pag:' + (ui.modal.i + (dx < 0 ? 1 : -1)));
    }, { passive: true });
    mostrarTela('titulo');
  }

  Object.assign(ui, { plantao, forcarModo: id => { if (D.modoPorId[id]) ui.modoForcado = id; }, init, novoJogo, clique, render, mostrarTela, toast, store, sincronizar: aposOperar, pularMinigame });
  GM.ui = ui;
})(typeof window !== 'undefined' ? window : globalThis);
