"""Renderiza a animação inteira em 4K (retomável: pula quadros já salvos)."""
import bpy
from pathlib import Path
prefs = bpy.context.preferences.addons["cycles"].preferences
prefs.compute_device_type = "OPTIX"
prefs.get_devices()
for d in prefs.devices:
    d.use = d.type == "OPTIX"
sc = bpy.context.scene
sc.cycles.device = "GPU"
sc.cycles.samples = 40
sc.render.resolution_percentage = 100
sc.render.use_overwrite = False
sc.render.use_placeholder = True
sc.render.filepath = str(Path(bpy.data.filepath).parent / "quadros" / "q_####")
bpy.ops.render.render(animation=True)
