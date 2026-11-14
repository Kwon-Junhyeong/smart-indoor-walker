import React, { useEffect, useRef, useState } from "react";
import * as ROSLIB from "roslib";

type NavigationMapProps = {
  onStatusChange?: (status: string) => void;
};

type MapInfo = {
  width: number;
  height: number;
  resolution: number;
  origin: {
    position: { x: number; y: number; z: number };
    orientation: { x: number; y: number; z: number; w: number };
  };
};

type MapMessage = {
  info: MapInfo;
  data: number[];
};

type Pose2D = {
  x: number;
  y: number;
  yaw: number;
};

type ScanPoint = {
  x: number;
  y: number;
};

type Segment = {
  startX: number;
  startY: number;
  goalX: number;
  goalY: number;
};

const NavigationMap: React.FC<NavigationMapProps> = ({ onStatusChange }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const [ros, setRos] = useState<ROSLIB.Ros | null>(null);
  const [connected, setConnected] = useState(false);
  const [mapMsg, setMapMsg] = useState<MapMessage | null>(null);
  const [statusLabel, setStatusLabel] = useState<string>("Idle");

  const [startClick, setStartClick] = useState<{ x: number; y: number } | null>(
    null
  );
  const [lastSegment, setLastSegment] = useState<Segment | null>(null);

  const [scanPoints, setScanPoints] = useState<ScanPoint[]>([]);
  const [robotPose, setRobotPose] = useState<Pose2D | null>(null);
  const robotPoseRef = useRef<Pose2D | null>(null);

  const hasAmclPoseRef = useRef(false);

  const setStatus = (msg: string) => {
    setStatusLabel(msg);
    if (onStatusChange) onStatusChange(msg);
  };

  useEffect(() => {
    const rosInstance = new ROSLIB.Ros({
      url: "ws://10.210.64.159:9090",
    });

    rosInstance.on("connection", () => {
      setConnected(true);
      setStatus("ROS connected");
    });

    rosInstance.on("error", () => {
      setConnected(false);
      setStatus("ROS connection error");
    });

    rosInstance.on("close", () => {
      setConnected(false);
      setStatus("ROS disconnected");
    });

    setRos(rosInstance);

    return () => {
      rosInstance.close();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ros) return;

    const mapTopic = new ROSLIB.Topic({
      ros,
      name: "/map",
      messageType: "nav_msgs/OccupancyGrid",
    });

    mapTopic.subscribe((msg: any) => {
      const m: MapMessage = {
        info: {
          width: msg.info.width,
          height: msg.info.height,
          resolution: msg.info.resolution,
          origin: {
            position: {
              x: msg.info.origin.position.x,
              y: msg.info.origin.position.y,
              z: msg.info.origin.position.z,
            },
            orientation: {
              x: msg.info.origin.orientation.x,
              y: msg.info.origin.orientation.y,
              z: msg.info.origin.orientation.z,
              w: msg.info.origin.orientation.w,
            },
          },
        },
        data: Array.from(msg.data),
      };
      setMapMsg(m);
      setStatus("Receiving /map");
    });

    return () => {
      mapTopic.unsubscribe();
    };
  }, [ros]);

  useEffect(() => {
    if (!ros) return;

    const odomTopic = new ROSLIB.Topic({
      ros,
      name: "/odom",
      messageType: "nav_msgs/Odometry",
    });

    odomTopic.subscribe((msg: any) => {
      if (hasAmclPoseRef.current) return;

      const p = msg.pose.pose;
      const q = p.orientation;

      const siny_cosp = 2.0 * (q.w * q.z + q.x * q.y);
      const cosy_cosp = 1.0 - 2.0 * (q.y * q.y + q.z * q.z);
      const yaw = Math.atan2(siny_cosp, cosy_cosp);

      const pose2d: Pose2D = {
        x: p.position.x,
        y: p.position.y,
        yaw,
      };

      robotPoseRef.current = pose2d;
      setRobotPose(pose2d);
    });

    return () => {
      odomTopic.unsubscribe();
    };
  }, [ros]);

  useEffect(() => {
    if (!ros) return;

    const amclTopic = new ROSLIB.Topic({
      ros,
      name: "/amcl_pose",
      messageType: "geometry_msgs/PoseWithCovarianceStamped",
    });

    amclTopic.subscribe((msg: any) => {
      const p = msg.pose.pose;
      const q = p.orientation;

      const siny_cosp = 2.0 * (q.w * q.z + q.x * q.y);
      const cosy_cosp = 1.0 - 2.0 * (q.y * q.y + q.z * q.z);
      const yaw = Math.atan2(siny_cosp, cosy_cosp);

      const pose2d: Pose2D = {
        x: p.position.x,
        y: p.position.y,
        yaw,
      };

      hasAmclPoseRef.current = true;
      robotPoseRef.current = pose2d;
      setRobotPose(pose2d);
    });

    return () => {
      amclTopic.unsubscribe();
    };
  }, [ros]);

  useEffect(() => {
    if (!ros) return;

    const scanTopic = new ROSLIB.Topic({
      ros,
      name: "/scan",
      messageType: "sensor_msgs/LaserScan",
    });

    scanTopic.subscribe((msg: any) => {
      const pose = robotPoseRef.current ?? { x: 0, y: 0, yaw: 0 };

      const ranges: number[] = msg.ranges || [];
      const angleMin: number = msg.angle_min;
      const angleInc: number = msg.angle_increment;
      const rangeMin: number = msg.range_min;
      const rangeMax: number = msg.range_max;

      const pts: ScanPoint[] = [];

      for (let i = 0; i < ranges.length; i += 2) {
        const r = ranges[i];
        if (!Number.isFinite(r) || r < rangeMin || r > rangeMax) continue;

        const angle = pose.yaw + angleMin + i * angleInc;
        const x = pose.x + r * Math.cos(angle);
        const y = pose.y + r * Math.sin(angle);
        pts.push({ x, y });

        if (pts.length > 800) break;
      }

      setScanPoints(pts);
    });

    return () => {
      scanTopic.unsubscribe();
    };
  }, [ros]);

  useEffect(() => {
    if (!mapMsg || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height, resolution, origin } = mapMsg.info;
    const data = mapMsg.data;

    canvas.width = width;
    canvas.height = height;

    const imageData = ctx.createImageData(width, height);
    const pixels = imageData.data;

    for (let i = 0; i < width * height; i++) {
      const value = data[i];

      let shade = 127;
      if (value === 0) {
        shade = 240;
      } else if (value > 0) {
        shade = 40;
      }

      const idx = i * 4;
      pixels[idx] = shade;
      pixels[idx + 1] = shade;
      pixels[idx + 2] = shade;
      pixels[idx + 3] = 255;
    }

    ctx.save();
    ctx.translate(0, height);
    ctx.scale(1, -1);

    ctx.putImageData(imageData, 0, 0);

    const worldToGrid = (x: number, y: number) => {
      const gx = (x - origin.position.x) / resolution - 0.5;
      const gy = (y - origin.position.y) / resolution - 0.5;
      return { gx, gy };
    };

    if (lastSegment) {
      const { startX, startY, goalX, goalY } = lastSegment;

      const sc = worldToGrid(startX, startY);
      const gc = worldToGrid(goalX, goalY);

      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(sc.gx, sc.gy, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#f97316";
      ctx.beginPath();
      ctx.arc(gc.gx, gc.gy, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "#f97316";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sc.gx, sc.gy);
      ctx.lineTo(gc.gx, gc.gy);
      ctx.stroke();
    }

    if (scanPoints.length > 0) {
      ctx.fillStyle = "#0ea5e9";
      ctx.beginPath();
      for (const p of scanPoints) {
        const { gx, gy } = worldToGrid(p.x, p.y);
        ctx.moveTo(gx + 1, gy);
        ctx.arc(gx, gy, 1.2, 0, Math.PI * 2);
      }
      ctx.fill();
    }

    if (robotPose) {
      const { x, y, yaw } = robotPose;
      const { gx: cx, gy: cy } = worldToGrid(x, y);

      const robotLength = 0.3;
      const robotWidth = 0.3;
      const halfL = (robotLength / resolution) / 2;
      const halfW = (robotWidth / resolution) / 2;

      const auraRadius = Math.max(halfL, halfW) * 2.0;

      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(yaw);

      ctx.fillStyle = "rgba(239, 68, 68, 0.16)";
      ctx.beginPath();
      ctx.arc(0, 0, auraRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.rect(-halfL, -halfW, 2 * halfL, 2 * halfW);
      ctx.fill();

      ctx.fillStyle = "#fee2e2";
      ctx.beginPath();
      ctx.moveTo(halfL, 0);
      ctx.lineTo(halfL - halfL * 0.5, halfW * 0.7);
      ctx.lineTo(halfL - halfL * 0.5, -halfW * 0.7);
      ctx.closePath();
      ctx.fill();

      ctx.restore();
    }

    ctx.restore();
  }, [mapMsg, scanPoints, robotPose, lastSegment]);

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!mapMsg || !canvasRef.current || !ros) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();

    const relX = (event.clientX - rect.left) / rect.width;
    const relY = (event.clientY - rect.top) / rect.height;

    const px = relX * canvas.width;
    const py = relY * canvas.height;

    const cellX = px;
    const cellY = canvas.height - py;

    const { resolution, origin } = mapMsg.info;

    const worldX = origin.position.x + (cellX + 0.5) * resolution;
    const worldY = origin.position.y + (cellY + 0.5) * resolution;

    if (!startClick) {
      setStartClick({ x: worldX, y: worldY });
      setLastSegment(null);
      setStatus(
        `Start set: (${worldX.toFixed(2)}, ${worldY.toFixed(2)})`
      );
      return;
    }

    const start = startClick;
    const goalX = worldX;
    const goalY = worldY;

    const yaw = Math.atan2(goalY - start.y, goalX - start.x);
    const halfYaw = yaw / 2;
    const qz = Math.sin(halfYaw);
    const qw = Math.cos(halfYaw);

    const initialPoseTopic = new ROSLIB.Topic({
      ros,
      name: "/initialpose",
      messageType: "geometry_msgs/PoseWithCovarianceStamped",
    });

    const initialPoseMsg: any = {
      header: {
        frame_id: "map",
        stamp: { sec: 0, nanosec: 0 },
      },
      pose: {
        pose: {
          position: { x: start.x, y: start.y, z: 0 },
          orientation: { x: 0, y: 0, z: qz, w: qw },
        },
        covariance: [
          0.25, 0.0, 0.0, 0.0, 0.0, 0.0,
          0.0, 0.25, 0.0, 0.0, 0.0, 0.0,
          0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
          0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
          0.0, 0.0, 0.0, 0.0, 0.0, 0.0,
          0.0, 0.0, 0.0, 0.0, 0.0, 0.0685389,
        ],
      },
    };

    initialPoseTopic.publish(initialPoseMsg);

    const initialPose2d: Pose2D = { x: start.x, y: start.y, yaw };
    hasAmclPoseRef.current = true;
    robotPoseRef.current = initialPose2d;
    setRobotPose(initialPose2d);

    const goalTopic = new ROSLIB.Topic({
      ros,
      name: "/goal_pose",
      messageType: "geometry_msgs/PoseStamped",
    });

    const goalMsg: any = {
      header: {
        frame_id: "map",
        stamp: { sec: 0, nanosec: 0 },
      },
      pose: {
        position: { x: goalX, y: goalY, z: 0 },
        orientation: { x: 0, y: 0, z: qz, w: qw },
      },
    };

    goalTopic.publish(goalMsg);

    setLastSegment({
      startX: start.x,
      startY: start.y,
      goalX,
      goalY,
    });
    setStartClick(null);

    const yawDeg = (yaw * 180) / Math.PI;
    setStatus(
      `Goal sent: (${goalX.toFixed(2)}, ${goalY.toFixed(
        2
      )}, ${yawDeg.toFixed(1)}°)`
    );
  };

  const handleStop = () => {
    if (!ros) return;

    const stopTopic = new ROSLIB.Topic({
      ros,
      name: "/stop_nav",
      messageType: "std_msgs/Empty",
    });

    const msg: any = {};
    stopTopic.publish(msg);
    setStatus("Stop command sent");
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        backgroundColor: "#020617",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          style={{
            width: "100%",
            height: "100%",
            imageRendering: "pixelated",
            backgroundColor: "#f9fafb",
            cursor: "crosshair",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 16,
            bottom: 16,
            padding: "4px 10px",
            borderRadius: 999,
            backgroundColor: connected ? "#dcfce7" : "#fecaca",
            color: connected ? "#166534" : "#7f1d1d",
            fontSize: 11,
            border: connected
              ? "1px solid #16a34a55"
              : "1px solid #dc262655",
            minWidth: 80,
            textAlign: "center",
          }}
        >
          {connected ? statusLabel : "ROS offline"}
        </div>

        <button
          onClick={handleStop}
          style={{
            position: "absolute",
            right: 18,
            bottom: 18,
            padding: "6px 18px",
            borderRadius: 999,
            border: "none",
            backgroundColor: "#ef4444",
            color: "#f9fafb",
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(220,38,38,0.55)",
          }}
        >
          Stop
        </button>
      </div>
    </div>
  );
};

export default NavigationMap;

