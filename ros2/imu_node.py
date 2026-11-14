import rclpy
from adafruit_bno08x import (
    BNO_REPORT_ACCELEROMETER,
    BNO_REPORT_GYROSCOPE,
    BNO_REPORT_ROTATION_VECTOR,
)
from adafruit_bno08x.i2c import BNO08X_I2C
from adafruit_extended_bus import ExtendedI2C as I2C
from geometry_msgs.msg import Quaternion
from rclpy.node import Node
from sensor_msgs.msg import Imu

I2C_BUS = 5
I2C_ADDRESS = 0x4B
LEVEL_OFFSET = Quaternion(x=0.03912, y=0.00781, z=-0.00238, w=0.99920)


def quaternion_inverse(q):
    return Quaternion(x=-q.x, y=-q.y, z=-q.z, w=q.w)


def quaternion_product(q1, q2):
    x1, y1, z1, w1 = q1.x, q1.y, q1.z, q1.w
    x2, y2, z2, w2 = q2.x, q2.y, q2.z, q2.w
    return Quaternion(
        x=w1 * x2 + x1 * w2 + y1 * z2 - z1 * y2,
        y=w1 * y2 - x1 * z2 + y1 * w2 + z1 * x2,
        z=w1 * z2 + x1 * y2 - y1 * x2 + z1 * w2,
        w=w1 * w2 - x1 * x2 - y1 * y2 - z1 * z2,
    )


class BNO085Node(Node):
    def __init__(self):
        super().__init__("imu_node")

        self.publisher_ = self.create_publisher(Imu, "/imu", 10)
        self.offset_inv = quaternion_inverse(LEVEL_OFFSET)

        try:
            self.i2c = I2C(I2C_BUS)
            self.bno = BNO08X_I2C(self.i2c, address=I2C_ADDRESS)
            self.bno.enable_feature(BNO_REPORT_ACCELEROMETER)
            self.bno.enable_feature(BNO_REPORT_GYROSCOPE)
            self.bno.enable_feature(BNO_REPORT_ROTATION_VECTOR)
            self.get_logger().info(f"BNO085 initialized on I2C bus {I2C_BUS}")
        except Exception as e:
            self.get_logger().error(f"failed to initialize BNO085 on I2C bus {I2C_BUS}: {e}")
            raise SystemExit(1)

        self.timer = self.create_timer(0.1, self.timer_callback)

    def timer_callback(self):
        try:
            accel_x, accel_y, accel_z = self.bno.acceleration
            gyro_x, gyro_y, gyro_z = self.bno.gyro
            quat_i, quat_j, quat_k, quat_real = self.bno.quaternion

            measured = Quaternion(x=quat_i, y=quat_j, z=quat_k, w=quat_real)

            msg = Imu()
            msg.header.stamp = self.get_clock().now().to_msg()
            msg.header.frame_id = "imu_link"
            msg.orientation = quaternion_product(measured, self.offset_inv)

            msg.angular_velocity.x = gyro_x
            msg.angular_velocity.y = gyro_y
            msg.angular_velocity.z = gyro_z

            msg.linear_acceleration.x = accel_x
            msg.linear_acceleration.y = accel_y
            msg.linear_acceleration.z = accel_z

            msg.orientation_covariance[0] = 0.0025
            msg.orientation_covariance[4] = 0.0025
            msg.orientation_covariance[8] = 0.001

            self.publisher_.publish(msg)

        except Exception as e:
            self.get_logger().warn(f"sensor read error: {e}")


def main(args=None):
    rclpy.init(args=args)
    node = BNO085Node()
    try:
        rclpy.spin(node)
    except KeyboardInterrupt:
        pass
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
