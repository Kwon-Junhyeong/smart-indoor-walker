import math

WHEEL_RADIUS = 0.038
WHEEL_SEPARATION = 0.45
ENCODER_PPR = 1100.0
LEFT_ENC_BIAS = 1.0508
RIGHT_ENC_BIAS = 1.0
PWM_GAIN_LEFT = 380.0
PWM_GAIN_RIGHT = 480.0
PWM_MAX = 255


def twist_to_pwm(linear, angular):
    v_left = linear - angular * WHEEL_SEPARATION / 2.0
    v_right = linear + angular * WHEEL_SEPARATION / 2.0
    pwm_left = max(min(int(v_left * PWM_GAIN_LEFT), PWM_MAX), -PWM_MAX)
    pwm_right = max(min(-int(v_right * PWM_GAIN_RIGHT), PWM_MAX), -PWM_MAX)
    return pwm_left, pwm_right


class WheelOdometry:
    def __init__(self, left_bias=LEFT_ENC_BIAS, right_bias=RIGHT_ENC_BIAS):
        self.left_bias = left_bias
        self.right_bias = right_bias
        self.x = 0.0
        self.y = 0.0
        self.th = 0.0
        self.prev_left = None
        self.prev_right = None

    def update(self, left_count, right_count):
        if self.prev_left is None:
            self.prev_left = left_count
            self.prev_right = right_count
            return False

        delta_left = left_count - self.prev_left
        delta_right = right_count - self.prev_right
        self.prev_left = left_count
        self.prev_right = right_count

        dist_per_tick = (2.0 * math.pi * WHEEL_RADIUS) / ENCODER_PPR
        d_left = delta_left * dist_per_tick * self.left_bias
        d_right = delta_right * dist_per_tick * self.right_bias

        d_center = (d_left + d_right) / 2.0
        d_theta = (d_right - d_left) / WHEEL_SEPARATION

        self.x += d_center * math.cos(self.th)
        self.y += d_center * math.sin(self.th)
        self.th += d_theta
        return True
