import heapq
import math
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ros2"))

import home
from local_planner import GOAL_TOLERANCE, ROBOT_RADIUS, normalize_angle, steer
from places import goal_of, load_places

DT = 0.05
BEAMS = 240
MAX_RANGE = 10.0
NOISE = 0.01
ACCEL = 0.8
TURN_ACCEL = 4.0
CARROT = 1.2
ROUTE_CLEARANCE = 0.40
TRIPS = ["toilet", "kitchen", "living room", "bedroom"]


def ray_box(ox, oy, dx, dy, box):
    x0, y0, x1, y1 = box
    t_near, t_far = 0.0, MAX_RANGE
    for o, d, lo, hi in ((ox, dx, x0, x1), (oy, dy, y0, y1)):
        if abs(d) < 1e-12:
            if o < lo or o > hi:
                return None
        else:
            t0, t1 = (lo - o) / d, (hi - o) / d
            if t0 > t1:
                t0, t1 = t1, t0
            t_near, t_far = max(t_near, t0), min(t_far, t1)
            if t_near > t_far:
                return None
    return t_near


def scan(x, y, th, boxes, rng):
    ranges = []
    for i in range(BEAMS):
        a = th - math.pi + i * 2.0 * math.pi / BEAMS
        dx, dy = math.cos(a), math.sin(a)
        nearest = MAX_RANGE
        for box in boxes:
            t = ray_box(x, y, dx, dy, box)
            if t is not None and t < nearest:
                nearest = t
        ranges.append(nearest + rng.gauss(0.0, NOISE))
    return ranges


def clearance(x, y, boxes):
    nearest = float("inf")
    for x0, y0, x1, y1 in boxes:
        nearest = min(nearest, math.hypot(max(x0 - x, 0.0, x - x1), max(y0 - y, 0.0, y - y1)))
    return nearest - ROBOT_RADIUS


def route(start, goal, boxes):
    cell = home.CELL
    cols, rows = int(home.WIDTH / cell), int(home.HEIGHT / cell)

    def free(c):
        x, y = (c[0] + 0.5) * cell, (c[1] + 0.5) * cell
        return 0 <= c[0] < cols and 0 <= c[1] < rows and clearance(x, y, boxes) + ROBOT_RADIUS > ROUTE_CLEARANCE

    s = (int(start[0] / cell), int(start[1] / cell))
    g = (int(goal[0] / cell), int(goal[1] / cell))
    best = {s: 0.0}
    parent = {}
    queue = [(0.0, s)]
    steps = [(1, 0, 1.0), (-1, 0, 1.0), (0, 1, 1.0), (0, -1, 1.0), (1, 1, 1.414), (1, -1, 1.414), (-1, 1, 1.414), (-1, -1, 1.414)]
    while queue:
        _, c = heapq.heappop(queue)
        if c == g:
            path = [c]
            while c in parent:
                c = parent[c]
                path.append(c)
            return [((i + 0.5) * cell, (j + 0.5) * cell) for i, j in path[::-1]]
        for di, dj, w in steps:
            n = (c[0] + di, c[1] + dj)
            if n != g and not free(n):
                continue
            cost = best[c] + w
            if cost < best.get(n, float("inf")):
                best[n] = cost
                parent[n] = c
                heapq.heappush(queue, (cost + math.hypot(g[0] - n[0], g[1] - n[1]), n))
    return None


def main():
    rng = random.Random(0)
    places = load_places(home.PLACES_FILE)
    mapped = home.WALLS + home.FURNITURE
    world = mapped + home.UNMAPPED
    x, y, th = goal_of(places, "bedroom")
    v = w = 0.0
    t = 0.0
    side = 0
    print("t,trip,x,y,theta,v,clearance")
    for trip in TRIPS:
        gx, gy, _ = goal_of(places, trip)
        path = route((x, y), (gx, gy), mapped)
        index = 0
        for _ in range(int(120.0 / DT)):
            while index < len(path) - 1 and math.hypot(path[index][0] - x, path[index][1] - y) < CARROT:
                index += 1
            cx, cy = path[index]
            final = math.hypot(gx - x, gy - y)
            if final < GOAL_TOLERANCE:
                v_cmd, w_cmd = 0.0, 0.0
            else:
                bearing = normalize_angle(math.atan2(cy - y, cx - x) - th)
                distance = max(math.hypot(cx - x, cy - y), GOAL_TOLERANCE + 0.01)
                ranges = scan(x, y, th, world, rng)
                v_cmd, w_cmd, side, _ = steer(ranges, -math.pi, 2.0 * math.pi / BEAMS, bearing, distance, side)
            v += max(-ACCEL * DT, min(ACCEL * DT, v_cmd - v))
            w += max(-TURN_ACCEL * DT, min(TURN_ACCEL * DT, w_cmd - w))
            x += v * math.cos(th) * DT
            y += v * math.sin(th) * DT
            th = normalize_angle(th + w * DT)
            t += DT
            print(f"{t:.2f},{trip},{x:.4f},{y:.4f},{th:.4f},{v:.3f},{clearance(x, y, world):.4f}")
            if final < GOAL_TOLERANCE and abs(v) < 0.01:
                break


if __name__ == "__main__":
    main()
