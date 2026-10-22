"""Gera o HTML estático da parede (salas por ano) e das notas a partir de titulos.json.
O HTML estático garante o conteúdo sem JavaScript; o titulos.js só o anima e o organiza.
Uso: python titulos/_ferramentas/gerar.py
"""
import html
import json
import pathlib
import re

AQUI = pathlib.Path(__file__).resolve().parent.parent
dados = json.loads((AQUI / "titulos.json").read_text(encoding="utf-8"))
E = dados["entidades"]
IMG = dados["imagens"]
esc = lambda s: html.escape(str(s or ""), quote=True)


def ordenados(itens):
    tipo = {"titulo": 0, "premio": 1}
    return sorted(itens, key=lambda i: (i["ordem"], tipo[i["tipo"]], -1 if i.get("img") else 0, i["nivel"]))


def rotulo_tipo(it):
    ent = E[it["entidade"]]
    if it["tipo"] == "titulo":
        return f"Título · {ent['rotulo']}"
    quem = "" if it["entidade"] == "carreira" else f" · {ent['rotulo']}"
    return f"Prêmio individual{quem}"


def peca(it, n):
    img = IMG.get(it.get("img") or "")
    medalha = it["tipo"] == "premio"
    cls = f"pc pc--n{it['nivel']} pc--{it['tipo']}" + (" pc--foto" if img else " pc--tipo")
    if img:
        ratio = img["w"] / img["h"]
        ratio = 1 if medalha else max(0.62, min(1.34, ratio))
        alt = f"{img['legenda']} Foto: {img['autor']}, {img['licenca']}."
        frame = (f'<div class="pc-frame" style="aspect-ratio:{ratio:.3f}">'
                 f'<img src="{esc(img["src"])}" width="{img["w"]}" height="{img["h"]}" loading="lazy" decoding="async" '
                 f'alt="{esc(alt)}" style="object-position:{esc(img.get("pos", "50% 50%"))}"></div>')
    else:
        nome = it.get("classe") if medalha else it["competicao"]
        frame = (f'<div class="pc-frame pc-frame--tipo" aria-hidden="true"><span class="pc-ty-year{' long' if len(it['ano'].split(' · ')[0]) > 4 else ''}">{esc(it["ano"].split(" · ")[0])}</span>'
                 f'<span class="pc-ty-name">{esc(nome)}</span></div>')
    vezes = f'<span class="pc-times">{it["vezes"]}×</span>' if it.get("vezes", 1) > 1 else ""
    mais = [f'<p><b>Temporada</b> {esc(it["temporada"])}</p>', f'<p><b>Contexto</b> {esc(it["contexto"])}</p>']
    if it.get("papel"):
        mais.append(f'<p><b>Papel de Neymar</b> {esc(it["papel"])}</p>')
    mais.append("<p><b>Fontes</b> " + " · ".join(f'<a href="{esc(f["url"])}" rel="noopener" target="_blank">{esc(f["nome"])}</a>' for f in it["fontes"]) + "</p>")
    if img:
        mais.append(f'<p><b>Imagem</b> {esc(img["legenda"])} <a href="{esc(img["url"])}" rel="noopener" target="_blank">{esc(img["autor"])}, {esc(img["licenca"])}</a></p>')
    alvo = f'{it["competicao"]}, {it["ano"]}' + ("" if it["entidade"] == "carreira" else f', {E[it["entidade"]]["nome"]}')
    return f'''      <li class="{cls}" data-id="{esc(it["id"])}" data-cat="{it["categoria"]}" data-ent="{it["entidade"]}" data-tipo="{it["tipo"]}" data-vezes="{it.get("vezes", 1)}">
        <div class="pc-obj">{frame}{vezes}</div>
        <div class="pc-cap">
          <span class="pc-no mono-num">№ {n:02d}</span>
          <span class="pc-kind">{esc(rotulo_tipo(it))}</span>
          <h4 class="pc-name">{esc(it["competicao"])}</h4>
          <span class="pc-year mono-num">{esc(it["ano"])}</span>
        </div>
        <div class="pc-more">{"".join(mais)}</div>
        <button class="pc-hit" type="button" aria-haspopup="dialog" aria-label="Ver de perto: {esc(alvo)}"></button>
      </li>'''


