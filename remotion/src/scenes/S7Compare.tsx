import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { SCENES } from "../narration";
import { Backdrop } from "../components/Backdrop";
import { Captions } from "../components/Caption";
import { Kicker, Panel, Title } from "../components/Ui";
import { body, display, C } from "../theme";

const Card: React.FC<{
  heading: string;
  sub: string;
  amount: string;
  note: string;
  accent: string;
  delay: number;
  left: number;
  masked?: boolean;
}> = ({ heading, sub, amount, note, accent, delay, left, masked }) => (
  <Panel delay={delay} style={{ position: "absolute", left, top: 330, width: 720 }}>
    <div
      style={{
        fontFamily: body,
        fontSize: 26,
        letterSpacing: 2,
        textTransform: "uppercase",
        color: accent,
        marginBottom: 14,
      }}
    >
      {heading}
    </div>
    <div
      style={{
        fontFamily: display,
        fontWeight: 600,
        fontSize: 40,
        color: C.cream,
        marginBottom: 26,
        filter: masked ? "blur(9px)" : undefined,
      }}
    >
      {sub}
    </div>
    <div
      style={{
        fontFamily: display,
        fontWeight: 700,
        fontSize: 88,
        color: accent,
        letterSpacing: -3,
      }}
    >
      {amount}
    </div>
    <div
      style={{
        fontFamily: body,
        fontSize: 26,
        color: C.muted,
        marginTop: 12,
      }}
    >
      {note}
    </div>
  </Panel>
);

export const S7Compare: React.FC = () => {
  const frame = useCurrentFrame();
  const arrow = interpolate(frame, [110, 140], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 130, top: 130 }}>
        <Kicker text="Rest-of-year dividend comparison" delay={4} />
        <div style={{ height: 16 }} />
        <Title text="Keep it, or switch it?" delay={10} size={72} />
      </div>
      <Card
        heading="Keep ABBV"
        sub="ABBV · 140 shares"
        amount="$464.80"
        note="Dividends expected through December 31"
        accent={C.gold}
        delay={26}
        left={130}
      />
      <Card
        heading="Switch to an alternative"
        sub="Alternative holding"
        amount="$2,580.08"
        note="Dividends expected through December 31"
        accent={C.tealLight}
        delay={70}
        left={1070}
        masked
      />
      <div
        style={{
          position: "absolute",
          left: 905,
          top: 500,
          fontFamily: display,
          fontWeight: 700,
          fontSize: 60,
          color: C.tealLight,
          opacity: arrow,
          transform: `translateX(${interpolate(arrow, [0, 1], [-20, 0])}px)`,
        }}
      >
        →
      </div>
      <div
        style={{
          position: "absolute",
          left: 130,
          top: 730,
          fontFamily: body,
          fontSize: 34,
          color: C.green,
          fontWeight: 700,
          opacity: interpolate(frame, [160, 185], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          }),
        }}
      >
        Rest of year dividends: +$2,115.28
      </div>
      <Captions lines={SCENES.s7.lines} />
    </AbsoluteFill>
  );
};
