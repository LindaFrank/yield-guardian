import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Captions } from "../components/Caption";
import { Kicker, Panel, Stat } from "../components/Ui";
import { body, display, C } from "../theme";

export const S2Goal: React.FC = () => {
  const frame = useCurrentFrame();
  const count = interpolate(frame, [16, 70], [0, 5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const bar = interpolate(frame, [24, 90], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const float = Math.sin(frame / 40) * 6;
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 130, top: 210, width: 760 }}>
        <Kicker text="Her retirement target" delay={6} />
        <div style={{ height: 26 }} />
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 210,
            color: C.tealLight,
            letterSpacing: -8,
            lineHeight: 1,
            transform: `translateY(${float}px)`,
          }}
        >
          {count.toFixed(1)}%
        </div>
        <div
          style={{
            fontFamily: body,
            fontSize: 34,
            color: C.muted,
            marginTop: 10,
          }}
        >
          annual dividend yield
        </div>
        <div
          style={{
            marginTop: 34,
            height: 12,
            width: 620,
            borderRadius: 8,
            backgroundColor: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${bar * 100}%`,
              background: `linear-gradient(90deg, ${C.teal}, ${C.tealLight})`,
            }}
          />
        </div>
      </div>
      <Panel
        title="Income review"
        delay={30}
        style={{
          position: "absolute",
          right: 130,
          top: 240,
          width: 660,
          transform: `translateY(${-float}px)`,
        }}
      >
        <div style={{ display: "grid", gap: 30 }}>
          <Stat label="Current expenses covered" value="Yes, at 5.0%" size={46} />
          <Stat label="Holdings in her portfolio" value="23 stocks" size={46} />
          <Stat
            label="Calculating this by hand"
            value="Difficult"
            color={C.gold}
            size={46}
          />
        </div>
      </Panel>
      <Captions
        lines={[
          {
            from: 12,
            duration: 116,
            text: "After reviewing her income and expenses, she decided a 5.0% annual yield will support her.",
          },
          {
            from: 128,
            duration: 112,
            text: "Her portfolio holds 23 stocks — and working out which ones actually help is hard to calculate.",
          },
        ]}
      />
    </AbsoluteFill>
  );
};
