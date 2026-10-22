"""Gera assets/overlay.webp com a versão Coringa alinhada ao rosto do hero.
Uso: python make_joker_overlay.py <coringa.png> <pasta_assets>

O alinhamento usa as pupilas medidas nas duas fotos (similaridade: escala,
rotação e translação). Se trocar alguma foto, meça de novo os pontos abaixo.
RGB  = Coringa (onde a foto acaba, o Neymar escurecido no mesmo clima)
Alfa = onde existe foto real do Coringa (usado fora da silhueta do Neymar)
"""
import sys
import numpy as np
from PIL import Image, ImageFilter

src, out = sys.argv[1], sys.argv[2]
W, H = 2048, 2336                       # tamanho do person-diffuse.webp

# pupilas (esquerda, direita) em pixels
NEY = [(905, 542), (1120, 536)]         # person-diffuse.webp
JOK = [(435, 620), (662, 620)]          # Coringa.png

PAD = 1400
jk = Image.open(src).convert("RGB")
jw, jh = jk.size

# borda esticada só para não haver buraco; a cobertura decide o que aparece
arr = np.asarray(jk)
ext_img = Image.fromarray(np.pad(arr, ((PAD, PAD), (PAD, PAD), (0, 0)), mode="edge"))
inside = np.zeros((jh + 2 * PAD, jw + 2 * PAD), np.uint8)
inside[PAD + 30:PAD + jh - 30, PAD + 30:PAD + jw - 30] = 255
cov_img = Image.fromarray(inside).filter(ImageFilter.GaussianBlur(45))

# transformação inversa (saída -> entrada) por similaridade de 2 pontos
n1, n2 = np.array(NEY, np.float64)
j1, j2 = np.array(JOK, np.float64) + PAD
vn, vj = n2 - n1, j2 - j1
s = np.linalg.norm(vj) / np.linalg.norm(vn)
ang = np.arctan2(vj[1], vj[0]) - np.arctan2(vn[1], vn[0])
c, si = s * np.cos(ang), s * np.sin(ang)
a, b, d, e = c, -si, si, c
tx = j1[0] - (a * n1[0] + b * n1[1])
ty = j1[1] - (d * n1[0] + e * n1[1])
coef = (a, b, tx, d, e, ty)

rgb = ext_img.transform((W, H), Image.AFFINE, coef, Image.BICUBIC)
alpha = cov_img.transform((W, H), Image.AFFINE, coef, Image.BILINEAR)

# onde a foto do Coringa acaba (tronco), usa o próprio Neymar no clima dela:
# escuro, frio e contrastado
ney = np.asarray(Image.open(f"{out}/person-diffuse.webp").convert("RGB")).astype(np.float32) / 255
gray = ney @ np.array([0.299, 0.587, 0.114])
graded = ney * 0.55 + gray[..., None] * 0.45                     # menos saturado
graded = np.clip((graded - 0.5) * 1.3 + 0.5, 0, 1) ** 1.8 * np.array([0.55, 0.58, 0.62])
k = np.asarray(alpha).astype(np.float32)[..., None] / 255
final = np.asarray(rgb).astype(np.float32) / 255 * k + graded * (1 - k)
rgb = Image.fromarray((final * 255).astype(np.uint8))
ov = rgb.convert("RGBA")
ov.putalpha(alpha)
ov.save(f"{out}/overlay.webp", quality=90, exact=True)   # mantém o RGB onde alfa = 0

# preview: metade esquerda foto, metade direita Coringa
prev = Image.open(f"{out}/person-diffuse.webp").convert("RGB")
prev.paste(rgb.crop((W // 2, 0, W, H)), (W // 2, 0))
prev.resize((W // 3, H // 3)).save(f"{out}/../preview-reveal.jpg", quality=85)
print("ok", round(1 / s, 3), round(np.degrees(ang), 2))
