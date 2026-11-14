import React, { useState, useEffect, useRef } from "react";
import { Ros, Topic } from "roslib";
import LidarViewer from "../components/LidarViewer";
import SensorPanel from "../components/SensorPanel";

const AVOIDANCE_CMD_TOPIC = "/avoidance_cmd";
const ROSBRIDGE_URL = "ws://10.210.64.159:9090";

const AvoidancePage: React.FC = () => {
  const [mode, setMode] = useState<"idle" | "running" | "stopped">("idle");
  const [connected, setConnected] = useState(false);

  const rosRef = useRef<Ros | null>(null);
  const avoidanceTopicRef = useRef<Topic | null>(null);

  useEffect(() => {
    const ros = new Ros({ url: ROSBRIDGE_URL });

    ros.on("connection", () => {
      setConnected(true);
      avoidanceTopicRef.current = new Topic({
        ros,
        name: AVOIDANCE_CMD_TOPIC,
        messageType: "std_msgs/msg/String",
      });
    });

    ros.on("close", () => {
      setConnected(false);
      avoidanceTopicRef.current = null;
    });

    ros.on("error", () => {
      setConnected(false);
    });

    rosRef.current = ros;

    return () => {
      avoidanceTopicRef.current = null;
      ros.close();
      rosRef.current = null;
    };
  }, []);

  const publishCmd = (data: string) => {
    const topic = avoidanceTopicRef.current;
    if (!topic) return;

    topic.publish({ data } as any);
  };

  const handleStart = () => {
    publishCmd("start");
    setMode("running");
  };

  const handleStop = () => {
    publishCmd("stop");
    setMode("stopped");
  };

  const modeLabel = (() => {
    switch (mode) {
      case "running":
        return "Avoidance running";
      case "stopped":
        return "Stopped";
      default:
        return "Idle";
    }
  })();

  const modeColor = (() => {
    switch (mode) {
      case "running":
        return { bg: "#16a34a1a", border: "#16a34a33", text: "#4ade80" };
      case "stopped":
        return { bg: "#b91c1c1a", border: "#b91c1c33", text: "#fca5a5" };
      default:
        return { bg: "#111827", border: "#1f2937", text: "#9ca3af" };
    }
  })();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050816",
        color: "#e5e7eb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <div style={{ padding: "20px 28px 32px" }}>
        <div
          style={{
            marginBottom: 16,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 600,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#9ca3af",
                marginBottom: 4,
              }}
            >
              06
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              Obstacle Avoidance
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              fontSize: 11,
            }}
          >
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid #16a34a33",
                backgroundColor: "#16a34a1a",
                color: "#4ade80",
              }}
            >
              ● ROS
            </span>
            <span
              style={{
                padding: "4px 10px",
                borderRadius: 999,
                border: "1px solid #4b556333",
                backgroundColor: "#020617",
                color: "#9ca3af",
              }}
            >
              /scan | /odom | /imu | /cmd_vel
            </span>
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1.3fr)",
            gap: 20,
            alignItems: "flex-start",
          }}
        >
          <div
            style={{
              backgroundColor: "#020617",
              borderRadius: 16,
              padding: 18,
              border: "1px solid #111827",
              boxShadow: "0 20px 45px rgba(15,23,42,0.8)",
              minHeight: 420,
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 10,
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                  }}
                >
                  Avoidance LIDAR
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  Obstacle detection (/scan)
                </div>
              </div>
            </div>

            <div style={{ flex: 1, minHeight: 360 }}>
              <LidarViewer />
            </div>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            <div
              style={{
                backgroundColor: "#020617",
                borderRadius: 16,
                padding: 16,
                border: "1px solid #111827",
                boxShadow: "0 14px 32px rgba(15,23,42,0.7)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: 12,
                  fontSize: 12,
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    Avoidance Control
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                    }}
                  >
                    A → B straight, detour around obstacles
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 999,
                    backgroundColor: modeColor.bg,
                    color: modeColor.text,
                    border: `1px solid ${modeColor.border}`,
                    whiteSpace: "nowrap",
                  }}
                >
                  {connected ? modeLabel : "ROS offline"}
                </span>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                }}
              >
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={!connected}
                  style={{
                    flex: 1,
                    padding: "12px 0",
                    borderRadius: 999,
                    border: "none",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: connected ? "pointer" : "not-allowed",
                    opacity: connected ? 1 : 0.5,
                    background:
                      "linear-gradient(135deg, #f97316, #ea580c)",
                    color: "#f9fafb",
                    boxShadow: "0 12px 30px rgba(248,113,113,0.45)",
                    letterSpacing: "0.06em",
                  }}
                >
                  Start
                </button>
                <button
                  type="button"
                  onClick={handleStop}
                  disabled={!connected}
                  style={{
                    width: 110,
                    padding: "12px 0",
                    borderRadius: 999,
                    border: "1px solid #7f1d1d",
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: connected ? "pointer" : "not-allowed",
                    opacity: connected ? 1 : 0.5,
                    backgroundColor: "#450a0a",
                    color: "#fecaca",
                    boxShadow: "0 10px 24px rgba(127,29,29,0.6)",
                    letterSpacing: "0.04em",
                  }}
                >
                  Stop
                </button>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#020617",
                borderRadius: 16,
                padding: 14,
                border: "1px solid #111827",
                boxShadow: "0 10px 26px rgba(15,23,42,0.65)",
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
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                    }}
                  >
                    IMU and Encoder Summary
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                    }}
                  >
                    /imu | /odom
                  </div>
                </div>
              </div>

              <div
                style={{
                  borderRadius: 12,
                  border: "1px solid #1f2937",
                  padding: 8,
                  background:
                    "radial-gradient(circle at top, #0b1120, #020617)",
                }}
              >
                <SensorPanel />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AvoidancePage;
