import React from "react";
import { useNavigate } from "react-router-dom";

interface FeatureNavProps {
  prevPath?: string;
  prevLabel?: string;
  nextPath?: string;
  nextLabel?: string;
}

const FeatureNav: React.FC<FeatureNavProps> = ({
  prevPath,
  prevLabel,
  nextPath,
  nextLabel,
}) => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        marginTop: 24,
        display: "flex",
        justifyContent: "space-between",
      }}
    >
      <div>
        {prevPath && prevLabel && (
          <button
            onClick={() => navigate(prevPath)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #ccc",
              backgroundColor: "#fff",
              cursor: "pointer",
            }}
          >
            ← {prevLabel}
          </button>
        )}
      </div>
      <div>
        {nextPath && nextLabel && (
          <button
            onClick={() => navigate(nextPath)}
            style={{
              padding: "8px 16px",
              borderRadius: 8,
              border: "1px solid #1976d2",
              backgroundColor: "#1976d2",
              color: "#fff",
              cursor: "pointer",
            }}
          >
            {nextLabel} →
          </button>
        )}
      </div>
    </div>
  );
};

export default FeatureNav;
