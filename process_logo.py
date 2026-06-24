import io
from rembg import remove
from PIL import Image
import os

input_path = r"C:\Users\KsL_Tapa\Downloads\nexora-logo.png"

print("Removing background from nexora-logo.png...")
with open(input_path, 'rb') as i:
    output_data = remove(i.read())

img = Image.open(io.BytesIO(output_data))

print("Saving nexora-logo.webp...")
img.save("public/nexora-logo.webp", "WEBP")

print("Generating 512x512 icon...")
img_512 = img.copy()
img_512.thumbnail((512, 512), Image.Resampling.LANCZOS)
bg512 = Image.new('RGBA', (512, 512), (0,0,0,0))
bg512.paste(img_512, ((512 - img_512.width) // 2, (512 - img_512.height) // 2))
bg512.save("public/icon-512.png", "PNG")

print("Generating 192x192 icon...")
img_192 = img.copy()
img_192.thumbnail((192, 192), Image.Resampling.LANCZOS)
bg192 = Image.new('RGBA', (192, 192), (0,0,0,0))
bg192.paste(img_192, ((192 - img_192.width) // 2, (192 - img_192.height) // 2))
bg192.save("public/icon-192.png", "PNG")

print("All done!")
