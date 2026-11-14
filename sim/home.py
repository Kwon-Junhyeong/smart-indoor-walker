import os

T = 0.15
WIDTH, HEIGHT = 9.0, 7.0
CELL = 0.05

WALLS = [
    (0.0, 0.0, WIDTH, T), (0.0, HEIGHT - T, WIDTH, HEIGHT), (0.0, 0.0, T, HEIGHT), (WIDTH - T, 0.0, WIDTH, HEIGHT),
    (0.0, 3.5, 2.2, 3.5 + T), (3.1, 3.5, 3.5, 3.5 + T),
    (3.5, 3.5, 3.5 + T, HEIGHT), (5.5, 3.5, 5.5 + T, HEIGHT),
    (3.5, 5.0, 4.0, 5.0 + T), (4.9, 5.0, 5.5, 5.0 + T),
    (5.5, 3.5, 6.4, 3.5 + T), (7.9, 3.5, WIDTH, 3.5 + T),
]
FURNITURE = [
    (0.3, 5.0, 2.3, 6.7),
    (0.4, 0.3, 2.6, 1.1),
    (7.3, 5.3, 8.5, 6.5),
    (6.0, 0.3, 8.6, 0.8),
]
UNMAPPED = [(3.3, 2.1, 3.8, 2.6)]

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
PLACES_FILE = os.path.join(ROOT, "maps", "home_places.yaml")


def occupied(x, y, boxes):
    return any(x0 <= x <= x1 and y0 <= y <= y1 for x0, y0, x1, y1 in boxes)


def write_map():
    cols, rows = int(WIDTH / CELL), int(HEIGHT / CELL)
    boxes = WALLS + FURNITURE
    data = bytearray()
    for r in range(rows):
        y = HEIGHT - (r + 0.5) * CELL
        for c in range(cols):
            data.append(0 if occupied((c + 0.5) * CELL, y, boxes) else 254)
    with open(os.path.join(ROOT, "maps", "home.pgm"), "wb") as f:
        f.write(f"P5\n{cols} {rows}\n255\n".encode())
        f.write(bytes(data))
    with open(os.path.join(ROOT, "maps", "home.yaml"), "w", encoding="utf-8") as f:
        f.write("image: home.pgm\nmode: trinary\nresolution: 0.05\norigin: [0.0, 0.0, 0]\nnegate: 0\noccupied_thresh: 0.65\nfree_thresh: 0.25\n")


if __name__ == "__main__":
    write_map()
