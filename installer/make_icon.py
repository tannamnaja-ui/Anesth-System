from PIL import Image, ImageDraw, ImageFont
import os

SIZE = 512
img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(img)

# Green circle (sage/medical green, matches the app's pastel-green theme)
margin = 12
circle_fill = (91, 140, 90, 255)   # #5b8c5a
circle_outline = (74, 117, 73, 255)  # #4a7549
draw.ellipse(
    [margin, margin, SIZE - margin, SIZE - margin],
    fill=circle_fill,
    outline=circle_outline,
    width=10,
)

text = "Anes"
font = None
font_candidates = [
    r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\arial.ttf",
]
for path in font_candidates:
    if os.path.exists(path):
        font = ImageFont.truetype(path, 150)
        break
if font is None:
    font = ImageFont.load_default()

bbox = draw.textbbox((0, 0), text, font=font)
text_w = bbox[2] - bbox[0]
text_h = bbox[3] - bbox[1]
x = (SIZE - text_w) / 2 - bbox[0]
y = (SIZE - text_h) / 2 - bbox[1]
draw.text((x, y), text, font=font, fill=(255, 255, 255, 255))

out_path = os.path.join(os.path.dirname(__file__), "payload", "icon.ico")
img.save(out_path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("wrote", out_path)
