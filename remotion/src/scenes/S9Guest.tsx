import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Captions } from "../components/Caption";
import { Button, Kicker, Panel, Row, Title } from "../components/Ui";
import { body, C } from "../theme";

export const S9Guest: React.FC = () => {
  const frame = useCurrentFrame();
  const lockO = interpolate(frame, [60, 84], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 130, top: 140, width: 700 }}>
        <Kicker text="Guest Analysis Mode" delay={4} />
        <div style={{ height: 18 }} />
        <Title text={"Alternatives stay\nhidden."} delay={10} size={78} />
        <div
          style={{
            marginTop: 26,
            fontFamily: body,
            fontSize: 29,
            color: C.muted,
            lineHeight: 1.45,
            opacity: lockO,
          }}
        >
          Stock names, ticker symbols and share counts are concealed while browsing as
          a guest.
        </div>
        <div style={{ height: 36 }} />
        <Button label="Save my portfolio" delay={100} color={C.teal} />
        <div
          style={{
            marginTop: 18,
            fontFamily: body,
            fontSize: 24,
            color: C.muted,
            opacity: interpolate(frame, [130, 155], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Create an account and subscribe to unlock the alternatives and the new
          annual yield.
        </div>
      </div>
      <Panel
        title="Suggested alternatives"
        delay={26}
        style={{ position: "absolute", right: 120, top: 200, width: 860 }}
      >
        <Row ticker="XXXXX" shares="000 shares" yieldPct="?" masked delay={40} />
        <Row ticker="XXXX" shares="000 shares" yieldPct="?" masked delay={50} />
        <Row ticker="XXXXXX" shares="000 shares" yieldPct="?" masked delay={60} />
        <div
          style={{
            marginTop: 24,
            display: "flex",
            alignItems: "center",
            gap: 16,
            opacity: lockO,
          }}
        >
          <span
            style={{
              fontFamily: body,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 2,
              color: C.gold,
              border: `1px solid ${C.gold}`,
              borderRadius: 8,
              padding: "8px 14px",
            }}
          >
            LOCKED
          </span>
          <span style={{ fontFamily: body, fontSize: 28, color: C.gold }}>
            New annual yield hidden in guest mode
          </span>
        </div>
      </Panel>
      <Captions
        lines={[
          {
            from: 12,
            duration: 140,
            text: "In Guest Analysis Mode, stock names, tickers and share counts stay hidden.",
          },
          {
            from: 152,
            duration: 148,
            text: "Choosing Save my portfolio starts account creation, and unlocks the alternatives and the new yield.",
          },
        ]}
      />
    </AbsoluteFill>
  );
};
