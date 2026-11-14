import math
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ros2"))

from local_planner import ROBOT_RADIUS, normalize_angle, steer

DT = 0.05
BEAMS = 360
MAX_RANGE = 10.0
NOISE = 0.01
ACCEL = 0.8
TURN_ACCEL = 4.0

WALLS = [(-1.0, -1.5, 9.0, -1.4), (-1.0, 1.4, 9.0, 1.5), (-1.1, -1.5, -1.0, 1.5), (9.0, -1.5, 9.1, 1.5)]
BOXES = [(1.6, -0.30, 2.1, 0.30), (3.6, 0.45, 4.2, 1.4), (5.3, -1.4, 5.9, 0.0)]
START = (0.0, 0.0, 0.0)
GOAL = (7.5, 0.0)


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


def scan(x, y, th, rng):
    ranges = []
    for i in range(BEAMS):
        a = th - math.pi + i * 2.0 * math.pi / BEAMS
        dx, dy = math.cos(a), math.sin(a)
        nearest = MAX_RANGE
        for box in WALLS + BOXES:
            t = ray_box(x, y, dx, dy, box)
            if t is not None and t < nearest:
                nearest = t
        ranges.append(nearest + rng.gauss(0.0, NOISE))
    return ranges


def clearance(x, y):
    nearest = float("inf")
    for x0, y0, x1, y1 in WALLS + BOXES:
        dx = max(x0 - x, 0.0, x - x1)
        dy = max(y0 - y, 0.0, y - y1)
        nearest = min(nearest, math.hypot(dx, dy))
    return nearest - ROBOT_RADIUS


def main():
    rng = random.Random(0)
    x, y, th = START
    v = w = 0.0
    side = 0
    print("t,x,y,theta,v,w,clearance")
    for k in range(int(60.0 / DT)):
        ranges = scan(x, y, th, rng)
        bearing = normalize_angle(math.atan2(GOAL[1] - y, GOAL[0] - x) - th)
        distance = math.hypot(GOAL[0] - x, GOAL[1] - y)
        v_cmd, w_cmd, side, done = steer(ranges, -math.pi, 2.0 * math.pi / BEAMS, bearing, distance, side)
        v += max(-ACCEL * DT, min(ACCEL * DT, v_cmd - v))
        w += max(-TURN_ACCEL * DT, min(TURN_ACCEL * DT, w_cmd - w))
        x += v * math.cos(th) * DT
        y += v * math.sin(th) * DT
        th = normalize_angle(th + w * DT)
        print(f"{k * DT:.2f},{x:.4f},{y:.4f},{th:.4f},{v:.3f},{w:.3f},{clearance(x, y):.4f}")
        if done and abs(v) < 0.01:
            break


if __name__ == "__main__":
    main()
