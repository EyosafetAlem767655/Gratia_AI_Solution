"""
Cut the checkerboard background out of the source logo with a high-quality
matting model (rembg / isnet-general-use) + alpha matting, then clean faint
checker remnants by dropping low-alpha pixels. Produces a truly transparent
lockup + an emblem-only crop.

Usage: python scripts/process-logo.py
"""
import numpy as np
from PIL import Image
from rembg import new_session, remove

SRC = "public/logo-original.png"

session = new_session("birefnet-general")  # SOTA: cuts interior gaps/holes cleanly
src = Image.open(SRC).convert("RGBA")

cut = remove(src, session=session)

# Hard-threshold the mask so the baked drop-shadow / checker halo is fully cut.
arr = np.array(cut)
alpha = arr[:, :, 3]
alpha = np.where(alpha >= 128, 255, 0).astype(np.uint8)
arr[:, :, 3] = alpha
cut = Image.fromarray(arr, "RGBA")


def trimmed(img: Image.Image) -> Image.Image:
    bbox = img.getbbox()
    return img.crop(bbox) if bbox else img


# Full lockup
trimmed(cut).save("public/logo.png")

# Emblem only (top portion, above the wordmark)
w, h = cut.size
emblem = trimmed(cut.crop((0, 0, w, int(h * 0.57))))
emblem.save("public/emblem.png")

print("done:", trimmed(cut).size, "| emblem", emblem.size)
