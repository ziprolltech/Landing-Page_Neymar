"""Gera carreira/index.html a partir de carreira/carreira.json.

O HTML sai estático (todo o texto, as fotos e os créditos já no documento), para a página continuar
legível sem JavaScript. O carreira.js só acrescenta movimento, a régua do tempo e a navegação.
Uso, na raiz do site:  python carreira/tools/gerar.py
"""
import json
import html
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
data = json.loads((ROOT / "carreira.json").read_text(encoding="utf-8"))
CH = data["capitulos"]
BY_ID = {c["id"]: c for c in CH}
e = lambda s: html.escape(str(s), quote=True)


def foto_ref(ref):
    """'santos-origem:1' -> fotos.corpo[1]; 'santos-origem:abertura' -> fotos.abertura."""
    cid, k = ref.split(":")
    f = BY_ID[cid]["fotos"]
    return f["abertura"] if k == "abertura" else f["corpo"][int(k)]


def credito(f, prefixo="Foto"):
    return (f'{prefixo}: <a href="{e(f["url"])}" rel="noopener">{e(f["autor"])}</a>'
            f' · <a href="{e(f["licencaUrl"])}" rel="noopener license">{e(f["licenca"])}</a> · Wikimedia Commons')


def img(f, cls="", lazy=True, alt=None, extra=""):
    a = f["alt"] if alt is None else alt
    return (f'<img{f" class={chr(34)}{cls}{chr(34)}" if cls else ""} src="{e(f["arquivo"])}" width="{f["w"]}" height="{f["h"]}" '
            f'alt="{e(a)}"{" loading=" + chr(34) + "lazy" + chr(34) if lazy else ""} decoding="async"{extra}>')


def figura(f, cls):
    return f"""<figure class="ph {cls}">
          <div class="ph-mask">{img(f)}</div>
          <figcaption><span class="ph-cap">{e(f["legenda"])}</span> <span class="cred">{credito(f)}</span></figcaption>
        </figure>"""


def frame(i, c):
    f = c["fotos"]["abertura"]
    return f"""<li><a class="frame" href="#cap-{c["id"]}" data-go="{i}" data-depth="{0.15 + 0.07 * (i % 3):.2f}">
          <span class="frame-img">{img(f, lazy=False, alt="")}</span>
          <span class="frame-n">{i + 1:02d}</span>
          <span class="frame-name">{e(c["rotulo"])}</span>
          <span class="frame-per">{e(c["periodo"])}</span>
        </a></li>"""


