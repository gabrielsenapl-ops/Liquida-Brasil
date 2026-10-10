// audio.js - efeitos sonoros com Web Audio (osciladores) e os sons gravados dos minigames.
// O navegador só libera áudio depois de um clique: até lá, tudo fica mudo.
// Para mudar um som: edite a lista SONS (notas em Hz, duração em segundos, forma de onda).
(function (root) {
  const GM = root.GM = root.GM || {};

  // cada som é uma sequência de notas: [frequência, duração, onda, volume]
  const SONS = {
    clique: [[660, 0.03, 'square', 0.05]],
    moeda: [[988, 0.05, 'square', 0.07], [1319, 0.09, 'square', 0.07]],
    gasto: [[196, 0.08, 'triangle', 0.12], [147, 0.12, 'triangle', 0.12]],
    alerta: [[880, 0.09, 'square', 0.08], [0, 0.05], [880, 0.09, 'square', 0.08]],
    operacao: [[740, 0.12, 'square', 0.07], [554, 0.12, 'square', 0.07], [740, 0.12, 'square', 0.07], [554, 0.12, 'square', 0.07]],
    vitoria: [[523, 0.1, 'square', 0.08], [659, 0.1, 'square', 0.08], [784, 0.1, 'square', 0.08], [1047, 0.3, 'square', 0.08]],
    derrota: [[392, 0.18, 'triangle', 0.12], [330, 0.18, 'triangle', 0.12], [262, 0.18, 'triangle', 0.12], [196, 0.4, 'triangle', 0.12]],
    // V3 seção 4: notificação ("Só mais uma", "Print vazado"), telefone ("Ligação às 3h"), delação de aliado e jato na janela
    notificacao: [[1047, 0.06, 'sine', 0.09], [0, 0.04], [1568, 0.14, 'sine', 0.09]],
    telefone: [[880, 0.07, 'square', 0.04], [988, 0.07, 'square', 0.04], [880, 0.07, 'square', 0.04], [988, 0.07, 'square', 0.04], [0, 0.3],
      [880, 0.07, 'square', 0.04], [988, 0.07, 'square', 0.04], [880, 0.07, 'square', 0.04], [988, 0.07, 'square', 0.04]],
    delacao: [[1319, 0.08, 'triangle', 0.1], [1760, 0.25, 'triangle', 0.1]],
    jato: [[500, 1.6, 'ruido', 0.05]]   // 'ruido' = chiado filtrado que sobe de tom
  };
  // Qualquer som acima pode ser trocado por arquivo: se existir assets/audio/<nome>.mp3, ele toca no lugar do sintetizado.

  let ctx = null;
  let ligado = true;       // preferência do jogador (tecla M)
  let desbloqueado = false; // vira true no primeiro clique
  const MUS_VOL = 0.6;     // volume normal do chiptune (abaixa para 15% durante um meme)
  const ideo = { el: null };   // "Ideologia" (assets/audio/ideologia.m4a), quando está tocando

  function desbloquear() {
    if (desbloqueado) return;
    try {
      const AC = root.AudioContext || root.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      desbloqueado = true;
      prepararArquivos(); prepararMemes();
      iniciarMusica();
    } catch (e) { ctx = null; }
  }


  // ---------------- Tema de fundo (chiptune, composição original) ----------------
  // Loop de 8 compassos em Lá menor, ~76 BPM, clima de balada rock melancólica: melodia com deslize
  // (onda de pulso), baixo (triângulo), arpejo suave, bateria em meio-tempo e eco. Para mudar: edite TEMA (notas por colcheia; '-' segura, '.' pausa).
  const TEMA = {
    bpm: 76,                                                     // balada lenta, em meio-tempo
    acordes: [[45, 'Am'], [45, 'Am'], [50, 'Dm'], [50, 'Dm'], [45, 'Am'], [41, 'F'], [40, 'E'], [40, 'E']],
    maior: [false, false, false, false, false, true, true, true],
    melodia: [
      'E5 - - - C5 - D5 -',
      'E5 - G5 - - - E5 -',
      'F5 - - - D5 - E5 F5',
      'A5 - - - - - . .',
      'E5 - C5 - A4 - C5 -',
      'C6 - A5 - - - F5 -',
      'B5 - - - G#5 - B5 -',
      'E5 - - - - - . .'
    ],
    baixo: [0, null, null, null, 7, null, 0, null]
  };
  const NOTAS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const midiDe = n => { const m = /^([A-G])(#?)(\d)$/.exec(n); return 12 * (parseInt(m[3], 10) + 1) + NOTAS[m[1]] + (m[2] ? 1 : 0); };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  let mus = { tocando: false, timer: null, passo: 0, proximo: 0, ruido: null, mestre: null };

  function tom(t, freq, dur, onda, vol, bend) {
    const o = ctx.createOscillator(), g = ctx.createGain();
    o.type = onda;
    if (bend) { o.frequency.setValueAtTime(freq * 0.944, t); o.frequency.linearRampToValueAtTime(freq, t + 0.06); } else o.frequency.value = freq;
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(mus.mestre);
    o.start(t); o.stop(t + dur + 0.02);
  }
  function batida(t, dur, vol, agudo) {
    const src = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter();
    src.buffer = mus.ruido; f.type = agudo ? 'highpass' : 'lowpass'; f.frequency.value = agudo ? 6000 : 1800;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(f); f.connect(g); g.connect(mus.mestre);
    src.start(t); src.stop(t + dur + 0.02);
  }
  function tocarPasso(t, passo) {
    const comp = Math.floor(passo / 8) % 8, i = passo % 8, col = 60 / TEMA.bpm / 2;
    const [raiz] = TEMA.acordes[comp];
    const b = TEMA.baixo[i];
    if (b !== null) tom(t, hz(raiz + b), col * 0.9, 'triangle', 0.16);
    const arp = [0, TEMA.maior[comp] ? 4 : 3, 7, 12][[0, 1, 2, 3, 2, 1, 2, 1][i]];
    tom(t, hz(raiz + 24 + arp), col * 0.8, 'triangle', 0.03);
    const tok = TEMA.melodia[comp].split(' ')[i];
    if (tok && tok !== '-' && tok !== '.') {
      let len = 1; const toks = TEMA.melodia[comp].split(' ');
      while (toks[i + len] === '-') len++;
      tom(t, hz(midiDe(tok)), col * len * 0.98, 'square', 0.04, len > 1);
    }
    if (i === 0 || i === 6) batida(t, 0.11, 0.24, false);                  // bumbo
    if (i === 4) batida(t, 0.16, 0.16, true);                              // caixa no tempo 3
    else if (i % 2 === 0) batida(t, 0.03, 0.04, true);                     // chimbal suave
  }
  function agendar() {
    if (!mus.tocando || !ctx) return;
    const col = 60 / TEMA.bpm / 2;
    while (mus.proximo < ctx.currentTime + 0.25) {
      if (mus.proximo < ctx.currentTime - 0.1) mus.proximo = ctx.currentTime + 0.05;   // aba ficou em segundo plano
      tocarPasso(mus.proximo, mus.passo);
      mus.proximo += col; mus.passo = (mus.passo + 1) % 64;
    }
  }
  function iniciarMusica() {
    if (mus.tocando || !ligado || !desbloqueado || !ctx || !querMusica || ideo.el) return;
    try {
      if (ctx.state === 'suspended') ctx.resume();
      if (!mus.ruido) {
        mus.ruido = ctx.createBuffer(1, ctx.sampleRate * 0.2, ctx.sampleRate);
        const d = mus.ruido.getChannelData(0); for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1;
        mus.mestre = ctx.createGain(); mus.mestre.gain.value = MUS_VOL; mus.mestre.connect(ctx.destination);
        const eco = ctx.createDelay(1), fb = ctx.createGain(), sai = ctx.createGain();   // eco de 3 colcheias
        eco.delayTime.value = 60 / TEMA.bpm * 0.75; fb.gain.value = 0.3; sai.gain.value = 0.35;
        mus.mestre.connect(eco); eco.connect(fb); fb.connect(eco); eco.connect(sai); sai.connect(ctx.destination);
      }
      mus.tocando = true; mus.passo = 0; mus.proximo = ctx.currentTime + 0.1;
      mus.timer = setInterval(agendar, 40); agendar();
    } catch (e) { mus.tocando = false; }
  }
  function pararMusica() { mus.tocando = false; if (mus.timer) { clearInterval(mus.timer); mus.timer = null; } }
  let querMusica = true;   // preferência separada: tecla N

  // ---------------- Sons trocáveis por arquivo (V3 seção 4) ----------------
  const arquivos = {};   // nome -> <audio> que carregou
  function prepararArquivos() {
    if (!root.Audio) return;
    Object.keys(SONS).forEach(nome => {
      try {
        const a = new root.Audio('assets/audio/' + nome + '.mp3');
        a.preload = 'auto';
        a.addEventListener('canplaythrough', () => { arquivos[nome] = a; }, { once: true });
        a.addEventListener('error', () => { /* sem arquivo: fica o sintetizado */ }, { once: true });
      } catch (e) { /* segue */ }
    });
  }

  function play(nome) {
    const seq = SONS[nome];
    if (!seq || !ligado || !desbloqueado || !ctx) return;
    try {
      if (arquivos[nome]) { const a = arquivos[nome].cloneNode(); a.volume = 0.6; const p = a.play(); if (p && p.catch) p.catch(() => { }); return; }
      if (ctx.state === 'suspended') ctx.resume();
      let t = ctx.currentTime + 0.01;
      seq.forEach(([freq, dur, onda, vol]) => {
        if (freq && onda === 'ruido') {        // chiado filtrado (jato)
          const n = ctx.createBuffer(1, Math.floor(ctx.sampleRate * dur), ctx.sampleRate), d = n.getChannelData(0);
          for (let k = 0; k < d.length; k++) d[k] = Math.random() * 2 - 1;
          const src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
          src.buffer = n; f.type = 'bandpass'; f.Q.value = 1.2;
          f.frequency.setValueAtTime(freq * 0.6, t); f.frequency.linearRampToValueAtTime(freq * 2.4, t + dur);
          g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + dur * 0.4); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
          src.connect(f); f.connect(g); g.connect(ctx.destination); src.start(t); src.stop(t + dur + 0.02);
        } else if (freq) {
          const osc = ctx.createOscillator(), g = ctx.createGain();
          osc.type = onda || 'square';
          osc.frequency.value = freq;
          g.gain.setValueAtTime(vol || 0.08, t);
          g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
          osc.connect(g); g.connect(ctx.destination);
          osc.start(t); osc.stop(t + dur + 0.02);
        }
        t += dur;
      });
    } catch (e) { /* áudio é enfeite: nunca derruba o jogo */ }
  }

  // ---------------- Memes (assets/audio/memes/, uso local: ficam fora do git) ----------------
  // Um por vez, no máximo a cada 8 s o mesmo; a música de fundo (chiptune ou Ideologia) abaixa para 15% enquanto tocam.
  // Sem o arquivo (ou ainda carregando, ou outro meme tocando) toca o som sintetizado de reserva: o jogo funciona sem os memes.
  const MEME_DIR = 'assets/audio/memes/', MEME_VOL = 0.9, MEME_INTERVALO = 8000, IDEO_VOL = 0.8;
  const MEMES = ['pegaram-telefone', 'toc-toc-pf', 'me-chame-de-corrupto', 'imbroxavel', 'e-agora-vai-entra-o-grosso',
    'chega-de-frescura-e-mimimi', 'eu-sou-crente', 'ces-nao-sao-crente', 'abraco-lindao', 'defender-corrupcao'];
  const memes = { el: {}, buf: {}, ok: {}, ultimo: {}, ativos: 0, tocando: false };
  function prepararMemes() {
    if (!root.Audio) return;
    MEMES.forEach(n => {
      try {
        const a = new root.Audio(MEME_DIR + n + '.mp3');
        a.preload = 'auto'; memes.el[n] = a;
        a.addEventListener('canplaythrough', () => { memes.ok[n] = true; }, { once: true });
        a.addEventListener('error', () => { memes.ok[n] = false; }, { once: true });
        if (viaFetch()) {
          root.fetch(MEME_DIR + n + '.mp3').then(r => { if (!r.ok) throw new Error(); return r.arrayBuffer(); })
            .then(b => ctx.decodeAudioData(b)).then(buf => { memes.buf[n] = buf; }).catch(() => { });
        }
      } catch (e) { /* segue */ }
    });
  }
  function rampa(param, alvo, seg) {
    const t = ctx.currentTime;
    param.cancelScheduledValues(t); param.setValueAtTime(param.value, t); param.linearRampToValueAtTime(alvo, t + seg);
  }
  function abaixarMusica() {
    memes.ativos++;
    try { if (ctx && mus.mestre) rampa(mus.mestre.gain, MUS_VOL * 0.15, 0.1); } catch (e) { }
    if (ideo.el) ideo.el.volume = IDEO_VOL * 0.15;
  }
  function voltarMusica() {
    memes.ativos = Math.max(0, memes.ativos - 1);
    if (memes.ativos) return;                       // outro meme ainda tocando
    try { if (ctx && mus.mestre) rampa(mus.mestre.gain, MUS_VOL, 0.4); } catch (e) { }
    if (ideo.el) ideo.el.volume = IDEO_VOL;
  }
  // devolve true se o meme tocou; false = tocou a reserva (ou nada)
  function meme(nome, reserva) {
    if (!ligado || !desbloqueado) return false;
    const agora = Date.now(), pronto = memes.buf[nome] || memes.ok[nome];
    if (!pronto || memes.tocando || agora - (memes.ultimo[nome] || 0) < MEME_INTERVALO) { if (reserva) play(reserva); return false; }
    memes.ultimo[nome] = agora; memes.tocando = true; abaixarMusica();
    let acabou = false;
    const fim = () => { if (acabou) return; acabou = true; memes.tocando = false; voltarMusica(); };
    setTimeout(fim, 20000);   // segurança: a música nunca fica muda para sempre
    try {
      if (memes.buf[nome] && ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        const src = ctx.createBufferSource(), g = ctx.createGain();
        src.buffer = memes.buf[nome]; g.gain.value = MEME_VOL; src.connect(g); g.connect(ctx.destination);
        src.onended = fim; src.start();
      } else {
        const a = memes.el[nome].cloneNode(); a.volume = MEME_VOL;
        ['ended', 'error', 'abort'].forEach(ev => a.addEventListener(ev, fim));
        const p = a.play(); if (p && p.catch) p.catch(fim);
      }
      return true;
    } catch (e) { fim(); if (reserva) play(reserva); return false; }
  }

  // ---------------- "Ideologia" (ao liberar os 5 finais, e depois em Opções) ----------------
  // O chiptune para enquanto a faixa toca e volta no fim. Sem o arquivo: chama aoFalhar e nada muda.
  function tocarIdeologia(aoFalhar) {
    if (!ligado || !root.Audio) { if (aoFalhar) aoFalhar(); return false; }
    pararIdeologia();
    const a = new root.Audio('assets/audio/ideologia.m4a');
    a.volume = memes.ativos ? IDEO_VOL * 0.15 : IDEO_VOL;
    ideo.el = a; pararMusica();
    const volta = () => { if (ideo.el !== a) return; ideo.el = null; iniciarMusica(); };
    a.addEventListener('ended', volta);
    a.addEventListener('error', () => { volta(); if (aoFalhar) aoFalhar(); }, { once: true });
    const p = a.play(); if (p && p.catch) p.catch(() => { volta(); if (aoFalhar) aoFalhar(); });
    return true;
  }
  function pararIdeologia() { const a = ideo.el; if (!a) return; ideo.el = null; try { a.pause(); } catch (e) { } iniciarMusica(); }

  // ---------------- Sons dos minigames (arquivos em assets/audio/minigames/) ----------------
  // Em http(s) (site publicado): fetch + decodeAudioData, que funciona também no iPhone.
  // Em file:// (duplo clique) o fetch é bloqueado: toca com <audio>. Falhou? Fica em silêncio (som é enfeite).
  const MG_DIR = 'assets/audio/minigames/';
  const MG_VOL = 0.7, MG_VOL_LOOP = 0.3;   // loops ficam baixos (pico ~0,3)
  const mgBuf = {}, mgEl = {}, mgLoops = [];
  const viaFetch = () => !!(ctx && root.fetch && root.location && /^https?:$/.test(root.location.protocol));
  function mgCarregar(nome) {
    if (nome in mgBuf) return;
    mgBuf[nome] = null;
    if (viaFetch()) {
      root.fetch(MG_DIR + nome + '.mp3').then(r => r.arrayBuffer()).then(b => ctx.decodeAudioData(b))
        .then(buf => { mgBuf[nome] = buf; }).catch(() => { /* cai no <audio> */ });
    }
    if (!mgEl[nome] && root.Audio) { mgEl[nome] = new root.Audio(MG_DIR + nome + '.mp3'); mgEl[nome].preload = 'auto'; }
  }
  function mgTocar(nome, vol, loop) {
    if (!ligado) return null;
    try {
      mgCarregar(nome);
      if (mgBuf[nome] && ctx) {
        if (ctx.state === 'suspended') ctx.resume();
        const src = ctx.createBufferSource(), g = ctx.createGain();
        src.buffer = mgBuf[nome]; src.loop = !!loop; g.gain.value = vol;
        src.connect(g); g.connect(ctx.destination); src.start();
        return { parar() { try { src.stop(); } catch (e) { } } };
      }
      const base = mgEl[nome];
      if (!base) return null;
      const a = base.cloneNode(); a.volume = vol; a.loop = !!loop;
      const p = a.play(); if (p && p.catch) p.catch(() => { });
      return { parar() { a.pause(); a.currentTime = 0; } };
    } catch (e) { return null; }
  }
  const mg = nome => { mgTocar(nome, MG_VOL, false); };
  function mgLoop(nome) { const h = mgTocar(nome, MG_VOL_LOOP, true); if (h) mgLoops.push(h); }
  function pararLoop() { while (mgLoops.length) mgLoops.pop().parar(); }
  // pré-carrega os sons de um minigame para o primeiro toque não atrasar
  function mgPreparar(nomes) { nomes.forEach(mgCarregar); }

  GM.audio = {
    SONS, play, desbloquear, mg, mgLoop, pararLoop, mgPreparar, meme, MEMES,
    ideologia: tocarIdeologia, pararIdeologia,
    get ideologiaTocando() { return !!ideo.el; },
    get volumeMusica() { return mus.mestre ? mus.mestre.gain.value : MUS_VOL; },   // para testes
    setLigado(v) { ligado = !!v; if (ligado) iniciarMusica(); else { pararMusica(); pararLoop(); pararIdeologia(); pararMusica(); } },
    setMusica(v) { querMusica = !!v; if (querMusica) iniciarMusica(); else { pararMusica(); pararIdeologia(); pararMusica(); } },   // N também para a Ideologia
    get musica() { return querMusica; },
    TEMA,
    get ligado() { return ligado; }
  };
})(typeof window !== 'undefined' ? window : globalThis);
