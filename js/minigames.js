// minigames.js - Minigames em tempo real. Visual apenas: não mexe no estado do jogo.
// Cada minigame: iniciar(host, { modo: 'jogo' | 'livre', onSair(resultado) }).
// resultado = { nivel: 0..3, ganhou, pontos }. Quem aplica efeitos é o motor (engine.resolveEvent).
// Math.random é permitido aqui (só visual/jogabilidade), como em sprites.js.
(function (root) {
  const GM = root.GM = root.GM || {};

  // Mundo lógico 9:16 (3.1): 240 de largura (igual ao antigo 240x320) e 427 de altura. O espaço novo entra
  // na vertical; as velocidades verticais sobem na mesma proporção (VK), então o tempo de queda não muda.
  const MW = 240, MH = 427, VK = MH / 320;
  // Sons gravados (assets/audio/minigames/, via GM.audio): respeitam a tecla M; loops param ao sair do minigame.
  const som = n => { const a = GM.audio; if (a && a.mg) a.mg(n); };
  const somLoop = n => { const a = GM.audio; if (a && a.mgLoop) a.mgLoop(n); };
  const pararSons = () => { const a = GM.audio; if (a && a.pararLoop) a.pararLoop(); };
  const preparar = l => { const a = GM.audio; if (a && a.mgPreparar) a.mgPreparar(l); };
  const FANFARRA = ['mg_nivel0_derrota', 'mg_nivel1_bronze', 'mg_nivel2_prata', 'mg_nivel3_ouro'];

  // Encaixa o canvas no palco: escala INTEIRA em pixels do aparelho (devicePixelRatio), sem esticar.
  function encaixar(cv) {
    const palco = cv.parentNode, dpr = root.devicePixelRatio || 1;
    const r = palco.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const k = Math.max(1, Math.floor(Math.min(r.width * dpr / MW, r.height * dpr / MH)));
    if (cv._k !== k) { cv.width = MW * k; cv.height = MH * k; cv._k = k; }
    const w = MW * k / dpr + 'px', h = MH * k / dpr + 'px';
    if (cv.style.width !== w) { cv.style.width = w; cv.style.height = h; }
    const ctx = cv.getContext('2d');
    ctx.setTransform(k, 0, 0, k, 0, 0); ctx.imageSmoothingEnabled = false;
  }

  // ---------------- Tritura Fácil ----------------
  const TRITURA = (function () {
    const W = MW, H = MH, CHAO = H - 38, DUR = 45, VT = CHAO / 282;   // VT: mesma queda que no chão antigo (282)
    const PROVAS = [['PLANILHA', 'PAGA-TUDO'], ['NOTA FRIA', 'R$ 9 MI'], ['PRINT', 'DO ZAP'], ['CONTRATO', 'SEM OBRA'], ['EXTRATO', 'DO CUNHADO'], ['ATA SECRETA', 'DO CONSELHO'], ['PEN DRIVE', 'DE 2019']];
    const LIMPAS = [['RECEITA', 'DE BOLO'], ['CARDAPIO', 'DO RU'], ['BOLETO', 'DA LUZ'], ['FOTO', 'DO GATO'], ['LISTA', 'DE MERCADO'], ['CONVITE', 'BATIZADO']];

    function nivelDe(ganhou, susp) { return !ganhou ? 0 : susp < 30 ? 3 : susp <= 66 ? 2 : 1; }

    function iniciar(host, opts) {
      host.innerHTML =
        '<div class="mg-hud"><span>TEMPO <b class="mg-t">45</b></span>' +
        '<div><div class="mg-barra"><i class="mg-susp"></i></div><div class="mg-rot">SUSPEITA <b class="mg-s">0</b>%</div></div>' +
        '<span>R$ <b class="mg-p">0</b> mi</span></div>' +
        '<div class="mg-palco"><canvas width="' + W + '" height="' + H + '"></canvas>' +
        '<div class="mg-tela mg-ini"><h2>Fiscalização surpresa</h2><p>Toque nos papéis com carimbo SECRETO para triturar. Papel limpo, mesmo com URGENTE, deixe cair. Errar custa suspeita.</p><button class="btn grande mg-go" type="button">Ligar a trituradora</button></div>' +
        '<div class="mg-tela mg-fim" hidden><h2 class="mg-fim-t"></h2><p class="mg-fim-p"></p><div class="mg-fim-b"></div></div></div>';
      const $ = c => host.querySelector(c);
      const cv = $('canvas'), ctx = cv.getContext('2d');
      let e, vivo = true, ult = 0;
      preparar(['mg_comecar', 'tri_ligar', 'tri_motor_loop', 'tri_triturar_1', 'tri_triturar_2', 'tri_triturar_3', 'tri_toque_vazio', 'tri_bandeira', 'tri_chegou_no_fiscal'].concat(FANFARRA));
      const novo = () => { e = { rodando: false, t: DUR, susp: 0, pts: 0, seq: 0, docs: [], part: [], txt: [], prox: 0.4, tremor: 0 }; };
      novo();

      function gerar() {
        const ruim = Math.random() < 0.55, par = ruim ? PROVAS : LIMPAS, i = Math.floor(Math.random() * par.length), prog = 1 - e.t / DUR;
        e.docs.push({ x: 6 + Math.random() * (W - 54), y: -40, w: 42, h: 34, v: (45 + prog * 75 + Math.random() * 25) * VT, ruim: ruim,
          w0: Math.random() * 6.28, amp: 10 + Math.random() * 22, x0: 0, isca: !ruim && Math.random() < 0.4, a: par[i][0], b: par[i][1], r: (Math.random() - 0.5) * 0.2 });
        e.prox = Math.max(0.22, 0.65 - prog * 0.45) * (0.7 + Math.random() * 0.6);
      }
      const tiras = d => { for (let k = 0; k < 9; k++) e.part.push({ x: d.x + 3 + k * 4, y: d.y, w: 3, h: 14 + Math.random() * 10, vy: 20 + Math.random() * 60, vx: (Math.random() - 0.5) * 30, l: 1.2 }); };
      const texto = (x, y, s, c) => e.txt.push({ x, y, s, c, l: 0.9 });
      const suspeita = n => { e.susp = Math.min(100, e.susp + n); e.tremor = 0.25; };

      cv.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        if (!e.rodando) return;
        const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width, y = (ev.clientY - r.top) * H / r.height;
        for (let i = e.docs.length - 1; i >= 0; i--) {
          const d = e.docs[i];
          if (x >= d.x - 2 && x <= d.x + d.w + 2 && y >= d.y - 2 && y <= d.y + d.h + 2) {
            e.docs.splice(i, 1); tiras(d);
            if (d.ruim) { e.seq++; const v = 10 * (1 + Math.floor(e.seq / 4)); e.pts += v; texto(d.x, d.y, '+' + v, '#ffcd75'); som(e.seq < 4 ? 'tri_triturar_1' : e.seq < 8 ? 'tri_triturar_2' : 'tri_triturar_3'); }   // tom sobe com o combo
            else { e.seq = 0; suspeita(13); texto(d.x, d.y, 'BANDEIRA!', '#ef7d57'); som('tri_bandeira'); }
            return;
          }
        }
        e.seq = 0; suspeita(2); som('tri_toque_vazio');
      });

      function fim(ganhou) {
        e.rodando = false;
        const nivel = nivelDe(ganhou, e.susp), nomes = ['Flagrado', 'Bronze', 'Prata', 'Ouro'];
        const res = { nivel, ganhou, pontos: e.pts };
        $('.mg-fim-t').textContent = ganhou ? 'Perícia desistiu: ' + nomes[nivel] : 'Operação deflagrada às 6h';
        $('.mg-fim-p').textContent = (ganhou ? 'Você aguentou 45 segundos. ' : 'A suspeita bateu 100%. ') + 'Papel picado: R$ ' + e.pts + ' mi.';
        const b = $('.mg-fim-b'); b.innerHTML = '';
        const mk = (rot, fn) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'btn grande'; x.textContent = rot; x.addEventListener('click', fn); b.appendChild(x); };
        if (opts.modo === 'livre') { mk('De novo', comecar); mk('Sair', () => { vivo = false; pararSons(); opts.onSair(res); }); }
        else mk('Continuar', () => { vivo = false; pararSons(); opts.onSair(res); });
        $('.mg-fim').hidden = false;
        pararSons(); som(FANFARRA[nivel]);
        if (opts.onFim) opts.onFim(res);
      }

      function passo(dt) {
        if (!e.rodando) return;
        e.t -= dt; e.prox -= dt; e.tremor = Math.max(0, e.tremor - dt);
        if (e.prox <= 0) gerar();
        for (let i = e.docs.length - 1; i >= 0; i--) {
          const d = e.docs[i]; d.y += d.v * dt;
          if (!d.x0) d.x0 = d.x;
          d.w0 += dt * 2.2; d.x = Math.max(2, Math.min(W - d.w - 2, d.x0 + Math.sin(d.w0) * d.amp));
          if (d.y + d.h >= CHAO) { e.docs.splice(i, 1); if (d.ruim) { e.seq = 0; suspeita(16); texto(d.x, CHAO - 20, 'CHEGOU NO FISCAL', '#b13e53'); som('tri_chegou_no_fiscal'); } }
        }
        e.part = e.part.filter(p => { p.l -= dt; p.y += p.vy * dt; p.x += p.vx * dt; p.vy += 90 * dt; return p.l > 0; });
        e.txt = e.txt.filter(t => { t.l -= dt; t.y -= 18 * dt; return t.l > 0; });
        if (e.susp >= 100) return fim(false);
        if (e.t <= 0) { e.t = 0; fim(true); }
      }

      const pix = (s, x, y, c, tam, al) => { ctx.fillStyle = c; ctx.font = 'bold ' + tam + 'px "Press Start 2P", "Courier New", monospace'; ctx.textAlign = al || 'left'; ctx.fillText(s, x, y); };
      function papel(d) {
        ctx.save(); ctx.translate(d.x + d.w / 2, d.y + d.h / 2); ctx.rotate(d.r); ctx.translate(-d.w / 2, -d.h / 2);
        ctx.fillStyle = '#1a1c2c'; ctx.fillRect(-1, -1, d.w + 2, d.h + 2);
        ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, 0, d.w, d.h);
        ctx.fillStyle = '#94b0c2'; ctx.fillRect(0, d.h - 3, d.w, 3);
        pix(d.a.slice(0, 9), d.w / 2, 13, '#333c57', 5, 'center');
        pix(d.b.slice(0, 11), d.w / 2, 23, '#566c86', 4, 'center');
        if (d.isca || d.ruim) {
          const cor = d.ruim ? '#b13e53' : '#ef7d57';
          ctx.strokeStyle = cor; ctx.lineWidth = 2; ctx.strokeRect(5, 25, d.w - 10, 8);
          pix(d.ruim ? 'SECRETO' : 'URGENTE', d.w / 2, 32, cor, 4, 'center');
        }
        ctx.restore();
      }
      function desenhar() {
        ctx.save();
        if (e.tremor > 0) ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
        ctx.fillStyle = '#1a1c2c'; ctx.fillRect(-4, -4, W + 8, H + 8);
        ctx.fillStyle = '#242842';
        for (let y = 0; y < CHAO; y += 16) for (let x = (y / 16) % 2 ? -12 : 0; x < W; x += 24) ctx.fillRect(x + 1, y + 1, 22, 14);
        for (let i = 0; i < W; i += 16) { ctx.fillStyle = (i / 16) % 2 ? '#ffcd75' : '#1a1c2c'; ctx.fillRect(i, CHAO, 16, 8); }
        pix('FISCALIZACAO NAO ULTRAPASSE', W / 2, CHAO - 4, '#ffcd75', 5, 'center');
        ctx.fillStyle = '#566c86'; ctx.fillRect(40, H - 18, 160, 18); ctx.fillStyle = '#333c57'; ctx.fillRect(48, H - 22, 144, 6);
        for (let i = 0; i < 18; i++) { ctx.fillStyle = '#1a1c2c'; ctx.fillRect(52 + i * 8, H - 21, 3, 4); }
        ctx.fillStyle = '#38b764'; ctx.fillRect(176, H - 12, 6, 4);
        e.docs.forEach(papel);
        e.part.forEach(p => { ctx.fillStyle = '#f4f4f4'; ctx.fillRect(p.x, p.y, p.w, p.h); ctx.fillStyle = '#94b0c2'; ctx.fillRect(p.x, p.y + p.h - 2, p.w, 2); });
        e.txt.forEach(t => pix(t.s, Math.min(W - 4, Math.max(4, t.x)), t.y, t.c, 6, 'left'));
        if (e.seq >= 4) pix('SEQUENCIA x' + (1 + Math.floor(e.seq / 4)), 6, 12, '#ffcd75', 6, 'left');
        ctx.restore();
      }
      function hud() {
        $('.mg-t').textContent = Math.ceil(e.t); $('.mg-s').textContent = Math.round(e.susp); $('.mg-p').textContent = e.pts;
        const b = $('.mg-susp'); b.style.width = e.susp + '%'; b.style.background = e.susp > 66 ? '#b13e53' : e.susp > 33 ? '#ffcd75' : '#38b764';
      }
      function loop(ts) {
        if (!vivo || !host.isConnected) { pararSons(); return; }
        const dt = Math.min(0.05, (ts - ult) / 1000 || 0); ult = ts;
        passo(dt); encaixar(cv); desenhar(); hud(); root.requestAnimationFrame(loop);
      }
      function comecar() { novo(); e.rodando = true; $('.mg-ini').hidden = true; $('.mg-fim').hidden = true; pararSons(); som('mg_comecar'); som('tri_ligar'); somLoop('tri_motor_loop'); }
      $('.mg-go').addEventListener('click', comecar);
      root.requestAnimationFrame(ts => { ult = ts; loop(ts); });
    }
    return { iniciar, nivelDe };
  })();


  // ---------------- Nota na Cueca ----------------
  const CUECA = (function () {
    const W = MW, H = MH, DUR = 30, NOTAS = 24, MAXFLAGRA = 3;
    const LOCAIS = [
      { id: 'cueca', nome: 'CUECA', cap: 6, x: 10, y: 196 }, { id: 'paleto', nome: 'PALETO', cap: 4, x: 86, y: 196 }, { id: 'vaso', nome: 'VASO', cap: 4, x: 162, y: 196 },
      { id: 'meiae', nome: 'MEIA ESQ', cap: 3, x: 10, y: 300 }, { id: 'meiad', nome: 'MEIA DIR', cap: 3, x: 86, y: 300 }, { id: 'bolso', nome: 'BOLSO', cap: 3, x: 162, y: 300 }
    ];
    const BW = 68, BH = 84;
    function nivelDe(guardadas, flagras, caiu) { return caiu ? 0 : (guardadas >= 18 && flagras === 0) ? 3 : (guardadas >= 13 && flagras <= 1) ? 2 : guardadas >= 7 ? 1 : 0; }

    function iniciar(host, opts) {
      host.innerHTML =
        '<div class="mg-hud"><span>TEMPO <b class="mg-t">30</b></span><div class="mg-rot">FLAGRAS <b class="mg-f">0</b>/3</div><span>NOTAS <b class="mg-p">0</b></span></div>' +
        '<div class="mg-palco"><canvas width="' + W + '" height="' + H + '"></canvas>' +
        '<div class="mg-tela mg-ini"><h2>Mandado de busca</h2><p>Toque nos esconderijos para guardar uma nota por toque, só com o agente de costas. Às vezes ele vira sem avisar. Esconderijo piscando vermelho será revistado: as notas dele somem. 3 flagras e acabou.</p><button class="btn grande mg-go" type="button">Começar a esconder</button></div>' +
        '<div class="mg-tela mg-fim" hidden><h2 class="mg-fim-t"></h2><p class="mg-fim-p"></p><div class="mg-fim-b"></div></div></div>';
      const $ = c => host.querySelector(c);
      const cv = $('canvas'), ctx = cv.getContext('2d');
      let e, vivo = true, ult = 0;
      preparar(['mg_comecar', 'cue_tensao_loop', 'cue_nota', 'cue_cheio', 'cue_agente_vira', 'cue_agente_de_costas', 'cue_revista_aviso', 'cue_revistado', 'cue_flagra'].concat(FANFARRA));
      const novo = () => {
        e = { rodando: false, t: DUR, fase: 'costas', ft: 1.6, mesa: NOTAS, guard: 0, flagras: 0, cheio: {}, txt: [], tremor: 0, caiu: false, rev: null, proxRev: 6 };
        LOCAIS.forEach(l => { e.cheio[l.id] = 0; });
      };
      novo();
      const texto = (x, y, s, c) => e.txt.push({ x, y, s, c, l: 0.9 });

      cv.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        if (!e.rodando) return;
        const r = cv.getBoundingClientRect(), x = (ev.clientX - r.left) * W / r.width, y = (ev.clientY - r.top) * H / r.height;
        const l = LOCAIS.find(z => x >= z.x && x <= z.x + BW && y >= z.y && y <= z.y + BH);
        if (!l || e.mesa <= 0 || e.cheio[l.id] >= l.cap) { if (l) som('cue_cheio'); return; }
        if (e.fase === 'olhando') {
          e.flagras++; e.tremor = 0.3; e.fase = 'costas'; e.ft = 1.6;
          const perdidas = Math.min(e.cheio[l.id], 3); e.cheio[l.id] -= perdidas; e.guard -= perdidas;
          texto(l.x, l.y, 'FLAGRA!', '#b13e53'); som('cue_flagra');
          if (e.flagras >= MAXFLAGRA) { e.caiu = true; fim(); }
          return;
        }
        e.cheio[l.id]++; e.guard++; e.mesa--;
        texto(l.x + 20, l.y + 8, '+1', '#ffcd75'); som('cue_nota');
        if (e.mesa <= 0 || e.guard >= LOCAIS.reduce((t, z) => t + z.cap, 0)) fim();
      });

      function fim() {
        e.rodando = false;
        const nivel = nivelDe(e.guard, e.flagras, e.caiu), nomes = ['Flagrado', 'Bronze', 'Prata', 'Ouro'];
        const res = { nivel, ganhou: nivel > 0, pontos: e.guard };
        $('.mg-fim-t').textContent = e.caiu ? 'Agente achou tudo' : 'Busca terminou: ' + nomes[nivel];
        $('.mg-fim-p').textContent = 'Notas escondidas: ' + e.guard + ' de ' + NOTAS + '. Flagras: ' + e.flagras + '.';
        const b = $('.mg-fim-b'); b.innerHTML = '';
        const mk = (rot, fn) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'btn grande'; x.textContent = rot; x.addEventListener('click', fn); b.appendChild(x); };
        if (opts.modo === 'livre') { mk('De novo', comecar); mk('Sair', () => { vivo = false; pararSons(); opts.onSair(res); }); }
        else mk('Continuar', () => { vivo = false; pararSons(); opts.onSair(res); });
        $('.mg-fim').hidden = false;
        pararSons(); som(FANFARRA[nivel]);
        if (opts.onFim) opts.onFim(res);
      }

      function passo(dt) {
        if (!e.rodando) return;
        e.t -= dt; e.ft -= dt; e.tremor = Math.max(0, e.tremor - dt);
        e.proxRev -= dt;
        if (!e.rev && e.proxRev <= 0) {                     // revista surpresa: esvazia um esconderijo com notas
          const c = LOCAIS.filter(z => e.cheio[z.id] > 0);
          if (c.length) { e.rev = { id: c[Math.floor(Math.random() * c.length)].id, t: 1.1 }; som('cue_revista_aviso'); }
          e.proxRev = 6 + Math.random() * 3;
        }
        if (e.rev) {
          e.rev.t -= dt;
          if (e.rev.t <= 0) {
            const n = e.cheio[e.rev.id]; e.guard -= n; e.cheio[e.rev.id] = 0;
            const l = LOCAIS.find(z => z.id === e.rev.id); if (n) texto(l.x, l.y, 'REVISTADO -' + n, '#b13e53'); e.tremor = 0.2; e.rev = null; som('cue_revistado');
          }
        }
        if (e.ft <= 0) {
          const prog = 1 - e.t / DUR;
          if (e.fase === 'costas') {
            const surpresa = prog > 0.25 && Math.random() < 0.3;      // vira sem avisar
            e.fase = surpresa ? 'olhando' : 'aviso';
            e.ft = surpresa ? 0.9 + Math.random() * 0.6 : Math.max(0.22, 0.5 - prog * 0.25);
            if (!surpresa) som('cue_agente_vira');                     // surpresa vira calado
          }
          else if (e.fase === 'aviso') { e.fase = 'olhando'; e.ft = 0.9 + Math.random() * 0.7; }
          else { e.fase = 'costas'; e.ft = Math.max(0.6, 1.9 - prog * 1.2) * (0.7 + Math.random() * 0.6); som('cue_agente_de_costas'); }
        }
        e.txt = e.txt.filter(t => { t.l -= dt; t.y -= 18 * dt; return t.l > 0; });
        if (e.t <= 0) { e.t = 0; fim(); }
      }

      const pix = (s, x, y, c, tam, al) => { ctx.fillStyle = c; ctx.font = 'bold ' + tam + 'px "Press Start 2P", "Courier New", monospace'; ctx.textAlign = al || 'left'; ctx.fillText(s, x, y); };
      function agente() {
        const x = 96, y = 34, olha = e.fase === 'olhando', av = e.fase === 'aviso';
        ctx.fillStyle = '#29366f'; ctx.fillRect(x - 6, y + 40, 60, 46);                 // corpo
        ctx.fillStyle = '#f4f4f4'; ctx.fillRect(x + 16, y + 40, 16, 10);                // gola
        ctx.fillStyle = '#ffcd75'; ctx.fillRect(x + 8, y + 14, 32, 28);                 // cabeça
        ctx.fillStyle = '#1a1c2c'; ctx.fillRect(x + 4, y + 6, 40, 12); ctx.fillRect(x + 2, y + 14, 44, 4);  // boné
        if (olha || av) {
          ctx.fillStyle = '#1a1c2c'; ctx.fillRect(x + 10, y + 24, 12, 7); ctx.fillRect(x + 26, y + 24, 12, 7);  // óculos
          ctx.fillStyle = olha ? '#b13e53' : '#ffcd75'; ctx.fillRect(x + 12, y + 26, 3, 2); ctx.fillRect(x + 28, y + 26, 3, 2);
          ctx.fillStyle = '#1a1c2c'; ctx.fillRect(x + 18, y + 35, 12, 2);
        } else { ctx.fillStyle = '#5d275d'; ctx.fillRect(x + 8, y + 20, 32, 22); }     // nuca/cabelo
        const leg = olha ? 'OLHANDO!' : av ? 'VAI VIRAR!' : 'DE COSTAS';
        pix(leg, W / 2, 140, olha ? '#b13e53' : av ? '#ffcd75' : '#38b764', 7, 'center');
      }
      function desenhar() {
        ctx.save();
        if (e.tremor > 0) ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
        ctx.fillStyle = e.fase === 'olhando' ? '#3a1d2e' : '#1a1c2c'; ctx.fillRect(-4, -4, W + 8, H + 8);
        ctx.fillStyle = '#242842'; ctx.fillRect(0, 152, W, 4);
        agente();
        pix('MESA: ' + e.mesa + ' NOTAS', W / 2, 178, '#94b0c2', 6, 'center');
        LOCAIS.forEach(l => {
          const n = e.cheio[l.id];
          ctx.fillStyle = '#f4f4f4'; ctx.fillRect(l.x - 1, l.y - 1, BW + 2, BH + 2);
          ctx.fillStyle = (e.rev && e.rev.id === l.id) ? ((Math.floor(e.rev.t * 8) % 2) ? '#b13e53' : '#5d275d') : n >= l.cap ? '#38b764' : '#333c57'; ctx.fillRect(l.x, l.y, BW, BH);
          pix(l.nome, l.x + BW / 2, l.y + 12, '#f4f4f4', 6, 'center');
          for (let i = 0; i < l.cap; i++) { ctx.fillStyle = i < n ? '#a7f070' : '#566c86'; ctx.fillRect(l.x + 6 + (i % 4) * 14, l.y + 28 + Math.floor(i / 4) * 14, 10, 10); }
          if (n > 0) pix(String(n) + '/' + l.cap, l.x + BW / 2, l.y + BH - 6, '#ffcd75', 6, 'center');
        });
        e.txt.forEach(t => pix(t.s, Math.min(W - 4, Math.max(4, t.x)), t.y, t.c, 6, 'left'));
        ctx.restore();
      }
      function hud() { $('.mg-t').textContent = Math.ceil(e.t); $('.mg-f').textContent = e.flagras; $('.mg-p').textContent = e.guard; }
      function loop(ts) {
        if (!vivo || !host.isConnected) { pararSons(); return; }
        const dt = Math.min(0.05, (ts - ult) / 1000 || 0); ult = ts;
        passo(dt); encaixar(cv); desenhar(); hud(); root.requestAnimationFrame(loop);
      }
      function comecar() { novo(); e.rodando = true; $('.mg-ini').hidden = true; $('.mg-fim').hidden = true; pararSons(); som('mg_comecar'); somLoop('cue_tensao_loop'); }
      $('.mg-go').addEventListener('click', comecar);
      root.requestAnimationFrame(ts => { ult = ts; loop(ts); });
    }
    return { iniciar, nivelDe };
  })();

  // ---------------- Base dos minigames novos ----------------
  // cfg: { hud: [esq, meio, dir] (html), intro: [titulo, texto, botao], canvas: true|false }
  function base(host, opts, cfg) {
    host.innerHTML =
      '<div class="mg-hud"><span>' + cfg.hud[0] + '</span><div class="mg-rot">' + cfg.hud[1] + '</div><span>' + cfg.hud[2] + '</span></div>' +
      '<div class="mg-palco">' + (cfg.canvas === false ? '<div class="mg-dom"></div>' : '<canvas width="' + MW + '" height="' + MH + '"></canvas>') +
      '<div class="mg-tela mg-ini"><h2>' + cfg.intro[0] + '</h2><p>' + cfg.intro[1] + '</p><button class="btn grande mg-go" type="button">' + cfg.intro[2] + '</button></div>' +
      '<div class="mg-tela mg-fim" hidden><h2 class="mg-fim-t"></h2><p class="mg-fim-p"></p><div class="mg-fim-b"></div></div></div>';
    const $ = c => host.querySelector(c);
    const B = { $, cv: $('canvas'), ctx: $('canvas') ? $('canvas').getContext('2d') : null, dom: $('.mg-dom'), vivo: true, passo: null, desenhar: null, comecar: null };
    preparar(['mg_comecar'].concat(FANFARRA, cfg.sons || []));
    B.pix = (str, x, y, c, tam, al) => { const ctx = B.ctx; ctx.fillStyle = c; ctx.font = 'bold ' + tam + 'px "Press Start 2P", "Courier New", monospace'; ctx.textAlign = al || 'left'; ctx.fillText(str, x, y); };
    B.hud = (a, b, c) => { const h = host.querySelector('.mg-hud'); h.children[0].innerHTML = a; h.children[1].innerHTML = b; h.children[2].innerHTML = c; };
    B.terminar = (res, titulo, texto, somFim) => {
      $('.mg-fim-t').textContent = titulo; $('.mg-fim-p').textContent = texto;
      const b = $('.mg-fim-b'); b.innerHTML = '';
      const mk = (rot, fn) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'btn grande'; x.textContent = rot; x.addEventListener('click', fn); b.appendChild(x); };
      if (opts.modo === 'livre') { mk('De novo', B.iniciarJogo); mk('Sair', () => { B.vivo = false; pararSons(); opts.onSair(res); }); }
      else mk('Continuar', () => { B.vivo = false; pararSons(); opts.onSair(res); });
      $('.mg-fim').hidden = false;
      pararSons(); som(somFim || FANFARRA[res.nivel]);
      if (opts.onFim) opts.onFim(res);
    };
    B.iniciarJogo = () => { $('.mg-ini').hidden = true; $('.mg-fim').hidden = true; pararSons(); som('mg_comecar'); B.comecar(); (cfg.loops || []).forEach(somLoop); };
    $('.mg-go').addEventListener('click', B.iniciarJogo);
    let ult = 0;
    const loop = ts => {
      if (!B.vivo || !host.isConnected) { pararSons(); return; }
      const dt = Math.min(0.05, (ts - ult) / 1000 || 0); ult = ts;
      if (B.passo) B.passo(dt);
      if (B.cv) encaixar(B.cv);
      if (B.desenhar) B.desenhar();
      root.requestAnimationFrame(loop);
    };
    root.requestAnimationFrame(ts => { ult = ts; loop(ts); });
    return B;
  }
  const NOMES = ['Flagrado', 'Bronze', 'Prata', 'Ouro'];
  const ptr = (B, ev) => { const r = B.cv.getBoundingClientRect(); return { x: (ev.clientX - r.left) * MW / r.width, y: (ev.clientY - r.top) * MH / r.height }; };

  // ---------------- Mala Certa ----------------
  const MALA = (function () {
    const RODADAS = 7, HW = [0.15, 0.125, 0.105, 0.09, 0.075, 0.062, 0.05];
    function nivelDe(a) { return a >= 6 ? 3 : a >= 4 ? 2 : a >= 2 ? 1 : 0; }
    function iniciar(host, opts) {
      const B = base(host, opts, { hud: ['RODADA <b>1</b>/7', 'ACERTOS <b>0</b>', 'SUOR <b>0</b>'], intro: ['Mala para o aliado', 'Toque para parar o ponteiro dentro da faixa verde. A faixa encolhe e o ponteiro acelera. 6 acertos em 7 rodadas é ouro.', 'Abrir a mala'],
        sons: ['mala_tick', 'mala_fechou', 'mala_centro', 'mala_nao_fecha', 'mala_flagrada'] });
      let e;
      const ctx = B.ctx;
      const novo = () => { e = { rod: 0, ac: 0, suor: 0, pos: 0, dir: 1, c: 0.5, fase: 'jogando', ft: 0, msg: '', msgc: '#fff', rodando: true }; sorteia(); };
      const sorteia = () => { e.c = 0.22 + Math.random() * 0.56; e.pos = Math.random() < 0.5 ? 0 : 1; e.dir = e.pos ? -1 : 1; som('mala_tick'); };
      B.comecar = () => { novo(); };
      B.cv.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        if (!e || !e.rodando || e.fase !== 'jogando') return;
        const acertou = Math.abs(e.pos - e.c) <= HW[e.rod];
        if (acertou) { const centro = Math.abs(e.pos - e.c) < HW[e.rod] * 0.3; e.ac++; e.msg = centro ? 'NO CENTRO!' : 'FECHOU!'; e.msgc = '#a7f070'; som(centro ? 'mala_centro' : 'mala_fechou'); }
        else { e.suor++; e.msg = 'NAO FECHA...'; e.msgc = '#ef7d57'; som('mala_nao_fecha'); }
        e.fase = 'feedback'; e.ft = 0.7;
      });
      B.passo = dt => {
        if (!e || !e.rodando) return;
        if (e.fase === 'jogando') {
          const v = 0.85 + e.rod * 0.28;
          e.pos += e.dir * v * dt;
          if (e.pos >= 1) { e.pos = 1; e.dir = -1; } else if (e.pos <= 0) { e.pos = 0; e.dir = 1; }
        } else {
          e.ft -= dt;
          if (e.ft <= 0) {
            e.rod++;
            if (e.rod >= RODADAS) {
              e.rodando = false;
              const nivel = nivelDe(e.ac), res = { nivel, ganhou: nivel > 0, pontos: e.ac };
              B.terminar(res, nivel === 0 ? 'O aliado abriu a mala' : 'Mala fechada: ' + NOMES[nivel], e.ac + ' de ' + RODADAS + ' rodadas no ponto.', nivel === 0 ? 'mala_flagrada' : null);
            } else { e.fase = 'jogando'; e.msg = ''; sorteia(); }
          }
        }
        B.hud('RODADA <b>' + Math.min(e.rod + 1, RODADAS) + '</b>/' + RODADAS, 'ACERTOS <b>' + e.ac + '</b>', 'SUOR <b>' + e.suor + '</b>');
      };
      B.desenhar = () => {
        if (!e) { ctx.fillStyle = '#1a1c2c'; ctx.fillRect(0, 0, MW, MH); return; }
        ctx.fillStyle = '#1a1c2c'; ctx.fillRect(0, 0, MW, MH);
        ctx.fillStyle = '#242842'; ctx.fillRect(0, 262, MW, MH - 262);
        // aliado
        ctx.fillStyle = '#29366f'; ctx.fillRect(84, 96, 72, 56); ctx.fillStyle = '#f4f4f4'; ctx.fillRect(112, 96, 16, 10);
        ctx.fillStyle = '#ffcd75'; ctx.fillRect(96, 60, 48, 40);
        ctx.fillStyle = '#1a1c2c'; ctx.fillRect(100, 74, 10, 4); ctx.fillRect(130, 74, 10, 4); ctx.fillRect(108, 88, 24, 3);   // olhos e boca
        ctx.fillStyle = '#41a6f6'; for (let i = 0; i < Math.min(e.suor, 6); i++) ctx.fillRect(86 + (i % 3) * 52 + (i > 2 ? 6 : 0), 64 + (i % 3) * 10 + (i > 2 ? 14 : 0), 4, 7);
        // maleta com notas
        ctx.fillStyle = '#5d275d'; ctx.fillRect(60, 176, 120, 60); ctx.fillStyle = '#ef7d57'; ctx.fillRect(108, 170, 24, 8);
        ctx.fillStyle = '#1a1c2c'; ctx.fillRect(60, 204, 120, 3);
        for (let i = 0; i < e.ac; i++) { ctx.fillStyle = '#a7f070'; ctx.fillRect(66 + i * 16, 182 + (i % 2) * 3, 12, 18); ctx.fillStyle = '#38b764'; ctx.fillRect(68 + i * 16, 186 + (i % 2) * 3, 8, 3); }
        // barra
        const bx = 20, bw = 200, by = 316;
        ctx.fillStyle = '#333c57'; ctx.fillRect(bx, by, bw, 26); ctx.strokeStyle = '#f4f4f4'; ctx.lineWidth = 2; ctx.strokeRect(bx, by, bw, 26);
        ctx.fillStyle = '#38b764'; const hw = HW[Math.min(e.rod, RODADAS - 1)]; ctx.fillRect(bx + (e.c - hw) * bw, by + 2, hw * 2 * bw, 22);
        ctx.fillStyle = e.fase === 'jogando' ? '#ffcd75' : e.msgc; ctx.fillRect(bx + e.pos * bw - 2, by - 6, 4, 38);
        B.pix(e.fase === 'jogando' ? 'TOQUE!' : e.msg, 120, 380, e.fase === 'jogando' ? '#94b0c2' : e.msgc, 8, 'center');
      };
    }
    return { iniciar, nivelDe };
  })();

  // ---------------- Fuga de Jatinho ----------------
  const FUGA = (function () {
    const DUR = 30, LARG = 80, D = MH - 320;   // D: o jatinho desce para o pé da tela nova
    function nivelDe(vidas) { return vidas >= 3 ? 3 : vidas === 2 ? 2 : vidas === 1 ? 1 : 0; }
    function iniciar(host, opts) {
      const B = base(host, opts, { hud: ['TEMPO <b>30</b>', 'COMBUSTIVEL <b>3</b>', 'PISTA <b>2</b>'], intro: ['Decolagem', 'Toque à esquerda ou à direita do jatinho para trocar de pista. Desvie dos helicópteros por 30 segundos. Cada batida gasta combustível.', 'Decolar'],
        sons: ['fuga_decolagem', 'fuga_troca_pista', 'fuga_batida', 'fuga_combustivel_baixo', 'fuga_motor_loop', 'fuga_helice_loop'], loops: ['fuga_motor_loop', 'fuga_helice_loop'] });
      let e; const ctx = B.ctx;
      const novo = () => { e = { t: DUR, pista: 1, vidas: 3, obs: [], prox: 0.8, inv: 0, nuv: [], rodando: true, tremor: 0, ult: -1 }; for (let i = 0; i < 6; i++) e.nuv.push({ x: Math.random() * MW, y: Math.random() * MH, v: (20 + Math.random() * 30) * VK }); };
      B.comecar = () => { novo(); som('fuga_decolagem'); };
      B.cv.addEventListener('pointerdown', ev => {
        ev.preventDefault();
        if (!e || !e.rodando) return;
        const p = ptr(B, ev), col = Math.min(2, Math.floor(p.x / LARG));
        if (col < e.pista) e.pista--; else if (col > e.pista) e.pista++;
        som('fuga_troca_pista');
      });
      B.passo = dt => {
        if (!e || !e.rodando) return;
        const prog = 1 - e.t / DUR;
        e.t -= dt; e.prox -= dt; e.inv = Math.max(0, e.inv - dt); e.tremor = Math.max(0, e.tremor - dt);
        if (e.prox <= 0) {
          const larga = prog > 0.2 && Math.random() < 0.35, p = larga ? (Math.random() < 0.5 ? 0 : 1) : Math.floor(Math.random() * 3);
          e.obs.push({ p, n: larga ? 2 : 1, y: -30, v: (105 + prog * 90 + Math.random() * 20) * VK, a: 0 });
          e.prox = Math.max(0.5, 1.0 - prog * 0.5) * (0.85 + Math.random() * 0.4);
        }
        e.obs.forEach(o => { o.y += o.v * dt; o.a += dt * 20; });
        if (e.inv <= 0) {
          const hit = e.obs.find(o => o.y > 256 + D && o.y < 290 + D && e.pista >= o.p && e.pista < o.p + o.n);
          if (hit) { e.vidas--; e.inv = 1.2; e.tremor = 0.3; som(e.vidas === 1 ? 'fuga_combustivel_baixo' : 'fuga_batida'); if (e.vidas <= 0) return fim(); }
        }
        e.obs = e.obs.filter(o => o.y < MH + 20);
        e.nuv.forEach(n => { n.y += n.v * dt; if (n.y > MH + 10) { n.y = -20; n.x = Math.random() * MW; } });
        if (e.t <= 0) { e.t = 0; fim(); }
        B.hud('TEMPO <b>' + Math.ceil(e.t) + '</b>', 'COMBUSTIVEL <b>' + e.vidas + '</b>', 'PISTA <b>' + (e.pista + 1) + '</b>');
      };
      const fim = () => {
        e.rodando = false;
        const nivel = nivelDe(e.vidas), res = { nivel, ganhou: nivel > 0, pontos: e.vidas };
        B.terminar(res, nivel === 0 ? 'Sem combustível' : 'Pouso em segredo: ' + NOMES[nivel], e.vidas > 0 ? 'Combustível restante: ' + e.vidas + ' de 3.' : 'O jatinho virou planador.');
      };
      B.desenhar = () => {
        ctx.save();
        if (e && e.tremor > 0) ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
        ctx.fillStyle = '#0d1b3a'; ctx.fillRect(-4, -4, MW + 8, MH + 8);
        if (!e) { ctx.restore(); return; }
        ctx.fillStyle = '#29366f'; ctx.fillRect(LARG - 1, 0, 2, MH); ctx.fillRect(2 * LARG - 1, 0, 2, MH);
        ctx.fillStyle = '#3b5dc9'; e.nuv.forEach(n => { ctx.fillRect(n.x, n.y, 26, 6); ctx.fillRect(n.x + 6, n.y - 4, 14, 4); });
        e.obs.forEach(o => {
          const x = o.p * LARG + 6, w = o.n * LARG - 12;
          ctx.fillStyle = 'rgba(255,205,117,0.16)'; ctx.fillRect(o.p * LARG, o.y, o.n * LARG, 90);            // holofote
          for (let k = 0; k < o.n; k++) {
            const cx = o.p * LARG + k * LARG + LARG / 2;
            ctx.fillStyle = '#b13e53'; ctx.fillRect(cx - 14, o.y, 28, 14); ctx.fillStyle = '#1a1c2c'; ctx.fillRect(cx - 6, o.y + 4, 12, 6);
            ctx.fillStyle = '#94b0c2'; ctx.fillRect(cx - 24 + (Math.floor(o.a) % 2) * 6, o.y - 4, 48 - (Math.floor(o.a) % 2) * 12, 3); ctx.fillRect(cx + 12, o.y + 6, 18, 3);
          }
        });
        const px = e.pista * LARG + LARG / 2;
        if (e.inv <= 0 || Math.floor(e.inv * 10) % 2) {
          ctx.fillStyle = '#f4f4f4'; ctx.fillRect(px - 5, 262 + D, 10, 34); ctx.fillRect(px - 22, 280 + D, 44, 8); ctx.fillRect(px - 10, 292 + D, 20, 5);
          ctx.fillStyle = '#41a6f6'; ctx.fillRect(px - 3, 268 + D, 6, 8); ctx.fillStyle = '#ef7d57'; ctx.fillRect(px - 3, 298 + D, 6, 6 + (Math.floor(e.t * 12) % 2) * 4);
        }
        ctx.restore();
      };
    }
    return { iniciar, nivelDe };
  })();

  // ---------------- Coletiva de Imprensa ----------------
  const COLETIVA = (function () {
    const Q = [
      ['O banco tem um rombo de quantos bilhões, exatamente?', 'O número é preliminar e está sendo auditado por quem sabe contar.', 'Uns poucos. Depende de quem faz a conta.', 'Mais do que cabe na minha calculadora, e olha que ela é grande.'],
      ['Por que o jatinho está no nome do porteiro do prédio?', 'O porteiro é um investidor sofisticado e a operação seguiu as normas internas.', 'Ele pediu um empréstimo e eu ajudei.', 'Porque o porteiro não tem nada no nome, e isso é muito prático.'],
      ['O senhor pretende delatar alguém?', 'Eu confio plenamente nas instituições e no calendário delas.', 'Só se me perguntarem com educação.', 'Depende de quem me abandonar primeiro.'],
      ['Onde está o dinheiro dos clientes?', 'Em ativos de alta liquidez e baixa visibilidade, conforme o regulamento.', 'Está por aí, rendendo.', 'Procurei na gaveta e só achei clipes.'],
      ['Por que a planilha tem uma aba chamada "Não abrir"?', 'É uma aba de boas práticas de governança, e o nome é didático.', 'Foi brincadeira do estagiário.', 'Porque, se abrissem, vocês iam ver.'],
      ['O fundo pagou uma festa de aniversário?', 'Foi um evento institucional de integração, com música ao vivo e compliance.', 'Foi um aniversário pequeno.', 'Foi ótima. Tinha até fonte de chocolate do fundo.'],
      ['Os aliados recebem mesada do banco?', 'Recebem apoio logístico voluntário e devidamente agradecido.', 'Pagamos o que combinamos.', 'Mesada atrasada dá briga, o senhor nem imagina.'],
      ['Por que o cofre foi trocado de madrugada?', 'Foi uma atualização programada de segurança, em janela noturna de manutenção.', 'O antigo estava cheio.', 'Eu queria ver se a furadeira cabia no elevador.'],
      ['O senhor já viajou ao exterior com dinheiro na mala?', 'Viajo com a bagagem regulamentar e declaro tudo o que a lei exige que eu lembre.', 'Só com o necessário para a viagem.', 'Na mala, nunca. Na cueca é outra pergunta.'],
      ['O CDB de 140% não era bom demais para ser verdade?', 'Rentabilidade passada não é garantia de rentabilidade futura. Nem de passada.', 'Era um produto agressivo, admito.', 'Era bom demais. A parte da verdade a gente nunca prometeu.'],
      ['Quem autorizou a compra do haras?', 'A decisão foi colegiada, tomada em reunião sem ata, por unanimidade dos presentes.', 'Foi o conselho, eu acho.', 'Fui eu. O cavalo concordou.'],
      ['O senhor tem medo de ser preso?', 'Tenho total respeito pelo devido processo legal e por cada um dos seus recursos.', 'Ninguém gosta de pensar nisso.', 'Medo, não. Tenho três passaportes.'],
      ['Por que o banco tem mais diretores do que clientes?', 'Nossa governança é robusta e foi dimensionada para o crescimento que virá.', 'Gostamos de gente qualificada por perto.', 'Cada aliado indicou alguém. Ninguém indicou um contador.']
    ];
    const RODADAS = 5, PONTOS = [2, 1, 0];
    // reação da sala por pontos da resposta (2 = evasiva perfeita, 1 = meia resposta, 0 = sincera); sorteia uma
    const REACOES = [
      ['Jornalistas se entreolham, sem entender nada.', 'Silêncio na sala. Alguém pergunta qual foi a pergunta.', 'Repórter risca a pergunta do bloquinho e desiste.', 'A tradutora de libras pede uma pausa.'],
      ['Repórter anota com cara de dúvida.', 'Murmúrio na sala: "isso foi um sim ou um não?"', 'Um repórter levanta a mão para a pergunta seguinte. A mesma.', 'O assessor sorri amarelo no canto da sala.'],
      ['Flashes em cima do banqueiro.', 'O assessor desmaia no canto da sala.', 'Três repórteres saem correndo para ligar para a redação.', 'A frase já virou figurinha antes de terminar.']
    ];
    function nivelDe(p) { return p >= 9 ? 3 : p >= 7 ? 2 : p >= 4 ? 1 : 0; }
    function iniciar(host, opts) {
      const B = base(host, opts, { hud: ['RODADA <b>1</b>/5', 'PONTOS <b>0</b>', 'TEMPO <b>9</b>'], canvas: false, intro: ['Coletiva de imprensa', 'Escolha a resposta mais evasiva: a que diz muito e não diz nada. Sinceridade rende manchete. O tempo encurta a cada pergunta.', 'Subir ao púlpito'],
        sons: ['col_pergunta', 'col_flash', 'col_evasiva_perfeita', 'col_meia_resposta', 'col_sincera_flagrado', 'col_tick', 'col_tempo_acabando', 'col_murmurio_loop'], loops: ['col_murmurio_loop'] });
      let e; const dom = B.dom;
      const novo = () => {
        const ord = Q.map((q, i) => i).sort(() => Math.random() - 0.5).slice(0, RODADAS);
        e = { ord, rod: 0, pts: 0, t: 0, tmax: 0, trava: false, rodando: true }; pergunta();
      };
      B.comecar = novo;
      const pergunta = () => {
        const q = Q[e.ord[e.rod]]; e.tmax = Math.max(5, 9 - e.rod * 0.8); e.t = e.tmax; e.trava = false; e.seg = Math.ceil(e.t); e.acabando = false;
        som('col_pergunta');
        const ops = [0, 1, 2].sort(() => Math.random() - 0.5);
        dom.innerHTML = '<div class="cq-rep">REPÓRTER</div><p class="cq-q">' + q[0] + '</p><div class="cq-tempo"><i></i></div>' +
          ops.map(k => '<button type="button" class="cq-op" data-k="' + k + '">' + q[k + 1] + '</button>').join('') + '<p class="cq-fb">&nbsp;</p>';
        dom.querySelectorAll('.cq-op').forEach(b => b.addEventListener('click', () => escolher(+b.dataset.k)));
      };
      const escolher = k => {
        if (!e || !e.rodando || e.trava) return;
        e.trava = true; const p = k < 0 ? 0 : PONTOS[k]; e.pts += p;
        if (p === 2) som('col_evasiva_perfeita'); else if (p === 1) som('col_meia_resposta'); else { som('col_sincera_flagrado'); som('col_flash'); }
        dom.querySelectorAll('.cq-op').forEach(b => { const kk = +b.dataset.k; b.classList.add(kk === 0 ? 'cq-ok' : kk === k ? 'cq-ruim' : 'cq-off'); });
        dom.querySelector('.cq-fb').textContent = k < 0 ? 'Sem resposta: o silêncio virou manchete.' : (r => r[Math.floor(Math.random() * r.length)])(REACOES[2 - p]);
        setTimeout(() => {
          if (!e || !e.rodando || !host.isConnected) return;
          e.rod++;
          if (e.rod >= RODADAS) {
            e.rodando = false;
            const nivel = nivelDe(e.pts), res = { nivel, ganhou: nivel > 0, pontos: e.pts };
            B.terminar(res, nivel === 0 ? 'Virou meme na hora' : 'Coletiva encerrada: ' + NOMES[nivel], 'Evasivas: ' + e.pts + ' de ' + RODADAS * 2 + ' pontos.');
          } else pergunta();
        }, 1300);
      };
      B.passo = dt => {
        if (!e || !e.rodando || e.trava) return;
        e.t -= dt;
        const seg = Math.max(0, Math.ceil(e.t));
        if (seg !== e.seg) { e.seg = seg; if (seg > 0 && seg <= 3) som('col_tick'); }
        if (!e.acabando && e.t <= 2) { e.acabando = true; som('col_tempo_acabando'); }
        const barra = dom.querySelector('.cq-tempo i'); if (barra) barra.style.width = Math.max(0, e.t / e.tmax * 100) + '%';
        if (e.t <= 0) escolher(-1);
        B.hud('RODADA <b>' + Math.min(e.rod + 1, RODADAS) + '</b>/' + RODADAS, 'PONTOS <b>' + e.pts + '</b>', 'TEMPO <b>' + Math.max(0, Math.ceil(e.t)) + '</b>');
      };
    }
    return { iniciar, nivelDe };
  })();

  // ---------------- Chuva de Notas ----------------
  const CHUVA = (function () {
    const DUR = 30, D = MH - 320;   // D: a maleta desce para o pé da tela nova
    function nivelDe(p, falsas) { return falsas >= 4 ? 0 : p >= 34 ? 3 : p >= 22 ? 2 : p >= 10 ? 1 : 0; }
    function iniciar(host, opts) {
      const B = base(host, opts, { hud: ['TEMPO <b>30</b>', 'FALSAS <b>0</b>/4', 'R$ <b>0</b> mi'], intro: ['Chuva de notas', 'Arraste para mover a maleta. Pegue as notas (as douradas valem 3) e desvie das falsas, marcadas com X. 4 notas falsas e acabou.', 'Abrir a maleta'],
        sons: ['chuva_nota', 'chuva_ouro', 'chuva_falsa', 'chuva_ambiente_loop'], loops: ['chuva_ambiente_loop'] });
      let e; const ctx = B.ctx;
      const novo = () => { e = { t: DUR, x: 120, alvo: 120, it: [], prox: 0.4, pts: 0, falsas: 0, txt: [], tremor: 0, rodando: true }; };
      B.comecar = novo;
      const mover = ev => { if (e && e.rodando) e.alvo = Math.max(20, Math.min(220, ptr(B, ev).x)); };
      B.cv.addEventListener('pointerdown', ev => { ev.preventDefault(); mover(ev); });
      B.cv.addEventListener('pointermove', mover);
      B.passo = dt => {
        if (!e || !e.rodando) return;
        const prog = 1 - e.t / DUR;
        e.t -= dt; e.prox -= dt; e.tremor = Math.max(0, e.tremor - dt);
        const d = e.alvo - e.x, vmax = 170 * dt; e.x += Math.max(-vmax, Math.min(vmax, d));
        if (e.prox <= 0) {
          const r = Math.random(), tipo = r < 0.3 + prog * 0.12 ? 'falsa' : r < 0.42 + prog * 0.12 ? 'ouro' : 'nota';
          e.it.push({ x: 16 + Math.random() * 208, y: -16, v: (80 + prog * 90 + Math.random() * 30) * VK, tipo });
          e.prox = Math.max(0.3, 0.6 - prog * 0.25) * (0.7 + Math.random() * 0.6);
        }
        e.it.forEach(i => { i.y += i.v * dt; });
        e.it = e.it.filter(i => {
          if (i.y > 272 + D && i.y < 304 + D && Math.abs(i.x - e.x) < 26) {
            if (i.tipo === 'falsa') { e.falsas++; e.pts = Math.max(0, e.pts - 4); e.tremor = 0.25; e.txt.push({ x: i.x, y: 262 + D, s: 'FALSA! -4', c: '#b13e53', l: 0.9 }); som('chuva_falsa'); }
            else { const v = i.tipo === 'ouro' ? 3 : 1; e.pts += v; e.txt.push({ x: i.x, y: 262 + D, s: '+' + v, c: '#ffcd75', l: 0.7 }); som(i.tipo === 'ouro' ? 'chuva_ouro' : 'chuva_nota'); }
            return false;
          }
          return i.y < MH + 10;
        });
        e.txt = e.txt.filter(t => { t.l -= dt; t.y -= 20 * dt; return t.l > 0; });
        B.hud('TEMPO <b>' + Math.ceil(e.t) + '</b>', 'FALSAS <b>' + e.falsas + '</b>/4', 'R$ <b>' + e.pts + '</b> mi');
        if (e.falsas >= 4 || e.t <= 0) fim();
      };
      const fim = () => {
        e.rodando = false; e.t = Math.max(0, e.t);
        const nivel = nivelDe(e.pts, e.falsas), res = { nivel, ganhou: nivel > 0, pontos: e.pts };
        B.terminar(res, e.falsas >= 4 ? 'Chuva de nota falsa' : nivel === 0 ? 'Só molhou' : 'Colheita: ' + NOMES[nivel], 'Notas guardadas: R$ ' + e.pts + ' mi. Falsas pegas: ' + e.falsas + '.');
      };
      B.desenhar = () => {
        ctx.save();
        if (e && e.tremor > 0) ctx.translate((Math.random() - 0.5) * 4, (Math.random() - 0.5) * 4);
        ctx.fillStyle = '#1a1c2c'; ctx.fillRect(-4, -4, MW + 8, MH + 8);
        ctx.fillStyle = '#242842'; ctx.fillRect(0, 0, MW, 14); for (let i = 0; i < MW; i += 24) ctx.fillRect(i + 4, 14, 10, 6);
        if (!e) { ctx.restore(); return; }
        e.it.forEach(i => {
          const cor = i.tipo === 'ouro' ? '#ffcd75' : i.tipo === 'falsa' ? '#a7a1c2' : '#a7f070';
          ctx.fillStyle = '#1a1c2c'; ctx.fillRect(i.x - 11, i.y - 8, 22, 16); ctx.fillStyle = cor; ctx.fillRect(i.x - 10, i.y - 7, 20, 14);
          if (i.tipo === 'falsa') { ctx.fillStyle = '#b13e53'; ctx.fillRect(i.x - 6, i.y - 1, 12, 2); ctx.fillRect(i.x - 1, i.y - 6, 2, 12); ctx.save(); ctx.translate(i.x, i.y); ctx.rotate(0.78); ctx.fillRect(-6, -1, 12, 2); ctx.restore(); }
          else { ctx.fillStyle = i.tipo === 'ouro' ? '#ef7d57' : '#38b764'; ctx.fillRect(i.x - 3, i.y - 3, 6, 6); }
        });
        ctx.fillStyle = '#5d275d'; ctx.fillRect(e.x - 24, 286 + D, 48, 26); ctx.fillStyle = '#b13e53'; ctx.fillRect(e.x - 24, 286 + D, 48, 5);
        ctx.fillStyle = '#ffcd75'; ctx.fillRect(e.x - 4, 296 + D, 8, 6); ctx.fillStyle = '#ef7d57'; ctx.fillRect(e.x - 8, 280 + D, 16, 6);
        e.txt.forEach(t => B.pix(t.s, Math.min(200, Math.max(4, t.x - 16)), t.y, t.c, 6, 'left'));
        ctx.restore();
      };
    }
    return { iniciar, nivelDe };
  })();

  GM.minigames = { registro: { trituradora: TRITURA, cueca: CUECA, mala: MALA, coletiva: COLETIVA, fuga: FUGA, chuva: CHUVA } };
  if (typeof module !== 'undefined' && module.exports) module.exports = GM.minigames;
})(typeof window !== 'undefined' ? window : globalThis);
