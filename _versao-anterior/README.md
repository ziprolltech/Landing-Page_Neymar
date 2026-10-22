# Site Neymar Jr · player_010

Site estático (HTML único) com hero 3D em Three.js, scroll suave com Lenis, mapa, timeline, seção "direto da vila" e rodapé. Tudo roda localmente: Three.js e Lenis estão em `assets/vendor`, sem dependência do Layers.

## Rodar

Os módulos e o `fetch` precisam de um servidor (não abre direto pelo `file://`):

```bash
cd Site-Neymar
python -m http.server 8080
# abra http://localhost:8080
```

## Estrutura

```
index.html            página inteira (CSS + JS inline)
creditos.json         créditos das fotos (timeline e hero)
assets/
  person-diffuse.webp  2048x2336 · foto recortada, fundo branco
  person-alpha.webp    máscara da silhueta
  person-depth.webp    cúpula suavizada na silhueta
  person-normal.webp   normal derivada do depth
  overlay.webp         versão Coringa alinhada ao rosto, revelada pelo mouse (RGBA)
  paddock.webp         retrato com efeito de pintura (1350x1165)
  mapa-dots.json       mapa pontilhado (Natural Earth)
  vendor/              three.module.js, three.core.js (r186), lenis.mjs
  timeline/            coloque aqui 2003.webp, 2011.webp, ... (ver abaixo)
tools/
  make_maps.py         regenera os mapas e o retrato a partir de uma foto
  make_joker_overlay.py gera o overlay do Coringa (source/Coringa.png)
  build_map.mjs        regenera mapa-dots.json
```

## Fotos da timeline

1. Baixe fotos com licença livre do Wikimedia Commons (categoria "Neymar").
2. Salve como `assets/timeline/<ano>.webp`.
3. Preencha `arquivo`, `autor`, `licenca` e `url` daquele ano em `creditos.json`.

Enquanto a foto não existir, o card mostra o ano em halftone. Os créditos aparecem no card e no rodapé automaticamente.

## Trocar a foto do hero

```bash
pip install rembg opencv-contrib-python pillow numpy
python tools/make_maps.py minha-foto.png assets
```

Preencha `hero.autor` em `creditos.json`.

`make_maps.py` sobrescreve o overlay com o halftone antigo. Depois dele, rode de novo o do Coringa
(e meça outra vez as pupilas `NEY`/`JOK` no topo do script se a foto mudou):

```bash
python tools/make_joker_overlay.py source/Coringa.png assets
```
