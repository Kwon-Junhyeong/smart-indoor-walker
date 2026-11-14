import React, { useEffect, useRef, useState } from "react";
import * as ROSLIB from "roslib";

const ROSLIB_ANY = ROSLIB as any;

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

const SlamMap: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [ros, setRos] = useState<any | null>(null);
  const [connected, setConnected] = useState(false);
  const [mapMsg, setMapMsg] = useState<MapMessage | null>(null);

  useEffect(() => {
    const host = window.location.hostname || "10.210.64.159";

    const rosInstance = new ROSLIB_ANY.Ros({
      url: `ws://${host}:9090`,
    });

    rosInstance.on("connection", () => {
      setConnected(true);
    });

    rosInstance.on("error", () => {
      setConnected(false);
    });

    rosInstance.on("close", () => {
      setConnected(false);
    });

    setRos(rosInstance);

    return () => {
      rosInstance.close();
    };
  }, []);

  useEffect(() => {
    if (!ros) return;

    const mapTopic = new ROSLIB_ANY.Topic({
      ros,
      name: "/map",
      messageType: "nav_msgs/OccupancyGrid",
    });

    mapTopic.subscribe((msg: any) => {
      const info = msg.info;

      const m: MapMessage = {
        info: {
          width: info.width,
          height: info.height,
          resolution: info.resolution,
          origin: {
            position: {
              x: info.origin.position.x,
              y: info.origin.position.y,
              z: info.origin.position.z,
            },
            orientation: {
              x: info.origin.orientation.x,
              y: info.origin.orientation.y,
              z: info.origin.orientation.z,
              w: info.origin.orientation.w,
            },
          },
        },
        data: Array.from(msg.data),
      };

      setMapMsg(m);
    });

    return () => {
      mapTopic.unsubscribe();
    };
  }, [ros]);

  useEffect(() => {
    if (!mapMsg || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { width, height } = mapMsg.info;
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
    ctx.restore();
  }, [mapMsg]);

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
          style={{
            width: "100%",
            height: "100%",
            imageRendering: "pixelated",
            backgroundColor: "#f9fafb",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 12,
            bottom: 12,
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
          {connected ? "/map (Cartographer)" : "ROS offline"}
        </div>
      </div>
    </div>
  );
};

export default SlamMap;

