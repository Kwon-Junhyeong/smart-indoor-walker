import heapq
import math

MAX_SPEED = 0.4
MAX_TURN = 1.2
ROBOT_RADIUS = 0.30
MARGIN = 0.30
MARGIN_COST = 4.0
CLOSE_MARGIN = 0.15
CLOSE_COST = 12.0
CELL = 0.05
RANGE = 4.0
LOOKAHEAD = 0.30
SLOW_RANGE = 0.80
TURN_GAIN = 2.0
GOAL_TOLERANCE = 0.20
MIN_VALID_FRACTION = 0.5
SIDE_COST = 2.5

HALF = int(RANGE / CELL)


def disk(radius):
    n = radius / CELL
    m = int(math.ceil(n))
    return [(i, j) for i in range(-m, m + 1) for j in range(-m, m + 1) if i * i + j * j <= n * n]


INFLATE = int(math.ceil((ROBOT_RADIUS + MARGIN) / CELL))
BODY = disk(ROBOT_RADIUS - CELL / 2.0)
NEAR = disk(ROBOT_RADIUS + MARGIN)
CLOSE = disk(ROBOT_RADIUS + CLOSE_MARGIN)
NEIGHBORS = [(1, 0, 1.0), (-1, 0, 1.0), (0, 1, 1.0), (0, -1, 1.0),
             (1, 1, math.sqrt(2.0)), (1, -1, math.sqrt(2.0)), (-1, 1, math.sqrt(2.0)), (-1, -1, math.sqrt(2.0))]


def normalize_angle(angle):
    while angle > math.pi:
        angle -= 2.0 * math.pi
    while angle < -math.pi:
        angle += 2.0 * math.pi
    return angle


def to_cell(x, y):
    return int(round(x / CELL)), int(round(y / CELL))


def inside(cell):
    return -HALF <= cell[0] <= HALF and -HALF <= cell[1] <= HALF


def seen_cells(ranges, angle_min, angle_increment):
    seen = set()
    for i, r in enumerate(ranges):
        if r is None or math.isnan(r):
            continue
        a = angle_min + i * angle_increment
        c, s = math.cos(a), math.sin(a)
        for k in range(int(min(r, RANGE) / CELL) + 1):
            ci, cj = to_cell(k * CELL * c, k * CELL * s)
            seen.update(((ci, cj), (ci + 1, cj), (ci - 1, cj), (ci, cj + 1), (ci, cj - 1)))
    return seen


def blocked_cells(ranges, angle_min, angle_increment):
    blocked = set()
    near = {}
    hits = set()
    for i, r in enumerate(ranges):
        if r is None or math.isinf(r) or math.isnan(r) or r > RANGE:
            continue
        a = angle_min + i * angle_increment
        hits.add(to_cell(r * math.cos(a), r * math.sin(a)))
    for ci, cj in hits:
        for di, dj in BODY:
            blocked.add((ci + di, cj + dj))
        for di, dj in NEAR:
            near.setdefault((ci + di, cj + dj), MARGIN_COST)
        for di, dj in CLOSE:
            near[(ci + di, cj + dj)] = CLOSE_COST
    return blocked, near


def nearest_free(cell, blocked, seen):
    if cell not in blocked and cell in seen:
        return cell
    for radius in range(1, 4 * INFLATE + 1):
        ring = [(cell[0] + i, cell[1] + j) for i in range(-radius, radius + 1) for j in range(-radius, radius + 1)
                if max(abs(i), abs(j)) == radius]
        free = [c for c in ring if inside(c) and c not in blocked and c in seen]
        if free:
            return min(free, key=lambda c: (c[0] - cell[0]) ** 2 + (c[1] - cell[1]) ** 2)
    return None


def find_path(blocked, near, seen, target, side=0, goal_bearing=0.0):
    sin_b, cos_b = math.sin(goal_bearing), math.cos(goal_bearing)
    start = (0, 0)
    blocked = blocked - {start}
    best = {start: 0.0}
    parent = {}
    queue = [(math.hypot(target[0], target[1]), start)]
    while queue:
        _, cell = heapq.heappop(queue)
        if cell == target:
            path = [cell]
            while cell in parent:
                cell = parent[cell]
                path.append(cell)
            return path[::-1]
        for di, dj, step in NEIGHBORS:
            nxt = (cell[0] + di, cell[1] + dj)
            if not inside(nxt) or nxt in blocked or nxt not in seen:
                continue
            weight = near.get(nxt, 1.0)
            if side and (-nxt[0] * sin_b + nxt[1] * cos_b) * side < 0:
                weight *= SIDE_COST
            cost = best[cell] + step * weight
            if cost < best.get(nxt, float("inf")):
                best[nxt] = cost
                parent[nxt] = cell
                heapq.heappush(queue, (cost + math.hypot(target[0] - nxt[0], target[1] - nxt[1]), nxt))
    return None


def plan(ranges, angle_min, angle_increment, goal_bearing, goal_distance, side=0):
    reach = min(goal_distance, RANGE - CELL)
    target = to_cell(reach * math.cos(goal_bearing), reach * math.sin(goal_bearing))
    blocked, near = blocked_cells(ranges, angle_min, angle_increment)
    seen = seen_cells(ranges, angle_min, angle_increment)
    target = nearest_free(target, blocked, seen)
    if target is None:
        return None
    return find_path(blocked, near, seen, target, side, goal_bearing)


def steer(ranges, angle_min, angle_increment, goal_bearing, goal_distance, side=0):
    if goal_distance < GOAL_TOLERANCE:
        return 0.0, 0.0, 0, True

    valid = sum(1 for r in ranges if r is not None and not math.isnan(r))
    if not ranges or valid < MIN_VALID_FRACTION * len(ranges):
        return 0.0, 0.0, side, False

    path = plan(ranges, angle_min, angle_increment, goal_bearing, goal_distance, side)
    if path is None or len(path) < 2:
        return 0.0, 0.0, side, False

    steps = int(LOOKAHEAD / CELL)
    ci, cj = path[min(steps, len(path) - 1)]
    heading = math.atan2(cj, ci)
    nearest = min((r for r in ranges if r is not None and not math.isnan(r)), default=float("inf"))
    slow = max(0.3, min(1.0, (nearest - ROBOT_RADIUS) / (SLOW_RANGE - ROBOT_RADIUS)))
    linear = MAX_SPEED * slow * max(0.0, math.cos(heading)) ** 2
    angular = max(-MAX_TURN, min(MAX_TURN, TURN_GAIN * heading))
    lateral = max((-i * math.sin(goal_bearing) + j * math.cos(goal_bearing) for i, j in path), key=abs)
    if side == 0 and abs(lateral) >= 4:
        side = 1 if lateral > 0 else -1
    elif abs(lateral) < 2:
        side = 0
    return linear, angular, side, False
