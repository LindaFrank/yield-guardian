import React from "react";
import {
  AbsoluteFill,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Button, Kicker, Title } from "../components/Ui";
import { body, C } from "../theme";

export const S10Cta: React.FC = () => {
  const frame = useCurrentFrame();
  const scale = interpolate(frame, [0, 240], [1.04, 1.12]);
  return (
    <AbsoluteFill>
      <Backdrop />
      <AbsoluteFill style={{ opacity: 0.28 }}>
        <Img
          src={staticFile("images/susan.png")}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `scale(${scale})`,
          }}
        />
      </AbsoluteFill>
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(8,22,29,0.86), rgba(8,22,29,0.94))",
        }}
      />
      <AbsoluteFill
        style={{
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
        }}
      >
        <Kicker text="Yield Guardian" delay={6} />
        <div style={{ height: 22 }} />
        <Title text="See what your portfolio can earn." delay={14} size={86} />
        <div style={{ height: 46 }} />
        <div style={{ display: "flex", gap: 26 }}>
          <Button label="Try Guest Analysis" delay={50} />
          <Button
            label="Back to home"
            delay={64}
            color="rgba(255,255,255,0.12)"
            pulse={false}
          />
        </div>
        <div
          style={{
            marginTop: 56,
            fontFamily: body,
            fontSize: 24,
            color: C.muted,
            maxWidth: 1100,
            lineHeight: 1.5,
            opacity: interpolate(frame, [110, 140], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Yield Guardian is a portfolio analysis tool, not a registered investment
          advisor. All information is for educational purposes only.
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
