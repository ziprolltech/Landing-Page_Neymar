"""Gera as texturas das camisas (costas: nome + número) usadas no render do Blender."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import numpy as np

OUT = Path(__file__).parent / "tex"
S = 1024
FONT = "C:/Windows/Fonts/ariblk.ttf"
# bbox da camisa (m): x -0.36..0.36, y -0.76..0.02  ->  u,v
def px(x, y):
    return ((x + 0.36) / 0.72 * S, (1 - (y + 0.76) / 0.78) * S)

KITS = {
    "selecao":  dict(bg="#f4cf1a", ink="#0b6b3a", num="10", stripes=None, trim="#0b6b3a"),
    "santos":   dict(bg="#f3f3f1", ink="#111111", num="11", stripes=None, trim="#111111"),
    "barca":    dict(bg="#a50044", ink="#f2c230", num="11", stripes=("#a50044", "#1d3f8f", 5), trim="#f2c230"),
    "psg":      dict(bg="#132c58", ink="#ffffff", num="10", stripes=None, trim="#d0102b"),
    "hilal":    dict(bg="#0d57b0", ink="#ffffff", num="10", stripes=None, trim="#ffffff"),
    "santos2":  dict(bg="#f3f3f1", ink="#ffffff", num="10", stripes=("#f3f3f1", "#141414", 9), trim="#141414", outline="#141414"),
}

def text(d, cx, cy, s, size, fill, outline=None, sx=1.0):
    f = ImageFont.truetype(FONT, size)
    l, t, r, b = d.textbbox((0, 0), s, font=f)
    w, h = r - l, b - t
    tmp = Image.new("RGBA", (w + 40, h + 40), (0, 0, 0, 0))
    td = ImageDraw.Draw(tmp)
    td.text((20 - l, 20 - t), s, font=f, fill=fill, stroke_width=8 if outline else 0, stroke_fill=outline)
    tmp = tmp.resize((int(tmp.width * sx), tmp.height), Image.LANCZOS)
    return tmp, (int(cx - tmp.width / 2), int(cy - tmp.height / 2))

for name, k in KITS.items():
    im = Image.new("RGB", (S, S), k["bg"])
    d = ImageDraw.Draw(im)
    if k["stripes"]:
        a, b, n = k["stripes"]
        w = S / n
        for i in range(n):
            d.rectangle([i * w, 0, (i + 1) * w, S], fill=a if i % 2 == 0 else b)
    # gola e punhos
    cx, cy = px(0, 0.0)
    d.ellipse([cx - 90, cy - 70, cx + 90, cy + 40], outline=k["trim"], width=22)
    for sgn in (-1, 1):
        x0, y0 = px(sgn * 0.31, -0.22)
        d.line([x0 - 40, y0 - 30, x0 + 40, y0 + 30][::1] if sgn < 0 else [x0 - 40, y0 + 30, x0 + 40, y0 - 30], fill=k["trim"], width=20)
    nm, pos = text(d, *px(0, -0.155), "NEYMAR JR", 62, k["ink"], k.get("outline"), sx=0.92)
    im.paste(nm, pos, nm)
    nb, pos = text(d, *px(0, -0.37), k["num"], 300, k["ink"], k.get("outline"), sx=0.8)
    im.paste(nb, pos, nb)
    # trama leve do tecido
    rng = np.random.default_rng(1)
    a = np.asarray(im).astype(np.float32)
    a *= 1 + rng.normal(0, 0.012, (S, S, 1))
    Image.fromarray(np.clip(a, 0, 255).astype(np.uint8)).save(OUT / f"kit_{name}.png")

# logo NJR para os capôs (branco sobre transparente)
im = Image.new("RGBA", (512, 256), (0, 0, 0, 0))
d = ImageDraw.Draw(im)
f = ImageFont.truetype(FONT, 150)
d.text((256, 128), "NJR", font=f, fill="white", anchor="mm")
im.save(OUT / "logo_njr.png")
print("ok")
