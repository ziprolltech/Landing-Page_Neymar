---
message: "Da Vila para o mundo: a carreira do camisa 10, do menino do Santos ao maior artilheiro da Seleção"
audience: visitantes do site de fã
mode: autonomous
duration: 45
canvas: 1920x1080
music: assets/audio/score.wav — 120 BPM, compasso = 2s, cortes a cada 4s (5,9,13,17,21,25,29), virada 33, final 39
---

Arco: abertura sombria (promessa) → sete fases da carreira em cortes no ritmo
(ascensão) → corte seco para o Coringa (ousadia) → explosão de luz no retrato
oficial com os números finais (legado).

Estrutura: composição única (`index.html`) com cenas `.scene` e um timeline;
transições CSS do catálogo: light leak (abertura→carreira), zoom-through
(primária entre fotos), glitch (virada do Coringa), overexposure burn (clímax).
Grão de filme (`grain-overlay`) e barras de cinema por cima de tudo.

Paleta: fundo #090a0b, texto #f7fafb, acento #fedd00, apoio #009c3b.
Tipos: Oswald 700 (títulos/anos), Space Grotesk 400/700 (linhas e rótulos).

## Frame 1
status: outline
src: index.html#s-intro
time: 0–5s
rules: kinetic-type-beats (Hook escalation) · ambient-glow-bloom · sine-wave-loop
beat: preto com brilho amarelo respirando; "DA VILA" bate em 1.0s, "PARA O MUNDO." em 2.5s, linha fina desenha; push lento.

## Frame 2–8
status: outline
src: index.html#s-2011 … #s-2026
time: 5–33s (4s cada)
rules: multi-phase-camera (push Ken Burns no foco da foto) · waterfall-entry (ano + linha) · depth-of-field-blur (leve na entrada)
beat: foto em tela cheia, gradiente escuro embaixo à esquerda, ano gigante em Oswald amarelo, título e linha curta em Space Grotesk; régua de progresso 01/07.
- 2011 Santos — O menino da Vila. / Campeão da Libertadores aos 19 anos.
- 2013 Seleção — Bola de Ouro. / Melhor jogador da Copa das Confederações.
- 2015 Barcelona — A tríplice coroa. / Champions, La Liga e Copa do Rei.
- 2016 Rio — O ouro olímpico. / O pênalti decisivo no Maracanã.
- 2017 Paris — A maior transferência da história. / 222 milhões de euros.
- 2023 Al-Hilal — Maior artilheiro da Seleção. / Passou Pelé.
- 2026 Santos — Da Vila para o mundo. / Quatro Copas. Segue no Santos.

## Frame 9
status: outline
src: index.html#s-coringa
time: 33–39s
rules: chromatic-glitch (entrada) · multi-phase-camera (descida lenta) · kinetic-beat-slam
beat: glitch seco para a arte Coringa/Batman (chuva); "OUSADIA" slam em 34.0, "E ALEGRIA." em 35.5.

## Frame 10
status: outline
src: index.html#s-final
time: 39–45s
rules: counting-dynamic-scale (80 · 130 · 4) · ambient-glow-bloom · spring-pop-entrance
beat: estouro de luz; retrato oficial recortado sobre "NEYMAR JR" gigante; contagem 80 gols · 130 jogos · 4 Copas; "camisa 10" e fade final.
