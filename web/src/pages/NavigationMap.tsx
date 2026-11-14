import React from "react";
import NavigationMap from "../components/NavigationMap";

const NavigationMapPage: React.FC = () => {
  return (
    <div
      style={{
        width: "100%",
        height: "100vh",
        backgroundColor: "#050816",
        color: "#e5e7eb",
      }}
    >
      <NavigationMap />
    </div>
  );
};

export default NavigationMapPage;
