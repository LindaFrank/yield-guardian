import React from "react";
import { interpolate, Sequence, useCurrentFrame } from "remotion";
import { body, C } from "../theme";

export const CaptionLine: React.FC<{ text: string }> = ({ text }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 10], [0, 1], {
    extrapolateRight: "clamp",
  });
  const y = interpolate(frame, [0, 14], [18, 0], {
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        position: "absolute",
        left: 120,
        right: 120,
        bottom: 78,
        opacity,
        transform: `translateY(${y}px)`,
      }}
    >
      <div
        style={{
          display: "inline-block",
          maxWidth: 1500,
          backgroundColor: "rgba(8,22,29,0.72)",
          borderLeft: `4px solid ${C.tealLight}`,
          padding: "18px 28px",
          fontFamily: body,
          fontWeight: 500,
          fontSize: 38,
          lineHeight: 1.32,
          color: C.cream,
          letterSpacing: -0.3,
        }}
      >
        {text}
      </div>
    </div>
  );
};

export const Captions: React.FC<{
  lines: { from: number; duration: number; text: string }[];
}> = ({ lines }) => (
  <>
    {lines.map((l, i) => (
      <Sequence key={i} from={l.from} durationInFrames={l.duration}>
        <CaptionLine text={l.text} />
      </Sequence>
    ))}
  </>
);
