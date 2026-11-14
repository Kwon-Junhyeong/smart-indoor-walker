import React, { useMemo } from "react";
import * as ROSLIB from "roslib";
import LidarViewer from "../components/LidarViewer";
import SensorPanel from "../components/SensorPanel";
import TeleopPad from "../components/TeleopPad";

const ROSLIB_ANY = ROSLIB as any;

const HeightPad: React.FC = () => {
  const { topic, connected } = useMemo(() => {
    const host = window.location.hostname || "10.210.64.159";

    const ros = new ROSLIB_ANY.Ros({
      url: `ws://${host}:9090`,
    });

    const heightTopic = new ROSLIB_ANY.Topic({
      ros,
      name: "/chair_height_cmd",
      messageType: "std_msgs/msg/Int32",
    });

    ros.on("close", () => {
    });

    return { topic: heightTopic, connected: true };
  }, []);

  const sendHeight = (v: number) => {
    if (!topic) return;
    topic.publish({ data: v });
  };

  const btnStyleBase: React.CSSProperties = {
    flex: 1,
    height: 40,
    borderRadius: 999,
    border: "none",
    fontSize: 13,
    fontWeight: 600,
    cursor: "pointer",
  };

  return (
    <div
      style={{
        background:
          "linear-gradient(135deg, rgba(15,23,42,0.94), rgba(15,23,42,0.96))",
        borderRadius: 16,
        padding: 14,
        border: "1px solid rgba(148,163,184,0.24)",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        color: "#e5e7eb",
        marginTop: 10,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
          fontSize: 12,
        }}
      >
        <span style={{ fontWeight: 600 }}>Seat Height</span>
        <span
          style={{
            fontSize: 11,
            color: connected ? "#22c55e" : "#9ca3af",
          }}
        >
          /chair_height_cmd
        </span>
      </div>

      <div
        style={{
          display: "flex",
          gap: 10,
        }}
      >
        <button
          style={{
            ...btnStyleBase,
            background:
              "radial-gradient(circle at 30% 0%, #22c55e, #16a34a)",
            color: "#f9fafb",
          }}
          onClick={() => sendHeight(1)}
        >
          ↑ Up
        </button>
        <button
          style={{
            ...btnStyleBase,
            backgroundColor: "#f97316",
            color: "#111827",
          }}
          onClick={() => sendHeight(0)}
        >
          ■ Stop
        </button>
        <button
          style={{
            ...btnStyleBase,
            background:
              "radial-gradient(circle at 30% 0%, #38bdf8, #0ea5e9)",
            color: "#0f172a",
          }}
          onClick={() => sendHeight(-1)}
        >
          ↓ Down
        </button>
      </div>
    </div>
  );
};

const SystemPage: React.FC = () => {
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
              03
            </div>
            <div
              style={{
                fontSize: 22,
                fontWeight: 700,
              }}
            >
              System
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
              /scan | /odom | /imu
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
                  LIDAR
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "#9ca3af",
                  }}
                >
                  /scan
                </div>
              </div>
            </div>

            <LidarViewer />
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
                    Sensors
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                    }}
                  >
                    /odom | /imu
                  </div>
                </div>
              </div>

              <SensorPanel />
            </div>

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
                    Controls
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#9ca3af",
                    }}
                  >
                    /cmd_vel
                  </div>
                </div>

                <span
                  style={{
                    fontSize: 11,
                    padding: "3px 10px",
                    borderRadius: 999,
                    backgroundColor: "#16a34a1a",
                    color: "#4ade80",
                    border: "1px solid #16a34a33",
                  }}
                >
                  Connected
                </span>
              </div>

              <TeleopPad />

              <HeightPad />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemPage;
