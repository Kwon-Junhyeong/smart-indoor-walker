import React, { useMemo } from "react";
import * as ROSLIB from "roslib";
import NavigationMap from "../components/NavigationMap";
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
        <span style={{ fontWeight: 600 }}>Height</span>
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

const SlamPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "calc(100vh - 56px)",
        background: "radial-gradient(circle at top, #020617 0%, #020617 60%)",
        padding: "18px 28px 28px",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        color: "#e5e7eb",
      }}
    >
      <div
        style={{
          marginBottom: 14,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "baseline",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 11,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#6b7280",
              marginBottom: 2,
            }}
          >
            04
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 700,
            }}
          >
            SLAM
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1.4fr)",
          gap: 18,
          alignItems: "flex-start",
        }}
      >
        <div
          style={{
            background:
              "radial-gradient(circle at top, #020617, #020617 60%)",
            borderRadius: 18,
            padding: 16,
            border: "1px solid rgba(31,41,55,0.9)",
            boxShadow: "0 18px 40px rgba(0,0,0,0.65)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "baseline",
              marginBottom: 8,
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
                SLAM Map
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: "#9ca3af",
                }}
              >
                /map
              </div>
            </div>
          </div>

          <div
            style={{
              borderRadius: 14,
              overflow: "hidden",
              border: "1px solid rgba(55,65,81,0.8)",
              backgroundColor: "#020617",
            }}
          >
            <NavigationMap />
          </div>
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <div
            style={{
              background:
                "linear-gradient(135deg, rgba(15,23,42,0.96), rgba(15,23,42,0.98))",
              borderRadius: 18,
              padding: 16,
              border: "1px solid rgba(55,65,81,0.9)",
              boxShadow: "0 14px 32px rgba(0,0,0,0.65)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginBottom: 10,
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
                  backgroundColor: "#ecfdf3",
                  color: "#16a34a",
                  border: "1px solid #bbf7d0",
                }}
              >
                ● ROS
              </span>
            </div>

            <TeleopPad />
          </div>

          <HeightPad />
        </div>
      </div>
    </div>
  );
};

export default SlamPage;
