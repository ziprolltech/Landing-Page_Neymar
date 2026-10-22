"""Trilha do trailer (45s, 120 BPM) sintetizada do zero — sem samples de terceiros
além dos SFX que vêm com a HyperFrames (media-use/audio/assets/sfx).

Uso: python tools/make_score.py <pasta_sfx> <saida.wav>

Mapa (segundos):
  0–5    abertura: drone em Ré menor + riser, impacto em 5
  5–33   carreira: ostinato de cordas + tambores, um compasso (2s) por acorde,
         impacto leve em cada corte de foto (a cada 4s), cresce depois de 19s
  33–39  Coringa: corte seco, drone dissonante, batidas de coração, riser
  39–45  final: impacto grande, acorde maior sustentado e fade
"""
import subprocess, sys, wave
import numpy as np

SR = 44100
DUR = 45.0
BEAT = 0.5
N = int(SR * DUR)
sfx_dir, out = sys.argv[1], sys.argv[2]

def t_arr(sec):
    return np.arange(int(SR * sec)) / SR

def add(buf, start, sig, gain=1.0):
    i = int(start * SR)
    if i < 0:                       # começa antes de 0: corta a cabeça
        sig, i = sig[-i:], 0
    j = min(N, i + len(sig))
    if i < N:
        buf[i:j] += sig[: j - i] * gain

def hz(midi):
    return 440.0 * 2 ** ((midi - 69) / 12)

def env(n, a, r, sus=1.0):
    e = np.ones(n) * sus
    na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, sus, na)
    if nr < n:
        e[-nr:] = np.linspace(sus, 0, nr)
    return e

def lowpass(x, k):
    # média móvel encadeada: passa-baixa barato e estável
    ker = np.ones(k) / k
    return np.convolve(np.convolve(x, ker, "same"), ker, "same")

def saw(freq, sec, harmonics=10, detune=0.0, vib=0.0):
    t = t_arr(sec)
    f = freq * (1 + detune) * (1 + vib * np.sin(2 * np.pi * 5.2 * t))
    ph = 2 * np.pi * np.cumsum(f) / SR
    return sum(np.sin(h * ph) / h ** 1.15 for h in range(1, harmonics + 1))

def pad(notes, sec, a=0.6, r=0.8, harmonics=8):
    s = np.zeros(int(SR * sec))
    for m in notes:
        for d in (-0.004, 0.0, 0.005):
            s += saw(hz(m), sec, harmonics, d, 0.003)
    return s * env(len(s), a, r) / (len(notes) * 3)

def taiko(sec=1.2, f0=95, f1=48):
    t = t_arr(sec)
    f = f1 + (f0 - f1) * np.exp(-t * 18)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 4.5)
    rng = np.random.default_rng(7)
    skin = lowpass(rng.standard_normal(len(t)), 9) * np.exp(-t * 40) * 0.6
    return body + skin

def tom(sec=0.35):
    return taiko(sec, 220, 140) * 0.5

def stab(m, sec=0.22):
    s = saw(hz(m), sec, 12) + saw(hz(m + 12), sec, 6) * 0.4
    return s * env(len(s), 0.004, 0.12)

def boom(sec=4.0):
    t = t_arr(sec)
    f = 32 + 60 * np.exp(-t * 6)
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.1)

def load_sfx(name):
    raw = subprocess.run(
        ["ffmpeg", "-v", "error", "-i", f"{sfx_dir}/{name}", "-f", "f32le", "-ac", "1", "-ar", str(SR), "-"],
        capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)

music = np.zeros(N)   # vai para o reverb
drums = np.zeros(N)   # seco

# ---- 0–5: abertura ----
add(music, 0.0, pad([38, 45, 50, 53], 5.4, a=2.5, r=0.6), 0.9)        # Dm grave
add(drums, 0.0, boom(5.0), 0.7)
riser = load_sfx("riser.mp3")
add(music, 5.0 - len(riser) / SR, riser, 0.6)
add(drums, 3.5, taiko(), 0.5); add(drums, 4.25, taiko(), 0.6)

