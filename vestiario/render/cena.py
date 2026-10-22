"""Vestiário NJR — cena fotorrealista no Blender (Cycles).

Uso:
  blender -b --factory-startup -P cena.py -- [--teste] [--salvar cena.blend]
Eixos: X atravessa a sala, Y vai da porta (0) até a parede do fundo, Z para cima.
"""
import bpy, bmesh, math, sys, random
from mathutils import Vector, Matrix
from pathlib import Path

ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
AQUI = Path(__file__).resolve().parent
TEX = AQUI / "tex"
rnd = random.Random(7)

# ---------- medidas (m) ----------
WALL = 3.9          # paredes laterais em x = ±WALL
BACK = 16.0         # parede do fundo
H = 3.1             # teto
SOFF_Z, SOFF_D = 2.70, 1.20      # rebaixo lateral: altura e profundidade a partir da parede
D = 0.56            # profundidade da cabine
UNIT = 0.78
N_UNITS = 17
Y0 = 1.25           # início das cabines
FIN = 0.03
SEAT_Z, SEAT_D = 0.47, 0.50
STRIP = 1.55        # faixa cinza do piso a partir da parede
KITS = ["selecao", "santos", "barca", "psg", "hilal", "santos2"]

# ---------- limpeza ----------
bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
col = scene.collection

# ---------- materiais ----------
def mat(name, color, rough=0.5, metal=0.0, coat=0.0, emit=None, estr=0.0, spec=0.5):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metal
    b.inputs["Coat Weight"].default_value = coat
    b.inputs["Specular IOR Level"].default_value = spec
    if emit:
        b.inputs["Emission Color"].default_value = (*emit, 1)
        b.inputs["Emission Strength"].default_value = estr
    return m

def srgb(h):
    h = h.lstrip("#")
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)

