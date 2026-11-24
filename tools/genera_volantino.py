"""Volantino A4 fronte/retro di LIFE 365.

Fronte: lo stemma (freccia circolare arcobaleno con la scritta LIFE 365) accanto al QR del sito.
Retro: tutto quello che fa l'app. La cornice di entrambe le pagine ripete lo stesso stemma.

Uso:  py -3 tools/genera_volantino.py --url https://INDIRIZZO --out stampa/volantino.pdf
"""
import argparse
import math
import os

import qrcode
from reportlab.lib.colors import HexColor, white
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

W, H = A4
NOTTE = HexColor("#0b1a33")
INK = HexColor("#1c2433")
MUTED = HexColor("#5b6577")
LINEA = HexColor("#e3e8f0")
ARCOBALENO = ["#e5484d", "#f5a524", "#e2b714", "#30a46c", "#2f6fed", "#6e56cf", "#b0459e"]

FONT_DIR = os.path.join(os.environ.get("WINDIR", r"C:\Windows"), "Fonts")
pdfmetrics.registerFont(TTFont("Testo", os.path.join(FONT_DIR, "segoeui.ttf")))
pdfmetrics.registerFont(TTFont("Grassetto", os.path.join(FONT_DIR, "segoeuib.ttf")))
pdfmetrics.registerFont(TTFont("Nero", os.path.join(FONT_DIR, "seguibl.ttf")))


def colore_a(t):
    """Colore dell'arcobaleno nel punto t (0..1), interpolato tra le tappe."""
    t = min(max(t, 0.0), 1.0) * (len(ARCOBALENO) - 1)
    i = min(int(t), len(ARCOBALENO) - 2)
    f = t - i
    a, b = HexColor(ARCOBALENO[i]), HexColor(ARCOBALENO[i + 1])
    return HexColor(0).__class__(a.red + (b.red - a.red) * f, a.green + (b.green - a.green) * f, a.blue + (b.blue - a.blue) * f)


def testo_arcobaleno(c, testo, x, y, font, size, centrato=True):
    """Scritta riempita da una sfumatura arcobaleno (il testo fa da maschera)."""
    larghezza = pdfmetrics.stringWidth(testo, font, size)
    x0 = x - larghezza / 2 if centrato else x
    c.saveState()
    t = c.beginText(x0, y)
    t.setFont(font, size)
    t.setTextRenderMode(7)  # il testo diventa tracciato di ritaglio
    t.textOut(testo)
    c.drawText(t)
    c.linearGradient(x0, y, x0 + larghezza, y + size * 0.7, [HexColor(h) for h in ARCOBALENO], extend=True)
    c.restoreState()
    return larghezza


def freccia_tonda(c, cx, cy, r, spessore):
    """Freccia circolare che gira in senso orario: arco arcobaleno di ~300° e punta finale."""
    inizio, ampiezza, passi = 115.0, 300.0, 90
    c.saveState()
    c.setLineCap(1)
    c.setLineWidth(spessore)
    for k in range(passi):
        a0 = math.radians(inizio - ampiezza * k / passi)
        a1 = math.radians(inizio - ampiezza * (k + 1) / passi)
        c.setStrokeColor(colore_a(k / (passi - 1)))
        p = c.beginPath()
        p.moveTo(cx + r * math.cos(a0), cy + r * math.sin(a0))
        p.lineTo(cx + r * math.cos(a1), cy + r * math.sin(a1))
        c.drawPath(p, stroke=1, fill=0)
    # Punta: triangolo tangente all'arco, rivolto nel verso di rotazione (orario).
    fine = math.radians(inizio - ampiezza)
    px, py = cx + r * math.cos(fine), cy + r * math.sin(fine)
    tx, ty = math.sin(fine), -math.cos(fine)        # direzione oraria
    nx, ny = math.cos(fine), math.sin(fine)         # verso l'esterno
    lung, larg = spessore * 2.1, spessore * 1.35
    c.setFillColor(HexColor(ARCOBALENO[-1]))
    p = c.beginPath()
    p.moveTo(px + tx * lung, py + ty * lung)
    p.lineTo(px + nx * larg - tx * spessore * 0.2, py + ny * larg - ty * spessore * 0.2)
    p.lineTo(px - nx * larg - tx * spessore * 0.2, py - ny * larg - ty * spessore * 0.2)
    p.close()
    c.drawPath(p, stroke=0, fill=1)
    c.restoreState()


def stemma(c, cx, cy, r):
    """Lo stemma: freccia tonda con la scritta arcobaleno LIFE 365 dentro."""
    freccia_tonda(c, cx, cy, r, r * 0.15)
    testo_arcobaleno(c, "LIFE", cx, cy + r * 0.08, "Nero", r * 0.42)
    testo_arcobaleno(c, "365", cx, cy - r * 0.42, "Nero", r * 0.52)