def capitulo(i, c):
    fx = c["efeito"]
    fa = c["fotos"]["abertura"]
    saida = c["fotos"].get("saida")
    old = ""
    if saida:
        fo = foto_ref(saida)
        old = f'<div class="op-old">{img(fo, alt="")}</div>'
    tags = ""
    if fx == "memoria":
        tags = '<p class="op-tag op-tag--a" aria-hidden="true">Então · 2011</p><p class="op-tag op-tag--b" aria-hidden="true">Agora · 2025</p>'
    flag = '<div class="op-flag" aria-hidden="true"></div>' if fx == "bandeira" else ""
    ano = c["ano"]
    momentos = "\n".join(
        f'<li data-step><time>{e(m["quando"])}</time><p>{e(m["texto"])}</p></li>' for m in c["momentos"])
    if c["conquistas"]:
        wins = "\n".join(
            f'<li data-reveal="up" data-delay="{k * 70}"><b>{e(w["titulo"])}</b><span>{e(w["anos"])}</span>'
            + (f'<small>{e(w["nota"])}</small>' if w.get("nota") else "") + "</li>"
            for k, w in enumerate(c["conquistas"]))
        wins = f'<ul class="wins">{wins}</ul>'
    else:
        wins = f'<p class="wins-empty" data-reveal="up">{e(c.get("conquistasVazio", ""))}</p>'
    recordes = ""
    if c.get("recordes"):
        recordes = '<ul class="recs">' + "".join(
            f'<li data-reveal="up" data-delay="{k * 90}"><b>{e(r["titulo"])}</b><span>{e(r["texto"])}</span></li>'
            for k, r in enumerate(c["recordes"])) + "</ul>"
    nums = "\n".join(
        f'<div class="num"><dt>{e(n["rotulo"])}</dt><dd class="mono-num" data-count="{n["valor"]}" data-delay="{k * 120}">{n["valor"]}</dd></div>'
        for k, n in enumerate(c["numeros"]))
    fonte = c["numerosFonte"]
    par = ""
    if c["paralelo"]:
        items = "".join(f'<li><time>{e(p["quando"])}</time><p>{e(p["texto"])}</p></li>' for p in c["paralelo"])
        par = f"""<aside class="par" aria-label="Enquanto isso, na Seleção">
          <p class="par-k"><i aria-hidden="true"></i>Enquanto isso, na Seleção</p>
          <ul>{items}</ul>
          <a class="par-go" href="#cap-selecao" data-go="{len(CH) - 1}">Ver a linha da Seleção <span aria-hidden="true">→</span></a>
        </aside>"""
    corpo = c["fotos"]["corpo"]
    ph_a = figura(corpo[0], "ph--a") if corpo else ""
    ph_b = figura(corpo[1], "ph--b") if len(corpo) > 1 else ""
    theme = 'data-theme="dark"' if c["tipo"] != "Seleção" else 'data-header="light"'
    return f"""
  <section class="ch fx-{fx}{' ch--flip' if i % 2 else ''}" id="cap-{c["id"]}" data-i="{i}" data-fx="{fx}"
    data-inicio="{c["inicio"]}" data-fim="{c["fim"]}" data-de="{ano["de"]}" data-para="{ano["para"]}"
    data-rotulo="{e(c["rotulo"])}" data-periodo="{e(c["periodo"])}" style="--c:{c["cor"]}" aria-labelledby="h-{c["id"]}">
    <div class="op" data-theme="dark"{' data-header="light"' if fx == "bandeira" else ""}>
      <div class="op-stage">
        {flag}{old}
        <div class="op-new">{img(fa, lazy=i > 0)}</div>
        <div class="op-shade" aria-hidden="true"></div>
        {tags}
        <div class="op-year" aria-hidden="true">{ano["para"]}</div>
        <div class="op-copy">
          <p class="op-kicker"><span>Capítulo {i + 1:02d}</span> · <span>{e(c["tipo"])}</span></p>
          <h2 class="op-title" id="h-{c["id"]}">{e(c["nome"])}</h2>
          <p class="op-meta"><span class="op-period">{e(c["periodo"])}</span><span class="op-sub">{e(c["subtitulo"])}</span></p>
          <p class="op-note">{e(ano["nota"])}</p>
        </div>
        <p class="op-credit"><span>{e(fa["legenda"])}</span> {credito(fa)}</p>
      </div>
    </div>
    <div class="ch-body" {theme}>
      <div class="ch-wire" aria-hidden="true"><i></i></div>
      <div class="ch-grid">
        <div class="ch-intro">
          <p class="ch-lead" data-reveal="split" data-stagger="70">{e(c["abertura"])}</p>
          <p class="ch-ctx" data-reveal="up" data-delay="200">{e(c["contexto"])}</p>
        </div>
        {ph_a}
        <div class="ch-moments">
          <h3 class="ch-h3">Acontecimentos</h3>
          <ol class="steps">
            {momentos}
          </ol>
        </div>
        <div class="ch-side">
          <div class="ch-stats">
            <h3 class="ch-h3">Números</h3>
            <dl class="nums">{nums}</dl>
            <p class="src">{e(c["numerosNota"])} Fonte: <a href="{e(fonte["url"])}" rel="noopener">{e(fonte["nome"])}</a>.</p>
          </div>
          {recordes}
          <div class="ch-wins">
            <h3 class="ch-h3">Conquistas</h3>
            {wins}
          </div>
        </div>
        {par}
        {ph_b}
      </div>
    </div>
  </section>"""


