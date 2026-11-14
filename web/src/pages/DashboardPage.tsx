import React from "react";
import FeatureNav from "../components/FeatureNav";

const DashboardPage: React.FC = () => {
  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#050816",
        color: "#f9fafb",
        fontFamily: "system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
      }}
    >
      <FeatureNav />

      <div style={{ padding: "20px 28px 32px" }}>
        <div
          style={{
            marginBottom: 18,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 16,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                overflow: "hidden",
                border: "2px solid #22c55e",
                boxShadow: "0 0 0 4px rgba(34,197,94,0.2)",
                background:
                  "radial-gradient(circle at 30% 30%, #1d4ed8, #020617)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/images/puang.png"
                alt="Kim Puang"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = "none";
                }}
              />
              <span
                style={{
                  position: "absolute",
                  fontSize: 28,
                  display: "inline-block",
                }}
              >
                🐾
              </span>
            </div>

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
                02 | DASHBOARD
              </div>
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                }}
              >
                Kim Puang's Dashboard
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: "#9ca3af",
                  marginTop: 2,
                }}
              >
                Kim Puang, indoor autonomous assist user
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: 8,
              fontSize: 11,
            }}
          >
            <Badge color="#22c55e" bg="#16a34a1a" border="#16a34a33">
              ● System online
            </Badge>
            <Badge color="#a5b4fc" bg="#1d4ed81a" border="#1d4ed833">
              LiDAR connected
            </Badge>
            <Badge color="#f97316" bg="#f973161a" border="#f9731633">
              Battery 82%
            </Badge>
          </div>
        </div>

        <div
          style={{
            marginBottom: 20,
            borderRadius: 14,
            padding: "14px 18px",
            background:
              "linear-gradient(90deg, #1d4ed8 0%, #1e3a8a 40%, #020617 100%)",
            boxShadow: "0 14px 30px rgba(15,23,42,0.7)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 16,
              fontSize: 12,
            }}
          >
            <StatusItem label="RC link" value="Connected" color="#4ade80" />
            <StatusItem label="Sensors" value="LiDAR / IMU active" color="#a5b4fc" />
            <StatusItem label="Mode" value="Manual control" color="#fbbf24" />
            <StatusItem label="Today's drives" value="12 min, 4 runs" color="#f97316" />
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          <FeatureCard
            title="SLAM Map"
            subtitle="Real-time mapping"
            accent="#38bdf8"
            buttonLabel="SLAM View"
          />
          <FeatureCard
            title="Navigation"
            subtitle="Drive to a goal"
            accent="#4ade80"
            buttonLabel="Route View"
          />
          <FeatureCard
            title="Profile"
            subtitle="Favorites and stats"
            accent="#f97316"
            buttonLabel="Profile"
          />
        </div>

        <div
          style={{
            backgroundColor: "#020617",
            borderRadius: 14,
            padding: 16,
            border: "1px solid #111827",
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
              gap: 12,
              marginBottom: 14,
              fontSize: 12,
            }}
          >
            <MetricBox label="Saved places" value="1" color="#4ade80" />
            <MetricBox label="Total drive time (min)" value="12" color="#38bdf8" />
            <MetricBox label="Autonomous successes" value="5" color="#a855f7" />
            <MetricBox label="Avg. speed (m/s)" value="0.22" color="#eab308" />
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "center",
              gap: 10,
              marginTop: 4,
            }}
          >
            <QuickButton
              label="Start Autonomous Drive"
              background="#16a34a"
              textColor="#f9fafb"
            />
            <QuickButton
              label="View Map"
              background="#1d4ed8"
              textColor="#f9fafb"
            />
            <QuickButton
              label="Set Goal"
              background="#f97316"
              textColor="#111827"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

type BadgeProps = {
  children: React.ReactNode;
  color: string;
  bg: string;
  border: string;
};

const Badge: React.FC<BadgeProps> = ({ children, color, bg, border }) => (
  <span
    style={{
      padding: "4px 10px",
      borderRadius: 999,
      border: `1px solid ${border}`,
      backgroundColor: bg,
      color,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

type StatusItemProps = {
  label: string;
  value: string;
  color: string;
};

const StatusItem: React.FC<StatusItemProps> = ({ label, value, color }) => (
  <div>
    <div
      style={{
        fontSize: 11,
        color: "#cbd5f5",
        marginBottom: 2,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontSize: 13,
        fontWeight: 600,
        color,
      }}
    >
      {value}
    </div>
  </div>
);

type FeatureCardProps = {
  title: string;
  subtitle: string;
  accent: string;
  buttonLabel: string;
};

const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  subtitle,
  accent,
  buttonLabel,
}) => (
  <div
    style={{
      backgroundColor: "#0b1120",
      borderRadius: 12,
      padding: 14,
      border: "1px solid #111827",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    }}
  >
    <div>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontSize: 11,
          color: "#9ca3af",
          marginBottom: 16,
        }}
      >
        {subtitle}
      </div>
    </div>
    <div
      style={{
        alignSelf: "flex-end",
        fontSize: 11,
        padding: "4px 10px",
        borderRadius: 999,
        backgroundColor: "#020617",
        color: accent,
        border: `1px solid ${accent}55`,
      }}
    >
      {buttonLabel}
    </div>
  </div>
);

type MetricProps = {
  label: string;
  value: string;
  color: string;
};

const MetricBox: React.FC<MetricProps> = ({ label, value, color }) => {
  return (
    <div
      style={{
        padding: "10px 12px",
        borderRadius: 10,
        backgroundColor: "#020617",
        border: "1px solid #111827",
      }}
    >
      <div
        style={{
          fontSize: 11,
          color: "#9ca3af",
          marginBottom: 4,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 18,
          fontWeight: 700,
          color,
        }}
      >
        {value}
      </div>
    </div>
  );
};

type QuickButtonProps = {
  label: string;
  background: string;
  textColor: string;
};

const QuickButton: React.FC<QuickButtonProps> = ({
  label,
  background,
  textColor,
}) => {
  return (
    <button
      type="button"
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        border: "none",
        fontSize: 12,
        fontWeight: 600,
        backgroundColor: background,
        color: textColor,
        cursor: "pointer",
        boxShadow: "0 8px 18px rgba(0,0,0,0.4)",
      }}
    >
      {label}
    </button>
  );
};

export default DashboardPage;
