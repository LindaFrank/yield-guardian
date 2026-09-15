import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Backdrop } from "../components/Backdrop";
import { Captions } from "../components/Caption";
import { Kicker, Panel, Title } from "../components/Ui";
import { body, C } from "../theme";

const items: { t: string; ok: boolean }[] = [
  { t: "Name and address", ok: false },
  { t: "Account numbers", ok: false },
  { t: "Broker login", ok: false },
  { t: "Ticker symbols", ok: true },
  { t: "Number of shares", ok: true },
  { t: "Dividend history", ok: true },
];

export const S5Privacy: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 130, top: 190, width: 700 }}>
        <Kicker text="Privacy first" delay={4} />
        <div style={{ height: 20 }} />
        <Title text={"Personal details\nare ignored."} delay={12} size={78} />
        <div
          style={{
            marginTop: 30,
            fontFamily: body,
            fontSize: 30,
            color: C.muted,
            lineHeight: 1.4,
            opacity: interpolate(frame, [40, 60], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          Only what is needed to calculate dividends and the overall annual yield.
        </div>
      </div>
      <Panel
        delay={26}
        title="What is collected"
        style={{ position: "absolute", right: 140, top: 200, width: 720 }}
      >
        {items.map((it, i) => {
          const s = spring({
            frame: frame - (40 + i * 9),
            fps,
            config: { damping: 200 },
            durationInFrames: 22,
          });
          return (
            <div
              key={it.t}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 20,
                padding: "16px 8px",
                borderBottom:
                  i < items.length - 1 ? `1px solid ${C.panelLine}` : "none",
                opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [24, 0])}px)`,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  backgroundColor: it.ok
                    ? "rgba(79,157,106,0.2)"
                    : "rgba(201,86,75,0.2)",
                  color: it.ok ? C.green : C.red,
                  fontFamily: body,
                  fontWeight: 700,
                  fontSize: 26,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {it.ok ? "✓" : "✕"}
              </div>
              <div
                style={{
                  fontFamily: body,
                  fontSize: 32,
                  color: it.ok ? C.cream : C.muted,
                  textDecoration: it.ok ? "none" : "line-through",
                }}
              >
                {it.t}
              </div>
            </div>
          );
        })}
      </Panel>
      <Captions
        lines={[
          {
            from: 16,
            duration: 224,
            text: "Personal identifying information is ignored — only the data needed for dividends and yield is used.",
          },
        ]}
      />
    </AbsoluteFill>
  );
};
