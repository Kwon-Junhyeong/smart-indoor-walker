import math


def load_places(path):
    places = {}
    current = None
    with open(path, encoding="utf-8") as f:
        for raw in f:
            line = raw.split("#")[0].rstrip()
            if not line.strip():
                continue
            if not line.startswith(" "):
                current = line.strip().rstrip(":")
                places[current] = {}
            else:
                key, value = line.strip().split(":", 1)
                places[current][key.strip()] = [float(v) for v in value.strip().strip("[]").split(",")]
    return places


def place_at(places, x, y):
    for name, place in places.items():
        x0, y0, x1, y1 = place["area"]
        if x0 <= x <= x1 and y0 <= y <= y1:
            return name
    return None


def goal_of(places, name):
    x, y, yaw_deg = places[name]["goal"]
    return x, y, math.radians(yaw_deg)
