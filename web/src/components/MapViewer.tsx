import React, { useEffect, useRef, useState } from "react";
import * as ROSLIB from "roslib";

interface MapMeta {
  width: number;
  height: number;
  resolution: number;
  origin: { x: number; y: number; z: number };
}

const MapViewer: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mapMeta, setMapMeta] = useState<MapMeta | null>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("-");
  const [zoom, setZoom] = useState(110);
  const mapDataRef = useRef<Int8Array | null>(null);

  useEffect(() => {
    const ros = new ROSLIB.Ros({
      url: "ws://10.210.64.159:9090",
    });

    const mapTopic = new ROSLIB.Topic({
      ros,
      name: "/map",
      messageType: "nav_msgs/OccupancyGrid",
    });

    mapTopic.subscribe((msg: any) => {
      const info = msg.info;
      const data: number[] = msg.data;

      setMapMeta({
        width: info.width,
        height: info.height,
        resolution: info.resolution,
        origin: {
          x: info.origin.position.x,
          y: info.origin.position.y,
          z: info.origin.position.z,
        },
      });

      mapDataRef.current = Int8Array.from(data as number[]);

      const now = new Date();
      const t = now.toTimeString().split(" ")[0];
      setLastUpdate(t);
    });

    return () => {
      try {
        mapTopic.unsubscribe();
      } catch {}
      try {
        ros.close();
      } catch {}
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    if (!mapMeta || !mapDataRef.current) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }

    const { width, height } = mapMeta;
    const data = mapDataRef.current;

    const baseScale = Math.min(canvas.width / width, canvas.height / height);
    const zoomFactor = zoom / 100;
    const cellSize = baseScale * zoomFactor;

    const mapPxWidth = width * cellSize;
    const mapPxHeight = height * cellSize;
    const offsetX = (canvas.width - mapPxWidth) / 2;
    const offsetY = (canvas.height - mapPxHeight) / 2;

    ctx.fillStyle = "#f5f8ff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = y * width + x;
        const v = data[idx];

        let draw = false;
        let color = "#000000";

        if (v === -1) {
          draw = true;
          color = "#d7deee";
        } else if (v === 0) {
          draw = false;
        } else if (v >= 65) {
          draw = true;
          color = "#1f2a60";
        } else {
          draw = true;
          color = "#f6b68a";
        }

        if (!draw) continue;

        ctx.fillStyle = color;
        const px = offsetX + x * cellSize;
        const py = offsetY + (height - 1 - y) * cellSize;
        ctx.fillRect(px, py, cellSize, cellSize);
      }
    }

    ctx.strokeStyle = "#c6c9f2";
    ctx.lineWidth = 1;
    ctx.strokeRect(offsetX, offsetY, mapPxWidth, mapPxHeight);
  }, [mapMeta, zoom]);

  return (
    <div>
      <h3
        style={{
          marginTop: 0,
          marginBottom: 8,
          fontSize: 16,
          fontWeight: 700,
          color: "#222",
        }}
      >
        Home Map
      </h3>

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 8,
          fontSize: 12,
          color: "#555",
          gap: 12,
        }}
      >
        <div>
          {mapMeta ? (
            <>
              <div>
                Map size: {mapMeta.width} × {mapMeta.height} cells
              </div>
              <div>
                Cell size: approx. {mapMeta.resolution.toFixed(2)} m
              </div>
            </>
          ) : (
            <div>Loading map...</div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ marginBottom: 4 }}>Zoom: {zoom}%</div>
          <input
            type="range"
            min={70}
            max={160}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={600}
        height={600}
        style={{
          width: "100%",
          maxWidth: 620,
          borderRadius: 16,
          border: "1px solid #e0e3ef",
          backgroundColor: "#f5f8ff",
        }}
      />

      <div
        style={{
          marginTop: 6,
          fontSize: 11,
          color: "#777",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <span>
          Navy: walls/obstacles | Gray-blue: unexplored | Light: free space
        </span>
        <span>Updated: {lastUpdate}</span>
      </div>
    </div>
  );
};

export default MapViewer;
