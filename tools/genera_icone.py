"""Icone di LIFE 365 dallo stesso stemma del volantino (freccia tonda arcobaleno con LIFE 365).

Uso:  py -3 tools/genera_icone.py
Scrive: public/icon-192.png, public/icon-512.png, public/icon-maskable-512.png (schermata Home e app installata),
        public/logo-life365.png (logo su fondo bianco arrotondato usato nell'app), src/app/apple-icon.png (iPhone),
        src/app/favicon.ico (scheda del browser).
"""
import io
import os
import sys

import pymupdf
from PIL import Image
from reportlab.lib.colors import white
from reportlab.pdfgen import canvas

sys.path.insert(0, os.path.dirname(__file__))
from genera_volantino import stemma  # noqa: E402  stesso disegno del volantino

RADICE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def disegna(px, sfondo, scala, arrotondato=False):
    """Stemma centrato su un quadrato di `px` pixel; `scala` = raggio rispetto al lato.
    Con `arrotondato` lo sfondo bianco ha gli angoli tondi e il resto resta trasparente."""
    lato = 100.0
    buf = io.BytesIO()
    c = canvas.Canvas(buf, pagesize=(lato, lato))
    if sfondo and arrotondato:
        c.setFillColor(white)
        c.roundRect(0, 0, lato, lato, lato * 0.2, stroke=0, fill=1)
    elif sfondo:
        c.setFillColor(white)
        c.rect(0, 0, lato, lato, stroke=0, fill=1)
    stemma(c, lato / 2, lato / 2, lato * scala)
    c.showPage()
    c.save()
    pagina = pymupdf.open("pdf", buf.getvalue())[0]
    pm = pagina.get_pixmap(matrix=pymupdf.Matrix(px / lato, px / lato), alpha=(not sfondo) or arrotondato)
    return Image.open(io.BytesIO(pm.tobytes("png"))).convert("RGBA")


def salva(img, *percorso):
    dest = os.path.join(RADICE, *percorso)
    img.save(dest)
    print("scritto", os.path.relpath(dest, RADICE), img.size)


# Il raggio 0.36 lascia spazio a spessore e punta della freccia; 0.28 rientra nella zona sicura "maskable".
salva(disegna(192, True, 0.36), "public", "icon-192.png")
salva(disegna(512, True, 0.36), "public", "icon-512.png")
salva(disegna(512, True, 0.28), "public", "icon-maskable-512.png")
salva(disegna(512, True, 0.38, arrotondato=True), "public", "logo-life365.png")
salva(disegna(180, True, 0.36).convert("RGB"), "src", "app", "apple-icon.png")

ico = disegna(256, True, 0.40, arrotondato=True)
dest = os.path.join(RADICE, "src", "app", "favicon.ico")
ico.save(dest, sizes=[(16, 16), (32, 32), (48, 48), (64, 64), (128, 128), (256, 256)])
print("scritto src/app/favicon.ico")
