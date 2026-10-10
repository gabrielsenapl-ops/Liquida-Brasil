// sprites.js - pixel art procedural: mapas de caracteres + paleta de 16 cores (SPEC 9).
// Cada sprite é um array de strings; cada caractere é uma cor da PALETA ('.' = transparente).
// Para trocar um desenho: edite o mapa abaixo OU ponha assets/sprites/<nome>.png (mesmo tamanho).
(function (root) {
  const GM = root.GM = root.GM || {};

  // Paleta (as mesmas cores das variáveis do topo de css/style.css)
  const PALETA = {
    k: '#1a1c2c', // preto
    p: '#5d275d', // roxo escuro
    r: '#b13e53', // vermelho
    o: '#ef7d57', // laranja
    y: '#ffcd75', // amarelo (também a pele)
    g: '#a7f070', // verde claro
    G: '#38b764', // verde
    e: '#257179', // verde escuro
    b: '#29366f', // azul escuro
    B: '#3b5dc9', // azul
    l: '#41a6f6', // azul claro
    c: '#73eff7', // ciano
    w: '#f4f4f4', // branco
    s: '#94b0c2', // cinza claro
    S: '#566c86', // cinza
    d: '#333c57'  // cinza escuro
  };

  // Retratos 16x16, inimigos 32x32, ícones 12x12
  const MAPAS = {
    icone_cadeado: [   // página bloqueada do Diário do Rombo
      '....kkkk....',
      '...kSSSSk...',
      '..kS....Sk..',
      '..kS....Sk..',
      '..kS....Sk..',
      '.kkkkkkkkkk.',
      '.kyyyyyyyyk.',
      '.kyyykkyyyk.',
      '.kyyykkyyyk.',
      '.kyyyykyyyk.',
      '.kyyyyyyyyk.',
      '.kkkkkkkkkk.'
    ],
    retrato_bolso: [
      '................',
      '................',
      '.....kkkkkk.....',
      '....kkkkkkkk....',
      '...kkkkkkkkkk...',
      '...kkyyyyyykk...',
      '...kykyyyykyk...',
      '...kyyyyyyyyk...',
      '...kyyyooyyyk...',
      '...kyykkkkyyk...',
      '....kyyyyyyk....',
      '.....kkyykk.....',
      '...kllwwwwllk...',
      '..klwcclwrlccck.',
      '.kclccclwrlwwcck',
      '.kcccccllrlccccc'
    ],
    // rosto novo: Topete de campanha (escolhido em prototipos/aliados.html)
    retrato_cofreaberto: [
      '......kkkkk.....',
      '.....kSSSSSk....',
      '....kSSSSSSSk...',
      '...kSSSSSSSSk...',
      '...kSSSSSSSSk...',
      '...kSyyyyyySk...',
      '...kykyyyykyk...',
      '...kyyyyyyyyk...',
      '...kyyyooyyyk...',
      '...kykwwwwkyk...',
      '....kyyyyyyk....',
      '.....kkyykk.....',
      '...kbbwwwwbkkkkS',
      '..kbbbbwGwbkyoyS',
      '.kbbbbbwGwbkoyyS',
      '.kbbbbbbGbbkkkkS'
    ],
    retrato_principe: [
      '................',
      '................',
      '.....kooook.....',
      '....kooooook....',
      '...kooooooook...',
      '...koyyyyyyok...',
      '...kykyyyykyk...',
      '...kyyyyyyyyk...',
      '...kyyyooyyyk...',
      '...kyykkkkyyk...',
      'kwkwkyyyyyyk....',
      'wkwkwkkyykk.....',
      'kkkkkBwwwwBBk...',
      'kwwwkBBwkwBBBk..',
      'kkkkkBBwkwBBBBk.',
      '.kBBBBBBkBBBBBk.'
    ],
    // rosto novo: Calvo de óculos (escolhido em prototipos/aliados.html)
    retrato_aposentadoriaalheia: [
      '................',
      '................',
      '.....kkkkkk.....',
      '....kyyyyyyk....',
      '...kwyyyyyywk...',
      '...kwwyyyywwk...',
      '...kskssssksk...',
      '...kyyyyyyyyk...',
      '...kyyyooyyyk...',
      '...kykyyyykyk...',
      '....kykkkkyk....',
      '.....kkyykk.y...',
      '...kddwwwwdoooo.',
      '..kddddwrwdoookr',
      '.kdddddwrwdoooor',
      '.kddddddrddodok.'
    ],
    // rosto novo: Cavanhaque (escolhido em prototipos/aliados.html)
    retrato_quadradinho: [
      '................',
      '................',
      '.....kddddk.....',
      '....kddddddk....',
      '...kddddddddk...',
      '...kdkkyykkdk...',
      '...kykyyyykyk...',
      '...kyyyyyyyyk...',
      '...kyyyooyyyk...',
      '...kyyykkyyyk...',
      '....kyyddyyk....',
      '.....kkyykk.....',
      '...keewwwweek...',
      '..keeeewyweeek..',
      '.keeeeewwweeeek.',
      '.keeeeeeoeeeeek.'
    ],
    retrato_partidoelastico: [
      '................',
      '.kk..........kk.',
      '.krrrrrrrrrrrrk.',
      '.kk.kkkkkkkk.kk.',
      '...kkkkkkkkkk...',
      '...kkyyyyyykk...',
      '...kykyyyykyk...',
      '...kyyyyyyyyk...',
      '...kyyyooyyyk...',
      '...kyykkkkyyk...',
      '....kyyyyyyk....',
      '.....kkyykk.....',
      '...kppwwwwppk...',
      '..kppppwowpppk..',
      '.kpppppwowppppk.',
      '.kppppppopppppk.'
    ],
    retrato_gaveta: [
      '....kkkkkkkk....',
      '..kkkkkkkkkkkk..',
      '.kkkkkkkkkkkkkk.',
      '.kkkkkkkkkkkkkk.',
      '.kkkkyyyyyykkkk.',
      '..kkyyyyyyyykk..',
      '..kkykyyyykykk..',
      '..kkyyyyyyyykk..',
      '...kyyyooyyyk...',
      '...kyykkkkyyk...',
      '....kyyyyyyk....',
      '.....kkyykkkkkkk',
      '...kSSwwwwSkssss',
      '..kSSSSwBwSkssys',
      '.kSSSSSwBwSkkkkk',
      '.kSSSSSSBSSSSSk.'
    ],
    // rosto novo: Risca preta (escolhido em prototipos/aliados.html)
    retrato_calculadora: [
      '................',
      '................',
      '.....kkkkkk.....',
      '....kkkkkkkk....',
      '...kkkkkkkkkk...',
      '...kyyyyyykkk...',
      '...kskssssksk...',
      '...kyyyyyyyyk...',
      '...kyyyooyyyk...',
      '...kykyyyykyk...',
      '....kykkkkyk....',
      '.....kkyykkkkkkk',
      '...krrwwwwrkgggk',
      '..krrrrwkwrksksk',
      '.krrrrrwkwrksksk',
      '.krrrrrrkrrkkkkk'
    ],
    retrato_juristacaro: [
      '................',
      '................',
      '.....kSSSSk.....',
      '....kSSSSSSk....',
      '...kSSSSSSSSk...',
      '...kSyyyyyySk...',
      '...kskssssksk...',
      '...kyyyyyyyyk...',
      '...kyyyooyyyk...',
      '...kyykkkkyyk...',
      '....kyyyyyyk....',
      '.....kkyykk.....',
      '...kkwwwwwwkk...',
      '..kkkkkwwwkkkk..',
      '.kkkkkkwwwkkkkk.',
      '.kkkkkkkwkkkkkk.'
    ],
    retrato_tofu: [
      '................',
      '................',
      '.....kkkkkk.....',
      '....kkkkkkkk....',
      '...kkkkkkkkkk...',
      '...kkyyyyyykk...',
      '...kkdkkkkdkk...',
      '...kyyyyyyyyk...',
      '...kyyyooyyyk...',
      '...kyykkkkyyk...',
      '....kyyyyyyk....',
      '.....kkyykkkkkk.',
      '...kkkwwwwkkwwk.',
      '..kkkkkwwwkkwsk.',
      '.kkkkkkwwwkkssk.',
      '.kkkkkkkwkkkkkk.'
    ],
    retrato_inquerito: [
      '................',
      '................',
      '......kkkk......',
      '....kkwwyykk....',
      '...kyyyyyyyyk...',
      '...kkkyyyykkk...',
      '...kykkyykkyk...',
      '...kyyyyyyyyk...',
      '...kyyyooyyyk...',
      '...kyykkkkyyk...',
      '....kkyyyykk....',
      '.....kkyykk.....',
      '...kkkwwwwkkk...',
      '..kkkkkwwwkkkk..',
      '.kkkkkkwwwkkkkk.',
      '.kkkkkkkwkkkkkk.'
    ],
    // rosto novo: Careca abençoada (escolhido em prototipos/aliados.html)
    retrato_bispo: [
      '................',
      '................',
      '.....kkkkkk.....',
      '....kywyyyyk....',
      '...kyyyyyyyyk...',
      '...kkyyyyyykk...',
      '...kykyyyykyk...',
      '...kyyyyyyyyk...',
      '...kryyooyyrSS..',
      '...kykwwwwkSkkS.',
      '....kyyyyyykSS..',
      '.....kkyykk..k..',
      '...kyywwwwyykk..',
      '..kwyyywrwyyyk..',
      '.kyyyyywrwyywkk.',
      '.kwyyyyyryyyyyk.'
    ],
    // Dono do Controle Remoto (só na Primeira Instância): topete de apresentador, sorrisão, gravata-borboleta e o controle na mão
    retrato_controleremoto: [
      '................',
      '....kkkkkkk.....',
      '...kkkkkkkkkk...',
      '...kkyyyyyyyk...',
      '...kyykyyykyyk..',
      '...kyyyyyyyyyk..',
      '...kyyyyoyyyyk..',
      '...kykwwwwwkyk..',
      '...kyykkkkkyyk..',
      '....kyyyyyyyk.kk',
      '.....kkyyykk.krk',
      '...ppppwrwpppkkk',
      '..pppppwrwppyyk.',
      '.kppppppwppppyk.',
      '.kpppppwwwppppk.',
      '.kpppppwwwppppk.'
    ],
    retrato_barrapesada: [
      '................',
      '................',
      '.....kSSSSk.....',
      '....kSSSSSSk....',
      '...kSSSSSSSSk...',
      '...kSyyyyyySk...',
      '...kykyyyykyk...',
      '...kyyyyyyyyk...',
      '...kyyyooyyyss..',
      '...kyykkkkysccs.',
      '....kyyyyyysccs.',
      '.....kkyykk.ss..',
      '...kddwwwwddk.k.',
      '..kyyddwkwdddk.k',
      '.kdyrddwkwddddk.',
      '.kddddddkdddddk.'
    ],
    // no celular, de fone e crachá (escolhido entre as sugestões de prototipos/inimigos.html)
    inimigo_estagiario: [
      '................................',
      '................................',
      '................................',
      '................................',
      '..........ooo...................',
      '..........ooo.....oo............',
      '..........oookkkkkoo............',
      '...........kooooooook...........',
      '...........kooooooook...........',
      '...........koyyyyyyok...........',
      '...........kyyyyyyyyk...........',
      '..........wkyyyyyyyykw..........',
      '..........wkyykyykyykw..........',
      '..........wkyyykkyyykw..........',
      '..........wkyyyyyyyykw..........',
      '..........w.kkkkkkkk.w..........',
      '..........w..........w..........',
      '......kkkkkkkkkwwkkkkkkkkk......',
      '......kGGGGGGGGwwGGGGGGGGk......',
      '......kGGwGGGGGwwGGGGGGGGk......',
      '......kGGwGGGGGGGGGGGGGGGk......',
      '......kGGwGGGkkkkkkkGGGGGk......',
      '......kGGwGGGkccccckGGGGGk......',
      '......kGwwwGGkccccckGGGGGk......',
      '......kGwBwGGkcgccckGGGGGk......',
      '......kGwwwGGkcccrckGGGGGk......',
      '......kGwwwyyycccccyyyGGGk......',
      '......kGGGGyyycccccyyyGGGk......',
      '......kGGGGyyykkkkkyyyGGGk......',
      '......kGGGGGGGGGGGGGGGGGGk......',
      '......kGGGGGGGGGGGGGGGGGGk......',
      '......kGGGGGGGGGGGGGGGGGGk......'
    ],
    // chapéu com cartão de imprensa, lápis na orelha e bloquinho (escolhido entre as sugestões de prototipos/inimigos.html)
    inimigo_reporter: [
      '................................',
      '................................',
      '...........SSSSSSSSSS...........',
      '...........SSSSSSSwww...........',
      '...........SSSSSSSwww...........',
      '...........kkkkkkkwww...........',
      '........SSSSSSSSSSSSSSSS........',
      '........SSSSSSSSSSSSSSSS........',
      '............kkkkkkkk............',
      '...........kkkkkkkkkkk..........',
      '...........kkkkkkkkkko..........',
      '...........kkyyyyyykko..........',
      '...........kyyyyyyyyko..........',
      '...........kyykyykyyko..........',
      '...........kyyyyyyyyko..........',
      '...........kyyykkyyyko..........',
      '...........kyyyyyyyyk...........',
      '............kkkkkkkk............',
      '.......kkkkkkkwwwwkkkkkkk.......',
      '.......kSSSSSSwwwwSSSSSSk.......',
      '.......kSSSSSSwwwwSkkkkkkkkk....',
      '.......kSSSSSSwwwwSkwwwwwwwk....',
      '.......kSSSSSSSSSSSkwwwwwwwk....',
      '.......kSSSSSSSSSSSkwSSSSSwk....',
      '.......kSSSSSSSSyyykwwwwwwwk....',
      '.......kSSSSSSSSyyykwSSSSSwk....',
      '.......kSSSSSSSSyyykwwwwwwwk....',
      '.......kSSSSSSSSSSSkwSSSSSwk....',
      '.......kSSSSSSSSSSSkwwwwwwwk....',
      '.......kSSSSSSSSSSSkwSSSSSwk....',
      '.......kSSSSSSSSSSSkkkkkkkkk....',
      '.......kSSSSSSSSSSSSSSSSk.......'
    ],
    // óculos escuros, terno preto e algemas no dedo (escolhido entre as sugestões de prototipos/inimigos.html)
    inimigo_delegado: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '............kkkkkkkk............',
      '...........kddddddddk...........',
      '...........kddddddddk...........',
      '...........kdyyyyyydk...........',
      '...........kkSkkkSkkk...........',
      '...........kkkkkkkkkk...........',
      '...........kyyyyyyyyk...........',
      '...........kyyykkyyyk...........',
      '...........kyyyyyyyyk...........',
      '............kkkkkkkk.....ssss...',
      '.......kkkkkkkkwwkkkkkkks....s..',
      '.......kkkkkkkkwwkkkkkkks....s..',
      '.......kkkkkkkkrrkkkkkkks....s..',
      '.......kkkkkkkkrrkkkkkkks....s..',
      '.......kkkkkkkkrrkkkkkkkkssss...',
      '.......kkkkkkkkrrkkkkkkyyyyS....',
      '.......kkkkkkkkrrkkkkkkyyyyS....',
      '.......kkkkkkkkrrkkkkkkyyyyS....',
      '.......kkkkkkkkrrkkkkkkyyyyS....',
      '.......kkkkkkkkrrkkkkkkkkssss...',
      '.......kkkkkkkkkkkkkkkkks....s..',
      '.......kkkkkkkkkkkkkkkkks....s..',
      '.......kkkkkkkkkkkkkkkkks....s..',
      '.......kkkkkkkkkkkkkkkkks....s..',
      '.......kkkkkkkkkkkkkkkkkkssss...',
      '.......kkkkkkkkkkkkkkkkkk.......',
      '.......kkkkkkkkkkkkkkkkkk.......'
    ],
    // holofote com o cone de luz (escolhido entre as sugestões de prototipos/inimigos.html)
    inimigo_helicoptero: [
      '................................',
      '.kkkkkkkkkkkkkkkkkkkkkkkkkkkkkk.',
      '...............kk...............',
      '...............kk...............',
      '...............kk...............',
      '.......kkkkkkkkkkkkkkkk.........',
      'dd...SSSSSSSSSSSSSSSSSSSS.......',
      'dd...SSSSSSSSSSScccccccSS.......',
      'ddSSSSSSSSSSSSSScwcccccSS.......',
      'ddSSSSSSSSSSSSSScccccccSS.......',
      'dd...SSSSSSSSSSScccccccSS.......',
      '.....SSSSSSSSSSScccccccSS.......',
      '.....SSyyyyyyyyyyyyyyyySS.......',
      '.....SSSSSSSSSSSSSSSSSSSS.......',
      '..........k....www..k...........',
      '..........k....www..k...........',
      '........kkkkkkkkkkkkkkkk........',
      '...............www..............',
      '...............yyyy.............',
      '..............yyyyy.............',
      '..............wwwwww............',
      '.............yyyyyyy............',
      '.............yyyyyyyy...........',
      '............wwwwwwwww...........',
      '............yyyyyyyyyy..........',
      '...........yyyyyyyyyyy..........',
      '...........wwwwwwwwwwww.........',
      '..........yyyyyyyyyyyyy.........',
      '..........yyyyyyyyyyyyyy........',
      '.........wwwwwwwwwwwwwww........',
      '.........yyyyyyyyyyyyyyyy.......',
      '........yyyyyyyyyyyyyyyyy.......'
    ],
    inimigo_fim: [
      '................................',
      '................................',
      '................................',
      '................................',
      '................................',
      '..........................www...',
      '............ssssssss......www...',
      '............ssssssss......www...',
      '..wwwwwwwwwwwwwwwwwwwwwwwwwwww..',
      '..wwwwwwwwwwwwwwwwwwwwwwwwwwww..',
      '..wwwwlwwlwwlwwlwwlwwlwwwwwwww..',
      '..wwwwwwwwwwwwwwwwwwwwwwwwwwww..',
      '..wwwwwwwwwwwwwwwwwwwwwwwwwwww..',
      '..dddddddddddddddddddddddddddd..',
      '............ssssssss............',
      '................................',
      '................................',
      '................................',
      '........sssss.......sssss.......',
      '.......sddddds.....sddddds......',
      '......sdd...dds...sdd...dds.....',
      '.....sdd.....dds.sdd.....dds....',
      '.....sd.......dSSSd.......ds....',
      '.....sd.......Ss.sS.......ds....',
      '.....sd.......ds.sd.......ds....',
      '.....sdd.....dds.sdd.....dds....',
      '......sdd...dds...sdd...dds.....',
      '.......sddddds.....sddddds......',
      '........sssss.......sssss.......',
      '................................',
      '................................',
      '................................'
    ],
    icone_moeda: [
      '...yyyyy....',
      '..yyoooyy...',
      '.yyoyyyoyy..',
      '.yoyykyyoy..',
      '.yoykkkyoy..',
      '.yoyykyyoy..',
      '.yoykkkyoy..',
      '.yoyykyyoy..',
      '.yyoyyyoyy..',
      '..yyoooyy...',
      '...yyyyy....',
      '............'
    ],
    icone_termometro: [
      '.....ww.....',
      '....wrrw....',
      '....wrrw....',
      '....wrrw....',
      '....wrrw....',
      '....wrrw....',
      '....wrrw....',
      '...wrrrrw...',
      '..wrrrrrrw..',
      '..wrrrrrrw..',
      '...wrrrrw...',
      '....wwww....'
    ],
    icone_escudo: [
      '.kkkkkkkkkk.',
      '.kllllllllk.',
      '.klcccccclk.',
      '.klcllllclk.',
      '.klcllllclk.',
      '.klcllllclk.',
      '..klcllclk..',
      '..klcllclk..',
      '...klcclk...',
      '....kllk....',
      '.....kk.....',
      '............'
    ],
    icone_jatinho: [
      '............',
      '.....w......',
      '.....ww.....',
      'w....www....',
      'ww.wwwwwwww.',
      'wwwwwwwwwlw.',
      'ww.wwwwwwww.',
      'w....www....',
      '.....ww.....',
      '.....w......',
      '............',
      '............'
    ],
    // filmadora no tripé, com a luz de gravação (Vídeo para o delegado)
    icone_filmadora: [
      '............',
      '.kkkkkkk....',
      '.kdddddk..kk',
      '.kdwwddk.kdk',
      '.kdwwddkkddk',
      '.kdddddkkddk',
      '.kdddrdk.kdk',
      '.kkkkkkk..kk',
      '....kkk.....',
      '...k.k.k....',
      '..k..k..k...',
      '............'
    ],
    icone_claquete: [
      'kwkwkwkwkwk.',
      'wkwkwkwkwkw.',
      'kkkkkkkkkkk.',
      'kddddddddk..',
      'kdwwwwwwdk..',
      'kddddddddk..',
      'kdwwwwdddk..',
      'kddddddddk..',
      'kkkkkkkkkk..',
      '............',
      '............',
      '............'
    ],
    icone_igreja: [
      '.....y......',
      '....yyy.....',
      '.....y......',
      '....www.....',
      '...wwwww....',
      '..wwwwwww...',
      '..wwwyyww...',
      '..wwykkyw...',
      '..wwykkyw...',
      '..wwykkyw...',
      '.ssssssssss.',
      '............'
    ],
    icone_pizza: [
      '............',
      '.oooooooooo.',
      '..yyrryyyy..',
      '..yyyyyrr...',
      '...yrryyy...',
      '...yyyyy....',
      '....yrry....',
      '....yyy.....',
      '.....yy.....',
      '.....y......',
      '............',
      '............'
    ],
    icone_cavalo: [
      '............',
      '.......kk...',
      '......ooko..',
      '.....oooooo.',
      '....ooo..oo.',
      '.oooooo.....',
      'ooooooo.....',
      'o.oooo......',
      '..o..o......',
      '..o..o......',
      '..k..k......',
      '............'
    ],
    icone_bolo: [
      '.....r......',
      '.....y......',
      '...wwwww....',
      '...rrrrr....',
      '..wwwwwww...',
      '..ooooooo...',
      '.wwwwwwwww..',
      '.ooooooooo..',
      'wwwwwwwwwww.',
      'ooooooooooo.',
      'sssssssssss.',
      '............'
    ],
    icone_cadeia: [
      'ssssssssss..',
      's.s.s.s.ss..',
      's.s.s.s.ss..',
      's.s.s.s.ss..',
      's.s.s.s.ss..',
      'ssssssssss..',
      's.s.s.s.ss..',
      's.s.s.s.ss..',
      's.s.s.s.ss..',
      's.s.s.s.ss..',
      'ssssssssss..',
      '............'
    ],
    icone_jornal: [
      'wwwwwwwwww..',
      'wkkkkkkkkw..',
      'wwwwwwwwwws.',
      'wkkkk.wSSws.',
      'wwwww.wSSws.',
      'wkkkk.wwwws.',
      'wwwwwwwwwws.',
      'wkkkkkkkkws.',
      'wwwwwwwwwws.',
      'wkkkkkkkkws.',
      'wwwwwwwwwws.',
      '.ssssssssss.'
    ],
    icone_taca: [
      '.yyyyyyyyy..',
      '.yyyyyyyyy..',
      'yyoyyyyyoyy.',
      'y.oyyyyyo.y.',
      'y..oyyyo..y.',
      '.y..oyo..y..',
      '.....y......',
      '.....y......',
      '.....y......',
      '...yyyyy....',
      '...ooooo....',
      '............'
    ],

    // --- Janela do escritório (J01): jato e helicóptero que cruzam o céu ---
    jato_janela: [
      '...ww...........',
      '..www...........',
      '.wwwwwwwwwwwwwwc',
      'wlwlwlwlwwwwwwws',
      '.ssssssssssssss.',
      '......wwww......',
      '.......ww.......'
    ],
    helicoptero_janela: [
      'wwwwwwwwwwwwww',
      '......kk......',
      '....ddddddd...',
      '..ddddcccdddd.',
      'kkdddddccddddd',
      '..dddddddddd..',
      '...ssssssss...',
      '.......yy.....'
    ]
  };


  // ---------------- Corpos inteiros (gerados a partir dos retratos) ----------------
  // corpo_<id>: 16x30. Linhas 0-15 = retrato (cabeça + ombros); o resto é tronco, braços, pernas e sapatos.
  // Para desenhar à mão um corpo próprio, basta colocar assets/sprites/corpo_<id>.png (16x30).
  function gerarCorpos() {
    Object.keys(MAPAS).filter(k => k.indexOf('retrato_') === 0).forEach(k => {
      const id = k.slice(8), ret16 = MAPAS[k];
      const base = ret16.map(l => l.split(''));
      const cor = base[15][4] !== '.' ? base[15][4] : 'd';
      const robe = cor === 'k';
      const gravata = base[15][8] !== cor && base[15][8] !== 'k' ? base[15][8] : (robe ? 'w' : cor);
      const borda = robe ? 'S' : 'k';
      const calca = robe ? 'k' : (cor === 'd' ? 'S' : 'd');
      const sapato = robe ? 'd' : 'k';
      const L = () => '................'.split('');
      const linhas = base.slice();
      for (let r = 16; r < 30; r++) linhas.push(L());
      const set = (r, x, c) => { linhas[r][x] = c; };
      // tronco + mangas (linhas 16-20)
      for (let r = 16; r <= 20; r++) {
        set(r, 1, borda); set(r, 2, cor); set(r, 3, cor); set(r, 4, borda);
        for (let x = 5; x <= 10; x++) set(r, x, cor);
        set(r, 11, borda); set(r, 12, cor); set(r, 13, cor); set(r, 14, borda);
        set(r, 7, r <= 17 && !robe ? 'w' : gravata); set(r, 8, r <= 17 && !robe ? 'w' : gravata);
      }
      if (robe) { set(16, 7, 'w'); set(16, 8, 'w'); set(17, 7, 'w'); set(17, 8, 'w'); for (let r = 18; r <= 20; r++) { set(r, 7, 'k'); set(r, 8, 'k'); } }
      else { for (let r = 18; r <= 20; r++) { set(r, 7, cor); set(r, 8, gravata); } }
      // mãos + cinto (linha 21)
      set(21, 1, 'k'); set(21, 2, 'y'); set(21, 3, 'y'); set(21, 4, 'k');
      set(21, 12, 'y'); set(21, 13, 'y'); set(21, 14, 'k'); set(21, 11, 'k');
      set(22, 2, 'k'); set(22, 3, 'k'); set(22, 12, 'k'); set(22, 13, 'k');
      for (let x = 4; x <= 11; x++) set(21, x, robe ? cor : 'k');
      if (!robe) { set(21, 7, 'y'); set(21, 8, 'y'); }
      // pernas (22-27)
      for (let r = 22; r <= 27; r++) {
        set(r, 4, borda); set(r, 5, calca); set(r, 6, calca); set(r, 7, 'k'); set(r, 8, 'k');
        set(r, 9, calca); set(r, 10, calca); set(r, 11, borda);
        if (robe && r >= 26) { set(r, 3, borda); set(r, 12, borda); }
      }
      // sapatos (28-29)
      for (let r = 28; r <= 29; r++) for (let x = 3; x <= 12; x++) set(r, x, sapato);
      MAPAS['corpo_' + id] = linhas.map(l => l.join(''));
    });
  }
  gerarCorpos();

  // ---------------- Cache e override por PNG ----------------
  const cache = {};     // nome -> canvas pré-renderizado
  const png = {};       // nome -> Image carregada de assets/sprites/
  const temDom = typeof document !== 'undefined';

  function renderizar(nome) {
    const m = MAPAS[nome];
    if (!m || !temDom) return null;
    const cv = document.createElement('canvas');
    cv.width = m[0].length; cv.height = m.length;
    const ctx = cv.getContext('2d');
    m.forEach((linha, y) => {
      for (let x = 0; x < linha.length; x++) {
        const cor = PALETA[linha[x]];
        if (cor) { ctx.fillStyle = cor; ctx.fillRect(x, y, 1, 1); }
      }
    });
    return (cache[nome] = cv);
  }

  // desenha o sprite; devolve false se não existir
  function draw(ctx, nome, x, y, escala) {
    escala = escala || 1;
    const img = png[nome] || cache[nome] || renderizar(nome);
    if (!img) return false;
    const w = MAPAS[nome] ? MAPAS[nome][0].length : img.width;
    const h = MAPAS[nome] ? MAPAS[nome].length : img.height;
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, Math.round(x), Math.round(y), w * escala, h * escala);
    return true;
  }

  function carregarPngs() {
    if (!temDom || typeof Image === 'undefined') return;
    Object.keys(MAPAS).forEach(nome => {
      const img = new Image();
      img.onload = () => { png[nome] = img; if (GM.ui && GM.ui.render) GM.ui.render(); };
      img.onerror = () => { /* sem PNG: fica o procedural */ };
      img.src = 'assets/sprites/' + nome + '.png';
    });
  }

  // ---------------- Cenário do escritório (desenhado em código) ----------------
  const W = 310, H = 300;          // tamanho lógico do canvas #cena (exibido em 2x)
  const inimigoPorFaixa = ['estagiario', 'reporter', 'delegado', 'helicoptero', 'fim'];
  let moedas = [];                 // partículas de moeda subindo
  let tempo = 0;
  let jatos = [];                  // aeronaves cruzando a janela (J01)
  let contJatos = 0;
  let proximoJato = 60;            // tempo (quadros, ~8 por segundo) da próxima passagem

  function ret(ctx, x, y, w, h, c) { ctx.fillStyle = PALETA[c] || c; ctx.fillRect(x, y, w, h); }

  function predios(ctx, x0, y0, w, h, seed, pal) {
    pal = pal || { c1: 'd', c2: 'S', j1: 'y', j2: 'b' };
    // skyline de banco genérico: prédios com janelas acesas
    let x = x0, i = seed;
    while (x < x0 + w) {
      const pw = 14 + (i * 7) % 12, ph = 20 + (i * 13) % (h - 16);
      ret(ctx, x, y0 + h - ph, pw, ph, i % 2 ? pal.c1 : pal.c2);
      for (let wy = y0 + h - ph + 3; wy < y0 + h - 3; wy += 5) {
        for (let wx = x + 2; wx < x + pw - 2; wx += 4) if ((wx * 3 + wy + i) % 5) ret(ctx, wx, wy, 2, 2, (wx + wy) % 3 ? pal.j1 : pal.j2);
      }
      x += pw + 1; i++;
    }
  }

  // J01: jato (faixas 0-2) ou helicóptero com holofote (faixa 3) cruzando o céu da janela.
  // Só visual: pode usar Math.random sem afetar a semente da partida.
  function criarJato(faixa) {
    const heli = faixa >= 3;
    const esq = Math.random() < 0.3;              // 30% das vezes cruza da direita para a esquerda
    const v = heli ? 0.9 + Math.random() * 0.5 : 1.5 + Math.random() * 2;
    const baixo = faixa === 2;                    // faixa 2: jato voando baixo
    const y = heli ? 18 + Math.floor(Math.random() * 6)
      : baixo ? 30 + Math.floor(Math.random() * 6) : 17 + Math.floor(Math.random() * 13);
    return {
      nome: heli ? 'helicoptero_janela' : 'jato_janela', heli, esq, v, y,
      x: esq ? 160 : 10 - (heli ? 14 : 16),
      faixa: Math.random() < 0.35 && faixa <= 1     // faixa de promoção (só com a polícia longe)
    };
  }

  function forcarJato(faixa) { jatos.push(criarJato(faixa || 0)); }

  function desenharJatos(ctx, s) {
    const faixa = s ? s.faixa : 0;
    const vivos = jatos.length;
    if (!vivos && tempo >= proximoJato) {
      jatos.push(criarJato(faixa));
      if (faixa < 3 && ++contJatos % 3 === 0 && GM.audio && GM.audio.play) GM.audio.play('jato');   // som em 1 de cada 3 passagens
      // passagem a cada 20-60 s (160-480 quadros); de 10 a 25 s no helicóptero
      proximoJato = tempo + (faixa >= 3 ? 80 + Math.floor(Math.random() * 120) : 160 + Math.floor(Math.random() * 320));
    }
    ctx.save();
    ctx.beginPath(); ctx.rect(13, 15, 144, 26); ctx.clip();   // só o céu da janela
    jatos.forEach(j => {
      const M = MAPAS[j.nome], w = M[0].length;
      if (j.heli) {                                           // feixe do holofote
        ctx.globalAlpha = 0.3; ctx.fillStyle = PALETA.y;
        const bx = j.x + w / 2 + (j.esq ? -1 : 1);
        ctx.beginPath(); ctx.moveTo(bx, j.y + 8); ctx.lineTo(bx - 8, 42); ctx.lineTo(bx + 8, 42); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = 1;
      }
      if (j.faixa) {                                          // faixa de promoção puxada atrás
        const fx = j.esq ? j.x + w + 4 : j.x - 18;
        ret(ctx, j.esq ? j.x + w : j.x - 4, j.y + 3, 4, 1, 'k');
        ret(ctx, Math.floor(fx), j.y, 14, 6, 'y');
        ret(ctx, Math.floor(fx) + 2, j.y + 2, 2, 2, 'r'); ret(ctx, Math.floor(fx) + 6, j.y + 2, 2, 2, 'r'); ret(ctx, Math.floor(fx) + 10, j.y + 2, 2, 2, 'r');
      }
      if (j.esq) {                                            // espelha quando vai para a esquerda
        ctx.save(); ctx.translate(Math.round(j.x) + w, 0); ctx.scale(-1, 1); draw(ctx, j.nome, 0, j.y, 1); ctx.restore();
      } else draw(ctx, j.nome, j.x, j.y, 1);
      j.x += j.esq ? -j.v : j.v;
    });
    ctx.restore();
    jatos = jatos.filter(j => j.esq ? j.x > 13 - 40 : j.x < 160);
  }

  // ---------------- Cenas de ação (S01-S03): substituem o escritório por ~3 s ----------------
  let cenaAtual = null;            // {id, ate}
  function mostrarCena(id, quadros) { if (CENAS[id]) cenaAtual = { id, ate: tempo + (quadros || 24) }; }

  function circ(ctx, cx, cy, r, c) {             // círculo cheio em pixels
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(r * r - y * y));
      ret(ctx, cx - w, cy + y, w * 2 + 1, 1, c);
    }
  }
  const LETRAS = {
    V: ['101', '101', '101', '101', '010'], I: ['111', '010', '010', '010', '111'], P: ['111', '101', '111', '100', '100'],
    L: ['100', '100', '100', '100', '111'], E: ['111', '100', '110', '100', '111'], G: ['111', '100', '101', '101', '111'],
    A: ['010', '101', '111', '101', '101'], F: ['111', '100', '110', '100', '100'],
    C: ['111', '100', '100', '100', '111'], D: ['110', '101', '101', '101', '110'], B: ['110', '101', '110', '101', '110'],
    R: ['110', '101', '110', '101', '101'], S: ['111', '100', '111', '001', '111'], O: ['111', '101', '101', '101', '111'],
    '1': ['010', '110', '010', '010', '111'], '4': ['101', '101', '111', '001', '001'], '0': ['111', '101', '101', '101', '111'],
    '%': ['101', '001', '010', '100', '101'], ' ': ['000', '000', '000', '000', '000']
  };
  function palavra(ctx, txt, x, y, esc, c) {     // fonte 3x5 só com as letras usadas
    txt.split('').forEach((ch, i) => LETRAS[ch].forEach((lin, yy) => {
      for (let xx = 0; xx < 3; xx++) if (lin[xx] === '1') ret(ctx, x + (i * 4 + xx) * esc, y + yy * esc, esc, esc, c);
    }));
  }
  function alia(s) {                              // aliados ativos, na ordem em que entraram
    const D = GM.data;
    return s ? D.aliados.filter(a => s.aliados[a.id].ativo).sort((a, b) => s.aliados[a.id].ordem - s.aliados[b.id].ordem) : [];
  }

  const CENAS = {
    // S01: boate VIP (ação "Festa e jatinho")
    boate(ctx, s, t) {
      const cores = ['r', 'l', 'g', 'y', 'c', 'o'];
      ret(ctx, 0, 0, W, H, 'k');
      ret(ctx, 0, 0, W, 170, 'p');
      for (let x = 0; x < W; x += 24) ret(ctx, x, 0, 2, 170, 'k');
      // feixes da bola de espelhos
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const tx = 155 + Math.sin(t * 0.12 + i * 1.1) * 150;
        ctx.globalAlpha = 0.22; ctx.fillStyle = PALETA[cores[(i + Math.floor(t / 6)) % 6]];
        ctx.beginPath(); ctx.moveTo(155, 28); ctx.lineTo(tx - 16, 172); ctx.lineTo(tx + 16, 172); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
      // piso de pista
      for (let y = 170; y < H; y += 10) for (let x = 0; x < W; x += 20) {
        const f = ((x / 20) + (y / 10) + Math.floor(t / 4)) % 2;
        ret(ctx, x, y, 20, 10, f ? 'B' : 'p');
      }
      ret(ctx, 0, 168, W, 3, 'k');
      // bola de espelhos
      ret(ctx, 154, 0, 2, 16, 'S');
      circ(ctx, 155, 26, 11, 's');
      for (let y = -10; y <= 10; y += 3) for (let x = -10; x <= 10; x += 3)
        if (x * x + y * y < 100 && (x + y + t) % 4 === 0) ret(ctx, 155 + x, 26 + y, 2, 2, 'w');
      // letreiro VIP piscando
      if (Math.floor(t / 6) % 5 !== 0) palavra(ctx, 'VIP', 40, 50, 4, 'r');
      ret(ctx, 34, 44, 52, 2, 'r'); ret(ctx, 34, 76, 52, 2, 'r');
      // caixas de som
      [[6, 112], [268, 112]].forEach(([x, y]) => {
        ret(ctx, x, y, 36, 58, 'd'); ret(ctx, x + 2, y + 2, 32, 54, 'k');
        circ(ctx, x + 18, y + 18, 9 + (t % 2), 'S'); circ(ctx, x + 18, y + 18, 3, 'k');
        circ(ctx, x + 18, y + 42, 6 + (t % 2), 'S'); circ(ctx, x + 18, y + 42, 2, 'k');
      });
      // balcão com garrafas
      ret(ctx, 190, 96, 70, 4, 'o');
      [['G', 196], ['r', 206], ['l', 216], ['y', 226], ['G', 236], ['r', 246]].forEach(([c, x], i) => { ret(ctx, x, 82 + (i % 2) * 3, 5, 14 - (i % 2) * 3, c); ret(ctx, x + 1, 78 + (i % 2) * 3, 3, 5, c); });
      ret(ctx, 184, 132, 82, 38, 'o'); ret(ctx, 184, 132, 82, 4, 'y'); ret(ctx, 184, 168, 82, 2, 'p');
      // dançarinos
      const bob = n => ((Math.floor(t / 2) + n) % 2) * 3;
      draw(ctx, 'corpo_bolso', 112, 108 - bob(0), 3);
      ret(ctx, 124, 123 - bob(0), 24, 5, 'k');                     // óculos escuros do Banqueiro de Bolso
      ret(ctx, 122, 124 - bob(0), 28, 1, 'k');
      alia(s).slice(0, 4).forEach((a, i) => {
        const pos = [[52, 142], [84, 150], [176, 152], [246, 146]][i];
        draw(ctx, 'corpo_' + a.id, pos[0], pos[1] - bob(i + 1), 2);
      });
      // confete
      for (let i = 0; i < 16; i++) ret(ctx, (i * 47 + t * 3) % W, (t * 4 + i * 23) % 170, 2, 2, cores[i % 6]);
    },

    // S02: cofre que trava (evento "cofre_trava")
    cofre(ctx, s, t) {
      ret(ctx, 0, 0, W, H, 'd');
      for (let y = 0; y < 200; y += 10) { ret(ctx, 0, y, W, 1, 'k'); for (let x = (y / 10) % 2 ? 0 : 10; x < W; x += 20) ret(ctx, x, y, 1, 10, 'k'); }
      ret(ctx, 0, 200, W, H - 200, 'k'); ret(ctx, 0, 198, W, 3, 'S');
      // lâmpada de alarme
      const liga = Math.floor(t / 3) % 2;
      ret(ctx, 145, 10, 30, 12, 'S'); ret(ctx, 149, 12, 22, 8, liga ? 'r' : 'p');
      if (liga) { ctx.save(); ctx.globalAlpha = 0.18; circ(ctx, 160, 16, 34, 'r'); ctx.restore(); }
      // porta do cofre
      const cx = 160, cy = 122;
      circ(ctx, cx, cy, 76, 'k'); circ(ctx, cx, cy, 72, 'S'); circ(ctx, cx, cy, 58, 's'); circ(ctx, cx, cy, 54, 'S');
      for (let i = 0; i < 12; i++) { const an = i * Math.PI / 6; ret(ctx, Math.round(cx + Math.cos(an) * 65) - 2, Math.round(cy + Math.sin(an) * 65) - 2, 4, 4, 'w'); }
      const giro = Math.sin(t * 0.5) * 0.3;                       // gira um pouco e trava
      for (let k = 0; k < 6; k++) {
        const an = giro + k * Math.PI / 3;
        for (let r = 6; r <= 36; r += 3) ret(ctx, Math.round(cx + Math.cos(an) * r) - 1, Math.round(cy + Math.sin(an) * r) - 1, 3, 3, 'y');
        circ(ctx, Math.round(cx + Math.cos(an) * 40), Math.round(cy + Math.sin(an) * 40), 4, 'o');
      }
      circ(ctx, cx, cy, 10, 'o'); circ(ctx, cx, cy, 5, 'y');
      // Banqueiro de Bolso puxando a porta, suando
      draw(ctx, 'corpo_bolso', 6, 120 + (t % 2) * 2, 3);
      if (Math.floor(t / 4) % 2) { ret(ctx, 14, 118, 3, 5, 'l'); ret(ctx, 50, 112, 3, 5, 'l'); }
      // suporte de TI com headset e notebook
      ret(ctx, 244, 132, 14, 14, 'y'); ret(ctx, 244, 130, 14, 5, 'k');      // cabeça e cabelo
      ret(ctx, 242, 134, 3, 8, 'k'); ret(ctx, 240, 140, 6, 2, 'k');        // fone e microfone
      ret(ctx, 246, 138, 2, 2, 'k'); ret(ctx, 252, 138, 2, 2, 'k');
      ret(ctx, 240, 146, 26, 34, 'B'); ret(ctx, 234, 162, 26, 14, 'w'); ret(ctx, 236, 164, 22, 8, 'c');
      ret(ctx, 240, 180, 10, 20, 'b'); ret(ctx, 254, 180, 10, 20, 'b');
      // balão "..."
      ret(ctx, 226, 100, 42, 20, 'w'); ret(ctx, 240, 120, 6, 6, 'w');
      for (let i = 0; i < 3; i++) if (Math.floor(t / 4) % 4 > i) ret(ctx, 234 + i * 11, 108, 5, 5, 'k');
      // pilha de dinheiro ao lado
      for (let i = 0; i < 5; i++) { ret(ctx, 70 + i * 8, 186 - (i % 3) * 6, 14, 14 + (i % 3) * 6, i % 2 ? 'G' : 'e'); ret(ctx, 74 + i * 8, 190 - (i % 3) * 6, 6, 2, 'y'); }
    },

    // S03: jatinho por dentro (evento "jatinho_lima")
    jatinho(ctx, s, t) {
      const tremor = Math.floor(t / 40) % 4 === 3;                 // turbulência de vez em quando
      ctx.save();
      if (tremor) ctx.translate((t % 2) * 2 - 1, (t % 3) - 1);
      ret(ctx, 0, 0, W, H, 'y');
      ret(ctx, 0, 0, W, 18, 'w'); ret(ctx, 0, 18, W, 2, 's');
      ret(ctx, 0, 146, W, 26, 'o'); ret(ctx, 0, 146, W, 3, 'y');
      ret(ctx, 0, 172, W, H - 172, 'r');
      for (let x = 0; x < W; x += 40) ret(ctx, x, 172, 20, H - 172, 'p');
      // janelinhas com nuvens
      for (let i = 0; i < 4; i++) {
        const x = 22 + i * 72, y = 44;
        ret(ctx, x - 3, y - 3, 40, 52, 'w');
        ctx.save(); ctx.beginPath(); ctx.rect(x, y, 34, 46); ctx.clip();
        ret(ctx, x, y, 34, 46, 'l'); ret(ctx, x, y, 34, 14, 'c');
        for (let n = 0; n < 2; n++) { const nx = x + 40 - ((t * 2 + i * 37 + n * 50) % 80); ret(ctx, nx, y + 14 + n * 18, 20, 6, 'w'); ret(ctx, nx + 4, y + 10 + n * 18, 12, 6, 'w'); }
        ctx.restore();
        ret(ctx, x - 3, y - 3, 3, 3, 'y'); ret(ctx, x + 34, y - 3, 3, 3, 'y'); ret(ctx, x - 3, y + 46, 3, 3, 'y'); ret(ctx, x + 34, y + 46, 3, 3, 'y');
      }
      // aviso de cinto
      ret(ctx, 145, 4, 20, 10, 'k'); ret(ctx, 148, 6, 14, 6, Math.floor(t / 6) % 2 ? 'r' : 'G');
      // poltronas e passageiros
      [[38, 'retrato_bolso'], [212, null]].forEach(([x, nome], i) => {
        ret(ctx, x, 96, 56, 76, 'p'); ret(ctx, x + 4, 100, 48, 68, 'r'); ret(ctx, x + 10, 88, 36, 14, 'r');
        const quem = nome || (alia(s)[0] ? 'retrato_' + alia(s)[0].id : null);
        if (quem) draw(ctx, quem, x + 4, 106 + ((Math.floor(t / 6) + i) % 2), 3);
        ret(ctx, x - 6, 150, 68, 24, 'r'); ret(ctx, x - 6, 150, 68, 4, 'p');
        ret(ctx, x - 10, 130, 10, 38, 'p'); ret(ctx, x + 56, 130, 10, 38, 'p');
      });
      // mesinha com taça e dinheiro
      ret(ctx, 122, 152, 66, 6, 'o'); ret(ctx, 122, 158, 66, 3, 'p'); ret(ctx, 152, 161, 6, 18, 'p'); ret(ctx, 140, 178, 30, 4, 'p');
      draw(ctx, 'icone_taca', 128, 134, 2);
      draw(ctx, 'icone_moeda', 160, 138, 2); draw(ctx, 'icone_moeda', 170, 142, 1);
      for (let i = 0; i < 4; i++) ret(ctx, 132 + ((i * 5 + t) % 7), 130 - ((t * 2 + i * 6) % 18), 2, 2, 'w');   // bolhas
      ctx.restore();
    }
  };

  // ---------------- Estilos do escritório (opções de cenário) ----------------
  let estiloCena = 'atual';

  function ell(ctx, cx, cy, rx, ry, c) {          // elipse cheia
    for (let dy = -ry; dy <= ry; dy++) {
      const w = Math.floor(rx * Math.sqrt(1 - (dy / ry) * (dy / ry)));
      ret(ctx, cx - w, cy + dy, w * 2 + 1, 1, c);
    }
  }
  function cofreCores(ctx, corpo, vao, pilha, porta, puxador) {   // cofre aberto do canto esquerdo
    ret(ctx, 6, 118, 44, 52, corpo); ret(ctx, 9, 121, 38, 46, vao);
    for (let i = 0; i < 4; i++) ret(ctx, 12 + i * 8, 150 - (i % 2) * 6, 7, 16 + (i % 2) * 6, pilha);
    ret(ctx, 50, 118, 8, 52, porta); ret(ctx, 52, 138, 4, 10, puxador);
  }
  function mesaCores(ctx, tampo, borda, perna) {
    ret(ctx, 40, 152, 200, 8, tampo); ret(ctx, 40, 160, 200, 4, borda);
    ret(ctx, 48, 164, 4, 20, perna); ret(ctx, 228, 164, 4, 20, perna);
  }

  // Estilo atual (o que o jogo tem hoje)
  function fundoAtual(ctx, s) {
    // parede e piso
    ret(ctx, 0, 0, W, H, 'b');
    for (let x = 0; x < W; x += 20) ret(ctx, x, 0, 1, 170, 'd');
    ret(ctx, 0, 170, W, H - 170, 'd');
    for (let y = 174; y < H; y += 10) ret(ctx, 0, y, W, 1, 'k');
    ret(ctx, 0, 168, W, 3, 'p');
    // janela com skyline
    ret(ctx, 10, 12, 150, 80, 'k');
    ret(ctx, 13, 15, 144, 74, s && s.faixa >= 3 ? 'p' : 'l');
    ret(ctx, 13, 15, 144, 20, s && s.faixa >= 3 ? 'r' : 'c');
    predios(ctx, 13, 45, 144, 44, 3);
    desenharJatos(ctx, s);
    ret(ctx, 84, 15, 2, 74, 'k'); ret(ctx, 13, 50, 144, 2, 'k');
    // quadro "caro" na parede
    ret(ctx, 176, 22, 20, 16, 'y'); ret(ctx, 178, 24, 16, 12, 'p'); ret(ctx, 182, 28, 6, 5, 'o');
    // cofre aberto (canto esquerdo)
    ret(ctx, 6, 118, 44, 52, 'S'); ret(ctx, 9, 121, 38, 46, 'k');
    for (let i = 0; i < 4; i++) ret(ctx, 12 + i * 8, 150 - (i % 2) * 6, 7, 16 + (i % 2) * 6, 'G');
    ret(ctx, 50, 118, 8, 52, 's'); ret(ctx, 52, 138, 4, 10, 'y');
  }
  function mesaAtual(ctx) { mesaCores(ctx, 'o', 'p', 'p'); }

  // Opção A: Cobertura Dourada (luxo cafona)
  function fundoDourado(ctx, s) {
    const t = tempo, alto = s && s.faixa >= 3;
    ret(ctx, 0, 0, W, 170, '#6b1f36');
    for (let x = 0; x < W; x += 20) ret(ctx, x, 0, 10, 170, '#7d2640');
    ret(ctx, 0, 0, W, 4, '#e8b84a'); ret(ctx, 0, 4, W, 2, '#a87a1f');
    ret(ctx, 0, 162, W, 8, '#e8b84a'); ret(ctx, 0, 162, W, 2, '#ffe28a');
    for (let y = 170; y < H; y += 10) for (let x = 0; x < W; x += 20)        // piso de mármore
      ret(ctx, x, y, 20, 10, (((x / 20) + ((y - 170) / 10)) % 2) ? '#f2e8d0' : '#2a1a24');
    ell(ctx, 155, 248, 82, 26, '#e8b84a'); ell(ctx, 155, 248, 78, 23, '#9b2a45'); ell(ctx, 155, 248, 56, 14, '#7d2640');
    // janela com pôr do sol
    ret(ctx, 10, 12, 150, 80, '#e8b84a'); ret(ctx, 13, 15, 144, 74, alto ? '#5d275d' : '#ff9a5c');
    ret(ctx, 13, 15, 144, 20, alto ? '#b13e53' : '#d9668a');
    predios(ctx, 13, 45, 144, 44, 3, { c1: '#3d1f4a', c2: '#57296a', j1: '#ffd27d', j2: '#ff9a5c' });
    desenharJatos(ctx, s);
    ret(ctx, 84, 15, 2, 74, '#e8b84a'); ret(ctx, 13, 50, 144, 2, '#e8b84a');
    // autorretrato do chefe, com coroa
    ret(ctx, 166, 10, 44, 44, '#e8b84a'); ret(ctx, 169, 13, 38, 38, '#a87a1f'); ret(ctx, 171, 15, 34, 34, '#2a1a24');
    draw(ctx, 'retrato_bolso', 172, 16, 2);
    ret(ctx, 180, 12, 16, 4, '#ffe28a'); ret(ctx, 180, 8, 3, 5, '#ffe28a'); ret(ctx, 187, 6, 3, 7, '#ffe28a'); ret(ctx, 194, 8, 3, 5, '#ffe28a');
    ret(ctx, 178, 55, 20, 5, '#e8b84a'); ret(ctx, 181, 57, 14, 1, '#6b1f36');
    // lustre de cristal
    ret(ctx, 231, 0, 2, 8, '#a87a1f'); ret(ctx, 216, 8, 34, 3, '#e8b84a');
    for (let i = 0; i < 5; i++) {
      ret(ctx, 218 + i * 8, 4, 3, 4, 'w'); ret(ctx, 218 + i * 8, 2, 3, 2, (i + Math.floor(t / 3)) % 2 ? '#ffcd75' : '#ef7d57');
      ret(ctx, 218 + i * 8, 11, 3, 4 + (i % 2) * 3, ((t + i) % 6 < 2) ? 'w' : '#73eff7');
    }
    cofreCores(ctx, '#e8b84a', '#2a1a24', '#38b764', '#ffe28a', '#ef7d57');
    // porquinho alado num pedestal (no piso, sobre o tapete)
    ctx.save(); ctx.translate(-104, 100);
    ret(ctx, 272, 148, 32, 16, '#f2e8d0'); ret(ctx, 270, 145, 36, 4, '#e8b84a');
    if (Math.floor(t / 3) % 2) { ret(ctx, 282, 112, 6, 9, 'w'); ret(ctx, 288, 114, 6, 7, 'w'); }
    else { ret(ctx, 280, 120, 8, 5, 'w'); ret(ctx, 288, 120, 8, 5, 'w'); }
    circ(ctx, 288, 134, 10, '#f4a6b7');
    ret(ctx, 281, 122, 4, 4, '#e38aa0'); ret(ctx, 291, 122, 4, 4, '#e38aa0');
    ret(ctx, 295, 133, 8, 6, '#e38aa0'); ret(ctx, 297, 135, 1, 2, 'k'); ret(ctx, 300, 135, 1, 2, 'k');
    ret(ctx, 290, 129, 2, 2, 'k'); ret(ctx, 284, 125, 9, 1, '#7d2640'); ret(ctx, 277, 133, 4, 1, '#e38aa0');
    ret(ctx, 281, 141, 4, 5, '#f4a6b7'); ret(ctx, 292, 141, 4, 5, '#f4a6b7');
    ctx.restore();
    // aquário com peixe e tubarão de gravata
    ret(ctx, 236, 214, 66, 50, '#a87a1f'); ret(ctx, 239, 217, 60, 44, '#2aa0c8'); ret(ctx, 239, 255, 60, 6, '#e8d39a');
    ret(ctx, 246, 238, 3, 17, '#38b764'); ret(ctx, 250, 244, 3, 11, '#38b764'); ret(ctx, 284, 240, 3, 15, '#38b764');
    const fx = 244 + (t * 2) % 44;
    ret(ctx, fx, 228, 8, 5, '#ef7d57'); ret(ctx, fx - 3, 227, 3, 7, '#ef7d57'); ret(ctx, fx + 6, 229, 1, 1, 'k');
    const sx = 282 - Math.floor(t * 1.2) % 48;
    ret(ctx, sx, 240, 18, 7, '#94b0c2'); ret(ctx, sx + 6, 236, 4, 4, '#94b0c2'); ret(ctx, sx + 16, 242, 2, 2, '#94b0c2');
    ret(ctx, sx + 2, 242, 1, 1, 'k'); ret(ctx, sx + 4, 246, 2, 5, '#b13e53');
    for (let i = 0; i < 4; i++) ret(ctx, 252 + i * 12, 254 - ((t * 2 + i * 7) % 34), 2, 2, 'w');
    ret(ctx, 240, 264, 58, 4, '#2a1a24');
    // triturador com tiras de papel
    ret(ctx, 40, 215, 26, 16, '#566c86'); ret(ctx, 43, 218, 20, 2, 'k');
    for (let i = 0; i < 6; i++) ret(ctx, 44 + i * 3, 231 + ((t * 2 + i * 5) % 20), 1, 6, 'w');
  }
  function mesaDourada(ctx) {
    mesaCores(ctx, '#e8b84a', '#a87a1f', '#a87a1f');
    ret(ctx, 56, 144, 12, 3, '#ffe28a'); ret(ctx, 57, 141, 10, 3, '#ffcd75'); ret(ctx, 58, 138, 8, 3, '#ffe28a');   // moedas
    ret(ctx, 200, 146, 16, 6, '#ffe28a'); ret(ctx, 203, 142, 10, 4, '#ffe28a');                                      // telefone dourado
  }

  // Opção B: Neon anos 80
  function fundoNeon(ctx, s) {
    const t = tempo, alto = s && s.faixa >= 3;
    ret(ctx, 0, 0, W, 170, '#1a0f3c'); ret(ctx, 0, 170, W, 130, '#0d0720');
    ret(ctx, 0, 3, W, 2, '#ff3e9d'); ret(ctx, 0, 8, W, 1, '#2fd6ff');
    ctx.save(); ctx.lineWidth = 1; ctx.strokeStyle = '#ff3e9d'; ctx.globalAlpha = 0.55;
    for (let y = 172, d = 6; y < H; y += d, d += 3) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }
    ctx.strokeStyle = '#2fd6ff';
    for (let i = -12; i <= 12; i++) { ctx.beginPath(); ctx.moveTo(155 + i * 14, 170); ctx.lineTo(155 + i * 14 * 5, H); ctx.stroke(); }
    ctx.restore();
    // janela com sol sintético
    ret(ctx, 10, 12, 150, 80, '#2fd6ff'); ret(ctx, 11, 13, 148, 78, '#140a2e');
    ret(ctx, 13, 15, 144, 74, alto ? '#5d275d' : '#2b1055');
    ret(ctx, 13, 15, 144, 14, alto ? '#b13e53' : '#2b1055'); ret(ctx, 13, 29, 144, 10, alto ? '#5d275d' : '#7a1f8a'); ret(ctx, 13, 39, 144, 8, '#d43f8e');
    circ(ctx, 85, 54, 22, '#ff9e5e');
    for (let k = 0; k < 5; k++) ret(ctx, 63, 54 + k * 4, 44, k + 1, '#7a1f8a');
    predios(ctx, 13, 45, 144, 44, 3, { c1: '#0d0720', c2: '#1d1040', j1: '#ff3e9d', j2: '#2fd6ff' });
    desenharJatos(ctx, s);
    ret(ctx, 84, 15, 2, 74, '#2fd6ff'); ret(ctx, 13, 50, 144, 2, '#2fd6ff');
    // letreiro LEGAL com o G falhando
    ret(ctx, 164, 17, 46, 1, '#ff3e9d'); ret(ctx, 164, 34, 46, 1, '#ff3e9d'); ret(ctx, 164, 17, 1, 18, '#ff3e9d'); ret(ctx, 209, 17, 1, 18, '#ff3e9d');
    palavra(ctx, 'LE', 168, 22, 2, '#ff3e9d'); palavra(ctx, 'AL', 192, 22, 2, '#ff3e9d');
    if (Math.floor(t / 4) % 7 !== 0) palavra(ctx, 'G', 184, 22, 2, '#ff3e9d');
    // pilha de TVs de tubo (no piso)
    ctx.save(); ctx.translate(-98, 118);
    for (let i = 0; i < 3; i++) {
      const y = 96 + i * 18;
      ret(ctx, 274, y, 30, 16, '#566c86'); ret(ctx, 276, y + 2, 26, 12, '#0d0720');
      if (i === 0) ['r', 'y', 'g', 'c', 'B', 'p'].forEach((c, k) => ret(ctx, 276 + k * 4 + (k > 2 ? 1 : 0), y + 2, 4, 12, c));
      else if (i === 1) for (let x = 0; x < 26; x += 2) ret(ctx, 276 + x, y + 12 - Math.floor(x * 0.4 + Math.sin(x * 0.5 + t * 0.3) * 1.5), 2, 2, '#a7f070');
      else for (let n = 0; n < 16; n++) ret(ctx, 276 + Math.floor(Math.random() * 26), y + 2 + Math.floor(Math.random() * 12), 2, 2, Math.random() < 0.5 ? 'w' : 'S');
    }
    ctx.restore();
    // lâmpada de lava e cofre neon
    cofreCores(ctx, '#2b1055', '#0d0720', '#a7f070', '#ff3e9d', '#2fd6ff');
    ret(ctx, 12, 112, 14, 6, '#ffcd75'); ret(ctx, 14, 94, 10, 18, '#3a1e6e'); ret(ctx, 13, 90, 12, 4, '#ffcd75');
    circ(ctx, 19, 100 + Math.round(Math.sin(t * 0.15) * 5), 3, '#ff3e9d'); circ(ctx, 19, 104 + Math.round(Math.sin(t * 0.12 + 2) * 6), 2, '#ff9e5e');
    // planta de palmeira
    ret(ctx, 14, 216, 2, 20, '#8a5a2a'); ret(ctx, 8, 236, 14, 12, '#ff3e9d');
    const sw = Math.round(Math.sin(t * 0.2) * 2);
    ret(ctx, 6 + sw, 214, 10, 3, 'G'); ret(ctx, 14 + sw, 212, 10, 3, 'G'); ret(ctx, 8 + sw, 219, 6, 3, 'e'); ret(ctx, 15 + sw, 218, 6, 3, 'e');
    // fax cuspindo papel
    ret(ctx, 120, 214, 30, 12, '#94b0c2'); ret(ctx, 124, 210, 22, 5, 'w'); ret(ctx, 124, 219, 22, 2, 'k');
    const len = (t * 2) % 26; ret(ctx, 130, 221, 14, len, 'w');
    for (let k = 4; k < len; k += 5) ret(ctx, 132, 221 + k, 10, 1, 'S');
    // fliperama
    ret(ctx, 251, 218, 1, 50, '#2fd6ff'); ret(ctx, 252, 218, 30, 50, '#2a1a6e'); ret(ctx, 254, 220, 26, 7, '#ff3e9d');
    ret(ctx, 256, 230, 18, 14, '#0d0720'); ret(ctx, 262, 232 + Math.abs(Math.round(Math.sin(t * 0.4) * 4)), 4, 4, '#ffcd75');
    ret(ctx, 254, 246, 26, 6, '#140a2e'); ret(ctx, 260, 244, 2, 4, 'k'); ret(ctx, 259, 242, 4, 3, 'r');
    ret(ctx, 268, 248, 3, 3, '#ffcd75'); ret(ctx, 273, 248, 3, 3, '#2fd6ff'); ret(ctx, 264, 256, 6, 3, 'k');
  }
  function mesaNeon(ctx) {
    mesaCores(ctx, '#1d1040', '#0d0720', '#2fd6ff');
    ret(ctx, 40, 152, 200, 1, '#2fd6ff'); ret(ctx, 40, 163, 200, 1, '#ff3e9d');
  }

  // Opção C: Repartição decadente
  function fundoReparticao(ctx, s) {
    const t = tempo, alto = s && s.faixa >= 3;
    ret(ctx, 0, 0, W, 170, '#9fb89a'); ret(ctx, 0, 110, W, 60, '#7e9c82'); ret(ctx, 0, 108, W, 3, '#6a8670');
    ret(ctx, 120, 118, 14, 22, '#728f77'); ret(ctx, 196, 26, 10, 16, '#93ac8e'); ret(ctx, 8, 100, 20, 8, '#93ac8e');   // manchas
    ret(ctx, 0, 0, W, 6, '#d6d2bf');
    for (let y = 170; y < H; y += 10) for (let x = 0; x < W; x += 15) ret(ctx, x, y, 15, 10, (((x / 15) + ((y - 170) / 10)) % 2) ? '#cfc8a8' : '#bdb594');
    ret(ctx, 0, 168, W, 3, '#6a8670');
    // luminárias (uma com defeito) e ventilador de teto
    ret(ctx, 140, 6, 50, 4, '#f4f4f4'); ret(ctx, 200, 6, 10, 4, '#f4f4f4');
    if (Math.floor(t / 3) % 9 !== 0) { ctx.save(); ctx.globalAlpha = 0.12; ret(ctx, 130, 10, 70, 20, 'w'); ctx.restore(); }
    ret(ctx, 116, 0, 4, 8, '#566c86');
    [0, 2.1, 4.2].forEach(d => { const bx = Math.round(Math.cos(t * 0.8 + d) * 20); ret(ctx, 118 + Math.min(0, bx), 8, Math.abs(bx) + 1, 2, '#566c86'); });
    // plaquinha FILA pendurada
    ret(ctx, 20, 0, 2, 4, '#566c86'); ret(ctx, 54, 0, 2, 4, '#566c86'); ret(ctx, 18, 1, 40, 11, '#b13e53'); palavra(ctx, 'FILA', 22, 2, 2, 'w');
    // janela com persiana quebrada
    ret(ctx, 10, 12, 150, 80, '#8a7a4a'); ret(ctx, 13, 15, 144, 74, alto ? '#5d275d' : '#d9c9a0'); ret(ctx, 13, 15, 144, 20, alto ? '#b13e53' : '#e6d8b0');
    predios(ctx, 13, 45, 144, 44, 3, { c1: '#8a7f66', c2: '#a39878', j1: '#e6d8b0', j2: '#b9ab86' });
    desenharJatos(ctx, s);
    for (let k = 0; k < 5; k++) ret(ctx, 13, 16 + k * 4, 144, 2, '#b8a878');
    ret(ctx, 40, 36, 34, 2, '#b8a878'); ret(ctx, 40, 38, 3, 3, '#b8a878');
    ret(ctx, 84, 15, 2, 74, '#8a7a4a'); ret(ctx, 13, 50, 144, 2, '#8a7a4a');
    // relógio parado e funcionário do mês
    circ(ctx, 176, 24, 11, '#3a3a3a'); circ(ctx, 176, 24, 9, 'w');
    ret(ctx, 176, 16, 1, 9, 'k'); ret(ctx, 176, 24, 5, 1, 'k'); ret(ctx, 176, 24, 1, 1, 'r');
    ret(ctx, 190, 12, 20, 24, '#6b4a1f'); ret(ctx, 192, 14, 16, 18, 'w'); draw(ctx, 'retrato_bolso', 192, 15, 1);
    ret(ctx, 195, 32, 10, 3, '#ffcd75');
    // mural de avisos
    ctx.save(); ctx.translate(-54, -8);
    ret(ctx, 268, 20, 40, 46, '#6b4a1f'); ret(ctx, 270, 22, 36, 42, '#c68642');
    [[273, 25, 10, 12, 'w'], [286, 27, 9, 9, '#ffcd75'], [297, 24, 8, 12, '#f4a6b7'], [276, 42, 12, 10, '#f4e9c0'], [291, 42 + ((t % 8) < 4 ? 0 : 1), 11, 14, 'w']].forEach(([x, y, w, h, c]) => {
      ret(ctx, x, y, w, h, c); ret(ctx, x + 2, y + 3, w - 4, 1, 'S'); ret(ctx, x + 2, y + 6, w - 5, 1, 'S'); ret(ctx, x + w / 2, y - 1, 2, 2, 'r');
    });
    ctx.restore();
    // arquivos abarrotados (no piso)
    ctx.save(); ctx.translate(-66, 96);
    ret(ctx, 270, 104, 18, 62, '#6f7f8a'); ret(ctx, 288, 110, 18, 56, '#7f8f9a');
    [120, 136, 152].forEach(y => ret(ctx, 270, y, 18, 1, 'k')); [126, 142, 156].forEach(y => ret(ctx, 288, y, 18, 1, 'k'));
    ret(ctx, 277, 112, 4, 2, 's'); ret(ctx, 295, 118, 4, 2, 's');
    ret(ctx, 290, 146, 14, 5, '#d0d6dc'); ret(ctx, 292, 140, 10, 7, 'y');
    const wob = Math.round(Math.sin(t * 0.3));
    ret(ctx, 270, 94, 18, 10, 'w'); ret(ctx, 272 + wob, 88, 14, 7, 'w'); ret(ctx, 274 + wob, 83, 10, 6, '#f4e9c0'); ret(ctx, 290, 100, 14, 10, '#f4e9c0');
    ctx.restore();
    cofreCores(ctx, '#566c86', 'k', '#38b764', '#94b0c2', '#ffcd75');
    // galão de água
    ret(ctx, 252, 232, 18, 34, '#d0d6dc'); ret(ctx, 254, 216, 14, 18, '#7fd3ff');
    for (let i = 0; i < 3; i++) ret(ctx, 257 + i * 3, 230 - ((t * 2 + i * 5) % 14), 2, 2, 'w');
    ret(ctx, 258, 246, 4, 3, 'r'); ret(ctx, 264, 246, 4, 3, '#2fd6ff'); ret(ctx, 260, 252, 6, 6, 'w');
    // lixeira transbordando e ventilador de pé soprando papéis
    ctx.save(); ctx.translate(-104, -18);
    ret(ctx, 224, 248, 18, 18, '#6f7f8a'); ret(ctx, 226, 242, 6, 8, 'w'); ret(ctx, 234, 240, 6, 10, '#f4e9c0');
    ctx.restore();
    ctx.save(); ctx.translate(-36, 0);
    ret(ctx, 196, 258, 18, 4, 'k'); ret(ctx, 204, 236, 3, 22, 'S'); circ(ctx, 205, 228, 10, '#94b0c2'); circ(ctx, 205, 228, 8, '#1a1c2c');
    const a = t * 0.9; const bx = Math.round(Math.cos(a) * 8), by = Math.round(Math.sin(a) * 8);
    ret(ctx, 205 + Math.min(0, bx), 228, Math.abs(bx) + 1, 2, 's'); ret(ctx, 205, 228 + Math.min(0, by), 2, Math.abs(by) + 1, 's');
    for (let i = 0; i < 4; i++) ret(ctx, 216 + ((t * 3 + i * 23) % 58), 222 + Math.round(Math.sin((t + i * 9) * 0.4) * 6) + i * 5, 6, 4, i % 2 ? 'w' : '#f4e9c0');
    ctx.restore();
  }
  function mesaReparticao(ctx) {
    mesaCores(ctx, '#a0702d', '#6b4a1f', '#6b4a1f');
    ret(ctx, 52, 142, 16, 10, 'w'); ret(ctx, 54, 138, 12, 4, '#f4e9c0'); ret(ctx, 206, 140, 18, 12, 'w'); ret(ctx, 208, 134, 14, 6, '#f4e9c0');
    const d = (Math.floor(tempo / 10) % 3 === 0) ? 3 : 0;                      // carimbo gigante
    ret(ctx, 98, 132 + d, 8, 4, 'r'); ret(ctx, 100, 136 + d, 4, 8, '#8a2a2a'); ret(ctx, 96, 144 + d, 12, 4, 'k');
  }


  // ---- Cenários ligados aos golpes (1 por golpe) ----
  function palmeira(ctx, x, base, h, k) {          // coqueiro: tronco reto e folhas que balançam
    const sw = Math.round(Math.sin(tempo * 0.15 + x) * 2), top = base - h, L = Math.round(9 * k);
    ret(ctx, x - 1, top, Math.max(2, Math.round(k * 2)), h, '#8a5a2a');
    ret(ctx, x - L + sw, top, L, 2, 'G'); ret(ctx, x + 1 + sw, top, L, 2, 'G');
    ret(ctx, x - Math.round(L * 0.7) + sw, top - 3, Math.round(L * 0.7), 2, 'G'); ret(ctx, x + 1 + sw, top - 3, Math.round(L * 0.7), 2, 'G');
    ret(ctx, x - 2 + sw, top - 5, 4, 3, 'e');
    circ(ctx, x, top + 4, 2, '#6b4a2b');
  }
  function boneca(ctx, cx, base, r, pulo) {        // matrioska
    const y = base - pulo, u = v => Math.floor(r * v);
    ell(ctx, cx, y - u(1.2), r, u(1.3), '#b13e53');
    circ(ctx, cx, y - u(1.1), Math.max(2, u(0.5)), '#ffcd75');
    circ(ctx, cx, y - u(2.3), Math.max(2, u(0.75)), '#ffe9c2');
    ret(ctx, cx - u(0.75), y - u(2.3) - u(0.75), u(1.5) + 1, Math.max(2, u(0.4)), '#ffcd75');
    ret(ctx, cx - u(0.3), y - u(2.3), 1, 1, 'k'); ret(ctx, cx + u(0.3), y - u(2.3), 1, 1, 'k');
  }

  // CDB Absurdo a 140%: Feirão do CDB
  function fundoFeirao(ctx, s) {
    const t = tempo, alto = s && s.faixa >= 3;
    ret(ctx, 0, 0, W, 170, '#d83a3a');
    for (let x = 0; x < W; x += 40) ret(ctx, x, 0, 6, 170, '#ffd23f');
    for (let y = 170; y < H; y += 10) for (let x = 0; x < W; x += 20) ret(ctx, x, y, 20, 10, (((x / 20) + ((y - 170) / 10)) % 2) ? '#f4f4f4' : '#c8252f');
    ret(ctx, 0, 168, W, 3, '#ffd23f');
    ret(ctx, 128, 212, 54, 88, '#8a1c1c'); ret(ctx, 128, 212, 2, 88, '#ffd23f'); ret(ctx, 180, 212, 2, 88, '#ffd23f');
    for (let x = 0; x < W; x += 14) {                                             // bandeirinhas balançando
      const cor = ['#ffd23f', 'w', '#3b5dc9', '#38b764'][Math.round(x / 14) % 4], dy = Math.round(Math.sin(t * 0.3 + x * 0.1));
      for (let r = 0; r < 8; r++) ret(ctx, x + Math.floor(r * 0.75), dy + r, 12 - Math.floor(r * 1.5), 1, cor);
    }
    ret(ctx, 10, 12, 150, 80, '#ffd23f'); ret(ctx, 13, 15, 144, 74, alto ? '#5d275d' : '#7fd3ff'); ret(ctx, 13, 15, 144, 20, alto ? '#b13e53' : '#b3e5ff');
    predios(ctx, 13, 45, 144, 44, 3, { c1: '#c8252f', c2: '#f4f4f4', j1: '#ffd23f', j2: '#3b5dc9' });
    desenharJatos(ctx, s);
    ret(ctx, 84, 15, 2, 74, '#ffd23f'); ret(ctx, 13, 50, 144, 2, '#ffd23f');
    ret(ctx, 166, 10, 42, 30, '#c8252f'); ret(ctx, 168, 12, 38, 26, '#ffd23f');     // placa CDB 140%
    for (let i = 0; i < 7; i++) { const c = (i + Math.floor(t / 4)) % 2 ? 'w' : '#c8252f'; ret(ctx, 168 + i * 6, 10, 3, 2, c); ret(ctx, 168 + i * 6, 38, 3, 2, c); }
    palavra(ctx, 'CDB', 176, 15, 2, '#c8252f'); palavra(ctx, '140%', 172, 27, 2, '#c8252f');
    cofreCores(ctx, '#c8252f', '#2a1a24', '#38b764', '#ffd23f', '#f4f4f4');
    const bx = 196, by = 268;                                                     // boneco inflável de posto
    for (let i = 0; i < 8; i++) { const off = Math.round(Math.sin(t * 0.5 + i * 0.6) * (1 + i * 0.5)); ret(ctx, bx - 4 + off, by - i * 5 - 5, 9, 6, i % 2 ? '#ffd23f' : '#ff7a1a'); }
    const ho = Math.round(Math.sin(t * 0.5 + 8 * 0.6) * 5);
    [-1, 1].forEach(side => { for (let j = 0; j < 5; j++) ret(ctx, bx + side * (6 + j * 3) + Math.round(Math.sin(t * 0.8 + j * 0.7 + (side > 0 ? 1.5 : 0)) * 3), by - 38 - j * 3, 4, 4, '#ff7a1a'); });
    circ(ctx, bx + ho, by - 50, 6, '#ffd23f'); ret(ctx, bx + ho - 3, by - 52, 2, 2, 'k'); ret(ctx, bx + ho + 2, by - 52, 2, 2, 'k'); ret(ctx, bx + ho - 2, by - 47, 5, 1, 'k');
    for (let i = 0; i < 4; i++) {                                                 // balões
      const cx = 252 + i * 8, cy = 228 + Math.round(Math.sin(t * 0.2 + i) * 3) - (i % 2) * 8;
      circ(ctx, cx, cy, 6, ['#c8252f', '#ffd23f', 'w', '#3b5dc9'][i]); ret(ctx, cx, cy + 6, 1, 16, 'S');
    }
  }
  function mesaFeirao(ctx) {
    mesaCores(ctx, '#f4f4f4', '#c8252f', '#c8252f');
    ret(ctx, 56, 145, 10, 6, '#ffd23f'); ret(ctx, 66, 142, 6, 12, '#ffd23f'); ret(ctx, 200, 144, 12, 8, '#3a3a3a'); ret(ctx, 202, 146, 8, 2, '#a7f070');
  }

  // Precatórios Turbinados: biblioteca de processos
  function fundoBiblioteca(ctx, s) {
    const t = tempo, alto = s && s.faixa >= 3;
    ret(ctx, 0, 0, W, 170, '#3b2418');
    for (let x = 0; x < W; x += 30) ret(ctx, x, 0, 1, 170, '#2e1c12');
    for (let y = 170; y < H; y += 10) for (let x = -15; x < W; x += 30) ret(ctx, x + (((y - 170) / 10) % 2) * 15, y, 29, 10, (Math.round((x + 15) / 30) + (y - 170) / 10) % 2 ? '#6b4a2b' : '#5e4025');
    ret(ctx, 164, 8, 114, 44, '#6b4a2b'); ret(ctx, 166, 10, 110, 40, '#1f130c'); ret(ctx, 166, 28, 110, 2, '#6b4a2b');
    const cores = ['#b13e53', '#3b5dc9', '#38b764', '#ffcd75', '#5d275d', '#ef7d57', '#73eff7'];
    [[12, 27], [31, 47]].forEach(([y0, y1], fila) => {
      for (let x = 168, i = fila * 13; x < 272; i++) { const w = 3 + (i * 7) % 3, h = 10 + (i * 5) % 6; ret(ctx, x, y1 - h, w, h, cores[i % 7]); ret(ctx, x, y1 - h + 2, w, 1, '#ffe9c2'); x += w + 1; }
    });
    ret(ctx, 10, 12, 150, 80, '#6b4a2b'); ret(ctx, 13, 15, 144, 74, alto ? '#5d275d' : '#8aa0b3'); ret(ctx, 13, 15, 144, 20, alto ? '#b13e53' : '#9fb3c4');
    predios(ctx, 13, 45, 144, 44, 3, { c1: '#4a5566', c2: '#5d6b7d', j1: '#e8d39a', j2: '#8a9bb0' });
    desenharJatos(ctx, s);
    for (let i = 0; i < 18; i++) ret(ctx, 13 + (i * 47 + t) % 144, 15 + (t * 5 + i * 13) % 70, 1, 4, '#b9cbdb');   // chuva
    ret(ctx, 84, 15, 2, 74, '#6b4a2b'); ret(ctx, 13, 50, 144, 2, '#6b4a2b');
    cofreCores(ctx, '#5a3a22', '#1a0f08', '#e8d39a', '#8a5a2a', '#ffcd75');
    for (let i = 0; i < 9; i++) {                                                 // pilha de processos balançando
      const wob = Math.round(Math.sin(t * 0.2 + i * 0.5) * Math.min(2, i / 4));
      ret(ctx, 14 + wob + (i % 3), 246 - i * 4, 18 - (i % 2) * 2, 4, i % 2 ? '#e8d39a' : '#d9b86c'); ret(ctx, 14 + wob + (i % 3), 248 - i * 4, 18 - (i % 2) * 2, 1, '#b13e53');
    }
    ret(ctx, 232, 254, 30, 8, '#94b0c2'); ret(ctx, 236, 246, 22, 8, '#d0d6dc'); ret(ctx, 246, 222, 4, 24, '#d0d6dc');   // estátua da Justiça torta
    circ(ctx, 248, 217, 4, '#d0d6dc'); ret(ctx, 244, 216, 8, 2, 'k');
    const ang = -0.25 + Math.sin(t * 0.1) * 0.1, dy = Math.round(Math.sin(ang) * 18), dx = Math.round(Math.cos(ang) * 18);
    ctx.save(); ctx.strokeStyle = '#ffcd75'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(248 - dx, 224 - dy); ctx.lineTo(248 + dx, 224 + dy); ctx.stroke(); ctx.restore();
    const yl = 224 - dy, yr = 224 + dy;
    ret(ctx, 248 - dx - 5, yl, 1, 8, '#ffcd75'); ret(ctx, 248 - dx + 5, yl, 1, 8, '#ffcd75'); ret(ctx, 248 - dx - 6, yl + 8, 12, 2, '#ffcd75'); ret(ctx, 248 - dx - 3, yl + 2, 6, 6, '#38b764');
    ret(ctx, 248 + dx - 5, yr, 1, 5, '#ffcd75'); ret(ctx, 248 + dx + 5, yr, 1, 5, '#ffcd75'); ret(ctx, 248 + dx - 6, yr + 5, 12, 2, '#ffcd75'); ret(ctx, 248 + dx - 4, yr + 4, 8, 1, 'w');
    const tx = 40 + Math.floor(t * 0.4) % 170, ty = 232, pa = Math.floor(t / 5) % 2;   // tartaruga de óculos levando um processo
    ell(ctx, tx, ty, 8, 5, '#38b764'); ell(ctx, tx, ty - 2, 7, 4, '#257179'); ret(ctx, tx + 8, ty - 2, 5, 4, '#38b764'); ret(ctx, tx + 10, ty - 2, 2, 1, 'w'); ret(ctx, tx + 12, ty - 2, 1, 1, 'k');
    ret(ctx, tx - 5 + pa * 2, ty + 4, 3, 3, '#38b764'); ret(ctx, tx + 3 - pa * 2, ty + 4, 3, 3, '#38b764'); ret(ctx, tx - 4, ty - 8, 8, 4, 'w'); ret(ctx, tx - 3, ty - 10, 6, 3, '#e8d39a');
  }
  function mesaBiblioteca(ctx) {
    mesaCores(ctx, '#5a3a22', '#3b2418', '#3b2418');
    ctx.save(); ctx.globalAlpha = 0.16; ell(ctx, 63, 151, 14, 4, '#ffcd75'); ctx.restore();
    ret(ctx, 62, 140, 2, 12, '#38b764'); ret(ctx, 56, 136, 14, 5, '#38b764'); ret(ctx, 58, 133, 10, 3, '#257179');   // luminária verde
    ret(ctx, 108, 136, 8, 2, '#8a5a2a'); ret(ctx, 108, 150, 8, 2, '#8a5a2a'); ret(ctx, 109, 138, 6, 12, '#73eff7'); ret(ctx, 111, 140, 2, 3, '#ffcd75'); ret(ctx, 112, 143 + (tempo % 6), 1, 1, '#ffcd75');   // ampulheta
    ret(ctx, 200, 144, 16, 8, '#e8d39a'); ret(ctx, 202, 141, 12, 4, '#d9b86c');
  }

  // Fundo de Fundo de Fundo: matrioska financeira
  function fundoMatrioska(ctx, s) {
    const t = tempo, alto = s && s.faixa >= 3;
    ret(ctx, 0, 0, W, 170, '#12343b'); for (let x = 0; x < W; x += 20) ret(ctx, x, 0, 1, 170, '#0f2226');
    for (let y = 170; y < H; y += 10) for (let x = 0; x < W; x += 20) { const c = (((x / 20) + ((y - 170) / 10)) % 2); ret(ctx, x, y, 20, 10, c ? '#f4f4f4' : '#12343b'); ret(ctx, x + 6, y + 3, 8, 4, c ? '#d6d2bf' : '#0f2226'); }
    ret(ctx, 0, 168, W, 3, '#b13e53');
    ret(ctx, 10, 12, 150, 80, '#2a8f9d'); ret(ctx, 13, 15, 144, 74, alto ? '#5d275d' : '#56b7c2'); ret(ctx, 13, 15, 144, 20, alto ? '#b13e53' : '#8ad3dc');
    predios(ctx, 13, 45, 144, 44, 3, { c1: '#0f3d3e', c2: '#1c5a5e', j1: '#f4f4f4', j2: '#b13e53' });
    desenharJatos(ctx, s);
    ret(ctx, 84, 15, 2, 74, '#2a8f9d'); ret(ctx, 13, 50, 144, 2, '#2a8f9d');
    for (let k = 0; k < 5; k++) { const z = 44 - k * 9, o = (44 - z) / 2; ret(ctx, 166 + o, 8 + o, z, z, (k + Math.floor(t / 4)) % 2 ? '#f4f4f4' : '#b13e53'); }     // túnel: quadro dentro de quadro
    ret(ctx, 184, 26, 8, 8, '#ffcd75');
    ret(ctx, 6, 118, 44, 52, '#94b0c2'); ret(ctx, 9, 121, 38, 46, '#0f2226'); ret(ctx, 14, 126, 28, 36, '#94b0c2'); ret(ctx, 17, 129, 22, 30, '#0f2226');   // cofre dentro de cofre dentro de cofre
    ret(ctx, 22, 134, 12, 20, '#94b0c2'); ret(ctx, 24, 136, 8, 16, '#0f2226'); ret(ctx, 27, 142, 3, 3, '#ffcd75'); ret(ctx, 50, 118, 8, 52, '#566c86'); ret(ctx, 52, 138, 4, 10, '#ffcd75');
    [12, 10, 8, 6, 4].reduce((x, r, i) => { boneca(ctx, x + r, 262, r, ((Math.floor(t / 4) + i) % 5 === 0) ? 3 : 0); return x + r * 2 + 4; }, 170);   // fila de matrioskas
  }
  function mesaMatrioska(ctx) {
    mesaCores(ctx, '#f4f4f4', '#b13e53', '#b13e53');
    boneca(ctx, 64, 152, 4, 0); boneca(ctx, 76, 152, 3, 0); boneca(ctx, 84, 152, 2, 0);
  }

  // Previdência dos Outros: aposentadoria de luxo na praia
  function fundoAposentadoria(ctx, s) {
    const t = tempo, alto = s && s.faixa >= 3;
    ret(ctx, 0, 0, W, 170, '#ffdfb0'); ret(ctx, 0, 110, W, 60, '#3ec1c9'); ret(ctx, 0, 108, W, 3, 'w');
    for (let x = 0; x < W; x += 12) ret(ctx, x, 111, 6, 57, '#35b0b8');
    ret(ctx, 0, 170, W, 130, '#f0d9a0');
    for (let i = 0; i < 70; i++) ret(ctx, (i * 53) % W, 172 + (i * 37) % 126, 2, 1, '#d8bd80');
    for (let i = 0; i < 6; i++) ret(ctx, 120 + i * 14, 214 + (i % 2) * 5, 3, 2, '#d8bd80');
    ret(ctx, 10, 12, 150, 80, 'w'); ret(ctx, 13, 15, 144, 74, alto ? '#5d275d' : '#7fd3ff'); ret(ctx, 13, 15, 144, 20, alto ? '#b13e53' : '#a8e0ff');
    circ(ctx, 130, 28, 8 + (Math.floor(t / 6) % 2), '#ffd23f');
    ret(ctx, 13, 50, 144, 39, '#2a8fd6');
    for (let k = 0; k < 6; k++) for (let x = 0; x < 144; x += 24) ret(ctx, 13 + (x + k * 9 + t) % 134, 54 + k * 6, 10, 1, '#73eff7');
    ret(ctx, 13, 82, 144, 7, '#f0d9a0'); palmeira(ctx, 34, 82, 22, 1); palmeira(ctx, 138, 82, 18, 1);
    desenharJatos(ctx, s);
    ret(ctx, 84, 15, 2, 74, 'w'); ret(ctx, 13, 50, 144, 2, 'w');
    ret(ctx, 180, 0, 1, 10, '#8a5a2a'); ret(ctx, 220, 0, 1, 10, '#8a5a2a'); ret(ctx, 170, 10, 60, 18, '#ff7a5c'); palavra(ctx, 'PARAISO', 173, 14, 2, 'w');
    ell(ctx, 246, 30, 5, 17, '#ff7a5c'); ret(ctx, 245, 14, 2, 32, 'w'); ell(ctx, 258, 32, 5, 16, '#3ec1c9'); ret(ctx, 257, 17, 2, 30, 'w');
    cofreCores(ctx, '#8a5a2a', '#2a1a08', '#ffd23f', '#ef7d57', '#ffd23f');
    palmeira(ctx, 28, 248, 40, 1.6);
    ret(ctx, 240, 222, 2, 40, '#8a5a2a');                                        // guarda-sol
    for (let dy = -12; dy <= 0; dy++) { const w = Math.floor(28 * Math.sqrt(1 - (dy / 12) * (dy / 12))); for (let x = -w; x <= w; x++) ret(ctx, 240 + x, 222 + dy, 1, 1, Math.floor((x + 28) / 8) % 2 ? 'w' : '#e0472f'); }
    ret(ctx, 222, 250, 32, 4, '#3b5dc9'); for (let i = 0; i < 4; i++) ret(ctx, 222 + i * 8, 250, 4, 4, 'w'); ret(ctx, 222, 240, 4, 12, '#3b5dc9');
    const fb = Math.round(Math.sin(t * 0.2));                                     // boia de flamingo
    circ(ctx, 180, 242 + fb, 11, '#ff9ec2'); circ(ctx, 180, 242 + fb, 6, '#f0d9a0'); ret(ctx, 186, 226 + fb, 3, 14, '#ff9ec2'); ret(ctx, 185, 224 + fb, 5, 4, '#ff9ec2'); ret(ctx, 190, 226 + fb, 3, 2, '#ffcd75'); ret(ctx, 187, 225 + fb, 1, 1, 'k');
    const cx = 200 + Math.round(Math.sin(t * 0.06) * 50);                         // caranguejo com moeda
    ell(ctx, cx, 280, 5, 3, '#e0472f'); ret(ctx, cx - 9, 276, 4, 3, '#e0472f'); ret(ctx, cx + 6, 276, 4, 3, '#e0472f'); ret(ctx, cx - 2, 276, 1, 2, 'k'); ret(ctx, cx + 2, 276, 1, 2, 'k'); ret(ctx, cx + 7, 272, 3, 3, '#ffd23f');
  }
  function mesaAposentadoria(ctx) {
    mesaCores(ctx, '#d8b26a', '#8a5a2a', '#8a5a2a');
    circ(ctx, 62, 147, 5, '#6b4a2b'); ret(ctx, 62, 136, 1, 8, 'w'); ret(ctx, 66, 132, 8, 2, '#ff7a5c'); ret(ctx, 70, 134, 1, 8, '#8a5a2a');
    ret(ctx, 200, 146, 14, 6, '#ff9ec2');
  }

  const ESTILOS = {
    atual: { fundo: fundoAtual, mesa: mesaAtual },
    dourado: { fundo: fundoDourado, mesa: mesaDourada },
    neon: { fundo: fundoNeon, mesa: mesaNeon },
    reparticao: { fundo: fundoReparticao, mesa: mesaReparticao },
    feirao: { fundo: fundoFeirao, mesa: mesaFeirao },
    biblioteca: { fundo: fundoBiblioteca, mesa: mesaBiblioteca },
    matrioska: { fundo: fundoMatrioska, mesa: mesaMatrioska },
    aposentadoria: { fundo: fundoAposentadoria, mesa: mesaAposentadoria }
  };
  function definirEstilo(nome) { if (ESTILOS[nome]) estiloCena = nome; }

  function cena(ctx, s) {
    const D = GM.data;
    if (cenaAtual) {
      if (tempo < cenaAtual.ate) { ctx.imageSmoothingEnabled = false; CENAS[cenaAtual.id](ctx, s, tempo); return; }
      cenaAtual = null;
    }
    ctx.imageSmoothingEnabled = false;
    const est = ESTILOS[estiloCena] || ESTILOS.atual;
    est.fundo(ctx, s);
    // Banqueiro de Bolso atrás da mesa. Com suspeita alta ele larga a mesa e vai para a frente da cena,
    // de pé, andando de um lado para o outro com a mala de fuga na mão (só visual; desenhado depois dos aliados).
    const bob = Math.floor(tempo / 4) % 2;
    const dePe = !!(s && s.suspeita >= D.params.banqueiroDePe);
    if (!dePe) {
      draw(ctx, 'retrato_bolso', 124, 104 + bob, 3);
      ret(ctx, 176, 140, 18, 14, 'o'); ret(ctx, 176, 140, 18, 2, 'k'); ret(ctx, 182, 137, 6, 3, 'k'); ret(ctx, 184, 145, 2, 5, 'G');
    }
    if (s && s.faixa < 3) mesinhaVigia(ctx, false);   // pernas atrás da mesa do banqueiro
    est.mesa(ctx, s);
    // aliados sentados (fila de trás e fila da frente)
    if (s) {
      const ativos = D.aliados.filter(a => s.aliados[a.id].ativo).sort((a, b) => s.aliados[a.id].ordem - s.aliados[b.id].ordem);
      const lugares = [[66, 120], [94, 120], [196, 120], [224, 120], [62, 176], [96, 176], [130, 176], [164, 176], [198, 176], [232, 176], [30, 176], [266, 176], [0, 176]];
      ativos.slice(0, lugares.length).forEach((a, i) => {
        const [x, y] = lugares[i];
        const b = (Math.floor(tempo / 4) + i) % 2;
        draw(ctx, y >= 170 ? 'corpo_' + a.id : 'retrato_' + a.id, x, y + b, 2);   // fila da frente: corpo inteiro
        if (s.aliados[a.id].lealdade < D.params.delacaoLimite) { ret(ctx, x + 26, y - 4 + b, 3, 7, 'r'); ret(ctx, x + 26, y + 5 + b, 3, 2, 'r'); }
      });
      if (dePe) {   // fugindo: na frente da mesa, perto da saída (direita), vai e volta sem sair do lugar
        // (a parte de baixo do canvas é cortada na tela: ele termina em y ~266 para os pés aparecerem)
        const passo = [0, 2, 4, 6, 4, 2][Math.floor(tempo / 2) % 6];
        const x = 248 + passo, y = 176 - (Math.floor(tempo / 2) % 2);
        ret(ctx, x + 4, 264, 42, 4, 'k');                                   // sombra no chão
        malaEstufada(ctx, x - 20, y + 56);                                  // na mão esquerda (a direita dá na borda)
        draw(ctx, 'corpo_bolso', x, y, 3);
        if (Math.floor(tempo / 3) % 2) { ret(ctx, x + 6, y + 14, 3, 5, 'c'); ret(ctx, x + 7, y + 19, 1, 1, 'c'); }   // gota de suor
      }
      // inimigo por faixa, perto do termômetro
      const nomeIni = 'inimigo_' + inimigoPorFaixa[Math.min(s.faixa, 3)];
      const tremor = s.faixa >= 2 ? (Math.floor(tempo / 2) % 2) : 0;
      draw(ctx, nomeIni, 206 + tremor, 50, 2);
      if (s.faixa < 3) mesinhaVigia(ctx, true);       // o helicóptero voa; os outros ficam de pé atrás da mesinha
    }
    // moedas subindo
    moedas = moedas.filter(m => m.vida > 0);
    moedas.forEach(m => {
      draw(ctx, 'icone_moeda', m.x, m.y, 1);
      m.y -= 3; m.x += m.vx; m.vida--;
    });
  }

  // mesinha alta de vigia do observador: o tampo cobre a cintura (onde o sprite termina) e as pernas vão até o chão (y 170).
  // tampo=false desenha só as pernas (antes da mesa do banqueiro, que as cobre); tampo=true desenha tampo e cafezinho.
  function mesinhaVigia(ctx, tampo) {
    if (!tampo) {
      ret(ctx, 218, 116, 3, 54, 'k'); ret(ctx, 219, 116, 1, 54, '#8a5a2a');
      ret(ctx, 255, 116, 3, 54, 'k'); ret(ctx, 256, 116, 1, 54, '#8a5a2a');
      ret(ctx, 220, 140, 36, 2, 'k');                                             // travessa
      ret(ctx, 214, 168, 48, 2, 'k');                                             // sombra no chão
      return;
    }
    ret(ctx, 210, 109, 56, 8, 'k'); ret(ctx, 211, 110, 54, 4, '#b07a3a'); ret(ctx, 211, 114, 54, 2, '#6b4a2b');
    ret(ctx, 211, 110, 54, 1, '#d8a35a');                                         // brilho do tampo
    ret(ctx, 254, 104, 6, 6, 'k'); ret(ctx, 255, 105, 4, 4, 'w'); ret(ctx, 260, 106, 2, 3, 'k'); ret(ctx, 255, 105, 4, 1, '#6b4a2b');   // cafezinho
    if (Math.floor(tempo / 3) % 2) ret(ctx, 256, 101, 1, 2, 's'); else ret(ctx, 257, 100, 1, 2, 's');   // vapor
  }

  // mala de dinheiro estufada (22x20), em cima da mesa, com notas escapando pela fresta
  function malaEstufada(ctx, x, y) {
    ret(ctx, x + 8, y - 4, 6, 2, 'k'); ret(ctx, x + 7, y - 3, 2, 4, 'k'); ret(ctx, x + 13, y - 3, 2, 4, 'k');   // alça
    ret(ctx, x + 2, y, 18, 20, 'k'); ret(ctx, x, y + 2, 22, 16, 'k');                                          // contorno arredondado
    ret(ctx, x + 2, y + 1, 18, 18, 'o'); ret(ctx, x + 1, y + 3, 20, 14, 'o');
    ret(ctx, x + 3, y + 2, 6, 2, 'y');                                                                          // brilho
    ret(ctx, x + 1, y + 8, 20, 2, 'p');                                                                         // fresta
    ret(ctx, x - 2, y + 6, 6, 3, 'G'); ret(ctx, x - 1, y + 7, 3, 1, 'g');                                       // notas saindo
    ret(ctx, x + 17, y + 5, 7, 3, 'G'); ret(ctx, x + 19, y + 6, 3, 1, 'g');
    ret(ctx, x + 9, y + 7, 4, 4, 'y');                                                                          // fecho
    ret(ctx, x + 2, y + 18, 18, 2, 'p');                                                                        // base
  }

  function soltarMoedas(valor) {
    const n = Math.min(12, 3 + Math.floor(valor / 20));
    for (let i = 0; i < n; i++) moedas.push({ x: 140 + (i * 37) % 30, y: 150 + (i * 13) % 20, vx: ((i * 7) % 5) - 2, vida: 14 + (i % 6) });
  }

  // animação leve: redesenha o cenário ~8 vezes por segundo quando o jogo está na tela
  function iniciarLoop() {
    if (!temDom) return;
    setInterval(() => {
      tempo++;
      const ui = GM.ui;
      if (!ui || ui.tela !== 'jogo' || !ui.s) return;
      const cv = document.getElementById('cena');
      if (cv) cena(cv.getContext('2d'), ui.s);
    }, 125);
  }

  // ---------------- Título e fim ----------------
  function titulo(ctx) {
    ctx.imageSmoothingEnabled = false;
    ret(ctx, 0, 0, 320, 120, 'b');
    ret(ctx, 0, 0, 320, 40, 'B');
    predios(ctx, 0, 40, 320, 60, 5);
    ret(ctx, 0, 100, 320, 20, 'd');
    draw(ctx, 'retrato_bolso', 136, 52, 3);
    // malas de dinheiro
    [[96, 88], [198, 88]].forEach(([x, y]) => { ret(ctx, x, y, 26, 18, 'o'); ret(ctx, x, y, 26, 2, 'k'); ret(ctx, x + 9, y - 4, 8, 4, 'k'); ret(ctx, x + 11, y + 6, 4, 8, 'G'); });
    for (let i = 0; i < 9; i++) draw(ctx, 'icone_moeda', 20 + i * 34, 10 + (i % 3) * 8, 1);
  }

  function fimHtml(fim) {
    const nome = fim.vitoria ? 'retrato_bolso' : (fim.id === 'guarulhos' || fim.id === 'delacao' ? 'inimigo_fim' : 'inimigo_helicoptero');
    const w = MAPAS[nome][0].length;
    return '<canvas class="fim-sprite" data-sprite="' + nome + '" width="' + w + '" height="' + w + '"></canvas>';
  }

  GM.sprites = {
    PALETA, MAPAS, draw, cena, titulo, fimHtml,
    moedas: soltarMoedas,
    forcarJato,
    mostrarCena,
    estilo: definirEstilo,
    estilos: () => Object.keys(ESTILOS),
    cenas: () => Object.keys(CENAS),
    nomes: () => Object.keys(MAPAS),
    iniciar() { carregarPngs(); iniciarLoop(); }
  };
  if (typeof module !== 'undefined' && module.exports) module.exports = GM.sprites;
})(typeof window !== 'undefined' ? window : globalThis);