def cornice(c):
    """Cornice della pagina fatta dallo stesso stemma ripetuto lungo i bordi."""
    r, margine = 7.2 * mm, 11 * mm
    c.setStrokeColor(LINEA)
    c.setLineWidth(0.8)
    c.roundRect(margine + r + 4 * mm, margine + r + 4 * mm, W - 2 * (margine + r + 4 * mm), H - 2 * (margine + r + 4 * mm), 6 * mm)
    nx, ny = 8, 12
    xs = [margine + r + i * (W - 2 * (margine + r)) / (nx - 1) for i in range(nx)]
    ys = [margine + r + j * (H - 2 * (margine + r)) / (ny - 1) for j in range(ny)]
    punti = {(x, ys[0]) for x in xs} | {(x, ys[-1]) for x in xs} | {(xs[0], y) for y in ys} | {(xs[-1], y) for y in ys}
    for x, y in sorted(punti):
        stemma(c, x, y, r)


def qr_immagine(url):
    q = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, border=2, box_size=12)
    q.add_data(url)
    q.make(fit=True)
    return ImageReader(q.make_image(fill_color="#0b1a33", back_color="white").get_image())


def centrato(c, testo, y, font, size, colore=INK):
    c.setFillColor(colore)
    c.setFont(font, size)
    c.drawCentredString(W / 2, y, testo)


def fronte(c, url):
    cornice(c)
    testo_arcobaleno(c, "LIFE 365", W / 2, H - 62 * mm, "Nero", 46)
    centrato(c, "La tua vita in ordine, tutto l'anno.", H - 74 * mm, "Grassetto", 17, NOTTE)
    centrato(c, "Finanze, documenti, casa, auto, salute e scadenze in un unico posto.", H - 82 * mm, "Testo", 11.5, MUTED)

    # Stemma grande e QR affiancati.
    y = H / 2 + 2 * mm
    stemma(c, W / 2 - 40 * mm, y, 30 * mm)
    lato = 62 * mm
    qx, qy = W / 2 + 8 * mm, y - lato / 2
    c.setFillColor(white)
    c.setStrokeColor(LINEA)
    c.roundRect(qx - 3 * mm, qy - 3 * mm, lato + 6 * mm, lato + 6 * mm, 4 * mm, stroke=1, fill=1)
    c.drawImage(qr_immagine(url), qx, qy, lato, lato)
    c.setFillColor(NOTTE)
    c.setFont("Grassetto", 11)
    c.drawCentredString(qx + lato / 2, qy - 9 * mm, "Inquadra con la fotocamera")

    centrato(c, url.replace("https://", ""), H / 2 - 52 * mm, "Grassetto", 15, NOTTE)

    righe = [
        ("Gratis", "crea il tuo account con e-mail e password"),
        ("Sincronizzato", "stessi dati su telefono, tablet e computer"),
        ("Privato", "ogni account vede soltanto i propri dati"),
        ("Ovunque", "accedi da qualsiasi dispositivo, anche dalla schermata Home"),
    ]
    y0 = H / 2 - 68 * mm
    for i, (titolo, testo) in enumerate(righe):
        yy = y0 - i * 8.5 * mm
        c.setFillColor(HexColor(ARCOBALENO[i * 2 % len(ARCOBALENO)]))
        c.circle(W / 2 - 70 * mm, yy + 1.4 * mm, 1.6 * mm, stroke=0, fill=1)
        c.setFillColor(NOTTE)
        c.setFont("Grassetto", 12)
        c.drawString(W / 2 - 66 * mm, yy, titolo)
        c.setFillColor(INK)
        c.setFont("Testo", 12)
        c.drawString(W / 2 - 66 * mm + pdfmetrics.stringWidth(titolo + "  ", "Grassetto", 12), yy, "· " + testo)


