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
import { Kicker, Title } from "../components/Ui";
import { body, C } from "../theme";

const TICKERS = [
  "AAPL","JNJ","KO","PG","VZ","T","XOM","CVX","PFE","MRK","MMM","IBM",
  "O","MO","PM","ABBV","DUK","SO","PEP","MCD","HD","WMT","CSCO",
];

export const S3Holdings: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill>
      <Backdrop />
      <div style={{ position: "absolute", left: 130, top: 150 }}>
        <Kicker text="23 holdings" delay={4} />
        <div style={{ height: 18 }} />
        <Title text="Which ones are working?" delay={10} size={78} />
      </div>
      <div
        style={{
          position: "absolute",
          left: 130,
          top: 360,
          width: 1660,
          display: "flex",
          flexWrap: "wrap",
          gap: 18,
        }}
      >
        {TICKERS.map((t, i) => {
          const delay = 24 + i * 3;
          const s = spring({
            frame: frame - delay,
            fps,
            config: { damping: 14, stiffness: 180 },
            durationInFrames: 24,
          });
          const isAbbv = t === "ABBV";
          const highlight = isAbbv
            ? interpolate(frame, [150, 175], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
              })
            : 0;
          return (
            <div
              key={t}
              style={{
                padding: "20px 30px",
                borderRadius: 14,
                fontFamily: body,
                fontWeight: 700,
                fontSize: 38,
                color: C.cream,
                backgroundColor: `rgba(20,122,138,${0.12 + highlight * 0.2})`,
                border: `1px solid ${
                  highlight > 0.5 ? C.red : "rgba(63,179,195,0.3)"
                }`,
                opacity: s,
                transform: `scale(${interpolate(s, [0, 1], [0.7, 1])}) translateY(${
                  interpolate(s, [0, 1], [18, 0]) - highlight * 8
                }px)`,
              }}
            >
              {t}
            </div>
          );
        })}
      </div>
      <Captions lines={SCENES.s3.lines} />
    </AbsoluteFill>
  );
};
