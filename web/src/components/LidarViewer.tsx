import React, { useEffect, useRef, useState } from "react";
import * as ROSLIB from "roslib";

type ScanMeta = {
  frame_id: string;
  points: number;
  range_min: number;
  range_max: number;
};

const LidarViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [meta, setMeta] = useState<ScanMeta | null>(null);
  const [status, setStatus] = useState<"idle" | "ok" | "error">("idle");

  useEffect(() => {
    const host = window.location.hostname || "10.210.64.159";
    const ros = new (ROSLIB as any).Ros({
      url: `ws://${host}:9090`,
    });

    ros.on("connection", () => setStatus("ok"));
    ros.on("error", () => setStatus("error"));
    ros.on("close", () => setStatus("error"));

    const scanTopic = new (ROSLIB as any).Topic({
      ros,
      name: "/scan",
      messageType: "sensor_msgs/msg/LaserScan",
    });

    const handleScan = (msg: any) => {
      drawScan(msg);
      setMeta({
        frame_id: msg.header?.frame_id || "",
        points: msg.ranges?.length || 0,
        range_min: msg.range_min ?? 0,
        range_max: msg.range_max ?? 0,
      });
    };

    scanTopic.subscribe(handleScan);

    return () => {
      try {
        scanTopic.unsubscribe();
        ros.close();
      } catch {
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const drawScan = (msg: any) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = "#020617";
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(0.5, 0.5, width - 1, height - 1);

    const cx = width / 2;
    const cy = height / 2;

    ctx.strokeStyle = "#1e293b";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, height);
    ctx.moveTo(0, cy);
    ctx.lineTo(width, cy);
    ctx.stroke();

    const ranges: number[] = msg.ranges || [];
    const angle_min: number = msg.angle_min || -Math.PI;
    const angle_inc: number = msg.angle_increment || 0.0;
    const range_min: number = msg.range_min || 0.0;
    const range_max: number = msg.range_max || 50.0;

    const viewRange = 8.0;

    const maxView = Math.min(viewRange, range_max || viewRange);
    const scale = (Math.min(width, height) * 0.45) / maxView;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(1, -1);

    ctx.fillStyle = "#22c55e";

    for (let i = 0; i < ranges.length; i++) {
      const r = ranges[i];
      if (!Number.isFinite(r)) continue;
      if (r < range_min || r > maxView) continue;

      const angle = angle_min + i * angle_inc;
      const x = r * Math.cos(angle);
      const y = r * Math.sin(angle);

      const px = x * scale;
      const py = y * scale;

      ctx.beginPath();
      ctx.arc(px, py, 1.8, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "#e5e7eb";
    ctx.beginPath();
    ctx.arc(0, 0, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  };

  const statusColor =
    status === "ok" ? "#4ade80" : status === "error" ? "#f97316" : "#9ca3af";

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          marginBottom: 8,
          fontSize: 11,
          color: "#9ca3af",
        }}
      >
        <div style={{ display: "flex", gap: 12 }}>
          <span>
            frame:{" "}
            <span style={{ color: "#e5e7eb" }}>{meta?.frame_id || "-"}</span>
          </span>
          <span>
            points:{" "}
            <span style={{ color: "#e5e7eb" }}>{meta?.points ?? 0}</span>
          </span>
          <span>
            range:{" "}
            <span style={{ color: "#e5e7eb" }}>
              {meta
                ? `${meta.range_min.toFixed(1)}-${meta.range_max.toFixed(1)} m`
                : "-"}
            </span>
          </span>
        </div>

        <span style={{ color: statusColor }}>
          ● {status === "ok" ? "scan" : status === "error" ? "error" : "idle"}
        </span>
      </div>

      <div
        style={{
          width: "100%",
          maxWidth: 640,
          borderRadius: 14,
          overflow: "hidden",
        }}
      >
        <canvas
          ref={canvasRef}
          width={640}
          height={640}
          style={{
            width: "100%",
            display: "block",
          }}
        />
      </div>
    </div>
  );
};

export default LidarViewer;
