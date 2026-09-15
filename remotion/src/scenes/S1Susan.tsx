import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Captions } from "../components/Caption";
import { Kicker, Title } from "../components/Ui";
import { C } from "../theme";

export const S1Susan: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 270], [1.12, 1.02]);
  const x = interpolate(frame, [0, 270], [-26, 12]);
  const fade = interpolate(frame, [0, 24], [0, 1], {
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ opacity: fade }}>
        <Img
          src={staticFile("images/susan.png")}
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale}) translateX(${x}px)`,
          }}
        />
        <AbsoluteFill
          style={{
            background:
              "linear-gradient(90deg, rgba(8,22,29,0.98) 0%, rgba(8,22,29,0.92) 32%, rgba(8,22,29,0.25) 58%, rgba(8,22,29,0.15) 100%)",
          }}
        />
      </AbsoluteFill>
      <div style={{ position: "absolute", left: 120, top: 250, width: 780 }}>
        <Kicker text="Yield Guardian" delay={10} />
        <div style={{ height: 24 }} />
        <Title text="Meet Susan." delay={18} size={120} />
        <div style={{ height: 22 }} />
        <div
          style={{
            width: 120,
            height: 5,
            backgroundColor: C.gold,
            opacity: interpolate(frame, [40, 60], [0, 1], {
              extrapolateRight: "clamp",
              extrapolateLeft: "clamp",
            }),
          }}
        />
      </div>
      <Captions
        lines={[
          {
            from: 30,
            duration: 120,
            text: "I'd like you to meet Susan. Over the years, she has built a substantial stock portfolio.",
          },
          {
            from: 150,
            duration: 120,
            text: "She wants those investments to provide her income through retirement.",
          },
        ]}
      />
    </AbsoluteFill>
  );
};
