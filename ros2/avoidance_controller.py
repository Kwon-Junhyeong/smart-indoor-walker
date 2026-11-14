#!/usr/bin/env python3
import math

import rclpy
from geometry_msgs.msg import Twist
from nav_msgs.msg import Odometry
from rclpy.node import Node
from sensor_msgs.msg import LaserScan
from std_msgs.msg import String

from local_planner import normalize_angle, steer


def yaw_from_quaternion(q) -> float:
    siny_cosp = 2.0 * (q.w * q.z + q.x * q.y)
    cosy_cosp = 1.0 - 2.0 * (q.y * q.y + q.z * q.z)
    return math.atan2(siny_cosp, cosy_cosp)


class AvoidanceController(Node):
    def __init__(self):
        super().__init__("avoidance_controller")

        self.declare_parameter("target_distance", 5.0)
        self.target_distance = self.get_parameter("target_distance").get_parameter_value().double_value

        self.cmd_pub = self.create_publisher(Twist, "cmd_vel", 10)
        self.sub_odom = self.create_subscription(Odometry, "odom", self.odom_callback, 10)
        self.sub_scan = self.create_subscription(LaserScan, "scan", self.scan_callback, 10)
        self.sub_cmd = self.create_subscription(String, "avoidance_cmd", self.command_callback, 10)

        self.pose = None
        self.scan = None
        self.scan_time = None
        self.goal = None
        self.side = 0
        self.enabled = False

        self.timer = self.create_timer(0.05, self.control_loop)
        self.get_logger().info(f"waiting for start, goal {self.target_distance} m ahead")

    def command_callback(self, msg: String):
        cmd = msg.data.strip().lower()
        if cmd == "start":
            self.enabled = True
            self.goal = None
            self.side = 0
            self.get_logger().info("start")
        elif cmd == "stop":
            self.enabled = False
            self.publish(0.0, 0.0)
            self.get_logger().info("stop")
        else:
            self.get_logger().warn(f"unknown command: '{msg.data}'")

    def odom_callback(self, msg: Odometry):
        p = msg.pose.pose
        self.pose = (p.position.x, p.position.y, yaw_from_quaternion(p.orientation))

    def scan_callback(self, msg: LaserScan):
        ranges = []
        for r in msg.ranges:
            if math.isnan(r) or r < msg.range_min:
                ranges.append(float("nan"))
            elif r > msg.range_max:
                ranges.append(float("inf"))
            else:
                ranges.append(r)
        self.scan = (ranges, msg.angle_min, msg.angle_increment)
        self.scan_time = self.get_clock().now()

    def control_loop(self):
        if not self.enabled or self.pose is None or self.scan is None:
            return

        if (self.get_clock().now() - self.scan_time).nanoseconds > 0.5e9:
            self.publish(0.0, 0.0)
            return

        x, y, yaw = self.pose
        if self.goal is None:
            self.goal = (x + self.target_distance * math.cos(yaw), y + self.target_distance * math.sin(yaw))

        bearing = normalize_angle(math.atan2(self.goal[1] - y, self.goal[0] - x) - yaw)
        distance = math.hypot(self.goal[0] - x, self.goal[1] - y)
        ranges, angle_min, angle_increment = self.scan
        linear, angular, self.side, done = steer(ranges, angle_min, angle_increment, bearing, distance, self.side)

        self.publish(linear, angular)
        if done:
            self.enabled = False
            self.get_logger().info("goal reached")

    def publish(self, linear, angular):
        msg = Twist()
        msg.linear.x = float(linear)
        msg.angular.z = float(angular)
        self.cmd_pub.publish(msg)

    def destroy_node(self):
        try:
            self.publish(0.0, 0.0)
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
