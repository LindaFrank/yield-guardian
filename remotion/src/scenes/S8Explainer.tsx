import React from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { SCENES } from "../narration";
import { Backdrop } from "../components/Backdrop";
import { Captions } from "../components/Caption";
import { Kicker, Panel, Title } from "../components/Ui";
import { body, display, C } from "../theme";

const lines = [
  ["Quarters remaining this year", "2"],
  ["Dividend per share, per quarter", "$1.66"],
  ["Shares held", "140"],
  ["Rest-of-year dividends if kept", "$464.80"],
  ["Rest-of-year dividends if switched", "$2,580.08"],
];

export const S8Explainer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 130, top: 170, width: 640 }}>
        <Kicker text="What does this mean?" delay={4} />
        <div style={{ height: 18 }} />
        <Title text={"The math,\nshown plainly."} delay={10} size={76} />
        <div
          style={{
            marginTop: 28,
            fontFamily: body,
            fontSize: 28,
            color: C.muted,
            lineHeight: 1.45,
            opacity: interpolate(frame, [36, 56], [0, 1], {
              extrapolateLeft: "clamp",
              extrapolateRight: "clamp",
            }),
          }}
        >
          An explainer walks through how the year-end dividend figures are calculated.
        </div>
      </div>
      <Panel
        title="Rest-of-year calculation"
        delay={22}
        style={{ position: "absolute", right: 130, top: 190, width: 900 }}
      >
        {lines.map((l, i) => {
          const s = spring({
            frame: frame - (40 + i * 12),
            fps,
            config: { damping: 200 },
            durationInFrames: 22,
          });
          const isLast = i >= lines.length - 2;
          return (
            <div
              key={l[0]}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                padding: "18px 6px",
                borderBottom:
                  i < lines.length - 1 ? `1px solid ${C.panelLine}` : "none",
                opacity: s,
                transform: `translateY(${interpolate(s, [0, 1], [14, 0])}px)`,
              }}
            >
              <span style={{ fontFamily: body, fontSize: 28, color: C.muted }}>
                {l[0]}
              </span>
              <span
                style={{
                  fontFamily: display,
                  fontWeight: 700,
                  fontSize: isLast ? 42 : 34,
                  color: isLast ? (i === lines.length - 1 ? C.tealLight : C.gold) : C.cream,
                }}
              >
                {l[1]}
              </span>
            </div>
          );
        })}
      </Panel>
      <Captions lines={SCENES.s8.lines} />
    </AbsoluteFill>
  );
};