FUNZIONI = [
    ("Dashboard", "Patrimonio netto, liquidità, entrate, uscite e risparmio dell'anno, con grafici mensili e per categoria."),
    ("Finanze", "Conti e movimenti con saldi calcolati, budget per categoria, prestiti e mutui. I giroconti non falsano i totali."),
    ("Scadenziario", "Tutte le scadenze in un'unica lista: documenti, bollette, bollo, revisione, rinnovi, garanzie, compleanni."),
    ("Notifiche", "Il campanello avvisa di ciò che scade nei prossimi 30 giorni o è già scaduto."),
    ("Documenti e file", "Schede con data di scadenza; carica PDF e foto, collegali alla sezione giusta, aprili e scaricali."),
    ("Casa e immobili", "Immobili e quote di proprietà, mutui, bollette e spese di ogni casa, con quelle ancora da pagare."),
    ("Auto e mobilità", "Veicoli, scadenze di assicurazione, bollo e revisione, interventi e costi dell'anno."),
    ("Salute", "Visite, esami, farmaci e prossimi controlli. Solo archivio personale, nessuna diagnosi."),
    ("Abbonamenti", "Costo mensile e annuale equivalente di ogni abbonamento e contratto, e i prossimi rinnovi."),
    ("Beni personali", "Inventario degli acquisti con valore attuale e scadenza della garanzia."),
    ("Agenda", "Appuntamenti, commissioni e promemoria da segnare come completati."),
    ("Viaggi", "Budget previsto e spese effettive, prese dai movimenti collegati al viaggio."),
    ("Rubrica", "Familiari, amici e professionisti, con i compleanni nello scadenziario."),
    ("Patrimonio e futuro", "Attività meno passività senza doppi conteggi, investimenti e obiettivi di risparmio."),
    ("Il mio anno", "Il riepilogo dell'anno scelto, confrontato con l'anno precedente."),
    ("Assistente", "Risposte immediate su spese, risparmio, abbonamenti e documenti in scadenza, calcolate sui tuoi dati."),
    ("Ricerca e tabelle", "Ricerca in tutti i moduli; in ogni tabella filtri, ordinamento, inserimento e modifica."),
    ("Un account, ogni dispositivo", "Accedi con e-mail e password: i dati restano sincronizzati ovunque. Esportali quando vuoi."),
]


def a_capo(testo, font, size, larghezza):
    parole, righe, riga = testo.split(), [], ""
    for p in parole:
        prova = (riga + " " + p).strip()
        if pdfmetrics.stringWidth(prova, font, size) <= larghezza:
            riga = prova
        else:
            righe.append(riga)
            riga = p
    if riga:
        righe.append(riga)
    return righe


def retro(c, url):
    cornice(c)
    testo_arcobaleno(c, "Cosa fa LIFE 365", W / 2, H - 47 * mm, "Nero", 28)
    centrato(c, "Un gestionale personale completo, in italiano, con importi in euro e date GG/MM/AAAA.", H - 54.5 * mm, "Testo", 10, MUTED)

    colonne, sinistra, gap = 2, 31 * mm, 7 * mm
    larghezza = (W - 2 * sinistra - gap) / colonne
    y_inizio, y = H - 63 * mm, [H - 63 * mm, H - 63 * mm]
    per_colonna = math.ceil(len(FUNZIONI) / colonne)
    for i, (titolo, testo) in enumerate(FUNZIONI):
        col = i // per_colonna
        x = sinistra + col * (larghezza + gap)
        yy = y[col]
        c.setFillColor(colore_a(i / (len(FUNZIONI) - 1)))
        c.roundRect(x, yy - 0.6 * mm, 2.2 * mm, 4.2 * mm, 1 * mm, stroke=0, fill=1)
        c.setFillColor(NOTTE)
        c.setFont("Grassetto", 11)
        c.drawString(x + 4.5 * mm, yy, titolo)
        c.setFillColor(INK)
        c.setFont("Testo", 9)
        righe = a_capo(testo, "Testo", 9, larghezza - 4.5 * mm)
        for k, riga in enumerate(righe):
            c.drawString(x + 4.5 * mm, yy - (4.4 + 3.7 * k) * mm, riga)
        y[col] = yy - (4.4 + 3.7 * len(righe) + 2.6) * mm
        assert y[col] > 76 * mm, f"il retro trabocca alla voce {titolo}"
    del y_inizio

    # Come iniziare + QR piccolo.
    base = 40 * mm
    c.setFillColor(HexColor("#f4f6fa"))
    c.roundRect(sinistra, base - 4 * mm, W - 2 * sinistra, 34 * mm, 4 * mm, stroke=0, fill=1)
    c.setFillColor(NOTTE)
    c.setFont("Grassetto", 12)
    c.drawString(sinistra + 5 * mm, base + 23 * mm, "Come iniziare")
    passi = [
        "1. Inquadra il QR o apri " + url.replace("https://", ""),
        "2. Crea il tuo account gratuito con e-mail e password",
        "3. Telefono: Condividi › Aggiungi alla schermata Home",
    ]
    c.setFont("Testo", 10.5)
    c.setFillColor(INK)
    for k, p in enumerate(passi):
        c.drawString(sinistra + 5 * mm, base + (16 - 6 * k) * mm, p)
    lato = 26 * mm
    c.drawImage(qr_immagine(url), W - sinistra - lato - 3 * mm, base - 1 * mm, lato, lato)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--url", required=True)
    ap.add_argument("--out", default="stampa/volantino.pdf")
    a = ap.parse_args()
    os.makedirs(os.path.dirname(a.out) or ".", exist_ok=True)
    c = canvas.Canvas(a.out, pagesize=A4)
    c.setTitle("LIFE 365 - volantino")
    c.setAuthor("LIFE 365")
    fronte(c, a.url)
    c.showPage()
    retro(c, a.url)
    c.showPage()
    c.save()
    print("scritto", a.out)


if __name__ == "__main__":
    main()
