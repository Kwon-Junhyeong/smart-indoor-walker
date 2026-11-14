#!/usr/bin/env python3
import math

import rclpy
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry
from rclpy.node import Node
from sensor_msgs.msg import Imu, LaserScan
from std_msgs.msg import String


def normalize_angle(angle: float) -> float:
    while angle > math.pi:
        angle -= 2.0 * math.pi
    while angle < -math.pi:
        angle += 2.0 * math.pi
    return angle


def yaw_from_quaternion(q) -> float:
    siny_cosp = 2.0 * (q.w * q.z + q.x * q.y)
    cosy_cosp = 1.0 - 2.0 * (q.y * q.y + q.z * q.z)
    return math.atan2(siny_cosp, cosy_cosp)


class AvoidanceController(Node):
    def __init__(self):
        super().__init__("avoidance_controller")

        self.target_distance = self.param("target_distance", 5.0)
        self.forward_speed = self.param("forward_speed", 0.4)
        self.turn_speed = self.param("turn_speed", 1.2)
        self.obstacle_distance = self.param("obstacle_distance", 0.7)
        self.left_turn_angle = math.radians(self.param("left_turn_deg", 90.0))
        self.right_turn_angle = math.radians(self.param("right_turn_deg", 92.0))
        self.straight1_distance = self.param("straight1_distance", 0.5)
        self.straight2_distance = self.param("straight2_distance", 1.5)
        self.straight3_distance = self.param("straight3_distance", 0.6)
        self.straight4_distance = self.param("straight4_distance", 0.7)
        self.yaw_tolerance = math.radians(self.param("yaw_tolerance_deg", 5.0))
        self.front_min_deg = self.param("front_min_deg", -30.0)
        self.front_max_deg = self.param("front_max_deg", 30.0)

        self.cmd_pub = self.create_publisher(Twist, "cmd_vel", 10)
        self.sub_odom = self.create_subscription(Odometry, "odom", self.odom_callback, 10)
        self.sub_scan = self.create_subscription(LaserScan, "scan", self.scan_callback, 10)
        self.sub_imu = self.create_subscription(Imu, "/imu", self.imu_callback, 10)
        self.sub_cmd = self.create_subscription(String, "avoidance_cmd", self.avoidance_cmd_callback, 10)

        self.state = "IDLE"

        self.current_x = None
        self.current_y = None
        self.current_yaw = None
        self.min_front = None

        self.x_start = None
        self.y_start = None
        self.x_goal = None

        self.yaw_ref = None
        self.yaw_L1 = None
        self.yaw_R2 = None
        self.yaw_R3 = None
        self.yaw_L4 = None

        self.st1_start = None
        self.st2_start = None
        self.st3_start = None
        self.st4_start = None

        self.enabled = False
        self.started = False

        self.timer = self.create_timer(0.02, self.control_loop)

        self.get_logger().info(
            f"waiting for start: forward {self.forward_speed} m/s, turn {self.turn_speed} rad/s, "
            f"obstacle distance {self.obstacle_distance} m"
        )

    def param(self, name, default):
        self.declare_parameter(name, default)
        return self.get_parameter(name).get_parameter_value().double_value

    def avoidance_cmd_callback(self, msg: String):
        cmd = msg.data.strip().lower()
        if cmd == "start":
            self.enabled = True
            self.started = False
            self.state = "INIT"
            self.get_logger().info("sequence start")
        elif cmd == "stop":
            self.enabled = False
            self.started = False
            self.state = "IDLE"
            self.publish_stop()
            self.get_logger().info("sequence stop")
        else:
            self.get_logger().warn(f"unknown command: '{msg.data}'")

    def odom_callback(self, msg: Odometry):
        self.current_x = msg.pose.pose.position.x
        self.current_y = msg.pose.pose.position.y
        if self.current_yaw is None:
            self.current_yaw = yaw_from_quaternion(msg.pose.pose.orientation)

    def imu_callback(self, msg: Imu):
        self.current_yaw = yaw_from_quaternion(msg.orientation)

    def scan_callback(self, msg: LaserScan):
        n = len(msg.ranges)
        idx_min = int((math.radians(self.front_min_deg) - msg.angle_min) / msg.angle_increment)
        idx_max = int((math.radians(self.front_max_deg) - msg.angle_min) / msg.angle_increment)
        idx_min = max(0, min(n - 1, idx_min))
        idx_max = max(0, min(n - 1, idx_max))
        if idx_max < idx_min:
            idx_min, idx_max = idx_max, idx_min

        min_front = None
        for i in range(idx_min, idx_max + 1):
            r = msg.ranges[i]
            if math.isinf(r) or math.isnan(r):
                continue
            if r < msg.range_min or r > msg.range_max:
                continue
            if min_front is None or r < min_front:
                min_front = r

        self.min_front = min_front

    def control_loop(self):
        if self.current_x is None or self.current_y is None or self.current_yaw is None or self.min_front is None:
            self.publish_stop()
            return

        if not self.enabled:
            return

        if not self.started:
            self.x_start = self.current_x
            self.y_start = self.current_y
            self.x_goal = self.x_start + self.target_distance if self.target_distance > 0.0 else None
            self.state = "FORWARD"
            self.started = True
            self.get_logger().info(f"start point x={self.x_start:.3f}")

        if self.state == "DONE":
            self.publish_stop()
            self.enabled = False
            return

        if self.state == "FORWARD":
            self.handle_forward()
        elif self.state == "TURN_L1":
            self.handle_turn(self.yaw_L1, "STRAIGHT1", "TURN_L1")
        elif self.state == "STRAIGHT1":
            self.handle_straight("st1_start", self.straight1_distance, "TURN_R2", "STRAIGHT1")
        elif self.state == "TURN_R2":
            self.handle_turn(self.yaw_R2, "STRAIGHT2", "TURN_R2")
        elif self.state == "STRAIGHT2":
            self.handle_straight("st2_start", self.straight2_distance, "TURN_R3", "STRAIGHT2")
        elif self.state == "TURN_R3":
            self.handle_turn(self.yaw_R3, "STRAIGHT3", "TURN_R3")
        elif self.state == "STRAIGHT3":
            self.handle_straight("st3_start", self.straight3_distance, "TURN_L4", "STRAIGHT3")
        elif self.state == "TURN_L4":
            self.handle_turn(self.yaw_L4, "STRAIGHT4", "TURN_L4")
        elif self.state == "STRAIGHT4":
            self.handle_straight("st4_start", self.straight4_distance, "DONE", "STRAIGHT4")
        else:
            self.publish_stop()

    def handle_forward(self):
        if self.x_goal is not None and self.current_x >= self.x_goal:
            self.publish_stop()
            self.state = "DONE"
            self.get_logger().info(f"[FORWARD] goal reached at x={self.current_x:.3f}")
            return

        if self.min_front is not None and self.min_front < self.obstacle_distance:
            self.publish_stop()
            self.yaw_ref = self.current_yaw
            self.yaw_L1 = normalize_angle(self.yaw_ref + self.left_turn_angle)
            self.yaw_R2 = self.yaw_ref
            self.yaw_R3 = normalize_angle(self.yaw_ref - self.right_turn_angle)
            self.yaw_L4 = self.yaw_ref

            self.st1_start = None
            self.st2_start = None
            self.st3_start = None
            self.st4_start = None

            self.state = "TURN_L1"
            self.get_logger().info(
                f"[FORWARD] obstacle at {self.min_front:.2f} m, closer than {self.obstacle_distance:.2f} m"
            )
            return

        self.publish_cmd(self.forward_speed, 0.0)

    def handle_turn(self, target_yaw, next_state, label):
        if target_yaw is None:
            self.publish_stop()
            return

        error = normalize_angle(target_yaw - self.current_yaw)

        if abs(error) < self.yaw_tolerance:
            self.publish_stop()
            self.state = next_state
            self.get_logger().info(f"[{label}] turn done, yaw {self.current_yaw:.3f} rad, error {error:.3f} rad")
            return

        self.publish_cmd(0.0, self.turn_speed if error > 0.0 else -self.turn_speed)

    def handle_straight(self, start_attr, target_distance, next_state, label):
        start = getattr(self, start_attr)
        if start is None:
            start = (self.current_x, self.current_y)
            setattr(self, start_attr, start)

        dist = math.hypot(self.current_x - start[0], self.current_y - start[1])

        if dist >= target_distance:
            self.publish_stop()
            self.state = next_state
            self.get_logger().info(f"[{label}] straight done, {dist:.3f} m")
            return

        self.publish_cmd(self.forward_speed, 0.0)

    def publish_cmd(self, linear_x, angular_z):
        msg = Twist()
        msg.linear.x = float(linear_x)
        msg.angular.z = float(angular_z)
        self.cmd_pub.publish(msg)

    def publish_stop(self):
        self.publish_cmd(0.0, 0.0)

    def destroy_node(self):
        try:
            self.publish_stop()
        except Exception:
            pass
        super().destroy_node()


def main(args=None):
    rclpy.init(args=args)
    node = AvoidanceController()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
