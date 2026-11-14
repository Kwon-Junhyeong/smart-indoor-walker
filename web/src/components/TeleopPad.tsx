import React, { useEffect, useRef, useState } from "react";
import * as ROSLIB from "roslib";

type Mode = "stop" | "forward" | "back" | "left" | "right";

const TeleopPad: React.FC = () => {
  const rosRef = useRef<ROSLIB.Ros | null>(null);
  const cmdVelRef = useRef<ROSLIB.Topic | null>(null);
  const [connected, setConnected] = useState(false);
  const [mode, setMode] = useState<Mode>("stop");

  useEffect(() => {
    const ros = new ROSLIB.Ros({
      url: "ws://10.210.64.159:9090",
    });
    rosRef.current = ros;

    ros.on("connection", () => setConnected(true));
    ros.on("close", () => setConnected(false));
    ros.on("error", () => setConnected(false));

    const cmdVel = new ROSLIB.Topic({
      ros,
      name: "/cmd_vel",
      messageType: "geometry_msgs/Twist",
    });
    cmdVelRef.current = cmdVel;

    return () => {
      try {
        cmdVel.publish({
          linear: { x: 0, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: 0 },
        } as any);
      } catch {}
      try {
        cmdVel.unsubscribe();
      } catch {}
      try {
        ros.close();
      } catch {}
    };
  }, []);

  const publishCmd = (linearX: number, angularZ: number) => {
    if (!cmdVelRef.current) return;
    const msg = {
      linear: { x: linearX, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angularZ },
    };
    try {
      cmdVelRef.current.publish(msg as any);
    } catch {}
  };

  useEffect(() => {
    const id = setInterval(() => {
      let linearX = 0;
      let angularZ = 0;

      if (mode === "forward") {
        linearX = 0.50;
      } else if (mode === "back") {
        linearX = -0.44;
      } else if (mode === "left") {
        angularZ = 1.2;
      } else if (mode === "right") {
        angularZ = -1.2;
      }

      publishCmd(linearX, angularZ);
    }, 100);

    return () => clearInterval(id);
  }, [mode]);

  const statusColor = connected ? "#22c55e" : "#9ca3af";

  const btnBase: React.CSSProperties = {
    padding: "10px 0",
    borderRadius: 999,
    border: "none",
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    userSelect: "none",
  };

  const isActive = (m: Mode) => mode === m;

  const primaryBg = (active: boolean) =>
    active
      ? "linear-gradient(135deg,#2563eb,#1d4ed8)"
      : "linear-gradient(135deg,#60a5fa,#2563eb)";

  const turnBg = (active: boolean) =>
    active ? "#d1d5db" : "#e5e7eb";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 8,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 11,
          color: "#6b7280",
        }}
      >
        <span>/cmd_vel</span>
        <span
          style={{
            padding: "2px 8px",
            borderRadius: 999,
            backgroundColor: "#f3f4ff",
            color: statusColor,
            border: `1px solid ${statusColor}20`,
          }}
        >
          {connected ? "Connected" : "Waiting"}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}
      >
        <div />
        <button
          type="button"
          onClick={() => setMode("forward")}
          style={{
            ...btnBase,
            background: primaryBg(isActive("forward")),
            color: "#f9fafb",
          }}
        >
          Fwd
        </button>
        <div />

        <button
          type="button"
          onClick={() => setMode("left")}
          style={{
            ...btnBase,
            backgroundColor: turnBg(isActive("left")),
            color: "#111827",
            fontWeight: 600,
          }}
        >
          Left
        </button>
        <button
          type="button"
          onClick={() => setMode("stop")}
          style={{
            ...btnBase,
            backgroundColor: "#fee2e2",
            color: "#b91c1c",
          }}
        >
          Stop
        </button>
        <button
          type="button"
          onClick={() => setMode("right")}
          style={{
            ...btnBase,
            backgroundColor: turnBg(isActive("right")),
            color: "#111827",
            fontWeight: 600,
          }}
        >
          Right
        </button>

        <div />
        <button
          type="button"
          onClick={() => setMode("back")}
          style={{
            ...btnBase,
            background: primaryBg(isActive("back")),
            color: "#f9fafb",
          }}
        >
          Back
        </button>
        <div />
      </div>
    </div>
  );
};

export default TeleopPad;
