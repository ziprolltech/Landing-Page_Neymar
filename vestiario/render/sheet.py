import sys
from PIL import Image
d=sys.argv[1]; fs=sys.argv[2].split(',')
ims=[Image.open(f'{d}/t_{int(f):03d}.png').convert('RGB') for f in fs]
w,h=ims[0].size
c=Image.new('RGB',(w,h*len(ims)))
for i,im in enumerate(ims): c.paste(im,(0,h*i))
c.save(f'{d}/sheet.jpg',quality=88)
