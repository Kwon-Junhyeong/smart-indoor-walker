import React, { useEffect, useRef } from "react";
import * as ROSLIB from "roslib";

const TeleopControls: React.FC = () => {
  const cmdVelRef = useRef<ROSLIB.Topic | null>(null);

  useEffect(() => {
    const ros = new ROSLIB.Ros({
      url: "ws://10.210.64.159:9090",
    });

    const cmdVel = new ROSLIB.Topic({
      ros,
      name: "/cmd_vel",
      messageType: "geometry_msgs/Twist",
    });
    cmdVelRef.current = cmdVel;

    return () => {
      try {
        const stopMsg = {
          linear: { x: 0, y: 0, z: 0 },
          angular: { x: 0, y: 0, z: 0 },
        };
        cmdVel.publish(stopMsg as any);
      } catch {}
      try {
        ros.close();
      } catch {}
    };
  }, []);

  const sendCmd = (linearX: number, angularZ: number) => {
    if (!cmdVelRef.current) return;

    const msg = {
      linear: { x: linearX, y: 0, z: 0 },
      angular: { x: 0, y: 0, z: angularZ },
    };

    cmdVelRef.current.publish(msg as any);
  };

  const stop = () => sendCmd(0, 0);

  return (
    <div>
      <h3 style={{ marginTop: 0 }}>Basic Drive Control (/cmd_vel)</h3>
      <p style={{ marginTop: 0, marginBottom: 8, fontSize: 12 }}>
        The robot moves only while a button is held down.
      </p>

      <div style={{ display: "inline-block", textAlign: "center" }}>
        <button
          onMouseDown={() => sendCmd(0.2, 0)}
          onMouseUp={stop}
          onMouseLeave={stop}
          style={{ width: 90, height: 50, margin: 4 }}
        >
          Forward
        </button>
        <div>
          <button
            onMouseDown={() => sendCmd(0, 0.7)}
            onMouseUp={stop}
            onMouseLeave={stop}
            style={{ width: 90, height: 50, margin: 4 }}
          >
            Turn Left
          </button>
          <button
            onClick={stop}
            style={{ width: 90, height: 50, margin: 4 }}
          >
            Stop
          </button>
          <button
            onMouseDown={() => sendCmd(0, -0.7)}
            onMouseUp={stop}
            onMouseLeave={stop}
            style={{ width: 90, height: 50, margin: 4 }}
          >
            Turn Right
          </button>
        </div>
        <button
          onMouseDown={() => sendCmd(-0.2, 0)}
          onMouseUp={stop}
          onMouseLeave={stop}
          style={{ width: 90, height: 50, margin: 4 }}
        >
          Backward
        </button>
      </div>
    </div>
  );
};

export default TeleopControls;
