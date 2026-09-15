import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";

export const Backdrop: React.FC = () => {
  const frame = useCurrentFrame();
  const drift = Math.sin(frame / 220) * 60;
  const drift2 = Math.cos(frame / 180) * 45;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <AbsoluteFill
        style={{
          background: `radial-gradient(1100px 700px at ${20 + drift}px ${
            120 + drift2
          }px, rgba(20,122,138,0.35), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background: `radial-gradient(900px 600px at ${1750 - drift2}px ${
            980 + drift
          }px, rgba(63,179,195,0.18), transparent 70%)`,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(8,22,29,0) 40%, rgba(8,22,29,0.85) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};