fotos_todas = []
for c in CH:
    for f in [c["fotos"]["abertura"], *c["fotos"]["corpo"]]:
        if f["url"] not in [x["url"] for x in fotos_todas]:
            fotos_todas.append(f)

creditos = "\n".join(f'<li><span>{e(f["legenda"])}</span> {credito(f, "Foto")}</li>' for f in fotos_todas)
fontes = "\n".join(f'<li><a href="{e(s["url"])}" rel="noopener">{e(s["nome"])}</a></li>' for s in data["fontes"])
frames = "\n        ".join(frame(i, c) for i, c in enumerate(CH))
caps = "".join(capitulo(i, c) for i, c in enumerate(CH))

page = f"""<!doctype html>
<html lang="pt-BR" class="no-js">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Carreira · Neymar Jr</title>
<meta name="description" content="A carreira de Neymar Jr em capítulos: Santos, Barcelona, PSG, Al-Hilal, o retorno ao Santos e a Seleção Brasileira, com datas, conquistas, números e fotos históricas.">
<link rel="icon" href="/assets/ui/njr-logo.png">
<script>try{{if(sessionStorage.getItem("njr-plate"))document.documentElement.classList.add("njr-arriving")}}catch(e){{}}</script>
<link rel="stylesheet" href="/shared/njr.css">
<link rel="stylesheet" href="carreira.css">
<link rel="preload" as="image" href="{CH[0]["fotos"]["abertura"]["arquivo"]}">
</head>
<body>
<div class="njr-plate" aria-hidden="true"><i></i><b></b></div>
<a class="skip" href="#cap-{CH[0]["id"]}">Pular para o primeiro capítulo</a>
<main id="main">
  <!-- gerado por carreira/tools/gerar.py a partir de carreira.json (atualizado em {data["atualizado"]}) -->
  <section class="hero" data-theme="dark" aria-labelledby="hero-h">
    <div class="hero-grain" aria-hidden="true"></div>
    <div class="hero-top">
      <p class="eyebrow hero-eyebrow">Carreira · 2009 — 2026</p>
      <h1 class="hero-h display" id="hero-h" data-lines="a trajetória|em capítulos">A trajetória em capítulos.</h1>
      <p class="hero-lead">Cinco clubes e uma Seleção, de 2009 a 2026. Role a página, use as setas <kbd>←</kbd> <kbd>→</kbd> do teclado ou escolha um capítulo.</p>
    </div>
    <div class="hero-ruler" aria-hidden="true"><span class="hr-a">2009</span><i class="hr-line"></i><span class="hr-b">2026</span></div>
    <nav class="reel-wrap" aria-label="Capítulos da carreira">
      <ol class="reel">
        {frames}
      </ol>
    </nav>
    <p class="hero-hint" aria-hidden="true"><i></i>Role para começar</p>
  </section>
{caps}

  <section class="ep" id="fontes" data-header="light" aria-labelledby="ep-h">
    <h2 class="ep-h display" id="ep-h" data-lines="fontes e|créditos">Fontes e créditos.</h2>
    <div class="ep-cols">
      <div>
        <h3 class="ch-h3">Fontes dos dados</h3>
        <ul class="ep-list">{fontes}</ul>
        <p class="ep-note">Dados conferidos até {e("22 de outubro de 2026")}. Quando as fontes divergem, a divergência aparece junto do número; quando não foi possível confirmar, o dado ficou de fora.</p>
      </div>
      <div>
        <h3 class="ch-h3">Fotografias</h3>
        <ul class="ep-list ep-photos">{creditos}</ul>
      </div>
    </div>
  </section>
</main>
<p class="sr-only" id="live" aria-live="polite"></p>
<script type="module" src="carreira.js"></script>
</body>
</html>
"""
(ROOT / "index.html").write_text(page, encoding="utf-8")
print("ok:", ROOT / "index.html")
