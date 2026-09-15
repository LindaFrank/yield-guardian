import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Captions } from "../components/Caption";
import { Button, Kicker, Panel, Row, Title } from "../components/Ui";
import { body, C } from "../theme";

export const S4Import: React.FC = () => {
  const frame = useCurrentFrame();
  const progress = interpolate(frame, [40, 130], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 130, top: 140, width: 720 }}>
        <Kicker text="Here is where Yield Guardian helps" delay={4} />
        <div style={{ height: 20 }} />
        <Title text={"Import your portfolio\nas a guest."} delay={12} size={72} />
        <div style={{ height: 40 }} />
        <Button label="Analyze a portfolio — no account needed" delay={40} />
      </div>
      <Panel
        title="Importing"
        delay={30}
        style={{ position: "absolute", right: 120, top: 190, width: 820 }}
      >
        <Row ticker="AAPL" shares="60 shares" yieldPct="5.4%" delay={44} />
        <Row ticker="KO" shares="220 shares" yieldPct="5.1%" delay={52} />
        <Row ticker="VZ" shares="180 shares" yieldPct="6.2%" delay={60} />
        <Row ticker="ABBV" shares="140 shares" yieldPct="3.1%" bad delay={68} />
        <div
          style={{
            marginTop: 22,
            height: 10,
            borderRadius: 6,
            backgroundColor: "rgba(255,255,255,0.08)",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              height: "100%",
              width: `${progress * 100}%`,
              background: `linear-gradient(90deg, ${C.teal}, ${C.tealLight})`,
            }}
          />
        </div>
        <div
          style={{
            fontFamily: body,
            fontSize: 24,
            color: C.muted,
            marginTop: 14,
          }}
        >
          {progress < 1
            ? `Reading tickers and share counts… ${Math.round(progress * 23)} of 23`
            : "23 of 23 holdings read · portfolio value calculated"}
        </div>
      </Panel>
      <Captions
        lines={[
          {
            from: 20,
            duration: 120,
            text: "Yield Guardian can analyze her portfolio — she simply imports it as a guest.",
          },
          {
            from: 140,
            duration: 130,
            text: "It reads the tickers and share counts, then calculates her current portfolio value.",
          },
        ]}
      />
    </AbsoluteFill>
  );
};
