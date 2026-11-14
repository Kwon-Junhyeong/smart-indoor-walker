import React, { useEffect, useState } from "react";
import * as ROSLIB from "roslib";

interface OdomState {
  x: number;
  y: number;
  yaw: number;
  vx: number;
  wz: number;
}

interface ImuState {
  yaw: number;
}

const clamp = (v: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v));

const quatToYaw = (q: { x: number; y: number; z: number; w: number }) => {
  const { x, y, z, w } = q;
  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  return Math.atan2(siny_cosp, cosy_cosp);
};

const StatusPanel: React.FC = () => {
  const [connected, setConnected] = useState(false);
  const [odom, setOdom] = useState<OdomState>({
    x: 0,
    y: 0,
    yaw: 0,
    vx: 0,
    wz: 0,
  });
  const [imu, setImu] = useState<ImuState>({ yaw: 0 });

  useEffect(() => {
    const ros = new ROSLIB.Ros({
      url: "ws://10.210.64.159:9090",
    });

    ros.on("connection", () => setConnected(true));
    ros.on("error", () => setConnected(false));
    ros.on("close", () => setConnected(false));

    const odomTopic = new ROSLIB.Topic({
      ros,
      name: "/odom",
      messageType: "nav_msgs/Odometry",
    });

    const imuTopic = new ROSLIB.Topic({
      ros,
      name: "/imu",
      messageType: "sensor_msgs/Imu",
    });

    odomTopic.subscribe((msg: any) => {
      const p = msg.pose.pose.position;
      const q = msg.pose.pose.orientation;
      const yaw = quatToYaw({
        x: q.x ?? 0,
        y: q.y ?? 0,
        z: q.z ?? 0,
        w: q.w ?? 1,
      });

      const twist = msg.twist?.twist || {};
      const vx = twist.linear?.x ?? 0;
      const wz = twist.angular?.z ?? 0;

      setOdom({
        x: p.x ?? 0,
        y: p.y ?? 0,
        yaw,
        vx,
        wz,
      });
    });

    imuTopic.subscribe((msg: any) => {
      const q = msg.orientation || {};
      const yaw = quatToYaw({
        x: q.x ?? 0,
        y: q.y ?? 0,
        z: q.z ?? 0,
        w: q.w ?? 1,
      });
      setImu({ yaw });
    });

    return () => {
      try {
        odomTopic.unsubscribe();
      } catch {}
      try {
        imuTopic.unsubscribe();
      } catch {}
      try {
        ros.close();
      } catch {}
    };
  }, []);

  const yawDeg = (odom.yaw * 180) / Math.PI;
  const imuYawDeg = (imu.yaw * 180) / Math.PI;

  const rangeM = 2.0;
  const scale = 26;

  const cx = 80;
  const cy = 60;

  const px = cx + clamp(odom.x, -rangeM, rangeM) * scale;
  const py = cy - clamp(odom.y, -rangeM, rangeM) * scale;

  const arrowLen = 24;
  const ax = px;
  const ay = py;
  const ex = ax + arrowLen * Math.cos(odom.yaw);
  const ey = ay - arrowLen * Math.sin(odom.yaw);

  const imuCx = 35;
  const imuCy = 35;
  const imuLen = 18;
  const imuEx = imuCx + imuLen * Math.cos(imu.yaw);
  const imuEy = imuCy - imuLen * Math.sin(imu.yaw);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 6,
          fontSize: 11,
        }}
      >
        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            backgroundColor: connected ? "#dcfce7" : "#fee2e2",
            color: connected ? "#16a34a" : "#b91c1c",
            border: `1px solid ${
              connected ? "rgba(22,163,74,0.3)" : "rgba(185,28,28,0.3)"
            }`,
          }}
        >
          {connected ? "ROS" : "ROS offline"}
        </span>

        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            backgroundColor: "#eff6ff",
            color: "#1d4ed8",
            border: "1px solid rgba(37,99,235,0.3)",
          }}
        >
          v {odom.vx.toFixed(2)} m/s
        </span>

        <span
          style={{
            padding: "4px 10px",
            borderRadius: 999,
            backgroundColor: "#fefce8",
            color: "#a16207",
            border: "1px solid rgba(202,138,4,0.3)",
          }}
        >
          yaw {yawDeg.toFixed(0)}°
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2.1fr 1.0fr",
          gap: 10,
          alignItems: "center",
        }}
      >
        <div
          style={{
            borderRadius: 14,
            backgroundColor: "#0f172a",
            border: "1px solid rgba(148,163,184,0.6)",
            padding: 8,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#e5e7eb",
              marginBottom: 4,
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>/odom</span>
            <span>
              X {odom.x.toFixed(2)} | Y {odom.y.toFixed(2)}
            </span>
          </div>

          <svg
            viewBox="0 0 160 120"
            style={{
              width: "100%",
              height: 90,
              display: "block",
              borderRadius: 10,
            }}
          >
            <line
              x1={cx - rangeM * scale}
              y1={cy}
              x2={cx + rangeM * scale}
              y2={cy}
              stroke="#64748b"
              strokeWidth={1}
              strokeDasharray="4 4"
            />
            <line
              x1={cx}
              y1={cy - rangeM * scale}
              x2={cx}
              y2={cy + rangeM * scale}
              stroke="#64748b"
              strokeWidth={1}
              strokeDasharray="4 4"
            />

            <circle
              cx={cx}
              cy={cy}
              r={rangeM * scale}
              fill="none"
              stroke="rgba(148,163,184,0.4)"
              strokeWidth={1}
            />

            <circle
              cx={px}
              cy={py}
              r={7}
              fill="#38bdf8"
              stroke="#e5e7eb"
              strokeWidth={1.5}
            />

            <line
              x1={ax}
              y1={ay}
              x2={ex}
              y2={ey}
              stroke="#facc15"
              strokeWidth={3}
              strokeLinecap="round"
            />

            <polygon
              points={`
                ${ex},${ey}
                ${ex - 6},${ey + 4}
                ${ex - 6},${ey - 4}
              `}
              fill="#facc15"
            />

            <text
              x={cx + rangeM * scale + 4}
              y={cy + 4}
              fontSize={9}
              fill="#e5e7eb"
            >
              X
            </text>
            <text
              x={cx + 4}
              y={cy - rangeM * scale - 4}
              fontSize={9}
              fill="#e5e7eb"
            >
              Y
            </text>
          </svg>
        </div>

        <div
          style={{
            borderRadius: 14,
            backgroundColor: "#020617",
            border: "1px solid rgba(59,130,246,0.8)",
            padding: 8,
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#cbd5f5",
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            <span>/imu</span>
            <span>{imuYawDeg.toFixed(0)}°</span>
          </div>

          <svg
            viewBox="0 0 70 70"
            style={{
              width: "100%",
              height: 70,
              display: "block",
            }}
          >
            <circle
              cx={imuCx}
              cy={imuCy}
              r={24}
              fill="none"
              stroke="rgba(148,163,184,0.6)"
              strokeWidth={2}
            />
            <circle
              cx={imuCx}
              cy={imuCy}
              r={16}
              fill="none"
              stroke="rgba(37,99,235,0.8)"
              strokeWidth={3}
            />
            <line
              x1={imuCx}
              y1={imuCy}
              x2={imuEx}
              y2={imuEy}
              stroke="#22c55e"
              strokeWidth={3}
              strokeLinecap="round"
            />
            <polygon
              points={`
                ${imuEx},${imuEy}
                ${imuEx - 4},${imuEy + 4}
                ${imuEx + 4},${imuEy + 4}
              `}
              fill="#22c55e"
            />
          </svg>
        </div>
      </div>
    </div>
  );
};

export default StatusPanel;