def contagem(lst):
    t = sum(1 for i in lst if i["tipo"] == "titulo")
    p = sum(i.get("vezes", 1) for i in lst if i["tipo"] == "premio")
    partes = []
    if t: partes.append(f"{t} {'título' if t == 1 else 'títulos'}")
    if p: partes.append(f"{p} {'prêmio' if p == 1 else 'prêmios'}")
    return " · ".join(partes)


itens = ordenados(dados["itens"])
salas = {}
for n, it in enumerate(itens, 1):
    salas.setdefault(it["ordem"], []).append((n, it))

partes = []
for ano, lst in salas.items():
    pecas = "\n".join(peca(it, n) for n, it in lst)
    partes.append(f'''    <section class="room" data-year="{ano}" id="sala-{ano}" aria-labelledby="sala-{ano}-h">
      <header class="room-head"><h3 class="room-year mono-num" id="sala-{ano}-h">{ano}</h3><p class="room-count">{contagem([i for _, i in lst])}</p></header>
      <ul class="room-items">
{pecas}
      </ul>
      <i class="room-floor" aria-hidden="true"></i>
    </section>''')
parede = "\n".join(partes)

notas = []
for c in dados["curadoria"]:
    notas.append(f'      <div class="note" data-reveal="up"><h3>{esc(c["titulo"])}</h3><p>{esc(c["texto"])}</p></div>')
fontes = "".join(f'<li><a href="{esc(f["url"])}" rel="noopener" target="_blank">{esc(f["nome"])}</a></li>' for f in dados["fontes"])
notas.append(f'      <div class="note note--wide" data-reveal="up"><h3>Fontes gerais</h3><ul class="note-list">{fontes}</ul><p>Cada peça traz as suas fontes específicas. Dados conferidos em {"/".join(reversed(dados["atualizado"].split("-")))}.</p></div>')
usadas = []
for it in itens:
    k = it.get("img")
    if k and k not in usadas:
        usadas.append(k)
cred = "".join(f'<li>{esc(IMG[k]["legenda"])} <a href="{esc(IMG[k]["url"])}" rel="noopener" target="_blank">{esc(IMG[k]["autor"])} · {esc(IMG[k]["licenca"])}</a></li>' for k in usadas)
cred += '<li>Abertura: a Seleção recebe a taça da Copa das Confederações, 2013. <a href="https://commons.wikimedia.org/wiki/File:Confed.Cup2013Champions.jpg" rel="noopener" target="_blank">Tânia Rêgo/Agência Brasil · CC BY 3.0 BR</a></li>'
notas.append(f'      <div class="note note--wide" data-reveal="up"><h3>Créditos das imagens</h3><ul class="note-list note-credits">{cred}</ul><p>Todas do Wikimedia Commons. Quando não há fotografia adequada, a peça usa uma composição tipográfica.</p></div>')

pagina = AQUI / "index.html"
txt = pagina.read_text(encoding="utf-8")
txt = re.sub(r"<!-- parede:inicio -->.*?<!-- parede:fim -->", lambda m: f"<!-- parede:inicio -->\n{parede}\n<!-- parede:fim -->", txt, flags=re.S)
txt = re.sub(r"<!-- notas:inicio -->.*?<!-- notas:fim -->", lambda m: "<!-- notas:inicio -->\n" + "\n".join(notas) + "\n<!-- notas:fim -->", txt, flags=re.S)
tt = sum(1 for i in itens if i["tipo"] == "titulo")
pp = sum(i.get("vezes", 1) for i in itens if i["tipo"] == "premio")
txt = re.sub(r'(<b class="mono-num" id="stat-titulos">)\d+', rf"\g<1>{tt}", txt)
txt = re.sub(r'(<b class="mono-num" id="stat-premios">)\d+', rf"\g<1>{pp}", txt)
pagina.write_text(txt, encoding="utf-8")
print(f"{len(itens)} peças em {len(salas)} salas · {tt} títulos · {pp} prêmios")
