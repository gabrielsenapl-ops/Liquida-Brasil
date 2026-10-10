// main.js - liga tudo: lê a URL (?seed=N, ?debug=1, ?selftest=1) e inicia a interface.
(function (root) {
  const GM = root.GM = root.GM || {};
  const E = GM.engine;
  const $ = id => document.getElementById(id);

  const q = new URLSearchParams(root.location.search);
  const seedUrl = q.has('seed') ? (parseInt(q.get('seed'), 10) >>> 0) : null;
  const main = GM.main = { seedUrl, debug: q.get('debug') === '1', selftest: q.get('selftest') === '1',
    ate: q.has('ate') ? parseInt(q.get('ate'), 10) : null };   // ?selftest=1&ate=N para no mês N (capturas de tela)

  // ---------------- Modo debug ----------------
  function montarDebug() {
    const box = $('debug');
    box.classList.remove('oculto');
    const opts = E.data.eventos.map(ev => '<option value="' + ev.id + '">' + ev.id + '</option>').join('') +
      '<option value="__operacao">operacao (sistema)</option>';
    box.innerHTML = '<b>DEBUG</b> <span id="dbg-seed"></span><br>' +
      '<button data-dbg="caixa">+100 caixa</button><button data-dbg="susp">-20 suspeita</button>' +
      '<button data-dbg="rombo">+10 rombo</button><button data-dbg="pular">pular 6 meses</button><br>' +
      '<select id="dbg-ev">' + opts + '</select><button data-dbg="evento">forçar evento</button>' +
      '<button data-dbg="json">estado JSON</button><pre id="dbg-json"></pre>';
    box.addEventListener('click', ev => {
      const b = ev.target.closest('[data-dbg]');
      const s = GM.ui.s;
      if (!b || !s || s.fim) return;
      const I = E._internal;
      switch (b.getAttribute('data-dbg')) {
        case 'caixa': s.caixa += 100; break;
        case 'susp': s.suspeita = Math.max(0, s.suspeita - 20); break;
        case 'rombo': s.rombo = Math.round((s.rombo + 10) * 10) / 10; break;
        case 'pular':
          for (let i = 0; i < 6 && !s.fim; i++) {
            while (s.evento) E.resolveEvent(s, s.evento.escolhas.length - 1);
            E.advanceMonth(s);
          }
          break;
        case 'evento': {
          const id = $('dbg-ev').value;
          if (s.evento) break;
          if (id === '__operacao') I.dispararOperacao(s);
          else I.dispararEvento(s, E.data.eventoPorId[id]);
          break;
        }
        case 'json': $('dbg-json').textContent = JSON.stringify(s, null, 1); return;
      }
      E._internal.fechar(s);
      GM.ui.sincronizar();
    });
  }
  main.debugRender = function () {
    if (!main.debug) return;
    const s = GM.ui.s;
    if (s) $('dbg-seed').textContent = 'seed ' + s.seed + ' · mês ' + s.mes;
  };

  // ---------------- Selftest: joga uma partida inteira clicando nos botões reais ----------------
  function selftest() {
    const erros = [];
    root.addEventListener('error', ev => erros.push(String(ev.message)));
    const res = { ok: false, final: null, meses: 0, erros };
    const seed = seedUrl != null ? seedUrl : 1;
    main.seedUrl = seed;
    let cliques = 0;
    try {
      const B = GM.bots, bot = B.equilibrado, rng = B.makeRng(seed * 7919 + 13);
      const clicar = sel => {
        const el = document.querySelector(sel);
        if (!el) throw new Error('botão não encontrado: ' + sel);
        el.click(); cliques++;
      };
      // o mesmo laço de GM.bots.jogar, mas clicando
      const acaoPorClique = act => {
        const antes = JSON.stringify(GM.ui.s);
        if (act.type === 'protecao' && (act.id === 'festa' || act.id === 'mimo')) {
          if (act.id === 'mimo' && act.alvo) clicar('[data-act="protecao:mimo:' + act.alvo + '"]');
          else { clicar('[data-act="alvo:' + act.id + '"]'); clicar('[data-act="protecao:' + act.id + ':' + (act.alvo || '-') + '"]'); }
        } else if (act.type === 'protecao') clicar('[data-act="protecao:' + act.id + '"]');
        else if (act.type === 'calote') clicar('[data-act="calote"]');
        else clicar('[data-act="' + act.type + ':' + act.id + '"]');
        if (GM.ui.modal && GM.ui.modal.tipo === 'confirmar') clicar('[data-act="confirmar-sim"]');   // 1ª vez / ação cara: confirma
        return JSON.stringify(GM.ui.s) !== antes;
      };
      clicar('[data-act="jogar"]');
      if (document.querySelector('[data-act="tutorial-pular"]')) clicar('[data-act="tutorial-pular"]');
      const s = GM.ui.s;
      let passos = 0;
      while (!s.fim && passos++ < 5000) {
        if (main.ate && s.mes >= main.ate && !s.evento) { GM.ui.clique('fechar'); break; }
        const m = GM.ui.modal;
        if (m && m.tipo === 'jornal') { clicar('[data-act="seguir"]'); continue; }
        if (m && m.tipo === 'novapagina') { clicar('#btn-fechar-grande'); continue; }   // aviso do Diário: DEPOIS
        if (s.evento) {
          const id = s.evento;
          clicar('[data-act="escolha:' + bot.escolha(s, E, rng) + '"]');
          if (GM.ui.modal && GM.ui.modal.tipo === 'minigame') { GM.ui.pularMinigame(); continue; }   // minigame: nível padrão, como o motor
          if (s.evento === id) clicar('[data-act="escolha:' + (s.evento.escolhas.length - 1) + '"]');
          continue;
        }
        let n = 0;
        while (!s.fim && !s.evento && n++ < 10) {
          const act = bot.acao(s, E, rng);
          if (!act) break;
          if (!acaoPorClique(act)) break;
        }
        if (!s.fim && !s.evento) {
          if (GM.ui.modal && GM.ui.modal.tipo === 'alvo') clicar('[data-act="fechar"]');
          clicar('#btn-proximo');
        }
      }
      if (main.ate && !s.fim) { res.ok = true; res.meses = s.mes; pre(res); return; }
      if (!s.fim) throw new Error('partida não terminou em ' + passos + ' passos');
      // confere com a mesma partida jogada direto no motor (sem tela)
      const ref = B.jogar(E, bot, seed, null, s.modo);
      res.consistente = ref.fim.id === s.fim.id && ref.mes === s.mes && ref.caixa === s.caixa;
      if (!res.consistente) erros.push('partida pela tela difere da partida no motor: ' + ref.fim.id + '/' + ref.mes + ' x ' + s.fim.id + '/' + s.mes);
      if (!document.querySelector('#modal-corpo .fim-titulo')) erros.push('tela de fim não apareceu');
      res.final = s.fim.id; res.meses = s.fim.meses; res.pontos = s.fim.pontos;
      // modos: final de liberaCom libera a Primeira Instância; o ranking guarda o modo
      const st = GM.ui.store, pi = E.data.modoPorId.primeirainstancia;
      if (pi.liberaCom.indexOf(s.fim.id) >= 0 && !st.get('primeiraLiberada', false)) erros.push('final ' + s.fim.id + ' não liberou a Primeira Instância');
      if (!st.get('ranking', []).some(r => r.modo === s.modo)) erros.push('ranking sem o modo da partida');
      res.modo = s.modo;
    } catch (e) {
      erros.push(String(e && e.stack || e));
    }
    res.seed = seed; res.cliques = cliques;
    res.ok = erros.length === 0;
    pre(res);
  }
  function pre(res) {
    const el = $('selftest');
    el.hidden = false;
    el.textContent = JSON.stringify(res);
    el.style.display = main.ate ? 'none' : '';
  }

  function iniciar() {
    GM.ui.init();
    if (q.get('estilo') && GM.sprites && GM.sprites.estilo) GM.sprites.estilo(q.get('estilo'));   // ?estilo=dourado|neon|reparticao (prévia do cenário)
    if (q.get('tema')) GM.ui.clique('tema:' + q.get('tema'));   // ?tema=claro|escuro|auto (capturas de tela)
    // versão de teste (testar-primeira-instancia.html): ?liberar=primeira libera a Primeira Instância de vez e já a escolhe;
    // ?liberar=nao volta a bloquear. Funciona no duplo clique (file://) em qualquer navegador.
    if (q.get('liberar') === 'primeira') { GM.ui.store.set('primeiraLiberada', true); GM.ui.clique('modo:primeirainstancia'); GM.ui.toast('Teste: Primeira Instância liberada.', 4000); }
    if (q.get('liberar') === 'nao') { GM.ui.store.set('primeiraLiberada', false); GM.ui.store.set('modo', 'foro'); GM.ui.mostrarTela('titulo'); GM.ui.toast('Teste: Primeira Instância bloqueada de novo.', 4000); }
    if (q.get('modo')) GM.ui.forcarModo(q.get('modo'));      // ?modo=foro|primeirainstancia (testes; ignora o bloqueio, não salva)
    if (q.get('vis')) GM.ui.clique('vis:' + q.get('vis'));      // ?vis=auto|pc|celular (capturas e smoke.js; fica salvo)
    if (main.debug) montarDebug();
    if (main.selftest) selftest();
    else if (q.get('jogar') === '1') GM.ui.clique('jogar');   // ?jogar=1 pula a abertura
    if (q.get('aba')) GM.ui.clique('aba:' + q.get('aba'));   // ?aba=golpes|aliados|extrato|opcoes (capturas)
    if (q.get('abrir')) GM.ui.clique(q.get('abrir'));          // ?abrir=comojogar|minigames (capturas)
  }
  // PWA: instalável e offline no site publicado (http/https). Em file:// (duplo clique) não se aplica.
  if (root.navigator && 'serviceWorker' in root.navigator && /^https?:$/.test(root.location.protocol) && !main.selftest) {
    root.addEventListener('load', () => { root.navigator.serviceWorker.register('service-worker.js').catch(() => { /* sem PWA: o jogo segue igual */ }); });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', iniciar);
  else iniciar();
})(typeof window !== 'undefined' ? window : globalThis);
