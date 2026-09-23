from PIL import Image
from pathlib import Path

source = Path('/home/ubuntu/emdr-therapy-mobile/assets/images/icon.png')
image = Image.open(source).convert('RGB').resize((512, 512), Image.Resampling.LANCZOS)
for name in ['icon.png', 'splash-icon.png', 'favicon.png', 'android-icon-foreground.png']:
    image.save(source.parent / name, format='PNG', optimize=True, compress_level=9)
