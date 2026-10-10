// engine.js - regras do jogo, puras: sem DOM, sem aleatório global (RNG com semente no estado).
// O estado é um objeto JSON simples; as funções o alteram no lugar e devolvem {ok, motivo}.
(function (root) {
  const GM = root.GM = root.GM || {};
  const D = GM.data || (typeof require === 'function' ? require('./data.js') : null);
  const P = D.params;

  // ---------------- RNG (mulberry32, estado guardado em state.rngState) ----------------
  function rand(s) {
    let t = s.rngState = (s.rngState + 0x6D2B79F5) | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  const randInt = (s, a, b) => a + Math.floor(rand(s) * (b - a + 1));
  const pick = (s, arr) => arr.length ? arr[Math.floor(rand(s) * arr.length)] : null;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const r1 = v => Math.round(v * 10) / 10;
  const fmt = (t, vars) => t.replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] != null ? vars[k] : m));

  // ---------------- Estado ----------------
  // Primeira Instância (modo difícil): as mecânicas dela só rodam com isto verdadeiro; o Foro não muda nada
  const primeira = s => s.modo === 'primeirainstancia';
  // aliado exigido por uma ação: o da própria ação (vale nos dois modos) ou o do modo (exigeAliados)
  function aliadoExigido(s, a) {
    if (a.exigeAliado) return a.exigeAliado;
    const m = D.modoPorId[s.modo];
    return (m && m.exigeAliados && m.exigeAliados[a.id]) || null;
  }
  function precisoDe(id) {
    const al = D.aliadoPorId[id], prep = { o: 'do ', a: 'da ' }[al.artigo] || 'de ';
    return 'Preciso ' + prep + (al.curto || al.nome);
  }

  function newGame(seed, modo) {
    seed = (seed == null ? 1 : seed) >>> 0;
    const s = {
      seed, rngState: seed,
      modo: D.modoPorId[modo] ? modo : P.modoPadrao,   // foro | primeirainstancia (não usa o RNG)
      mes: 1,
      caixa: P.inicio.caixa,
      suspeita: P.inicio.suspeita,
      rombo: P.inicio.rombo,
      golpes: {}, aliados: {},
      blindagem: 0,
      ap: P.acoesPorMes,
      faixa: 0,
      ordem: 0,
      flags: {
        liberdadeUsada: false, anistiaMeses: 0, fieisAte: 0, videoAte: 0, carnavalAte: 0, cdbBonusAte: 0,
        inspecaoTotal: false, vazamentosPendentes: [], operacaoPrimeira: false, vazouMes: 0,
        eventosUsados: {}, ultimosEventos: [], minigames: {}, delatouMes: 0, delatouId: null,
        calotePlanejado: false, caloteAte: 0   // Primeira Instância: não pagar os aliados no próximo fechamento
      },
      fila: [],          // eventos com escolha aguardando
      evento: null,      // evento aguardando escolha do jogador
      manchetes: [],     // manchetes do último mês (para o modal/ticker)
      log: [],
      fim: null,
      luxoAcumulado: 0,  // Diário do Rombo (só leitura): R$ reais gastos em festa, mimo e eventos de gasto
      luxoMaiorUnico: 0  // maior gasto único nessas ações, em R$ reais
    };
    D.golpes.forEach(g => { s.golpes[g.id] = { ativo: false, congeladoAte: 0, ultimoUso: null, meses: 0 }; });   // meses: rendendo (Emenda Elástica)
    D.aliados.forEach(a => {
      s.aliados[a.id] = { ativo: false, status: 'livre', lealdade: a.lealdade, mesadaExtra: 0, blindBonus: 0, ordem: 0, habeasSem: -1 };
    });
    log(s, D.textos.comecar, 'sistema');
    return s;
  }

  function log(s, texto, tipo) {
    s.log.push({ mes: s.mes, texto, tipo: tipo || 'info' });
    if (s.log.length > 200) s.log.shift();
  }
  function manchete(s, texto, tipo) {
    s.manchetes.push({ texto, tipo: tipo || 'manchete' });
    log(s, texto, tipo || 'manchete');
  }

  // ---------------- Consultas ----------------
  const ativos = s => D.aliados.filter(a => s.aliados[a.id].ativo);
  const aliadoAtivo = (s, id) => !!(s.aliados[id] && s.aliados[id].ativo);
  const congelado = (s, id) => s.golpes[id].congeladoAte >= s.mes;
  const golpeRendendo = (s, id) => s.golpes[id].ativo && !congelado(s, id);
  const recorrentesRendendo = s => D.golpes.filter(g => g.tipo === 'recorrente' && g.id !== 'fundofundo' && !g.passivo && golpeRendendo(s, g.id));
  const politicosAtivos = s => ativos(s).filter(a => a.politico);
  const semestre = s => Math.floor((s.mes - 1) / 6);

  function faixaIdx(susp) {
    const v = Math.floor(susp);
    for (let i = D.faixas.length - 1; i >= 0; i--) if (v >= D.faixas[i].min) return i;
    return 0;
  }

  function reducaoBlindagem(s) {
    const max = s.flags.inspecaoTotal ? P.blindagemReducaoMax / 2 : P.blindagemReducaoMax;
    return Math.min(max, s.blindagem / P.blindagemDivisor);
  }

  function recalcBlindagem(s) {
    let b = 0;
    ativos(s).forEach(a => { const st = s.aliados[a.id]; b += (a.blindagem + st.blindBonus) * st.lealdade / 100; });
    if (aliadoAtivo(s, 'partidoelastico') && politicosAtivos(s).length >= P.partidoElasticoMinPoliticos) b += P.partidoElasticoBonus;
    s.blindagem = r1(clamp(b, 0, 100));
    return s.blindagem;
  }

  // bônus de caixa de um golpe (6.1)
  function bonusCaixa(s, g) {
    const B = P.bonusReceita;
    let b = 0;
    if (g.tipo === 'recorrente' && aliadoAtivo(s, 'calculadora')) b += B.calculadora;
    if (g.id === 'previdencia' && aliadoAtivo(s, 'gaveta')) b += B.gavetaPrev;
    if (g.id === 'cdb' && aliadoAtivo(s, 'cofreaberto')) b += B.cofreAbertoCdb;
    if (g.id === 'cdb' && s.flags.cdbBonusAte >= s.mes) b += B.selicCdb;
    return b;
  }
  // renda do golpe; a Emenda Elástica (rendaSobe) cresce com os meses rendendo, até rendaTeto
  const rendaBase = (s, g) => (g.rendaSobe ? Math.min(g.rendaTeto, g.caixa + g.rendaSobe * (s.golpes[g.id].meses || 0)) : g.caixa);
  const rendaGolpe = (s, g) => Math.round(rendaBase(s, g) * (1 + bonusCaixa(s, g)));
  // golpe passivo sem o aliado exigido para na hora (precisa abrir de novo; a Emenda volta à renda inicial)
  function pararPassivos(s) {
    D.golpes.forEach(g => {
      if (!g.passivo || !s.golpes[g.id].ativo || aliadoAtivo(s, g.exigeAliado)) return;
      s.golpes[g.id].ativo = false; s.golpes[g.id].meses = 0;
      log(s, g.nome + ' parou: ' + nomeCom(g.exigeAliado, '') + ' não está mais com você.', 'perigo');
    });
  }
  function mesadaDe(s, id) { return D.aliadoPorId[id].mesada + s.aliados[id].mesadaExtra; }

  // previsão do próximo mês (para HUD e robôs)
  function previsao(s) {
    let receita = 0, rombo = 0, susp = 0;
    D.golpes.forEach(g => {
      if (g.tipo !== 'recorrente' || !s.golpes[g.id].ativo || s.golpes[g.id].congeladoAte >= s.mes + 1) return;
      receita += rendaGolpe(s, g); rombo += g.rombo; susp += g.suspeita;
    });
    let mesadas = 0;
    if (!(primeira(s) && s.flags.calotePlanejado)) ativos(s).forEach(a => { mesadas += mesadaDe(s, a.id); });
    return { receita, mesadas, saldo: receita - mesadas, rombo: r1(rombo), suspeitaPassiva: r1(susp) };
  }

  // ---------------- Suspeita e lealdade ----------------
  // ganho passa pela blindagem; reduções não. tipo 'vazamento' ainda sofre o Jurista Caro e fiéis.
  function addSuspeita(s, n, tipo) {
    if (n > 0) {
      n *= (1 - reducaoBlindagem(s));
      if (tipo === 'vazamento') {
        if (aliadoAtivo(s, 'juristacaro')) n *= P.juristaCaroVazamento;
        if (s.flags.fieisAte >= s.mes) n *= P.fieisVazamento;
      }
    }
    s.suspeita = clamp(s.suspeita + n, 0, 100);
    return n;
  }

  function setLealdade(s, id, v) {
    s.aliados[id].lealdade = clamp(Math.round(v), 0, 100);
  }
  const addLealdade = (s, id, n) => { if (aliadoAtivo(s, id)) setLealdade(s, id, s.aliados[id].lealdade + n); };

  function delata(s, id) {
    const st = s.aliados[id];
    if (!st.ativo) return;
    st.ativo = false; st.status = 'delatou';
    s.flags.delatouMes = s.mes; s.flags.delatouId = id;
    manchete(s, fmt(D.textos.delacaoAliado, { nome: D.aliadoPorId[id].nome }), 'perigo');
    recalcBlindagem(s);
    addSuspeita(s, P.delacaoSuspeita);
  }

  // ---------------- Efeitos (DSL) ----------------
  function congelarGolpe(s, meses) {
    const alvo = pick(s, D.golpes.filter(g => g.tipo === 'recorrente' && s.golpes[g.id].ativo && !congelado(s, g.id)));
    if (!alvo) return null;
    s.golpes[alvo.id].congeladoAte = s.mes + meses;
    log(s, alvo.nome + ' congelado por ' + meses + ' meses.', 'perigo');
    return alvo.id;
  }

  function aplicarOperacao(s) {
    const id = congelarGolpe(s, P.operacaoCongela);
    if (!id) log(s, D.textos.operacaoSemGolpe, 'perigo');
    addSuspeita(s, P.operacaoSuspeita);
    s.flags.ultimaOperacao = s.mes;
  }

  // Diário do Rombo: soma um gasto de luxo (R$ mi do jogo) em R$ reais. Só estatística, não muda o jogo.
  function somarLuxo(s, mi) {
    if (!(mi > 0)) return;
    const real = mi * D.ESCALA / 1000;
    s.luxoAcumulado = (s.luxoAcumulado || 0) + real;
    s.luxoMaiorUnico = Math.max(s.luxoMaiorUnico || 0, real);
  }

  function aplicarEfeitos(s, efeitos, ctx) {
    ctx = ctx || {};
    (efeitos || []).forEach(e => {
      if (e.caixa != null) {
        const antes = s.caixa;
        s.caixa = Math.max(0, Math.round(s.caixa + e.caixa));
        if (ctx.tipo === D.diarioLuxoEvento) somarLuxo(s, antes - s.caixa);
      }
      if (e.suspeita != null) addSuspeita(s, e.suspeita, ctx.tipo);
      if (e.rombo != null) s.rombo = r1(s.rombo + e.rombo);
      if (e.blindagem != null) { const a = pick(s, ativos(s)); if (a) s.aliados[a.id].blindBonus += e.blindagem; }
      if (e.blindagemAlvo != null && aliadoAtivo(s, ctx.alvo)) s.aliados[ctx.alvo].blindBonus += e.blindagemAlvo;
      if (e.lealdadeTodos != null) ativos(s).forEach(a => addLealdade(s, a.id, e.lealdadeTodos));
      if (e.lealdadeAliado != null) { const a = pick(s, ativos(s)); if (a) addLealdade(s, a.id, e.lealdadeAliado); }
      if (e.lealdadeAlvo != null && ctx.alvo) addLealdade(s, ctx.alvo, e.lealdadeAlvo);
      if (e.delataAlvo && ctx.alvo) delata(s, ctx.alvo);
      if (e.lealdadeDe != null) addLealdade(s, e.lealdadeDe.id, e.lealdadeDe.n);
      if (e.mesadaExtraAlvo != null && aliadoAtivo(s, ctx.alvo)) {
        s.aliados[ctx.alvo].mesadaExtra += Math.max(1, Math.round(D.aliadoPorId[ctx.alvo].mesada * e.mesadaExtraAlvo));
      }
      if (e.congelarGolpe != null) congelarGolpe(s, e.congelarGolpe);
      if (e.pendente != null) s.flags.vazamentosPendentes.push({ mes: s.mes + e.pendente.em, suspeita: e.pendente.suspeita, texto: e.pendente.texto });
      if (e.flag != null) s.flags[e.flag] = s.mes + (e.ate || 0);
      if (e.inspecaoTotal) s.flags.inspecaoTotal = true;
      if (e.operacao) aplicarOperacao(s);
      if (e.cancelarOperacao) {
        s.aliados[e.cancelarOperacao].habeasSem = semestre(s);
        log(s, D.textos.operacaoCancelada, 'bom');
      }
      if (e.chance != null && rand(s) < e.chance) {
        if (e.texto) manchete(s, e.texto, 'perigo');
        aplicarEfeitos(s, e.entao, ctx);
      }
    });
    recalcBlindagem(s);
  }

  // ---------------- Eventos ----------------
  function condOk(s, ev) {
    const c = ev.cond || {};
    if (c.uma && s.flags.eventosUsados[ev.id]) return false;
    if (c.modo != null && s.modo !== c.modo) return false;
    if (c.minAliados != null && ativos(s).length < c.minAliados) return false;
    if (c.aliado != null) {
      const ids = Array.isArray(c.aliado) ? c.aliado : [c.aliado];
      if (!ids.some(id => aliadoAtivo(s, id))) return false;
    }
    if (c.minFaixa != null && faixaIdx(s.suspeita) < c.minFaixa) return false;
    if (c.minSuspeita != null && s.suspeita < c.minSuspeita) return false;
    if (c.minRombo != null && s.rombo < c.minRombo) return false;
    if (c.minCaixa != null && s.caixa < c.minCaixa) return false;
    if (c.golpe != null && !s.golpes[c.golpe].ativo) return false;
    if (c.usouGolpe != null && s.golpes[c.usouGolpe].ultimoUso == null) return false;
    if (c.mesMod != null && s.mes % c.mesMod[0] !== c.mesMod[1]) return false;
    if (c.minPoliticos != null && politicosAtivos(s).length < c.minPoliticos) return false;
    if (c.alvoLealdadeMax != null && !ativos(s).some(a => s.aliados[a.id].lealdade < c.alvoLealdadeMax)) return false;
    return true;
  }

  function escolherAlvo(s, ev) {
    if (!ev.alvo) return null;
    let cands = ativos(s);
    if (ev.alvo === 'politico') cands = cands.filter(a => a.politico);
    else if (ev.alvo === 'fraco') cands = cands.filter(a => s.aliados[a.id].lealdade < ev.cond.alvoLealdadeMax);
    else if (Array.isArray(ev.alvo)) cands = cands.filter(a => ev.alvo.indexOf(a.id) >= 0);
    else if (ev.alvo !== 'aleatorio') cands = cands.filter(a => a.id === ev.alvo);
    const a = pick(s, cands);
    return a ? a.id : null;
  }

  // entre variantes, prefere a que não saiu nos últimos meses e, dentro dela, a menos usada na partida
  function menosVisto(s, lista) {
    const rec = s.flags.ultimosEventos, usados = id => s.flags.eventosUsados[id] || 0;
    const frescos = lista.filter(ev => rec.indexOf(ev.id) < 0);
    const pool = frescos.length ? frescos : lista;
    const min = Math.min.apply(null, pool.map(ev => usados(ev.id)));
    return pick(s, pool.filter(ev => usados(ev.id) === min));
  }

  function sortearEvento(s) {
    const eleg = D.eventos.filter(ev => ev.tipo !== 'propina' && condOk(s, ev));   // propina tem sorteio próprio
    if (!eleg.length) return null;
    // eventos com chance forçada (ex.: Príncipe do Patriotismo pede dinheiro). As variantes do mesmo grupo
    // dividem um único sorteio e sai a menos vista, para o texto não se repetir em seguida.
    const grupos = {};
    for (const ev of eleg) if (ev.forcaChance) (grupos[ev.grupo || ev.id] = grupos[ev.grupo || ev.id] || []).push(ev);
    for (const g in grupos) if (rand(s) < grupos[g][0].forcaChance) return menosVisto(s, grupos[g]);
    // evita repetir eventos recentes, se houver alternativa
    const recentes = s.flags.ultimosEventos;
    const frescos = eleg.filter(ev => recentes.indexOf(ev.id) < 0);
    const pool = frescos.length ? frescos : eleg;
    // sorteia o tipo pelo peso, depois o evento dentro do tipo
    const fx = faixaIdx(s.suspeita);
    const tipos = {};
    pool.forEach(ev => { (tipos[ev.tipo] = tipos[ev.tipo] || []).push(ev); });
    const nomes = Object.keys(tipos);
    const pesos = nomes.map(t => {
      let p = P.pesoTipo[t] || 1;
      if (t === 'vazamento') p *= 1 + P.pesoVazamentoPorFaixa * fx;
      return p;
    });
    let r = rand(s) * pesos.reduce((a, b) => a + b, 0);
    let tipo = nomes[nomes.length - 1];
    for (let i = 0; i < nomes.length; i++) { r -= pesos[i]; if (r < 0) { tipo = nomes[i]; break; } }
    const lista = tipos[tipo];
    // na faixa do Repórter, reajuste tem peso dobrado dentro do tipo "aliado"
    const pesosEv = lista.map(ev => (ev.id === 'reajuste' && fx === 1 ? 2 : 1));
    let r2 = rand(s) * pesosEv.reduce((a, b) => a + b, 0);
    for (let i = 0; i < lista.length; i++) { r2 -= pesosEv[i]; if (r2 < 0) return lista[i]; }
    return lista[lista.length - 1];
  }

  // Dispara um evento: sem escolha aplica já; com escolha vai para a fila.
  function dispararEvento(s, ev) {
    const alvo = escolherAlvo(s, ev);
    if (ev.alvo && !alvo) return;
    const texto = fmt(ev.manchete, { alvo: alvo ? D.aliadoPorId[alvo].nome : '' });
    s.flags.eventosUsados[ev.id] = (s.flags.eventosUsados[ev.id] || 0) + 1;
    s.flags.ultimosEventos.push(ev.id);
    while (s.flags.ultimosEventos.length > P.semRepetirMeses) s.flags.ultimosEventos.shift();
    if (ev.escolhas) {
      s.fila.push({ id: ev.id, tipo: ev.tipo, estilo: ev.estilo || null, texto, alvo, escolhas: ev.escolhas.map(c => ({ rotulo: c.rotulo, custo: c.custo || 0, efeitos: c.efeitos })) });
    } else {
      manchete(s, texto, ev.tipo === 'sorte' ? 'bom' : 'manchete');
      aplicarEfeitos(s, ev.efeitos, { alvo, tipo: ev.tipo });
    }
  }

  function habeasDisponiveis(s) {
    return ['tofu', 'inquerito'].filter(id => aliadoAtivo(s, id) && s.aliados[id].habeasSem !== semestre(s));
  }

  function dispararOperacao(s) {
    const hab = habeasDisponiveis(s);
    if (!hab.length) {
      manchete(s, D.textos.operacao, 'perigo');
      aplicarOperacao(s);
      return;
    }
    const escolhas = hab.map(id => ({ rotulo: 'Acionar habeas (' + D.aliadoPorId[id].nome + ')', custo: 0, efeitos: [{ cancelarOperacao: id }] }));
    escolhas.push({ rotulo: 'Aceitar a operação', custo: 0, efeitos: [{ operacao: true }] });
    s.fila.push({ id: 'operacao', tipo: 'sistema', texto: D.textos.operacao, alvo: null, escolhas });
  }

  function escolhaStatus(s, c) {
    if (c.custo > s.caixa) return { ok: false, motivo: 'Falta caixa' };
    return { ok: true, motivo: '' };
  }

  // ---------------- Minigames: 1 vez por partida, por gatilho ----------------
  // Oferece o primeiro minigame cujo gatilho vale neste mês. O resultado (nível 0..3) vem da UI.
  function motivoMinigame(s, g) {
    if (g.operacao && s.flags.ultimaOperacao != null && s.flags.ultimaOperacao >= s.mes - 1) return { motivo: 'operacao' };
    if (g.lealdadeMax != null) {
      const f = ativos(s).filter(a => s.aliados[a.id].lealdade < g.lealdadeMax).sort((a, b) => s.aliados[a.id].lealdade - s.aliados[b.id].lealdade)[0];
      if (f) return { motivo: 'lealdade', alvo: f.id };
    }
    if (g.vazou != null && s.flags.vazouMes === s.mes && s.suspeita >= g.vazou) return { motivo: 'vazamento' };
    if (g.delacao && s.flags.delatouMes === s.mes && s.flags.delatouId) return { motivo: 'delacao', alvo: s.flags.delatouId };
    if (g.minSuspeita != null && s.suspeita >= g.minSuspeita) return { motivo: 'suspeita' };
    if (g.minRombo != null && s.rombo >= g.minRombo) return { motivo: 'rombo' };
    if (g.minCaixa != null && s.caixa >= g.minCaixa) return { motivo: 'caixa' };
    return null;
  }

  function oferecerMinigame(s) {
    for (const mg of (D.minigames || [])) {
      if (s.flags.minigames[mg.id]) continue;
      const m = motivoMinigame(s, mg.gatilho);
      if (!m) continue;
      const nome = m.alvo ? D.aliadoPorId[m.alvo].nome : '';
      const texto = fmt(mg.textos[m.motivo], { nome });
      s.flags.minigames[mg.id] = { estado: 'oferecido', motivo: m.motivo };
      s.fila.push({ id: 'mg_' + mg.id, tipo: 'minigame', minigame: mg.id, estilo: null, texto, alvo: m.motivo === 'lealdade' ? m.alvo : null,
        escolhas: [ { rotulo: 'Jogar: ' + mg.nome, custo: 0, efeitos: [] }, { rotulo: 'Deixar do jeito que está', custo: 0, efeitos: [] } ] });
      return;
    }
  }

  function resolverMinigame(s, idx, nivel) {
    const ev = s.evento, mg = D.minigamePorId[ev.minigame], reg = s.flags.minigames[mg.id];
    s.evento = null;
    log(s, ev.texto, 'perigo');
    if (idx !== 0) {
      reg.estado = 'recusado';
      log(s, '→ Deixou as provas onde estavam.', 'escolha');
    } else {
      const n = nivel == null ? mg.nivelPadrao : Math.max(0, Math.min(mg.niveis.length - 1, nivel | 0));
      const nv = mg.niveis[n];
      reg.estado = 'jogado'; reg.nivel = n;
      log(s, '→ ' + mg.nome + ': ' + nv.nome + '.', 'escolha');
      manchete(s, nv.texto, n === 0 ? 'perigo' : 'bom');
      aplicarEfeitos(s, nv.efeitos, { alvo: ev.alvo, tipo: 'minigame' });
    }
    fechar(s);
    return { ok: true };
  }

  function resolveEvent(s, idx, nivel) {
    const ev = s.evento;
    if (!ev) return { ok: false, motivo: 'Nenhum evento' };
    if (ev.tipo === 'minigame') return resolverMinigame(s, idx, nivel);
    const c = ev.escolhas[idx];
    if (!c) return { ok: false, motivo: 'Escolha inválida' };
    const st = escolhaStatus(s, c);
    if (!st.ok) return st;
    s.caixa -= c.custo;
    if (ev.tipo === D.diarioLuxoEvento) somarLuxo(s, c.custo);
    log(s, ev.texto, ev.tipo === 'sistema' ? 'perigo' : 'manchete');
    log(s, '→ ' + c.rotulo, 'escolha');
    aplicarEfeitos(s, c.efeitos, { alvo: ev.alvo, tipo: ev.tipo });
    s.evento = null;
    fechar(s);
    return { ok: true };
  }

  // depois de qualquer mudança: blindagem, faixa, fim e próximo evento da fila
  function fechar(s) {
    pararPassivos(s);
    recalcBlindagem(s);
    atualizarFaixa(s);
    checkEnd(s);
    if (s.fim) { s.evento = null; s.fila = []; return; }
    if (!s.evento && s.fila.length) s.evento = s.fila.shift();
  }

  function atualizarFaixa(s) {
    const f = Math.min(faixaIdx(s.suspeita), 3);
    if (f !== s.faixa) {
      log(s, fmt(f > s.faixa ? D.textos.faixaSobe : D.textos.faixaDesce, { nome: D.faixas[f].nome }), f > s.faixa ? 'perigo' : 'bom');
      s.faixa = f;
    }
  }

  // ---------------- Mês ----------------
  function advanceMonth(s) {
    if (s.fim) return { ok: false, motivo: 'Fim de jogo' };
    if (s.evento) return { ok: false, motivo: 'Resolva o evento' };
    s.manchetes = [];
    s.mes += 1;
    s.ap = P.acoesPorMes;
    if (s.mes > P.mesMax) { checkEnd(s); return { ok: true }; }

    // 2. receitas
    let passiva = 0;
    D.golpes.forEach(g => {
      if (g.tipo !== 'recorrente' || !golpeRendendo(s, g.id)) return;
      s.caixa += rendaGolpe(s, g);
      s.rombo = r1(s.rombo + g.rombo);
      passiva += g.suspeita;
      if (g.rendaSobe) s.golpes[g.id].meses += 1;
    });

    // 3. mesadas, na ordem de recrutamento (Primeira Instância: o jogador pode ter decidido não pagar ninguém)
    if (primeira(s) && s.flags.calotePlanejado && ativos(s).length) {
      s.flags.caloteAte = s.mes + P.caloteMeses - 1;
      ativos(s).forEach(a => addLealdade(s, a.id, P.caloteLealdade));
      manchete(s, D.textos.calote, 'perigo');
    } else ativos(s).sort((a, b) => s.aliados[a.id].ordem - s.aliados[b.id].ordem).forEach(a => {
      const m = mesadaDe(s, a.id);
      if (s.caixa >= m) s.caixa -= m;
      else {
        s.caixa = 0;
        addLealdade(s, a.id, P.mesadaNaoPaga);
        log(s, fmt(D.textos.mesadaAtrasada, { nome: a.nome, deNome: nomeCom(a, 'de') }), 'perigo');
      }
    });

    // 4. suspeita passiva (decaimento aplicado no fim, se não houve vazamento)
    const heat = 1 + s.rombo / P.heatDivisor;
    const insp = s.flags.inspecaoTotal ? P.inspecaoMult : 1;
    const fundo = golpeRendendo(s, 'fundofundo') ? P.fundoMult : 1;
    addSuspeita(s, passiva * heat * insp * fundo);

    // 5. lealdade: deriva e delação
    ativos(s).forEach(a => {
      addLealdade(s, a.id, P.lealdadeDeriva + (s.suspeita >= P.faixaAlta ? P.lealdadeDerivaAlta : 0));
    });
    s.flags.calotePlanejado = false;
    recalcBlindagem(s);
    const calote = primeira(s) && s.flags.caloteAte >= s.mes;   // calote recente: delação mais fácil
    const limDel = P.delacaoLimite + (calote ? P.caloteDelacaoLimite : 0);
    const chDel = P.delacaoChance + (calote ? P.caloteDelacaoChance : 0);
    ativos(s).forEach(a => {
      const l = s.aliados[a.id].lealdade;
      if (l <= 0 || (l < limDel && rand(s) < chDel)) delata(s, a.id);
    });

    // 6. vazamentos pendentes
    s.flags.vazamentosPendentes = s.flags.vazamentosPendentes.filter(v => {
      if (v.mes > s.mes) return true;
      manchete(s, v.texto, 'perigo');
      addSuspeita(s, v.suspeita, 'vazamento');
      s.flags.vazouMes = s.mes;
      return false;
    });

    // 7. efeitos de faixa
    const fx = faixaIdx(s.suspeita);
    if (fx === 1 && s.flags.carnavalAte < s.mes && rand(s) < P.vazamentoFaixaChance) {
      manchete(s, pick(s, D.vazamentosFaixa), 'perigo');
      addSuspeita(s, P.vazamentoFaixaSuspeita, 'vazamento');
      s.flags.vazouMes = s.mes;
    }
    if (fx >= 2 && fx <= 3) {
      let ch = fx === 3 ? P.operacaoChanceHeli : P.operacaoChance;
      if (!s.flags.operacaoPrimeira) ch = 1;
      if (s.flags.videoAte >= s.mes) ch *= P.videoOperacao;
      if (aliadoAtivo(s, 'barrapesada') && s.suspeita <= P.barraPesadaLimite) ch *= P.barraPesadaOperacao;
      if (rand(s) < ch) { s.flags.operacaoPrimeira = true; dispararOperacao(s); }
    }
    if (fx === 3) {
      ativos(s).forEach(a => {
        if (s.aliados[a.id].lealdade < P.heliDelacaoLealdade && rand(s) < P.heliDelacaoChance) delata(s, a.id);
      });
    }
    if (!s.flags.inspecaoTotal && s.rombo >= P.inspecaoTotalRombo) {
      s.flags.inspecaoTotal = true;
      manchete(s, D.textos.inspecaoTotal, 'perigo');
    }

    // decaimento natural ("ciclo de notícia")
    if (s.flags.vazouMes !== s.mes) s.suspeita = clamp(s.suspeita - P.decaimento, 0, 100);

    // 7b. minigame por gatilho (1 vez por partida)
    oferecerMinigame(s);

    // 8. evento do mês
    if (rand(s) < P.chanceEvento) {
      const ev = sortearEvento(s);
      if (ev) dispararEvento(s, ev);
    }
    // 8b. Primeira Instância: pedido de propina por mensagem, além do evento do mês
    if (primeira(s) && rand(s) < P.propinaChance) {
      const props = D.eventos.filter(e => e.tipo === 'propina' && condOk(s, e));
      const ev = props.length ? menosVisto(s, props) : null;
      if (ev) dispararEvento(s, ev);
    }

    // 9. blindagem, anistia, fim
    recalcBlindagem(s);
    s.flags.anistiaMeses = s.blindagem >= P.anistiaBlindagem ? s.flags.anistiaMeses + 1 : 0;
    fechar(s);
    return { ok: true };
  }

  // ---------------- Ações do jogador ----------------
  // Lista todas as ações possíveis com {ok, motivo}; a UI usa o motivo nos botões.
  function statusGeral(s, precisaAp) {
    if (s.fim) return 'Fim de jogo';
    if (s.evento) return 'Resolva o evento';
    if (precisaAp && s.ap <= 0) return 'Sem ações';
    return '';
  }

  function custoAcao(s, a) {
    return { min: a.custoMin, max: a.custoMax };
  }

  function actionStatus(s, act) {
    const nao = motivo => ({ ok: false, motivo });
    switch (act.type) {
      case 'abrir': {
        const g = D.golpePorId[act.id];
        if (!g || g.tipo !== 'recorrente') return nao('Golpe inválido');
        if (s.golpes[g.id].ativo) return nao('Já ativo');
        if (g.soModo && g.soModo !== s.modo) return nao('Só na ' + D.modoPorId[g.soModo].nome);
        const m = statusGeral(s, true); if (m) return nao(m);
        if (g.exigeAliado && !aliadoAtivo(s, g.exigeAliado)) return nao('Exige ' + nomeCom(g.exigeAliado, ''));
        if (g.exigeRecorrentes && recorrentesRendendo(s).length < g.exigeRecorrentes) return nao('Exige ' + g.exigeRecorrentes + ' golpes rendendo');
        if (s.caixa < g.custo) return nao('Falta caixa');
        return { ok: true, motivo: '', custo: g.custo };
      }
      case 'executar': {
        const g = D.golpePorId[act.id];
        if (!g || g.tipo !== 'unica') return nao('Golpe inválido');
        const m = statusGeral(s, true); if (m) return nao(m);
        if (!aliadoAtivo(s, g.exigeAliado)) return nao('Exige ' + nomeCom(g.exigeAliado, ''));
        const u = s.golpes[g.id].ultimoUso;
        if (u != null && s.mes - u < g.recarga) return nao('Recarga: ' + (g.recarga - (s.mes - u)) + ' meses');
        return { ok: true, motivo: '' };
      }
      case 'recrutar': {
        const a = D.aliadoPorId[act.id];
        if (!a) return nao('Aliado inválido');
        const st = s.aliados[a.id];
        if (st.ativo) return nao('Já recrutado');
        if (st.status === 'delatou') return nao('Delatou você');
        if (a.soModo && a.soModo !== s.modo) return nao('Só na ' + D.modoPorId[a.soModo].nome);
        const m = statusGeral(s, true); if (m) return nao(m);
        if (s.caixa < a.custo) return nao('Falta caixa');
        return { ok: true, motivo: '', custo: a.custo };
      }
      case 'dispensar': {
        if (!aliadoAtivo(s, act.id)) return nao('Não está ativo');
        const m = statusGeral(s, false); if (m) return nao(m);
        return { ok: true, motivo: '' };
      }
      case 'protecao': {
        const a = D.acaoPorId[act.id];
        if (!a) return nao('Ação inválida');
        const m = statusGeral(s, true); if (m) return nao(m);
        const req = aliadoExigido(s, a);
        if (req && !aliadoAtivo(s, req)) return nao(a.exigeAliado && a.exigeTexto ? a.exigeTexto : precisoDe(req));
        const c = custoAcao(s, a);
        if (s.caixa < c.min) return nao('Falta caixa');
        if (a.alvo === 'obrigatorio') {
          if (!ativos(s).length) return nao('Sem aliados');
          if (act.alvo != null && !aliadoAtivo(s, act.alvo)) return nao('Aliado inválido');
          if (act.alvo != null && s.aliados[act.alvo].lealdade >= 100) return nao('Lealdade no máximo');
        }
        if (a.alvo === 'opcional' && act.alvo != null && !aliadoAtivo(s, act.alvo)) return nao('Aliado inválido');
        return { ok: true, motivo: '', custoMin: c.min, custoMax: c.max };
      }
      case 'calote': {
        if (!primeira(s)) return nao('Só na Primeira Instância');
        const m = statusGeral(s, false); if (m) return nao(m);
        if (!ativos(s).length) return nao('Sem aliados');
        return { ok: true, motivo: '' };
      }
      case 'delatar': {
        const m = statusGeral(s, false); if (m) return nao(m);
        if (faixaIdx(s.suspeita) < 3) return nao('Só com o Helicóptero (suspeita 86+)');
        return { ok: true, motivo: '' };
      }
      default: return nao('Ação desconhecida');
    }
  }

  // todas as ações imagináveis neste estado (para a UI e os robôs)
  function listActions(s) {
    const out = [];
    D.golpes.forEach(g => out.push({ type: g.tipo === 'recorrente' ? 'abrir' : 'executar', id: g.id }));
    D.aliados.forEach(a => {
      out.push({ type: s.aliados[a.id].ativo ? 'dispensar' : 'recrutar', id: a.id });
    });
    D.acoes.forEach(a => {
      if (a.alvo) ativos(s).forEach(al => out.push({ type: 'protecao', id: a.id, alvo: al.id }));
      if (a.alvo !== 'obrigatorio') out.push({ type: 'protecao', id: a.id });
    });
    if (primeira(s)) out.push({ type: 'calote' });
    out.push({ type: 'delatar' });
    return out.map(act => Object.assign({ action: act }, actionStatus(s, act)));
  }

  function getAvailableActions(s) {
    return listActions(s).filter(x => x.ok).map(x => x.action);
  }

  function doAction(s, act) {
    const st = actionStatus(s, act);
    if (!st.ok) return st;
    switch (act.type) {
      case 'abrir': {
        const g = D.golpePorId[act.id];
        s.caixa -= g.custo;
        s.golpes[g.id].ativo = true;
        s.ap -= 1;
        log(s, 'Abriu: ' + g.nome + ' (R$ ' + g.custo + ' mi).', 'acao');
        break;
      }
      case 'executar': {
        const g = D.golpePorId[act.id];
        const ganho = rendaGolpe(s, g);
        s.caixa += ganho;
        s.rombo = r1(s.rombo + g.rombo);
        s.golpes[g.id].ultimoUso = s.mes;
        s.ap -= 1;
        log(s, 'Executou: ' + g.nome + ' (+R$ ' + ganho + ' mi, rombo +' + g.rombo + ' bi).', 'acao');
        addSuspeita(s, g.suspeita);
        break;
      }
      case 'recrutar': {
        const a = D.aliadoPorId[act.id];
        const st2 = s.aliados[a.id];
        s.caixa -= a.custo;
        st2.ativo = true; st2.status = 'ativo'; st2.lealdade = a.lealdade; st2.mesadaExtra = 0; st2.ordem = ++s.ordem;
        s.ap -= 1;
        log(s, 'Recrutou: ' + a.nome + '.', 'acao');
        break;
      }
      case 'dispensar': {
        const a = D.aliadoPorId[act.id];
        s.aliados[a.id].ativo = false; s.aliados[a.id].status = 'dispensado';
        log(s, 'Dispensou: ' + a.nome + '. Ele promete "não guardar rancor".', 'acao');
        recalcBlindagem(s);
        addSuspeita(s, P.dispensaSuspeita);
        break;
      }
      case 'protecao': {
        const a = D.acaoPorId[act.id];
        const c = custoAcao(s, a);
        const custo = Math.min(s.caixa, randInt(s, c.min, c.max));
        s.caixa -= custo;
        s.ap -= 1;
        if (D.diarioLuxo.indexOf(a.id) >= 0) somarLuxo(s, custo);   // estatística do Diário
        let alvo = act.alvo;
        let txt = a.nome + ' (R$ ' + custo + ' mi)';
        if (alvo != null) txt += ' ' + nomeCom(alvo, 'para');
        log(s, txt + '.', 'acao');
        let red = a.suspeita || 0;
        if (a.id === 'filme' && aliadoAtivo(s, 'principe')) red = P.principeFilme;
        if (red) addSuspeita(s, red);
        if (a.lealdade && alvo != null) addLealdade(s, alvo, a.lealdade);
        if (a.flag) s.flags[a.flag] = s.mes + a.meses;
        const col = a.colateral;
        if (col && rand(s) < col.chance) {
          if (col.emMin != null) {
            s.flags.vazamentosPendentes.push({ mes: s.mes + randInt(s, col.emMin, col.emMax), suspeita: col.suspeita, texto: col.texto });
          } else {
            manchete(s, col.texto, 'perigo');
            addSuspeita(s, col.suspeita);
          }
        }
        break;
      }
      case 'calote': {   // liga/desliga: vale no próximo fechamento de mês; não gasta ação
        s.flags.calotePlanejado = !s.flags.calotePlanejado;
        log(s, s.flags.calotePlanejado ? 'Decidiu não pagar os aliados neste mês.' : 'Voltou atrás: as mesadas serão pagas.', 'acao');
        break;
      }
      case 'delatar': {
        log(s, 'Você procurou o Ministério Público com uma pasta de 900 páginas.', 'perigo');
        s.fim = montarFim(s, 'delacao');
        break;
      }
    }
    fechar(s);
    return { ok: true };
  }

  // ---------------- Previsão de uma ação (3.2) ----------------
  // O que a ação faz AGORA, sem sortear nada e sem mexer em s: caixa (faixa min..max), suspeita, rombo,
  // blindagem e lealdade; o que passa a acontecer todo mês; e a chance de efeito colateral (que não é prevista).
  function previewAction(s, act) {
    const st = actionStatus(s, act);
    const p = { ok: st.ok, motivo: st.motivo || '', caixa: { min: 0, max: 0 }, suspeita: 0, rombo: 0, blindagem: 0, lealdade: null, porMes: null, chance: null, fim: null };
    const copia = () => JSON.parse(JSON.stringify(s));
    const deltaSusp = (base, n) => {   // mesma conta de addSuspeita (ganho passa pela blindagem)
      if (n > 0) n *= (1 - reducaoBlindagem(base));
      return clamp(base.suspeita + n, 0, 100) - base.suspeita;
    };
    switch (act.type) {
      case 'abrir': {
        const g = D.golpePorId[act.id]; if (!g) break;
        p.caixa = { min: -g.custo, max: -g.custo };
        p.porMes = { caixa: rendaGolpe(s, g), rombo: g.rombo, suspeita: g.suspeita, mesada: 0, multSuspeita: g.id === 'fundofundo' ? P.fundoMult : null };
        break;
      }
      case 'executar': {
        const g = D.golpePorId[act.id]; if (!g) break;
        const ganho = rendaGolpe(s, g);
        p.caixa = { min: ganho, max: ganho };
        p.rombo = r1(s.rombo + g.rombo) - s.rombo;
        p.suspeita = deltaSusp(s, g.suspeita);
        break;
      }
      case 'recrutar': {
        const a = D.aliadoPorId[act.id]; if (!a) break;
        const c = copia(), st2 = c.aliados[a.id];
        st2.ativo = true; st2.status = 'ativo'; st2.lealdade = a.lealdade; st2.mesadaExtra = 0;
        p.caixa = { min: -a.custo, max: -a.custo };
        p.blindagem = recalcBlindagem(c) - s.blindagem;
        p.porMes = { caixa: 0, rombo: 0, suspeita: 0, mesada: a.mesada };
        break;
      }
      case 'dispensar': {
        if (!s.aliados[act.id]) break;
        const c = copia();
        c.aliados[act.id].ativo = false; c.aliados[act.id].status = 'dispensado';
        p.blindagem = recalcBlindagem(c) - s.blindagem;
        p.suspeita = deltaSusp(c, P.dispensaSuspeita);
        p.porMes = { caixa: 0, rombo: 0, suspeita: 0, mesada: -mesadaDe(s, act.id) };
        break;
      }
      case 'protecao': {
        const a = D.acaoPorId[act.id]; if (!a) break;
        const c = custoAcao(s, a);
        p.caixa = { min: -Math.min(s.caixa, c.max), max: -Math.min(s.caixa, c.min) };
        let red = a.suspeita || 0;
        if (a.id === 'filme' && aliadoAtivo(s, 'principe')) red = P.principeFilme;
        p.suspeita = red ? deltaSusp(s, red) : 0;
        if (a.lealdade && act.alvo != null && aliadoAtivo(s, act.alvo)) {
          const cp = copia(), antes = s.aliados[act.alvo].lealdade;
          setLealdade(cp, act.alvo, antes + a.lealdade);
          p.lealdade = { id: act.alvo, n: cp.aliados[act.alvo].lealdade - antes };
          p.blindagem = recalcBlindagem(cp) - s.blindagem;
        }
        if (a.colateral) p.chance = { pct: Math.round(a.colateral.chance * 100), suspeita: a.colateral.suspeita, depois: a.colateral.emMin != null };
        break;
      }
      case 'delatar': p.fim = 'delacao'; break;
    }
    p.blindagem = r1(p.blindagem);
    return p;
  }

  // Texto de explicação de um golpe, ação, 'recrutar', 'dispensar' ou 'delatar' (D.explicacoes),
  // com os números lidos dos próprios dados: nunca fica desatualizado se o balanceamento mudar.
  function explicacao(id) {
    const t = D.explicacoes[id];
    if (!t) return '';
    const ent = D.golpePorId[id] || D.acaoPorId[id] || {};
    const col = ent.colateral || {};
    const vars = Object.assign({}, P, ent, { delacaoLimiteCalote: P.delacaoLimite + P.caloteDelacaoLimite, chancePct: col.chance != null ? Math.round(col.chance * 100) : null, colSuspeita: col.suspeita });
    Object.keys(vars).forEach(k => { if (typeof vars[k] === 'number') vars[k] = String(vars[k]).replace('.', ','); });
    return fmt(t, vars);
  }

  // ---------------- Fim ----------------
  function checkEnd(s) {
    if (s.fim) return s.fim;
    // (1) Guarulhos / Preso (com a soltura possível uma vez)
    if (s.suspeita >= 100) {
      const t = s.aliados.tofu;
      if (!s.flags.liberdadeUsada && t.ativo && t.lealdade >= P.solturaLealdade) {
        s.flags.liberdadeUsada = true;
        s.suspeita = P.solturaSuspeita;
        s.caixa = Math.round(s.caixa * (1 - P.solturaCaixaPerda));
        manchete(s, D.textos.soltura, 'bom');
        s.faixa = faixaIdx(s.suspeita);
      } else {
        s.fim = montarFim(s, 'guarulhos');
        return s.fim;
      }
    }
    // (2) País quebrado
    if (s.rombo >= P.romboMeta) { s.fim = montarFim(s, 'pais_quebrado'); return s.fim; }
    // (3) Anistia
    if (s.flags.anistiaMeses >= P.anistiaMeses) { s.fim = montarFim(s, 'anistia'); return s.fim; }
    // (4) Liquidado
    if (s.mes > P.mesMax) { s.mes = P.mesMax; s.fim = montarFim(s, 'liquidado'); return s.fim; }
    return null;
  }

  function pontuar(s, id) {
    const Q = P.pontos;
    if (D.finais[id].vitoria) {
      return Math.round(s.rombo * Q.romboVitoria + s.caixa + (P.mesMax - s.mes) * Q.mesRestante + s.blindagem * Q.blindagem);
    }
    if (id === 'delacao') return Math.round(s.rombo * Q.romboDelacao);
    return Math.round(s.rombo * Q.romboDerrota);
  }

  // epílogo: quem caiu com você, quem delatou, quem saiu ganhando
  function epilogo(s, id) {
    const vit = D.finais[id].vitoria;
    const ep = { caiu: [], delatou: [], ganhou: [] };
    D.aliados.forEach(a => {
      const st = s.aliados[a.id];
      let g = null;
      if (st.status === 'delatou') g = 'delatou';
      else if (st.status === 'ativo') g = vit ? 'ganhou' : 'caiu';
      else if (st.status === 'dispensado') g = vit ? 'caiu' : 'ganhou';
      if (g) ep[g].push({ id: a.id, nome: a.nome, frase: a.epilogo[g] });
    });
    return ep;
  }

  // Nome do aliado no meio da frase, com artigo e contração: nomeCom(a, 'de') => "do Jurista Caro".
  // prep vazio => só o artigo ("o Jurista Caro"). Aceita o aliado ou o id. Função pura.
  const CONTRACAO = { de: { o: 'do', a: 'da' }, em: { o: 'no', a: 'na' }, a: { o: 'ao', a: 'à' }, por: { o: 'pelo', a: 'pela' } };
  function nomeCom(aliado, prep) {
    const a = typeof aliado === 'string' ? D.aliadoPorId[aliado] : aliado;
    const art = a.artigo || '';
    let base = a.nome;
    if (art && base.toLowerCase().startsWith(art + ' ')) base = base.slice(art.length + 1);   // "O Jurista Caro" => "Jurista Caro"
    if (!art) return prep ? prep + ' ' + base : base;
    const c = CONTRACAO[prep];
    return (c ? c[art] : (prep ? prep + ' ' + art : art)) + ' ' + base;
  }

  function montarFim(s, id) {
    const f = D.finais[id];
    return { id, titulo: f.titulo, texto: f.texto, extra: f.extra, vitoria: !!f.vitoria, pontos: pontuar(s, id), meses: Math.min(s.mes, P.mesMax), epilogo: epilogo(s, id) };
  }

  // ---------------- Exportação ----------------
  GM.engine = {
    newGame, advanceMonth, doAction, resolveEvent, checkEnd, getAvailableActions, listActions, actionStatus,
    escolhaStatus, recalcBlindagem, faixaIdx, previsao, reducaoBlindagem, rendaGolpe, mesadaDe, custoAcao,
    habeasDisponiveis, nomeCom, previewAction, explicacao, rand, data: D,
    // expostos para testes e modo debug
    _internal: { aplicarEfeitos, dispararEvento, dispararOperacao, condOk, sortearEvento, addSuspeita, delata, fechar, semestre }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GM.engine;
})(typeof window !== 'undefined' ? window : globalThis);