# ---- 5–33: carreira ----
CHORDS = [[38, 50, 53, 57], [34, 46, 50, 53], [41, 48, 53, 57], [36, 48, 52, 55]]   # Dm Bb F C
for bar in range(14):                       # 14 compassos de 2s = 28s
    t0 = 5.0 + bar * 2.0
    ch = CHORDS[bar % 4]
    lift = 1.0 if bar < 7 else 1.35
    add(music, t0, pad([n + 12 for n in ch[1:]], 2.1, a=0.15, r=0.3), 0.55 * lift)
    add(music, t0, pad([ch[0]], 2.1, a=0.05, r=0.3, harmonics=5), 0.8)
    for k in range(8):                      # ostinato de colcheias
        add(music, t0 + k * 0.25, stab(ch[0] + 12 + (7 if k % 4 == 3 else 0)), 0.16 * lift)
    add(drums, t0, taiko(), 0.9)
    add(drums, t0 + 1.0, taiko(1.0, 85, 52), 0.7)
    if bar >= 7:                            # cresce: toms em semicolcheias no fim do compasso
        for k in range(4):
            add(drums, t0 + 1.5 + k * 0.125, tom(), 0.35 + 0.1 * k)
imp1 = load_sfx("impact-bass-1.mp3")
imp2 = load_sfx("impact-bass-2.mp3")
whoosh = load_sfx("whoosh-cinematic.mp3")
for i, cut in enumerate([5.0, 9.0, 13.0, 17.0, 21.0, 25.0, 29.0]):
    add(drums, cut, imp1 if i % 2 == 0 else imp2, 0.55 if i else 1.0)
    if i:
        add(music, cut - 0.35, whoosh, 0.25)
add(music, 33.0 - len(riser) / SR, riser, 0.7)

# ---- 33–39: Coringa ----
glitch = load_sfx("glitch-2.mp3")
add(drums, 33.0, glitch, 0.9)
add(drums, 33.0, boom(3.0), 0.8)
dis = pad([38, 39, 44, 51], 6.2, a=1.2, r=0.8, harmonics=6)          # cluster dissonante
add(music, 33.0, dis, 0.75)
for k in range(5):                           # coração
    add(drums, 33.6 + k * 1.0, taiko(0.6, 70, 40), 0.55)
    add(drums, 33.85 + k * 1.0, taiko(0.6, 65, 38), 0.4)
add(music, 39.0 - len(riser) / SR, riser, 0.8)

# ---- 39–45: final ----
add(drums, 39.0, imp1, 1.0); add(drums, 39.0, imp2, 0.8); add(drums, 39.0, boom(6.0), 0.9)
add(drums, 39.0, taiko(2.0, 110, 45), 1.0)
add(music, 39.0, pad([38, 50, 54, 57, 62, 66], 6.0, a=0.05, r=3.5, harmonics=10), 1.1)   # Ré maior

def write(path, x):
    x = np.clip(x, -1, 1)
    with wave.open(path, "wb") as w:
        w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((x * 32767).astype(np.int16).tobytes())

music /= np.abs(music).max() + 1e-9
drums /= np.abs(drums).max() + 1e-9
write(out + ".music.wav", music * 0.9)
write(out + ".drums.wav", drums * 0.9)

# reverb no colchão musical, tambores secos com um pouco de sala; fade final; loudness de trailer
subprocess.run([
    "ffmpeg", "-v", "error", "-y", "-i", out + ".music.wav", "-i", out + ".drums.wav", "-filter_complex",
    "[0]aecho=0.8:0.6:70|140|280|520:0.35|0.28|0.2|0.12,volume=0.8[m];"
    "[1]aecho=0.9:0.4:40|90:0.2|0.1[d];"
    "[m][d]amix=inputs=2:normalize=0,afade=t=out:st=42.5:d=2.5,"
    "loudnorm=I=-14:TP=-1.5:LRA=11,aformat=channel_layouts=stereo",
    "-ar", str(SR), "-t", str(DUR), out], check=True)
print("ok", out)
