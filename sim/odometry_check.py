import math
import os
import random
import sys

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "ros2"))

from diff_drive import ENCODER_PPR, LEFT_ENC_BIAS, WHEEL_RADIUS, WHEEL_SEPARATION, WheelOdometry

TICK = 2.0 * math.pi * WHEEL_RADIUS / ENCODER_PPR
PERIOD = 0.02
STEPS_PER_PERIOD = 20


def encoder_stream(duration, linear, angular):
    lines = []
    dist_left = 0.0
    dist_right = 0.0
    x = y = th = 0.0
    dt = PERIOD / STEPS_PER_PERIOD
    for k in range(int(round(duration / PERIOD))):
        for i in range(STEPS_PER_PERIOD):
            t = k * PERIOD + i * dt
            v, w = linear(t), angular(t)
            dist_left += (v - w * WHEEL_SEPARATION / 2.0) * dt
            dist_right += (v + w * WHEEL_SEPARATION / 2.0) * dt
            x += v * math.cos(th) * dt
            y += v * math.sin(th) * dt
            th += w * dt
        left_count = int(dist_left / (TICK * LEFT_ENC_BIAS))
        right_count = int(dist_right / TICK)
        lines.append((left_count, right_count, x, y, th))
    return lines


def calibration():
    lines = encoder_stream(12.5, lambda t: 0.4, lambda t: 0.0)
    calibrated = WheelOdometry()
    raw = WheelOdometry(left_bias=1.0)
    print("distance,x_calibrated,y_calibrated,x_raw,y_raw,heading_raw_deg")
    for left, right, x, _, _ in lines:
        calibrated.update(left, right)
        raw.update(left, right)
        print(f"{x:.3f},{calibrated.x:.4f},{calibrated.y:.4f},{raw.x:.4f},{raw.y:.4f},{math.degrees(raw.th):.3f}")


def run_with_loss(lines, loss, rng, cumulative):
    odom = WheelOdometry()
    total_left = total_right = 0
    prev_left = prev_right = 0
    for n, (left, right, _, _, _) in enumerate(lines):
        inc_left, inc_right = left - prev_left, right - prev_right
        prev_left, prev_right = left, right
        if n > 0 and rng.random() < loss:
            continue
        if cumulative:
            odom.update(left, right)
        else:
            total_left += inc_left
            total_right += inc_right
            odom.update(total_left, total_right)
    return odom


def message_loss(trials=200):
    lines = encoder_stream(20.0, lambda t: 0.4, lambda t: 0.5 * math.sin(2.0 * math.pi * t / 8.0))
    reference = run_with_loss(lines, 0.0, random.Random(0), True)
    print("loss_percent,error_cumulative_m,error_increment_m")
    for percent in range(0, 55, 5):
        errors = {True: 0.0, False: 0.0}
        for cumulative in (True, False):
            rng = random.Random(1)
            for _ in range(trials):
                odom = run_with_loss(lines, percent / 100.0, rng, cumulative)
                errors[cumulative] += math.hypot(odom.x - reference.x, odom.y - reference.y)
        print(f"{percent},{errors[True] / trials:.4f},{errors[False] / trials:.4f}")


if __name__ == "__main__":
    mode = sys.argv[1] if len(sys.argv) > 1 else "calibration"
    if mode == "calibration":
        calibration()
    elif mode == "loss":
        message_loss()
    else:
        raise SystemExit("usage: odometry_check.py [calibration|loss]")
