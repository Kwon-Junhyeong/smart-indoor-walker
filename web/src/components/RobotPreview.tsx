import React from "react";

const RobotPreview: React.FC = () => {
  return (
    <div
      style={{
        borderRadius: 18,
        padding: 14,
        backgroundColor: "#ffffff",
        boxShadow: "0 4px 10px rgba(0,0,0,0.03)",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div
        style={{
          marginBottom: 8,
          fontSize: 15,
          fontWeight: 700,
          color: "#222",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Robot</span>
        <span
          style={{
            fontSize: 11,
            color: "#777",
          }}
        >
          0.3 m
        </span>
      </div>

      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "4 / 3",
          borderRadius: 16,
          background: "linear-gradient(145deg,#f5f8ff,#eef2ff)",
          overflow: "hidden",
          border: "1px solid #e0e3ef",
        }}
      >
        <div
          style={{
            position: "absolute",
            left: "8%",
            right: "8%",
            bottom: "18%",
            height: 2,
            background:
              "linear-gradient(90deg,rgba(99,91,255,0.2),rgba(99,91,255,0.7),rgba(99,91,255,0.2))",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "22%",
            right: "22%",
            bottom: "20%",
            top: "22%",
            borderRadius: 16,
            background:
              "linear-gradient(160deg,#ffffff,#cfd8ff)",
            boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
            border: "1px solid rgba(99,91,255,0.35)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "30%",
            right: "30%",
            top: "16%",
            height: "20%",
            borderRadius: 999,
            border: "2px solid rgba(0,0,0,0.15)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "22%",
            bottom: "18%",
            width: "14%",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%,#ffffff,#444b5a)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "22%",
            bottom: "18%",
            width: "14%",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%,#ffffff,#444b5a)",
            boxShadow: "0 4px 8px rgba(0,0,0,0.4)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "22%",
            bottom: "18%",
            width: "10%",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%,#ffffff,#555)",
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "22%",
            bottom: "18%",
            width: "10%",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%,#ffffff,#555)",
            opacity: 0.5,
          }}
        />

        <div
          style={{
            position: "absolute",
            left: "50%",
            transform: "translateX(-50%)",
            top: "22%",
            width: "16%",
            aspectRatio: "1 / 1",
            borderRadius: "50%",
            background:
              "radial-gradient(circle at 30% 30%,#ffe5e5,#ff6f61)",
            boxShadow: "0 4px 10px rgba(255,111,97,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            color: "#fff",
            fontWeight: 700,
          }}
        >
          LiDAR
        </div>

        <div
          style={{
            position: "absolute",
            left: "52%",
            top: "40%",
            width: "9%",
            aspectRatio: "1 / 1",
            borderRadius: 6,
            background:
              "linear-gradient(135deg,#ffcc80,#ff9800)",
            boxShadow: "0 3px 8px rgba(0,0,0,0.25)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 9,
            color: "#fff",
            fontWeight: 700,
          }}
        >
          IMU
        </div>

        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <span
            style={{
              fontSize: 11,
              color: "#555",
              fontWeight: 600,
            }}
          >
            Front
          </span>
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "6px solid transparent",
              borderRight: "6px solid transparent",
              borderBottom: "8px solid #555",
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default RobotPreview;