def add_noise_bump(m, scale=60.0, strength=0.05, rough_var=None):
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    tc = nt.nodes.new("ShaderNodeTexCoord")
    nz = nt.nodes.new("ShaderNodeTexNoise")
    nz.inputs["Scale"].default_value = scale
    nz.inputs["Detail"].default_value = 8
    nt.links.new(tc.outputs["Object"], nz.inputs["Vector"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = strength
    nt.links.new(nz.outputs["Fac"], bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    if rough_var:
        lo, hi = rough_var
        nz2 = nt.nodes.new("ShaderNodeTexNoise")
        nz2.inputs["Scale"].default_value = 1.6
        nz2.inputs["Detail"].default_value = 4
        nt.links.new(tc.outputs["Object"], nz2.inputs["Vector"])
        mr = nt.nodes.new("ShaderNodeMapRange")
        mr.inputs["To Min"].default_value = lo
        mr.inputs["To Max"].default_value = hi
        nt.links.new(nz2.outputs["Fac"], mr.inputs["Value"])
        nt.links.new(mr.outputs["Result"], b.inputs["Roughness"])

M_WHITE = mat("laca_branca", (0.80, 0.80, 0.79), rough=0.32, coat=0.25)
M_WALL = mat("parede", (0.86, 0.86, 0.85), rough=0.75)
M_CEIL = mat("teto", (0.88, 0.88, 0.87), rough=0.85)
M_BLACKG = mat("preto_brilho", (0.012, 0.012, 0.013), rough=0.12, coat=1.0)
M_HOOD = mat("capo_preto", (0.008, 0.008, 0.009), rough=0.22, coat=0.45)
M_LEATHER = mat("couro", (0.012, 0.012, 0.013), rough=0.5, coat=0.0, spec=0.35)
add_noise_bump(M_LEATHER, scale=140, strength=0.08)
M_FLOOR = mat("piso_epoxi", (0.66, 0.67, 0.68), rough=0.07, coat=0.6)
add_noise_bump(M_FLOOR, scale=18, strength=0.012, rough_var=(0.03, 0.16))
M_STRIP = mat("piso_faixa", (0.10, 0.105, 0.11), rough=0.28)
add_noise_bump(M_STRIP, scale=30, strength=0.01, rough_var=(0.2, 0.4))
M_CHROME = mat("cromo", (0.9, 0.9, 0.9), rough=0.12, metal=1.0)
M_DARK = mat("grafite", (0.03, 0.03, 0.032), rough=0.5)
M_VENT = mat("grelha", (0.22, 0.22, 0.22), rough=0.5)
M_LED = mat("led", (1, 1, 1), emit=(1.0, 0.97, 0.92), estr=14.0)
M_NICHE_LED = mat("led_nicho", (1, 1, 1), emit=(1.0, 0.98, 0.95), estr=2.2)
M_CASE_LED = mat("led_vitrine", (1, 1, 1), emit=(1.0, 0.98, 0.95), estr=9.0)
M_SCREEN = mat("tela", (0.0, 0.0, 0.0), rough=0.05, coat=1.0)
M_GLASS = bpy.data.materials.new("vidro")
M_GLASS.use_nodes = True
gb = M_GLASS.node_tree.nodes["Principled BSDF"]
gb.inputs["Transmission Weight"].default_value = 1.0
gb.inputs["Alpha"].default_value = 0.08
gb.inputs["Roughness"].default_value = 0.0
gb.inputs["IOR"].default_value = 1.2
M_TOWEL = mat("toalha", (0.82, 0.82, 0.8), rough=0.95)
add_noise_bump(M_TOWEL, scale=420, strength=0.35)
M_TOWEL_G = mat("toalha_cinza", (0.18, 0.18, 0.19), rough=0.95)
add_noise_bump(M_TOWEL_G, scale=420, strength=0.35)
M_BAG = mat("bolsa", (0.02, 0.02, 0.022), rough=0.55)
add_noise_bump(M_BAG, scale=300, strength=0.12)
M_BAG_STRIPE = mat("bolsa_faixa", (0.75, 0.75, 0.75), rough=0.6)
M_SOLE = mat("sola", (0.75, 0.75, 0.74), rough=0.5)
M_RUBBER = mat("borracha", (0.015, 0.015, 0.016), rough=0.45)
BOOT_COLORS = ["#ff5a1f", "#c8f02a", "#e8e8e8", "#1f6bff", "#ff2a3c", "#111111", "#f2e600", "#21c7b8"]
M_BOOTS = [mat(f"chuteira_{i}", srgb(c), rough=0.28, coat=0.6) for i, c in enumerate(BOOT_COLORS)]

def kit_mat(kit):
    m = bpy.data.materials.new(f"camisa_{kit}")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(str(TEX / f"kit_{kit}.png"))
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = 0.62
    b.inputs["Sheen Weight"].default_value = 0.35
    # malha do tecido
    tc = nt.nodes.new("ShaderNodeTexCoord")
    w = nt.nodes.new("ShaderNodeTexWave")
    w.inputs["Scale"].default_value = 900
    w.inputs["Distortion"].default_value = 2
    nt.links.new(tc.outputs["UV"], w.inputs["Vector"])
    bp = nt.nodes.new("ShaderNodeBump")
    bp.inputs["Strength"].default_value = 0.06
    nt.links.new(w.outputs["Fac"], bp.inputs["Height"])
    nt.links.new(bp.outputs["Normal"], b.inputs["Normal"])
    return m
M_KITS = {k: kit_mat(k) for k in KITS}

def logo_mat():
    m = bpy.data.materials.new("logo_capô")
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    b.inputs["Base Color"].default_value = (0.9, 0.9, 0.9, 1)
    b.inputs["Roughness"].default_value = 0.3
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = bpy.data.images.load(str(TEX / "logo_njr.png"))
    tr = nt.nodes.new("ShaderNodeBsdfTransparent")
    mx = nt.nodes.new("ShaderNodeMixShader")
    out = nt.nodes["Material Output"]
    nt.links.new(t.outputs["Alpha"], mx.inputs["Fac"])
    nt.links.new(tr.outputs[0], mx.inputs[1])
    nt.links.new(b.outputs[0], mx.inputs[2])
    nt.links.new(mx.outputs[0], out.inputs["Surface"])
    return m
M_LOGO = logo_mat()

# ---------- utilidades de malha ----------
def obj_from_bm(name, bm, mats, smooth_angle=None, bevel=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    o = bpy.data.objects.new(name, me)
    col.objects.link(o)
    if smooth_angle is not None:
        for p in me.polygons:
            p.use_smooth = True
        me.set_sharp_from_angle(angle=math.radians(smooth_angle))
    if bevel:
        mod = o.modifiers.new("bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 3
        mod.limit_method = "ANGLE"
        mod.harden_normals = True
    return o

def box(name, x0, x1, y0, y1, z0, z1, m, bevel=0.004):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x = x0 + (v.co.x + 0.5) * (x1 - x0)
        v.co.y = y0 + (v.co.y + 0.5) * (y1 - y0)
        v.co.z = z0 + (v.co.z + 0.5) * (z1 - z0)
    return obj_from_bm(name, bm, [m], smooth_angle=30, bevel=bevel)

def side_x(sd, lx):
    """lx = distância a partir da parede; sd = -1 esquerda, +1 direita."""
    return sd * (WALL - lx)

def prism(name, pts, y0, y1, sd, m, bevel=0.003):
    """Perfil 2D (lx, z) extrudado em Y entre y0 e y1."""
    bm = bmesh.new()
    a = [bm.verts.new((side_x(sd, lx), y0, z)) for lx, z in pts]
    b = [bm.verts.new((side_x(sd, lx), y1, z)) for lx, z in pts]
    n = len(pts)
    bm.faces.new(a)
    bm.faces.new(b[::-1])
    for i in range(n):
        j = (i + 1) % n
        bm.faces.new((a[i], a[j], b[j], b[i]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return obj_from_bm(name, bm, [m], smooth_angle=35, bevel=bevel)

def arc(cx, cz, r, a0, a1, n=14):
    return [(cx + r * math.cos(a0 + (a1 - a0) * i / n), cz + r * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]

def instance(src, name, loc=(0, 0, 0), rotz=0.0, mats=None):
    o = bpy.data.objects.new(name, src.data)
    for md in src.modifiers:
        nm = o.modifiers.new(md.name, md.type)
        for attr in ("width", "segments", "limit_method", "harden_normals", "levels", "render_levels", "thickness", "offset"):
            if hasattr(md, attr):
                setattr(nm, attr, getattr(md, attr))
    o.location = loc
    o.rotation_euler = (0, 0, rotz)
    if mats:
        for i, m in enumerate(mats):
            o.material_slots[i].link = "OBJECT"
            o.material_slots[i].material = m
    col.objects.link(o)
    return o

# ---------- sala ----------
def plane(name, x0, x1, y0, y1, z, m, flip=False):
    bm = bmesh.new()
    vs = [bm.verts.new(p) for p in ((x0, y0, z), (x1, y0, z), (x1, y1, z), (x0, y1, z))]
    f = bm.faces.new(vs[::-1] if flip else vs)
    return obj_from_bm(name, bm, [m])

plane("piso", -WALL + STRIP, WALL - STRIP, -1, BACK, 0, M_FLOOR)
plane("faixa_e", -WALL, -WALL + STRIP, -1, BACK, 0.0005, M_STRIP)
plane("faixa_d", WALL - STRIP, WALL, -1, BACK, 0.0005, M_STRIP)
plane("teto", -WALL + SOFF_D, WALL - SOFF_D, -1, BACK, H, M_CEIL, flip=True)
for sd in (-1, 1):
    # rebaixo: fundo horizontal + face vertical
    x_in = side_x(sd, SOFF_D)
    plane(f"rebaixo_{sd}", min(side_x(sd, 0), x_in), max(side_x(sd, 0), x_in), -1, BACK, SOFF_Z, M_CEIL, flip=True)
    box(f"rebaixo_face_{sd}", x_in - 0.01, x_in + 0.01, -1, BACK, SOFF_Z, H, M_CEIL, bevel=0.003)
    box(f"parede_{sd}", side_x(sd, -0.05) - 0.05, side_x(sd, -0.05) + 0.05, -1, BACK, 0, H, M_WALL, bevel=0)
box("parede_fundo", -WALL, WALL, BACK, BACK + 0.1, 0, H, M_WALL, bevel=0)
box("parede_porta", -WALL, WALL, -1.1, -1.0, 0, H, M_WALL, bevel=0)
# rodapé do fundo
box("rodape_fundo", -WALL, WALL, BACK - 0.012, BACK, 0, 0.08, M_DARK, bevel=0.002)

# ---------- cabines ----------
HR = 0.50                      # raio da curva do capô
HC = (D - HR, SOFF_Z - HR)     # centro da curva: o capô termina tangente ao rebaixo

def fin_profile():
    # divisória branca: um pouco à frente do capô, para aparecer como friso
    r = HR + 0.014
    p = [(0.0, SEAT_Z), (D + 0.014, SEAT_Z), (D + 0.014, HC[1])]
    p += arc(HC[0], HC[1], r, 0, math.pi / 2, 16)[1:]
    p = [(lx, min(z, SOFF_Z)) for lx, z in p]
    return p + [(0.0, SOFF_Z)]

def hood_profile():
    # capô preto: frente vertical acima do nicho, depois a curva até o teto
    outer = [(D, 1.84), (D, HC[1])] + arc(HC[0], HC[1], HR, 0, math.pi / 2, 18)[1:]
    inner = [(D - 0.02, 1.84), (D - 0.02, HC[1])] + arc(HC[0], HC[1], HR - 0.02, 0, math.pi / 2, 18)[1:]
    outer = [(max(lx, 0.0), min(z, SOFF_Z - 0.002)) for lx, z in outer]
    inner = [(max(lx, 0.0), min(z, SOFF_Z - 0.022)) for lx, z in inner]
    return outer + inner[::-1]

FIN_P = fin_profile()
HOOD_P = hood_profile()
shirt_rot = math.radians(48)

def build_shirt():
    """Camisa no cabide: malha plana recortada e simulada como tecido."""
    W2, TOP, BOT = 0.36, 0.02, -0.76
    sil = [(-0.085, 0.0), (-0.19, -0.035), (-0.33, -0.16), (-0.27, -0.27), (-0.235, -0.235),
           (-0.235, -0.74), (0.235, -0.74), (0.235, -0.235), (0.27, -0.27), (0.33, -0.16),
           (0.19, -0.035), (0.085, 0.0), (0.0, -0.06)]
    def inside(x, y):
        c = False
        n = len(sil)
        for i in range(n):
            x1, y1 = sil[i]; x2, y2 = sil[(i + 1) % n]
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
                c = not c
        return c
    nx, ny = 46, 50
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new()
    grid = {}
    for i in range(nx + 1):
        for j in range(ny + 1):
            x = -W2 + 2 * W2 * i / nx
            y = BOT + (TOP - BOT) * j / ny
            grid[i, j] = (x, y)
    vmap = {}
    for i in range(nx):
        for j in range(ny):
            cs = [grid[i, j], grid[i + 1, j], grid[i + 1, j + 1], grid[i, j + 1]]
            cx = sum(c[0] for c in cs) / 4; cy = sum(c[1] for c in cs) / 4
            if not inside(cx, cy):
                continue
            vs = []
            for k, (a, b) in zip(((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1)), cs):
                if k not in vmap:
                    vmap[k] = bm.verts.new((a, -0.004 * math.sin(a * 9) , b))
                vs.append(vmap[k])
            f = bm.faces.new(vs)
            for l in f.loops:
                x, _, z = l.vert.co
                l[uv].uv = ((x + 0.36) / 0.72, (z + 0.76) / 0.78)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    # normal para -Y (de frente para quem olha da sala)
    if bm.faces[0].normal.y > 0:
        bmesh.ops.reverse_faces(bm, faces=bm.faces)
    me = bpy.data.meshes.new("camisa")
    bm.to_mesh(me); bm.free()
    o = bpy.data.objects.new("camisa_base", me)
    col.objects.link(o)
    # grupo fixo: ombros/gola
    vg = o.vertex_groups.new(name="pin")
    pins = [v.index for v in me.vertices if v.co.z > -0.05 and abs(v.co.x) < 0.2]
    vg.add(pins, 1.0, "REPLACE")
    # pequena ondulação inicial para o tecido dobrar
    for v in me.vertices:
        v.co.y += 0.01 * math.sin(v.co.z * 23 + v.co.x * 7) * (1 + v.co.z * -1)
    cl = o.modifiers.new("tecido", "CLOTH")
    s = cl.settings
    s.quality = 6
    s.mass = 0.25
    s.tension_stiffness = 12; s.compression_stiffness = 12; s.shear_stiffness = 6
    s.bending_stiffness = 0.6
    s.vertex_group_mass = "pin"
    s.effector_weights.gravity = 1.0
    cl.point_cache.frame_start = 1
    cl.point_cache.frame_end = 40
    for f in range(1, 41):
        scene.frame_set(f)
    bpy.context.view_layer.objects.active = o
    o.select_set(True)
    dg = bpy.context.evaluated_depsgraph_get()
    ev = o.evaluated_get(dg)
    me2 = bpy.data.meshes.new_from_object(ev)
    o.modifiers.clear()
    o.data = me2
    scene.frame_set(1)
    # dobras verticais do tecido pendurado
    tx = bpy.data.textures.new("dobras", "CLOUDS")
    tx.noise_scale = 0.09
    disp = o.modifiers.new("dobras", "DISPLACE")
    disp.texture = tx
    disp.texture_coords = "LOCAL"
    disp.direction = "Y"
    disp.strength = 0.022
    disp.mid_level = 0.5
    sol = o.modifiers.new("espessura", "SOLIDIFY")
    sol.thickness = 0.004
    sub = o.modifiers.new("sub", "SUBSURF")
    sub.levels = 1; sub.render_levels = 1
    for p in me2.polygons:
        p.use_smooth = True
    me2.materials.append(M_KITS["selecao"])
    o.hide_render = True
    o.hide_viewport = True
    return o

SHIRT = build_shirt()

def build_hanger():
    cu = bpy.data.curves.new("cabide", "CURVE")
    cu.dimensions = "3D"
    cu.bevel_depth = 0.005
    sp = cu.splines.new("POLY")
    pts = [(-0.2, 0, -0.02), (0, 0, 0.06), (0.2, 0, -0.02), (-0.2, 0, -0.02)]
    sp.points.add(len(pts) - 1)
    for p, c in zip(sp.points, pts):
        p.co = (*c, 1)
    o = bpy.data.objects.new("cabide", cu)
    o.data.materials.append(M_CHROME)
    col.objects.link(o)
    hook = bpy.data.curves.new("gancho", "CURVE")
    hook.dimensions = "3D"; hook.bevel_depth = 0.003
    sp = hook.splines.new("POLY")
    hp = [(0, 0, 0.06), (0, 0, 0.1), (0, 0.03, 0.12), (0, 0.05, 0.1)]
    sp.points.add(len(hp) - 1)
    for p, c in zip(sp.points, hp):
        p.co = (*c, 1)
    h = bpy.data.objects.new("gancho", hook)
    h.data.materials.append(M_CHROME)
    col.objects.link(h)
    return o, h

def build_boot():
    """Chuteira: seções elípticas ao longo do comprimento + subdivisão."""
    secs = [  # (y, meia-largura, altura, base)
        (0.00, 0.025, 0.030, 0.008), (0.03, 0.040, 0.045, 0.0), (0.08, 0.047, 0.060, 0.0),
        (0.14, 0.048, 0.075, 0.0), (0.20, 0.044, 0.095, 0.0), (0.25, 0.038, 0.115, 0.0),
        (0.285, 0.030, 0.11, 0.0)]
    bm = bmesh.new()
    rings = []
    K = 12
    for y, w, h, b in secs:
        ring = []
        for k in range(K):
            a = 2 * math.pi * k / K
            x = w * math.cos(a)
            z = 0.016 + b + h * 0.5 * (1 + math.sin(a)) if math.sin(a) > 0 else 0.016 + b + 0.004 * math.sin(a)
            ring.append(bm.verts.new((x, y, z)))
        rings.append(ring)
    for r0, r1 in zip(rings, rings[1:]):
        for k in range(K):
            bm.faces.new((r0[k], r0[(k + 1) % K], r1[(k + 1) % K], r1[k]))
    bm.faces.new(rings[0][::-1]); bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    o = obj_from_bm("chuteira", bm, [M_BOOTS[0]], smooth_angle=180)
    s = o.modifiers.new("sub", "SUBSURF"); s.levels = 2; s.render_levels = 2
    sole = box("sola_chuteira", -0.042, 0.042, 0.0, 0.29, 0.0, 0.018, M_SOLE, bevel=0.006)
    o.hide_render = sole.hide_render = True
    return o, sole

def build_slide():
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co.x *= 0.10; v.co.y *= 0.28; v.co.z = (v.co.z + 0.5) * 0.022
    sole = obj_from_bm("chinelo_sola", bm, [M_RUBBER], smooth_angle=30, bevel=0.012)
    cu = bpy.data.curves.new("tira", "CURVE")
    cu.dimensions = "3D"; cu.extrude = 0.045; cu.bevel_depth = 0.0
    sp = cu.splines.new("BEZIER")
    sp.bezier_points.add(2)
    for bp, c in zip(sp.bezier_points, [(-0.05, 0, 0.02), (0, 0, 0.065), (0.05, 0, 0.02)]):
        bp.co = c; bp.handle_left_type = bp.handle_right_type = "AUTO"
    cu.offset = 0
    strap = bpy.data.objects.new("chinelo_tira", cu)
    strap.data.materials.append(M_RUBBER)
    strap.location = (0, 0.04, 0)
    strap.rotation_euler = (math.pi / 2, 0, 0)
    col.objects.link(strap)
    sole.hide_render = strap.hide_render = True
    return sole, strap

HANGER = build_hanger()
BOOT = build_boot()
SLIDE = build_slide()

def place_copy(src, name, matrix, mats=None):
    o = src.copy()
    o.data = src.data
    o.name = name
    o.matrix_world = matrix
    o.hide_render = False
    o.hide_viewport = False
    if mats:
        for i, m in enumerate(mats):
            o.material_slots[i].link = "OBJECT"
            o.material_slots[i].material = m
    col.objects.link(o)
    return o

def M(loc, rz=0.0, s=1.0):
    return Matrix.Translation(Vector(loc)) @ Matrix.Rotation(rz, 4, "Z") @ Matrix.Scale(s, 4)

kit_cycle = 0
for sd in (-1, 1):
    face = math.pi / 2 if sd < 0 else -math.pi / 2   # rotação que vira -Y para a sala
    for u in range(N_UNITS + 1):
        y = Y0 + u * UNIT
        prism(f"divisoria_{sd}_{u}", FIN_P, y - FIN / 2, y + FIN / 2, sd, M_WHITE, bevel=0.004)
    yA, yB = Y0, Y0 + N_UNITS * UNIT
    # fundo das cabines (iluminado pelos LEDs)
    box(f"fundo_cab_{sd}", side_x(sd, 0.02) - 0.01, side_x(sd, 0.02) + 0.01, yA, yB, SEAT_Z, SOFF_Z, M_WHITE, bevel=0)
    # capô contínuo (a divisória branca aparece por cima, como na foto)
    prism(f"capo_{sd}", HOOD_P, yA, yB, sd, M_HOOD, bevel=0.002)
    # encosto preto estofado
    prism(f"encosto_{sd}", [(D - 0.02, SEAT_Z + 0.03), (D + 0.07, SEAT_Z + 0.06), (D + 0.075, 0.96),
                             (D + 0.04, 1.0), (D - 0.02, 1.0)], yA, yB, sd, M_LEATHER, bevel=0.015)
    # banco: assento + base
    prism(f"assento_{sd}", [(D - 0.02, SEAT_Z - 0.09), (D + SEAT_D, SEAT_Z - 0.09), (D + SEAT_D + 0.01, SEAT_Z - 0.02),
                            (D + SEAT_D - 0.02, SEAT_Z + 0.01), (D - 0.02, SEAT_Z + 0.01)], yA, yB, sd, M_LEATHER, bevel=0.02)
    # nichos de chuteira sob o banco: caixa branca e suportes curvos pretos
    prism(f"base_banco_{sd}", [(0.0, 0.0), (D + SEAT_D - 0.06, 0.0), (D + SEAT_D - 0.06, 0.035), (0.0, 0.035)], yA, yB, sd, M_WHITE)
    prism(f"prat_banco_{sd}", [(0.0, 0.20), (D + SEAT_D - 0.1, 0.20), (D + SEAT_D - 0.1, 0.22), (0.0, 0.22)], yA, yB, sd, M_WHITE)
    for u in range(N_UNITS + 1):
        y = Y0 + u * UNIT
        sup = [(0.0, 0.0), (D + SEAT_D - 0.06, 0.0)] + arc(D + SEAT_D - 0.06 - 0.12, 0.0, 0.12, 0, math.pi / 2, 8)[1:] + \
              [(D + SEAT_D - 0.2, 0.30), (D + SEAT_D - 0.05, SEAT_Z - 0.09), (0.0, SEAT_Z - 0.09)]
        sup = [(D + SEAT_D - 0.06, 0.0), (D + SEAT_D - 0.06, 0.06)] + arc(D + SEAT_D + 0.10, 0.06, 0.16, math.pi, math.pi * 0.62, 8)[1:] + \
              [(D + SEAT_D - 0.02, SEAT_Z - 0.09), (0.0, SEAT_Z - 0.09), (0.0, 0.0)]
        prism(f"suporte_{sd}_{u}", sup, y - 0.022, y + 0.022, sd, M_BLACKG if u % 1 == 0 else M_WHITE, bevel=0.004)

    for u in range(N_UNITS):
        y = Y0 + (u + 0.5) * UNIT
        # LED sob o capô
        box(f"led_nicho_{sd}_{u}", min(side_x(sd, 0.05), side_x(sd, D - 0.05)), max(side_x(sd, 0.05), side_x(sd, D - 0.05)),
            y - UNIT / 2 + 0.05, y + UNIT / 2 - 0.05, 1.835, 1.845, M_NICHE_LED, bevel=0)
        # cofre preto
        box(f"cofre_{sd}_{u}", min(side_x(sd, 0.04), side_x(sd, 0.36)), max(side_x(sd, 0.04), side_x(sd, 0.36)),
            y + 0.08, y + 0.33, 1.0, 1.22, M_BLACKG, bevel=0.006)
        # cabide + camisa
        kit = KITS[(u + (0 if sd < 0 else 3)) % len(KITS)]
        hx = side_x(sd, 0.30)
        rz = face + (-shirt_rot if sd < 0 else shirt_rot)   # gira a frente para a porta
        place_copy(HANGER[0], f"cabide_{sd}_{u}", M((hx, y - 0.04, 1.80), rz))
        place_copy(HANGER[1], f"gancho_{sd}_{u}", M((hx, y - 0.04, 1.80), rz))
        place_copy(SHIRT, f"camisa_{sd}_{u}", M((hx, y - 0.04, 1.80 - 0.015), rz), [M_KITS[kit]])
        # logo NJR no capô
        lp = bpy.data.meshes.new("logo")
        bm = bmesh.new()
        w, h = 0.11, 0.055
        vs = [bm.verts.new(c) for c in ((-w, 0, -h), (w, 0, -h), (w, 0, h), (-w, 0, h))]
        f = bm.faces.new(vs)
        uvl = bm.loops.layers.uv.new()
        for l, c in zip(f.loops, ((0, 0), (1, 0), (1, 1), (0, 1))):
            l[uvl].uv = c
        bm.to_mesh(lp); bm.free()
        lp.materials.append(M_LOGO)
        lo = bpy.data.objects.new(f"logo_{sd}_{u}", lp)
        ang = math.radians(0)
        lx = D + 0.003
        lz = 2.03
        lo.location = (side_x(sd, lx), y + 0.22, lz)
        lo.rotation_euler = (0, sd * -(math.pi / 2 - ang) * 0 , 0)
        # face voltada para a sala, inclinada como a superfície do capô
        lo.matrix_world = Matrix.Translation(lo.location) @ Matrix.Rotation(face, 4, "Z") @ Matrix.Rotation(-ang, 4, "X")
        col.objects.link(lo)
        # chuteiras sob o banco, chinelos no chão
        if rnd.random() < 0.85:
            bm_ = M_BOOTS[rnd.randrange(len(M_BOOTS))]
            for k, dy in enumerate((-0.07, 0.07)):
                bx = side_x(sd, 0.70 + rnd.uniform(-0.03, 0.03))
                rzb = face + math.pi / 2 + rnd.uniform(-0.15, 0.15)
                mtx = M((bx, y + dy, 0.035 if k == 0 or rnd.random() < 0.5 else 0.22), rzb)
                place_copy(BOOT[0], f"chuteira_{sd}_{u}_{k}", mtx, [bm_])
                place_copy(BOOT[1], f"sola_{sd}_{u}_{k}", mtx)
        if rnd.random() < 0.8:
            for k, dy in enumerate((-0.07, 0.07)):
                sx = side_x(sd, D + SEAT_D + 0.28 + rnd.uniform(-0.03, 0.05))
                mtx = M((sx, y + dy + rnd.uniform(-0.02, 0.02), 0.0), face + math.pi / 2 + rnd.uniform(-0.12, 0.12))
                place_copy(SLIDE[0], f"chinelo_{sd}_{u}_{k}", mtx)
                place_copy(SLIDE[1], f"tira_{sd}_{u}_{k}", mtx @ Matrix.Translation((0, 0.04, 0)) @ Matrix.Rotation(math.pi / 2, 4, "X"))
        # bolsas e toalhas no banco
        r = rnd.random()
        if r < 0.3:
            bpy.ops.mesh.primitive_cube_add(size=1.0)
            bag = bpy.context.active_object
            bag.name = f"bolsa_{sd}_{u}"
            bag.data.transform(Matrix.Diagonal((0.26, 0.5, 0.24, 1)))
            bag.rotation_euler = (0, 0, 0)
            bag.location = (side_x(sd, D + 0.24), y + rnd.uniform(-0.1, 0.1), SEAT_Z + 0.13)
            bag.data.materials.append(M_BAG)
            bag.data.materials.append(M_BAG_STRIPE)
            for p in bag.data.polygons:
                p.use_smooth = True
            bv = bag.modifiers.new("b", "BEVEL"); bv.width = 0.07; bv.segments = 3
            sb = bag.modifiers.new("s", "SUBSURF"); sb.levels = 2; sb.render_levels = 2
            sdv = sd
            box(f"bolsa_faixa_{sd}_{u}", bag.location.x - 0.135, bag.location.x + 0.135, bag.location.y - 0.03, bag.location.y + 0.03,
                bag.location.z - 0.115, bag.location.z + 0.122, M_BAG_STRIPE, bevel=0.03)
        elif r < 0.62:
            tm = M_TOWEL if rnd.random() < 0.6 else M_TOWEL_G
            tx = side_x(sd, D + 0.2)
            box(f"toalha_{sd}_{u}", tx - 0.17, tx + 0.17, y - 0.13, y + 0.13, SEAT_Z + 0.01, SEAT_Z + 0.075, tm, bevel=0.025)

# ---------- teto: spots, grelhas, alçapão ----------
def downlight(name, x, y, z):
    bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.085, depth=0.012, location=(x, y, z - 0.004))
    ring = bpy.context.active_object; ring.name = name + "_aro"
    ring.data.materials.append(M_CHROME)
    bpy.ops.mesh.primitive_circle_add(vertices=32, radius=0.06, fill_type="NGON", location=(x, y, z - 0.011))
    disc = bpy.context.active_object; disc.name = name + "_led"
    disc.data.materials.append(M_LED)
    disc.rotation_euler = (math.pi, 0, 0)
    ld = bpy.data.lights.new(name, "SPOT")
    ld.energy = 55
    ld.spot_size = math.radians(115)
    ld.spot_blend = 0.6
    ld.shadow_soft_size = 0.05
    ld.color = (1.0, 0.95, 0.88)
    lo = bpy.data.objects.new(name, ld)
    lo.location = (x, y, z - 0.02)
    col.objects.link(lo)

ys = [1.6 + i * 2.05 for i in range(8)]
for y in ys:
    for x in (-1.25, 1.25):
        downlight(f"spot_{x}_{y:.1f}", x, y, H)
for y in [1.4 + i * 2.05 for i in range(8)]:
    for sd in (-1, 1):
        downlight(f"spot_rebaixo_{sd}_{y:.1f}", side_x(sd, 0.85), y, SOFF_Z)

def grille(name, x, y, z, w=0.42, d=0.32):
    box(name + "_moldura", x - w / 2, x + w / 2, y - d / 2, y + d / 2, z - 0.012, z, M_WHITE, bevel=0.002)
    for i in range(9):
        yy = y - d / 2 + 0.03 + i * (d - 0.06) / 8
        box(f"{name}_aleta{i}", x - w / 2 + 0.03, x + w / 2 - 0.03, yy - 0.006, yy + 0.006, z - 0.03, z - 0.013, M_VENT, bevel=0)
for y in (3.4, 9.6):
    for sd in (-1, 1):
        grille(f"grelha_{sd}_{y}", side_x(sd, 0.45), y, SOFF_Z)
for y in (5.6, 12.4):
    for x in (-2.3, 2.3):
        grille(f"grelha_teto_{x}_{y}", x, y, H, 0.36, 0.36)
# alçapão
for (x0, x1, y0, y1) in ((-0.6, 0.6, 9.0, 9.012), (-0.6, 0.6, 10.2, 10.212), (-0.6, -0.588, 9.0, 10.212), (0.588, 0.6, 9.0, 10.212)):
    box(f"alcapao_{x0}_{y0}", x0, x1, y0, y1, H - 0.002, H, M_DARK, bevel=0)
# detector de fumaça
bpy.ops.mesh.primitive_cylinder_add(vertices=32, radius=0.07, depth=0.04, location=(0.5, 13.5, H - 0.02))
bpy.context.active_object.data.materials.append(M_WHITE)

# ---------- TV suspensa ----------
TVY, TVZ = 7.4, 2.05
box("tv_corpo", -0.78, 0.78, TVY - 0.05, TVY + 0.05, TVZ, TVZ + 0.9, M_BLACKG, bevel=0.006)
box("tv_tela", -0.75, 0.75, TVY - 0.0525, TVY - 0.05, TVZ + 0.03, TVZ + 0.87, M_SCREEN, bevel=0)
box("tv_tela2", -0.75, 0.75, TVY + 0.05, TVY + 0.0525, TVZ + 0.03, TVZ + 0.87, M_SCREEN, bevel=0)
box("tv_haste", -0.04, 0.04, TVY - 0.04, TVY + 0.04, TVZ + 0.9, H, M_DARK, bevel=0.004)
for sx in (-1, 1):
    # braços laterais inclinados, como o suporte da foto
    a = box(f"tv_braco_{sx}", -0.02, 0.02, -0.02, 0.02, -0.5, 0.5, M_DARK, bevel=0.003)
    a.location = (sx * 0.72, TVY, TVZ + 0.75)
    a.rotation_euler = (0, sx * math.radians(-30), 0)
    a.scale = (1, 1, 0.75)

# ---------- mesa ----------
TY = 12.7
box("mesa_tampo", -0.75, 0.75, TY - 0.45, TY + 0.45, 0.74, 0.79, M_WHITE, bevel=0.006)
for x in (-0.7, 0.7):
    for y in (TY - 0.4, TY + 0.4):
        box(f"mesa_perna_{x}_{y}", x - 0.025, x + 0.025, y - 0.025, y + 0.025, 0, 0.74, M_WHITE, bevel=0.004)
for i in range(4):
    box(f"mesa_toalha_{i}", -0.55 + i * 0.3, -0.33 + i * 0.3, TY - 0.15, TY + 0.15, 0.79, 0.83, M_TOWEL, bevel=0.018)

# ---------- parede do fundo ----------
box("porta", -0.5, 0.5, BACK - 0.03, BACK, 0, 2.2, mat("porta_preta", (0.018, 0.018, 0.02), rough=0.38), bevel=0.004)
box("porta_batente", -0.55, 0.55, BACK - 0.02, BACK, 0, 2.25, M_DARK, bevel=0.003)
box("macaneta", 0.33, 0.43, BACK - 0.07, BACK - 0.05, 1.02, 1.04, M_CHROME, bevel=0.004)
for sx, kit in ((-1, "selecao"), (1, "santos")):
    cx = sx * 1.55
    box(f"vitrine_base_{sx}", cx - 0.48, cx + 0.48, BACK - 0.5, BACK, 0, 0.82, M_WHITE, bevel=0.006)
    box(f"vitrine_frente_{sx}", cx - 0.47, cx + 0.47, BACK - 0.505, BACK - 0.49, 0.78, 0.82, M_DARK, bevel=0)
    for nm, a in (("esq", (cx - 0.48, cx - 0.43, 0.82, 2.25)), ("dir", (cx + 0.43, cx + 0.48, 0.82, 2.25))):
        box(f"vitrine_lado_{nm}_{sx}", a[0], a[1], BACK - 0.47, BACK, a[2], a[3], M_BLACKG, bevel=0.004)
    box(f"vitrine_topo_{sx}", cx - 0.48, cx + 0.48, BACK - 0.47, BACK, 2.18, 2.25, M_BLACKG, bevel=0.004)
    box(f"vitrine_piso_{sx}", cx - 0.48, cx + 0.48, BACK - 0.47, BACK, 0.82, 0.88, M_BLACKG, bevel=0.004)
    box(f"vitrine_fundo_{sx}", cx - 0.43, cx + 0.43, BACK - 0.04, BACK - 0.03, 0.88, 2.18, M_WHITE, bevel=0)
    plane_v = box(f"vitrine_vidro_{sx}", cx - 0.43, cx + 0.43, BACK - 0.47, BACK - 0.469, 0.88, 2.18, M_GLASS, bevel=0)
    box(f"vitrine_led_{sx}", cx - 0.4, cx + 0.4, BACK - 0.43, BACK - 0.06, 2.16, 2.17, M_CASE_LED, bevel=0)
    place_copy(SHIRT, f"camisa_vitrine_{sx}", M((cx, BACK - 0.22, 1.98), 0.0, 1.25), [M_KITS[kit]])
    place_copy(HANGER[0], f"cabide_vitrine_{sx}", M((cx, BACK - 0.22, 1.995), 0.0, 1.25))
# logo NJR acima da porta
for txt, size, z, ext in (("NJR", 0.34, 2.48, 0.012), ("NEYMAR JR", 0.07, 2.38, 0.004)):
    cu = bpy.data.curves.new(txt, "FONT")
    cu.body = txt
    cu.size = size
    cu.extrude = ext
    cu.align_x = "CENTER"
    cu.font = bpy.data.fonts.load("C:/Windows/Fonts/ariblk.ttf")
    t = bpy.data.objects.new("logo_" + txt, cu)
    t.data.materials.append(M_BLACKG)
    t.location = (0, BACK - 0.02, z)
    t.rotation_euler = (math.pi / 2, 0, 0)   # plano XZ, legível de quem olha para +Y
    col.objects.link(t)

# ---------- mundo ----------
w = bpy.data.worlds.new("mundo")
w.use_nodes = True
w.node_tree.nodes["Background"].inputs["Color"].default_value = (0.02, 0.02, 0.02, 1)
w.node_tree.nodes["Background"].inputs["Strength"].default_value = 0.4
scene.world = w

# ---------- câmera ----------
cd = bpy.data.cameras.new("cam")
cd.lens = 18
cd.sensor_width = 36
cd.dof.use_dof = True
cd.dof.aperture_fstop = 5.6
cam = bpy.data.objects.new("cam", cd)
col.objects.link(cam)
scene.camera = cam
alvo = bpy.data.objects.new("alvo", None)
alvo.location = (0, BACK, 1.45)
col.objects.link(alvo)
cd.dof.focus_object = alvo
tr = cam.constraints.new("TRACK_TO")
tr.target = alvo
tr.track_axis = "TRACK_NEGATIVE_Z"
tr.up_axis = "UP_Y"

FPS, DUR = 30, 5.4
scene.render.fps = FPS
scene.frame_start, scene.frame_end = 1, int(FPS * DUR)
cam.location = (0, -0.6, 1.58)
cam.keyframe_insert("location", frame=1)
cam.location = (0, 11.6, 1.52)
cam.keyframe_insert("location", frame=scene.frame_end)
alvo.location = (0, BACK, 1.48)
alvo.keyframe_insert("location", frame=1)
alvo.location = (0, BACK, 1.38)
alvo.keyframe_insert("location", frame=scene.frame_end)
for o in (cam, alvo):
    for fc in o.animation_data.action.fcurves if hasattr(o.animation_data.action, "fcurves") else []:
        for k in fc.keyframe_points:
            k.interpolation = "BEZIER"
            k.easing = "AUTO"

# ---------- render ----------
r = scene.render
r.engine = "CYCLES"
c = scene.cycles
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
c.device = "GPU"
c.samples = 160
c.adaptive_threshold = 0.015
c.use_denoising = True
c.denoiser = "OPENIMAGEDENOISE"
c.max_bounces = 8
c.diffuse_bounces = 4
c.glossy_bounces = 4
c.transmission_bounces = 6
c.caustics_reflective = False
c.caustics_refractive = False
c.sample_clamp_indirect = 8
r.use_motion_blur = True
r.motion_blur_shutter = 0.35
r.resolution_x, r.resolution_y = 3840, 2160
r.resolution_percentage = 100
r.image_settings.file_format = "PNG"
r.image_settings.color_mode = "RGB"
scene.view_settings.view_transform = "AgX"
scene.view_settings.look = "AgX - Base Contrast"
scene.view_settings.exposure = 1.0
r.film_transparent = False

if "--teste" in ARGS:
    r.resolution_percentage = 33
    c.samples = 48
if "--salvar" in ARGS:
    bpy.ops.wm.save_as_mainfile(filepath=str(AQUI / ARGS[ARGS.index("--salvar") + 1]))
print("CENA OK", len(bpy.data.objects), "objetos")
