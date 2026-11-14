import React from "react";
import { useNavigate } from "react-router-dom";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#ffffff",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          height: 56,
          backgroundColor: "#1d4ed8",
          borderBottomLeftRadius: 40,
        }}
      />

      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "0 80px",
          maxWidth: 1200,
          width: "100%",
          margin: "0 auto",
        }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            padding: "10px 26px",
            borderRadius: 999,
            backgroundColor: "#1d4ed8",
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 600,
            marginBottom: 40,
          }}
        >
          2025 SDGs Social Problem-Solving Competition
        </div>

        <div
          style={{
            fontSize: 40,
            color: "#6b7280",
            fontWeight: 500,
            marginBottom: 18,
          }}
        >
          For older adults with limited mobility
        </div>

        <div
          style={{
            fontSize: 72,
            lineHeight: 1.08,
            fontWeight: 800,
            color: "#1d4ed8",
            marginBottom: 56,
            letterSpacing: "-0.03em",
          }}
        >
          Indoor Autonomous Assist System
        </div>
      </div>

      <div
        style={{
          padding: "0 80px 32px",
        }}
      >
        <div
          style={{
            borderTop: "2px solid #1d4ed8",
            paddingTop: 22,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            maxWidth: 1200,
            margin: "0 auto",
          }}
        >
          <div
            style={{
              fontSize: 20,
              color: "#1d4ed8",
              fontWeight: 600,
            }}
          >
            Smart Indoor Walker
          </div>

          <button
            onClick={() => navigate("/dashboard")}
            style={{
              width: 70,
              height: 70,
              borderRadius: "50%",
              border: "none",
              backgroundColor: "#1d4ed8",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              boxShadow: "0 10px 22px rgba(37, 99, 235, 0.45)",
            }}
          >
            <span
              style={{
                display: "inline-block",
                fontSize: 34,
                color: "#ffffff",
                transform: "translateX(1px)",
              }}
            >
              →
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
