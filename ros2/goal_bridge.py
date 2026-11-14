#!/usr/bin/env python3
import rclpy
from geometry_msgs.msg import PoseStamped, Twist
from nav2_msgs.action import NavigateToPose
from rclpy.action import ActionClient
from rclpy.node import Node
from std_msgs.msg import Empty


class GoalBridge(Node):
    def __init__(self) -> None:
        super().__init__("goal_bridge")

        self._client = ActionClient(self, NavigateToPose, "navigate_to_pose")
        self._last_goal_handle = None

        self._sub_goal = self.create_subscription(PoseStamped, "/goal_pose", self.goal_callback, 10)
        self._sub_stop = self.create_subscription(Empty, "/stop_nav", self.stop_callback, 10)
        self._cmd_pub = self.create_publisher(Twist, "/cmd_vel", 10)

        self.get_logger().info("goal_bridge started, waiting for /goal_pose and /stop_nav")

    def goal_callback(self, msg: PoseStamped) -> None:
        if not self._client.wait_for_server(timeout_sec=1.0):
            self.get_logger().warn("navigate_to_pose action server not available")
            return

        goal = NavigateToPose.Goal()
        goal.pose = msg

        pos = msg.pose.position
        self.get_logger().info(f"received /goal_pose ({pos.x:.2f}, {pos.y:.2f}), sending to Nav2")

        send_future = self._client.send_goal_async(goal)
        send_future.add_done_callback(self.goal_response_callback)

    def goal_response_callback(self, future) -> None:
        goal_handle = future.result()
        if not goal_handle.accepted:
            self.get_logger().warn("goal rejected by Nav2")
            return

        self.get_logger().info("goal accepted by Nav2")
        self._last_goal_handle = goal_handle

        result_future = goal_handle.get_result_async()
        result_future.add_done_callback(self.result_callback)

    def result_callback(self, future) -> None:
        result = future.result()
        self.get_logger().info(f"navigation finished with status {result.status}")
        self._last_goal_handle = None

    def stop_callback(self, msg: Empty) -> None:
        self.get_logger().info("received /stop_nav, cancelling navigation")

        if self._last_goal_handle is not None:
            cancel_future = self._last_goal_handle.cancel_goal_async()
            cancel_future.add_done_callback(self.cancel_done_callback)
        else:
            self.get_logger().info("no active goal to cancel")

        self._cmd_pub.publish(Twist())

    def cancel_done_callback(self, future) -> None:
        try:
            cancel_response = future.result()
            if len(cancel_response.goals_canceling) > 0:
                self.get_logger().info("Nav2 goal cancel requested")
            else:
                self.get_logger().info("no goals were cancelled")
        except Exception as e:
            self.get_logger().warn(f"cancel failed: {e}")


def main(args=None) -> None:
    rclpy.init(args=args)
    node = GoalBridge()
    try:
        rclpy.spin(node)
    finally:
        node.destroy_node()
        rclpy.shutdown()


if __name__ == "__main__":
    main()
