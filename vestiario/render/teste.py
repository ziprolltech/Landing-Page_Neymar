import bpy, sys
from pathlib import Path
argv = sys.argv[sys.argv.index("--") + 1:]
out = Path(argv[0]).resolve(); frames = [int(f) for f in argv[1].split(",")]
pct = int(argv[2]) if len(argv) > 2 else 33
smp = int(argv[3]) if len(argv) > 3 else 48
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
sc = bpy.context.scene
sc.cycles.device = "GPU"
sc.render.resolution_percentage = pct
sc.cycles.samples = smp
for f in frames:
    sc.frame_set(f)
    sc.render.filepath = str(out / f"t_{f:03d}.png")
    bpy.ops.render.render(write_still=True)
