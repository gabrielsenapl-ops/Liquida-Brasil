# Áudio: arquivos, origem e licença

Exigido por `docs/MELHORIAS_V3.md` (seção 4). Atualizado em 30/09/2026 (Fase E).

| Arquivo | Origem | Licença / situação | Vai para o GitHub? |
|---|---|---|---|
| Sons sintetizados em `js/audio.js` (`SONS`: clique, moeda, gasto, alerta, operacao, vitoria, derrota, notificacao, telefone, delacao, jato) e o tema chiptune (`TEMA`) | Código do projeto (osciladores Web Audio), composição original | Do projeto | Sim |
| `assets/audio/minigames/*.mp3` (44 arquivos: `tri_`, `cue_`, `mala_`, `fuga_`, `col_`, `chuva_`, `mg_`) | Gerados para o projeto com o Claude em 30/09/2026 | Do projeto; o Gabriel liberou a publicação (30/09/2026) | Sim |
| `assets/audio/<nome>.mp3` (opcional, troca um som de `SONS` pelo arquivo) | Nenhum existe hoje | Gravar com voz própria, de amigos ou TTS (regra do V3) | Sim, se forem do projeto |
| `assets/audio/memes/*.mp3` (10 arquivos: pegaram-telefone, toc-toc-pf, me-chame-de-corrupto, imbroxavel, e-agora-vai-entra-o-grosso, chega-de-frescura-e-mimimi, eu-sou-crente, ces-nao-sao-crente, abraco-lindao, defender-corrupcao) | Recortes de áudio de vídeos públicos, com **voz de pessoas reais**. `toc-toc-pf` é o corte de 5,2 s feito pela forma de onda (início e fim a confirmar ouvindo) | **Sem licença.** Exceção do `CLAUDE.md` | **Sim**, desde 06/10/2026 (autorização do Gabriel) |
| `assets/audio/ideologia.m4a` | Gravação original de uma música brasileira (4 min 9 s) | **Direitos autorais de terceiros, sem licença.** | **Sim**, desde 06/10/2026 (autorização do Gabriel) |

## Regras

- O jogo funciona sem os memes e sem a Ideologia: cada meme tem um som sintetizado de reserva (ou nenhum) e a música de fundo não abaixa se o arquivo não existir. Testado com a pasta `memes/` removida (Fase E).
- 06/10/2026: o Gabriel decidiu publicar os memes e a Ideologia mesmo sem licença (saíram do `.gitignore`). Risco: pedido de remoção (DMCA) no GitHub ou na hospedagem, principalmente da Ideologia, que é a gravação comercial inteira. Se acontecer, basta apagar o arquivo: o jogo volta ao som sintetizado sozinho.
- Nomes de arquivo sem nome de pessoa, sem espaço e sem acento (o `teste/ferramentas/check.js` verifica o nome dos `.mp3` e `.m4a`).
