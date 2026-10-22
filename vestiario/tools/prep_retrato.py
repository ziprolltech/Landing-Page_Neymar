"""Prepara um retrato para o Vestiário.

Uso: python vestiario/tools/prep_retrato.py <imagem_gerada> <id_do_capitulo>
     ex.: python vestiario/tools/prep_retrato.py ~/Downloads/barca.png barcelona

1. Lê a cor do fundo nos cantos e reescala os canais para que ela vire branco puro
   (no Vestiário o retrato é misturado em "multiply" com o holofote: qualquer
   fundo levemente cinza ou creme apareceria como uma caixa).
2. Encaixa no quadro padrão 2048x2336 (o mesmo do retrato da Seleção),
   alinhado pela base e centralizado, sem distorcer.
3. Salva em vestiario/assets/retratos/<id>.webp — o site passa a usar sozinho.

Ajustes finos de enquadramento (escala, x, y) ficam em capitulos.json → retrato.ajuste.
"""
import sys
from pathlib import Path

import numpy as np
from PIL import Image

W, H = 2048, 2336
src, cid = sys.argv[1], sys.argv[2]
out = Path(__file__).resolve().parent.parent / "assets" / "retratos" / f"{cid}.webp"

im = Image.open(src).convert("RGB")
a = np.asarray(im).astype(np.float32)
h, w = a.shape[:2]
k = max(8, min(h, w) // 40)
corners = np.concatenate([a[:k, :k].reshape(-1, 3), a[:k, -k:].reshape(-1, 3)])   # cantos de cima: sempre fundo
bg = np.median(corners, axis=0)
if bg.min() < 200:
    print(f"aviso: o fundo nos cantos não parece branco ({bg.round()}); gere o retrato com fundo branco liso")
a = np.clip(a * (255.0 / np.maximum(bg, 1)), 0, 255)

im = Image.fromarray(a.astype(np.uint8))
s = min(W / im.width, H / im.height)
im = im.resize((round(im.width * s), round(im.height * s)), Image.LANCZOS)
canvas = Image.new("RGB", (W, H), (255, 255, 255))
canvas.paste(im, ((W - im.width) // 2, H - im.height))
canvas.save(out, quality=90)
print("ok", out, "fundo era", bg.round().tolist())
