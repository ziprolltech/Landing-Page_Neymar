"""Gera os mapas do hero 3D + overlay halftone + retrato pintado.
Uso: python make_maps.py <foto_entrada> <pasta_saida>
"""
import sys, io
import numpy as np, cv2
from PIL import Image, ImageFilter
from rembg import remove

src, out = sys.argv[1], sys.argv[2]
W, H = 2048, 2336

# ---------- recorte ----------
im = Image.open(src).convert("RGB")
from rembg import new_session
cut = remove(im, session=new_session("u2net_human_seg"))
alpha_src = np.array(cut)[:, :, 3]

# encaixa no canvas 2048x2336 mantendo a altura, centralizado
s = H / im.height
nw = round(im.width * s)
rgb = im.resize((nw, H), Image.LANCZOS)
a = Image.fromarray(alpha_src).resize((nw, H), Image.LANCZOS)
ox = (W - nw) // 2

canvas = Image.new("RGB", (W, H), (255, 255, 255))
canvas.paste(rgb, (ox, 0))
alpha = Image.new("L", (W, H), 0)
alpha.paste(a, (ox, 0))
alpha = alpha.filter(ImageFilter.GaussianBlur(1.2))

A = np.asarray(alpha).astype(np.float32) / 255.0
C = np.asarray(canvas).astype(np.float32) / 255.0
C = C * A[..., None] + (1 - A[..., None])          # fundo branco limpo
diffuse = Image.fromarray((C * 255).astype(np.uint8))
diffuse.save(f"{out}/person-diffuse.webp", quality=90)
alpha.save(f"{out}/person-alpha.webp", quality=95)

# ---------- depth: cúpula suavizada na silhueta ----------
m = (A > 0.5).astype(np.uint8)
dist = cv2.distanceTransform(m, cv2.DIST_L2, 5)
dist /= max(dist.max(), 1)
dome = np.sqrt(np.clip(dist, 0, 1))
# realce leve do rosto (luminância) para dar volume
lum = cv2.cvtColor((C * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
depth = 0.85 * dome + 0.15 * lum * (dome > 0)
depth = cv2.GaussianBlur(depth, (0, 0), 18)
depth *= A
depth = (depth - depth.min()) / (depth.max() - depth.min() + 1e-6)
Image.fromarray((depth * 255).astype(np.uint8)).save(f"{out}/person-depth.webp", quality=92)

# ---------- normal a partir do depth ----------
d = cv2.GaussianBlur(depth, (0, 0), 3)
gx = cv2.Sobel(d, cv2.CV_32F, 1, 0, ksize=5)
gy = cv2.Sobel(d, cv2.CV_32F, 0, 1, ksize=5)
strength = 6.0
n = np.dstack([-gx * strength, gy * strength, np.ones_like(d)])
n /= np.linalg.norm(n, axis=2, keepdims=True)
normal = ((n * 0.5 + 0.5) * 255).astype(np.uint8)
Image.fromarray(normal).save(f"{out}/person-normal.webp", quality=92)

# ---------- overlay: halftone amarelo/verde (mesma pose por construção) ----------
g = cv2.cvtColor((C * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
cell = 14
ov = np.zeros((H, W, 4), np.uint8)
yellow = (254, 221, 0)
green = (0, 156, 59)
ov[..., :3] = yellow
for y in range(0, H, cell):
    for x in range(0, W, cell):
        cy, cx = y + cell // 2, x + cell // 2
        if cy >= H or cx >= W or A[cy, cx] < 0.5:
            continue
        r = np.clip((0.88 - g[cy, cx]) / 0.88, 0, 1) ** 0.8 * cell * 0.72
        if r > 0.6:
            cv2.circle(ov, (cx, cy), int(round(r)), (*green, 255), -1, cv2.LINE_AA)
base_a = (A * 255).astype(np.uint8)
dots = ov[..., 3]
ov[..., 3] = base_a                                   # silhueta inteira visível
mask_dots = dots > 0
ov[~mask_dots, :3] = yellow                           # fundo amarelo, pontos verdes
Image.fromarray(ov, "RGBA").save(f"{out}/overlay.webp", quality=90)

# ---------- retrato do paddock: filtro de pintura ----------
src_rgb = np.asarray(im)
try:
    paint = cv2.xphoto.oilPainting(cv2.cvtColor(src_rgb, cv2.COLOR_RGB2BGR), 4, 1)
    paint = cv2.cvtColor(paint, cv2.COLOR_BGR2RGB)
except Exception:
    paint = cv2.stylization(src_rgb, sigma_s=60, sigma_r=0.45)
ca = alpha_src.astype(np.float32)[..., None] / 255
paint = paint.astype(np.uint8)  # fundo da foto já é branco
pim = Image.fromarray(paint)
# 1350x1165, corte do peito pra cima
tw, th = 1350, 1165
ch = round(pim.width * th / tw)
pim = pim.crop((0, 0, pim.width, ch)).resize((tw, th), Image.LANCZOS)
pim.save(f"{out}/paddock.webp", quality=88)

# preview do reveal (metade esquerda foto, metade direita overlay)
prev = diffuse.convert("RGBA").copy()
ovi = Image.fromarray(ov, "RGBA")
half = ovi.crop((W // 2, 0, W, H))
prev.paste(half, (W // 2, 0), half)
prev.convert("RGB").resize((W // 3, H // 3)).save(f"{out}/../preview-reveal.jpg", quality=85)
print("ok")
