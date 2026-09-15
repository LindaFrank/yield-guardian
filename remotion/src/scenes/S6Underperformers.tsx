import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Captions } from "../components/Caption";
import { Button, Kicker, Panel, Stat, Title } from "../components/Ui";
import { body, C } from "../theme";

export const S6Underperformers: React.FC = () => {
  const frame = useCurrentFrame();
  const yieldNow = interpolate(frame, [20, 70], [0, 4.6], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const shake = frame > 120 ? Math.sin(frame / 4) * 2 : 0;
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 130, top: 130 }}>
        <Kicker text="Sample portfolio" delay={4} />
        <div style={{ height: 16 }} />
        <Title text="One holding falls short." delay={10} size={72} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 130,
          top: 330,
          display: "flex",
          gap: 26,
        }}
      >
        <Panel delay={20} style={{ width: 400 }}>
          <Stat label="Portfolio value" value="$225,000" size={56} />
        </Panel>
        <Panel delay={28} style={{ width: 400 }}>
          <Stat
            label="Overall annual yield"
            value={`${yieldNow.toFixed(1)}%`}
            color={C.tealLight}
            size={56}
          />
        </Panel>
        <Panel delay={36} style={{ width: 400 }}>
          <Stat label="Target yield" value="5.0%" color={C.gold} size={56} />
        </Panel>
      </div>
      <Panel
        title="Underperforming holdings"
        delay={60}
        style={{
          position: "absolute",
          left: 130,
          top: 570,
          width: 1240,
          transform: `translateX(${shake}px)`,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "22px 26px",
            borderRadius: 14,
            backgroundColor: "rgba(201,86,75,0.16)",
            border: `1px solid rgba(201,86,75,0.6)`,
            fontFamily: body,
            color: C.cream,
            fontSize: 34,
          }}
        >
          <span style={{ fontWeight: 700 }}>ABBV</span>
          <span style={{ color: C.muted }}>140 shares</span>
          <span style={{ color: C.red, fontWeight: 700 }}>3.1% yield</span>
          <span style={{ color: C.gold }}>below 5.0% goal</span>
        </div>
        <div style={{ marginTop: 26 }}>
          <Button label="Review Underperformers" delay={110} />
        </div>
      </Panel>
      <Captions
        lines={[
          {
            from: 14,
            duration: 130,
            text: "The sample portfolio holds familiar stocks — with one, ABBV, that does not meet the 5.0% goal.",
          },
          {
            from: 144,
            duration: 126,
            text: "Yield Guardian flags underperforming stocks against the desired annual yield.",
          },
        ]}
      />
    </AbsoluteFill>
  );
};
