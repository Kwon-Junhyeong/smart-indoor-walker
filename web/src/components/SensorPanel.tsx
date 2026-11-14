import React, { useEffect, useState } from "react";
import * as ROSLIB from "roslib";

type OdomState = {
  x: number;
  y: number;
  yawDeg: number;
};

type ImuState = {
  rollDeg: number;
  pitchDeg: number;
};

const SensorPanel: React.FC = () => {
  const [odom, setOdom] = useState<OdomState | null>(null);
  const [imu, setImu] = useState<ImuState | null>(null);

  useEffect(() => {
    const ros = new ROSLIB.Ros({
      url: "ws://10.210.64.159:9090",
    });

    ros.on("error", () => {
      setOdom(null);
      setImu(null);
    });

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
      const p = msg.pose?.pose;
      const x = p?.position?.x ?? 0;
      const y = p?.position?.y ?? 0;
      const q = p?.orientation ?? { x: 0, y: 0, z: 0, w: 1 };

      const yaw = quaternionToEuler(q.x, q.y, q.z, q.w).yaw;
      setOdom({
        x,
        y,
        yawDeg: (yaw * 180) / Math.PI,
      });
    });

    imuTopic.subscribe((msg: any) => {
      const q = msg.orientation ?? { x: 0, y: 0, z: 0, w: 1 };
      const e = quaternionToEuler(q.x, q.y, q.z, q.w);
      setImu({
        rollDeg: (e.roll * 180) / Math.PI,
        pitchDeg: (e.pitch * 180) / Math.PI,
      });
    });

    return () => {
      try {
        odomTopic.unsubscribe();
        imuTopic.unsubscribe();
      } catch {}
      try {
        ros.close();
      } catch {}
    };
  }, []);

  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 18,
        padding: 16,
        boxShadow: "0 10px 25px rgba(15, 23, 42, 0.06)",
        border: "1px solid #e5e7eb",
      }}
    >
      <div
        style={{
          marginBottom: 10,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: "#111827",
              marginBottom: 2,
            }}
          >
            Sensors
          </div>
          <div style={{ fontSize: 11, color: "#9ca3af" }}>/odom | /imu</div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
          gap: 10,
        }}
      >
        <div
          style={{
            backgroundColor: "#020617",
            borderRadius: 14,
            padding: 12,
            color: "#e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 11, color: "#9ca3af" }}>/odom</span>
            {odom && (
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                x {odom.x.toFixed(2)} | y {odom.y.toFixed(2)} | yaw{" "}
                {odom.yawDeg.toFixed(1)}°
              </span>
            )}
          </div>

          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "3 / 2",
              borderRadius: 12,
              border: "1px solid rgba(148,163,184,0.6)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 2,
                height: "100%",
                backgroundColor: "rgba(148,163,184,0.3)",
                transform: "translate(-50%, -50%)",
              }}
            />
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: "100%",
                height: 2,
                backgroundColor: "rgba(148,163,184,0.3)",
                transform: "translate(-50%, -50%)",
              }}
            />

            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                width: 10,
                height: 10,
                borderRadius: "50%",
                backgroundColor: "#22c55e",
                transform: "translate(-50%, -50%)",
              }}
            />
          </div>
        </div>

        <div
          style={{
            backgroundColor: "#020617",
            borderRadius: 14,
            padding: 12,
            color: "#e5e7eb",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 11, color: "#9ca3af" }}>/imu</span>
            {imu && (
              <span style={{ fontSize: 11, color: "#9ca3af" }}>
                roll {imu.rollDeg.toFixed(1)}° | pitch {imu.pitchDeg.toFixed(1)}°
              </span>
            )}
          </div>

          <div
            style={{
              position: "relative",
              width: "100%",
              aspectRatio: "1 / 1",
              borderRadius: "50%",
              border: "1px solid rgba(148,163,184,0.6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: "70%",
                height: 2,
                backgroundColor: "#22c55e",
                transform: imu
                  ? `rotate(${imu.rollDeg}deg)`
                  : "rotate(0deg)",
                transformOrigin: "50% 50%",
                transition: "transform 0.1s linear",
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

function quaternionToEuler(x: number, y: number, z: number, w: number) {
  const sinr_cosp = 2 * (w * x + y * z);
  const cosr_cosp = 1 - 2 * (x * x + y * y);
  const roll = Math.atan2(sinr_cosp, cosr_cosp);

  const sinp = 2 * (w * y - z * x);
  let pitch: number;
  if (Math.abs(sinp) >= 1) {
    pitch = Math.sign(sinp) * (Math.PI / 2);
  } else {
    pitch = Math.asin(sinp);
  }

  const siny_cosp = 2 * (w * z + x * y);
  const cosy_cosp = 1 - 2 * (y * y + z * z);
  const yaw = Math.atan2(siny_cosp, cosy_cosp);

  return { roll, pitch, yaw };
}

export default SensorPanel;
