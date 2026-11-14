import math

import rclpy
import serial
from geometry_msgs.msg import Quaternion, TransformStamped, Twist
from nav_msgs.msg import Odometry
from rclpy.node import Node
from rclpy.qos import QoSProfile
from std_msgs.msg import Int32
from tf2_ros import TransformBroadcaster

from diff_drive import WheelOdometry, twist_to_pwm


class SerialMotorDriver(Node):
    def __init__(self):
        super().__init__("serial_motor_driver")

        try:
            self.ser = serial.Serial("/dev/ttyACM0", 115200, timeout=0)
            self.get_logger().info("Arduino connected (/dev/ttyACM0)")
        except Exception as e:
            self.get_logger().error(f"Arduino connection failed: {e}")
            raise SystemExit(1)

        qos_cmd = QoSProfile(depth=1)
        self.sub_cmd_vel = self.create_subscription(Twist, "cmd_vel", self.cmd_vel_callback, qos_cmd)
        self.sub_height = self.create_subscription(Int32, "/chair_height_cmd", self.height_cmd_callback, qos_cmd)

        self.pub_odom = self.create_publisher(Odometry, "odom", 10)
        self.tf_broadcaster = TransformBroadcaster(self)

        self.odometry = WheelOdometry()
        self.last_time = self.get_clock().now()

        self.timer = self.create_timer(0.02, self.serial_loop)

    def cmd_vel_callback(self, msg: Twist):
        pwm_left, pwm_right = twist_to_pwm(msg.linear.x, msg.angular.z)
        cmd_str = f"c,{pwm_left},{pwm_right}\n"
        try:
            self.ser.write(cmd_str.encode("utf-8"))
            self.get_logger().info(f"sent: {cmd_str.strip()}")
        except Exception as e:
            self.get_logger().warn(f"send failed: {e}")

    def height_cmd_callback(self, msg: Int32):
        v = msg.data
        if v > 0:
            cmd_str = "u\n"
        elif v < 0:
            cmd_str = "d\n"
        else:
            cmd_str = "s\n"

        try:
            self.ser.write(cmd_str.encode("utf-8"))
            self.get_logger().info(f"actuator command: {cmd_str.strip()}")
        except Exception as e:
            self.get_logger().warn(f"actuator send failed: {e}")

    def serial_loop(self):
        try:
            if self.ser.in_waiting <= 0:
                return

            line = self.ser.readline().decode("utf-8", errors="ignore").strip()
            if not line or not line.startswith("e,"):
                return

            parts = line.split(",")
            if len(parts) < 3:
                return

            if not self.odometry.update(int(parts[1]), int(parts[2])):
                return

            current_time = self.get_clock().now()
            dt = (current_time - self.last_time).nanoseconds / 1e9
            self.last_time = current_time
            if dt <= 0:
                return

            x, y, th = self.odometry.x, self.odometry.y, self.odometry.th
            q = self.euler_to_quaternion(0.0, 0.0, th)

            odom = Odometry()
            odom.header.stamp = current_time.to_msg()
            odom.header.frame_id = "odom"
            odom.child_frame_id = "base_footprint"
            odom.pose.pose.position.x = x
            odom.pose.pose.position.y = y
            odom.pose.pose.orientation = q
            self.pub_odom.publish(odom)

            t = TransformStamped()
            t.header.stamp = current_time.to_msg()
            t.header.frame_id = "odom"
            t.child_frame_id = "base_footprint"
            t.transform.translation.x = x
            t.transform.translation.y = y
            t.transform.translation.z = 0.0
            t.transform.rotation = q
            self.tf_broadcaster.sendTransform(t)

        except Exception:
            return

    def euler_to_quaternion(self, roll, pitch, yaw):
        cr, sr = math.cos(roll / 2), math.sin(roll / 2)
        cp, sp = math.cos(pitch / 2), math.sin(pitch / 2)
        cy, sy = math.cos(yaw / 2), math.sin(yaw / 2)
        qx = sr * cp * cy - cr * sp * sy
        qy = cr * sp * cy + sr * cp * sy
        qz = cr * cp * sy - sr * sp * cy
        qw = cr * cp * cy + sr * sp * sy
        return Quaternion(x=qx, y=qy, z=qz, w=qw)


def main(args=None):
    rclpy.init(args=args)
    node = SerialMotorDriver()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        try:
            node.ser.write(b"c,0,0\n")
            node.ser.write(b"s\n")
        except Exception:
            pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
