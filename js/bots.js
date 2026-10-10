// bots.js - robôs jogadores (SPEC 12.2). Usados por tools/sim.js e pelo modo ?selftest=1.
// Cada robô tem: acao(s, E, rng) -> ação para doAction ou null (encerra o mês)
//                escolha(s, E, rng) -> índice da escolha do evento pendente.
// Os robôs usam um RNG próprio (não mexem no RNG do estado), para o jogo continuar determinístico.
(function (root) {
  const GM = root.GM = root.GM || {};

  function makeRng(seed) {
    let a = (seed >>> 0) ^ 0x9E3779B9;
    return function () {
      let t = a = (a + 0x6D2B79F5) | 0;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  // escolhas que o caixa cobre
  const pagaveis = (s, E) => s.evento.escolhas.map((c, i) => ({ c, i })).filter(x => E.escolhaStatus(s, x.c).ok);
  const ativos = (s, E) => E.data.aliados.filter(a => s.aliados[a.id].ativo);
  const ok = (s, E, act) => E.actionStatus(s, act).ok;

  // ---------- Passivo: nunca faz nada; nos eventos, a opção grátis ----------
  const passivo = {
    nome: 'Passivo',
    acao: () => null,
    escolha(s, E) {
      const p = pagaveis(s, E);
      const gratis = p.filter(x => !x.c.custo);
      return (gratis.length ? gratis[gratis.length - 1] : p[p.length - 1] || { i: s.evento.escolhas.length - 1 }).i;
    }
  };

  // ---------- Aleatório: qualquer ação permitida, ao acaso ----------
  const aleatorio = {
    nome: 'Aleatório',
    acao(s, E, rng) {
      if (rng() < 0.3) return null;
      const acts = E.getAvailableActions(s).filter(a => a.type !== 'delatar' || rng() < 0.05);
      return acts.length ? acts[Math.floor(rng() * acts.length)] : null;
    },
    escolha(s, E, rng) {
      const p = pagaveis(s, E);
      return p.length ? p[Math.floor(rng() * p.length)].i : s.evento.escolhas.length - 1;
    }
  };

  // ---------- Guloso: abre tudo o quanto antes, ignora a suspeita, recruta os mais baratos ----------
  const guloso = {
    nome: 'Guloso',
    acao(s, E) {
      const D = E.data;
      for (const g of D.golpes) {
        const act = { type: g.tipo === 'unica' ? 'executar' : 'abrir', id: g.id };
        if (ok(s, E, act)) return act;
      }
      const baratos = D.aliados.slice().sort((a, b) => a.custo - b.custo);
      for (const a of baratos) {
        const act = { type: 'recrutar', id: a.id };
        if (ok(s, E, act) && s.caixa - a.custo >= 20) return act;
      }
      return null;
    },
    escolha(s, E) {
      // a mais barata; empate: a primeira (habeas vem primeiro)
      const p = pagaveis(s, E);
      if (!p.length) return s.evento.escolhas.length - 1;
      p.sort((x, y) => (x.c.custo || 0) - (y.c.custo || 0) || x.i - y.i);
      return p[0].i;
    }
  };

  // ---------- Equilibrado: segura a suspeita, abre por eficiência, 1 tribunal + 1 regulador ----------
  const EQ = {
    limite: 55,          // tenta manter a suspeita abaixo disto
    alerta: 40,          // acima disto já gasta em proteção se sobrar ação
    reservaMeses: 3,     // guarda caixa para N meses de mesada
    lealdadeMin: 35,     // abaixo disto, mimo
    extraMeses: 10       // só recruta aliado extra se o caixa cobrir N meses da mesada dele
  };
  function reserva(s, E) { return Math.max(20, E.previsao(s).mesadas * EQ.reservaMeses); }

  function protecao(s, E, forte) {
    // ordem por custo-benefício; festa também dá lealdade ao aliado mais fraco
    const fraco = ativos(s, E).sort((a, b) => s.aliados[a.id].lealdade - s.aliados[b.id].lealdade)[0];
    // com caixa sobrando, o filme rende mais por ação; sem caixa, fake news
    const rico = s.caixa > reserva(s, E) + 80;
    const ordem = forte ? (rico ? ['filme', 'festa', 'fakenews', 'fieis', 'video'] : ['fakenews', 'festa', 'filme', 'fieis', 'video'])
      : ['fieis', 'fakenews', 'festa'];
    for (const id of ordem) {
      const act = { type: 'protecao', id };
      if (id === 'festa' && fraco) act.alvo = fraco.id;
      const custo = E.custoAcao(s, E.data.acaoPorId[id]).max;
      if (!ok(s, E, act)) continue;
      if (!forte && s.caixa - custo < reserva(s, E)) continue;
      if (id === 'fieis' && s.flags.fieisAte >= s.mes) continue;
      if (id === 'video' && s.flags.videoAte >= s.mes) continue;
      return act;
    }
    return null;
  }

  const equilibrado = {
    nome: 'Equilibrado',
    acao(s, E) {
      const D = E.data;
      const prev = E.previsao(s);
      // 1. suspeita crítica: proteção primeiro
      if (s.suspeita >= EQ.limite + 10) { const p = protecao(s, E, true); if (p) return p; }
      // 2. aliado prestes a delatar: mimo
      for (const a of ativos(s, E)) {
        if (s.aliados[a.id].lealdade < EQ.lealdadeMin) {
          const act = { type: 'protecao', id: 'mimo', alvo: a.id };
          if (ok(s, E, act)) return act;
        }
      }
      // 2b. suspeita alta: proteção
      if (s.suspeita >= EQ.limite - 5) { const p = protecao(s, E, true); if (p) return p; }
      // 2c. Primeira Instância: se o mês vai fechar sem caixa para as mesadas e todos estão leais, não paga ninguém
      if (s.modo === 'primeirainstancia' && !s.flags.calotePlanejado && prev.mesadas > 0 && s.caixa + prev.saldo < 0 &&
        ativos(s, E).every(a => s.aliados[a.id].lealdade >= 50) && ok(s, E, { type: 'calote' })) return { type: 'calote' };
      // 3. dispensa quem não vale a mesada quando o mês fecha no vermelho
      if (prev.saldo < 0 && s.caixa < -prev.saldo * 2) {
        const pior = ativos(s, E).filter(a => a.id !== 'tofu')
          .sort((a, b) => (a.blindagem / E.mesadaDe(s, a.id)) - (b.blindagem / E.mesadaDe(s, b.id)))[0];
        if (pior) return { type: 'dispensar', id: pior.id };
      }
      const res = reserva(s, E);
      // 4. golpes recorrentes por eficiência (rombo por suspeita)
      const recs = D.golpes.filter(g => g.tipo === 'recorrente' && g.rombo > 0)
        .sort((a, b) => (b.rombo / b.suspeita) - (a.rombo / a.suspeita));
      for (const g of recs) {
        const act = { type: 'abrir', id: g.id };
        if (ok(s, E, act) && s.caixa - g.custo >= res && s.suspeita < EQ.limite - 10) return act;
      }
      // 4b. Primeira Instância: golpes passivos (caixa sem rombo) quando sobra caixa
      if (s.modo === 'primeirainstancia') {
        for (const g of D.golpes.filter(x => x.passivo)) {
          const act = { type: 'abrir', id: g.id };
          if (ok(s, E, act) && s.caixa - g.custo >= res && s.suspeita < EQ.limite - 10) return act;
        }
      }
      // 5. aliados: tribunal, regulador, depois quem libera golpe
      // (na Primeira Instância, o Dono do Controle Remoto entra cedo: sem ele não tem Fake news)
      const quero = s.modo === 'primeirainstancia' ? ['tofu', 'controleremoto', 'barrapesada', 'bispo', 'quadradinho'] : ['tofu', 'barrapesada', 'bispo', 'quadradinho'];
      for (const id of quero) {
        const act = { type: 'recrutar', id };
        const a = D.aliadoPorId[id];
        if (ok(s, E, act) && s.caixa - a.custo >= res + a.mesada * 6 && prev.saldo > a.mesada) return act;
      }
      // 6. Fundo de Fundo quando der
      { const act = { type: 'abrir', id: 'fundofundo' };
        if (ok(s, E, act) && s.caixa - 80 >= res) return act; }
      // 7. operações únicas com suspeita baixa
      for (const g of D.golpes.filter(x => x.tipo === 'unica')) {
        const act = { type: 'executar', id: g.id };
        if (ok(s, E, act) && s.suspeita + g.suspeita < EQ.limite) return act;
      }
      // 8. sobrou ação: proteção preventiva
      if (s.suspeita >= EQ.alerta) { const p = protecao(s, E, false); if (p) return p; }
      // 9. caixa sobrando: mais blindagem (melhor blindagem por mesada primeiro)
      const extras = D.aliados.filter(a => !s.aliados[a.id].ativo)
        .sort((a, b) => (b.blindagem / b.mesada) - (a.blindagem / a.mesada));
      for (const a of extras) {
        const act = { type: 'recrutar', id: a.id };
        if (ok(s, E, act) && s.caixa - a.custo >= res + a.mesada * EQ.extraMeses && prev.saldo > a.mesada * 2) return act;
      }
      return null;
    },
    escolha(s, E) {
      const ev = s.evento;
      const p = pagaveis(s, E);
      if (!p.length) return ev.escolhas.length - 1;
      if (ev.id === 'operacao') return p[0].i;                   // habeas, se houver
      if (ev.id === 'reajuste') {
        const imp = ['tofu', 'barrapesada'].indexOf(ev.alvo) >= 0 || s.aliados[ev.alvo].lealdade < 45;
        return imp ? 0 : 1;
      }
      // paga se couber na reserva; senão a opção grátis
      const res = reserva(s, E);
      const pagas = p.filter(x => x.c.custo && s.caixa - x.c.custo >= res);
      if (pagas.length) return pagas[0].i;
      const gratis = p.filter(x => !x.c.custo);
      return (gratis.length ? gratis[0] : p[0]).i;
    }
  };

  // Joga uma partida inteira (Node). Devolve o estado final.
  function jogar(E, bot, seed, maxPassos, modo) {
    const s = E.newGame(seed, modo);
    const rng = makeRng(seed * 7919 + 13);
    let passos = 0;
    maxPassos = maxPassos || 5000;
    while (!s.fim && passos++ < maxPassos) {
      if (s.evento) { const r = E.resolveEvent(s, bot.escolha(s, E, rng)); if (!r.ok) E.resolveEvent(s, s.evento.escolhas.length - 1); continue; }
      let n = 0;
      while (!s.fim && !s.evento && n++ < 10) {
        const act = bot.acao(s, E, rng);
        if (!act) break;
        if (!E.doAction(s, act).ok) break;
      }
      if (!s.fim && !s.evento) E.advanceMonth(s);
    }
    s._passos = passos;
    return s;
  }

  GM.bots = { passivo, aleatorio, guloso, equilibrado, jogar, makeRng, EQ };
  if (typeof module !== 'undefined' && module.exports) module.exports = GM.bots;
})(typeof window !== 'undefined' ? window : globalThis);
