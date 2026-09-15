import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { body, display, C } from "../theme";

export const Panel: React.FC<{
  title?: string;
  delay?: number;
  style?: React.CSSProperties;
  children?: React.ReactNode;
}> = ({ title, delay = 0, style, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: 26,
  });
  return (
    <div
      style={{
        backgroundColor: C.panel,
        border: `1px solid ${C.panelLine}`,
        borderRadius: 18,
        boxShadow: "0 30px 70px rgba(0,0,0,0.45)",
        padding: 28,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [34, 0])}px)`,
        ...style,
      }}
    >
      {title ? (
        <div
          style={{
            fontFamily: body,
            fontSize: 20,
            letterSpacing: 2.4,
            textTransform: "uppercase",
            color: C.muted,
            marginBottom: 18,
          }}
        >
          {title}
        </div>
      ) : null}
      {children}
    </div>
  );
};

export const Stat: React.FC<{
  label: string;
  value: string;
  color?: string;
  size?: number;
}> = ({ label, value, color = C.cream, size = 62 }) => (
  <div>
    <div
      style={{
        fontFamily: body,
        fontSize: 22,
        color: C.muted,
        marginBottom: 6,
      }}
    >
      {label}
    </div>
    <div
      style={{
        fontFamily: display,
        fontWeight: 700,
        fontSize: size,
        color,
        letterSpacing: -1.5,
      }}
    >
      {value}
    </div>
  </div>
);

export const Row: React.FC<{
  ticker: string;
  shares: string;
  yieldPct: string;
  bad?: boolean;
  masked?: boolean;
  delay?: number;
}> = ({ ticker, shares, yieldPct, bad, masked, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: 20,
  });
  const mask = (t: string) => (masked ? "•".repeat(Math.max(3, t.length)) : t);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "14px 18px",
        marginBottom: 10,
        borderRadius: 12,
        backgroundColor: bad ? "rgba(201,86,75,0.14)" : "rgba(255,255,255,0.04)",
        border: `1px solid ${bad ? "rgba(201,86,75,0.55)" : C.panelLine}`,
        opacity: s,
        transform: `translateX(${interpolate(s, [0, 1], [-26, 0])}px)`,
        fontFamily: body,
        color: C.cream,
        fontSize: 28,
      }}
    >
      <span
        style={{
          width: 150,
          fontWeight: 700,
          filter: masked ? "blur(6px)" : undefined,
        }}
      >
        {mask(ticker)}
      </span>
      <span
        style={{
          width: 190,
          color: C.muted,
          filter: masked ? "blur(6px)" : undefined,
        }}
      >
        {mask(shares)}
      </span>
      <span
        style={{
          width: 120,
          textAlign: "right",
          color: bad ? C.red : C.green,
          fontWeight: 700,
        }}
      >
        {yieldPct}
      </span>
    </div>
  );
};

export const Button: React.FC<{
  label: string;
  delay?: number;
  color?: string;
  pulse?: boolean;
}> = ({ label, delay = 0, color = C.teal, pulse = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 12, stiffness: 160 },
    durationInFrames: 30,
  });
  const glow = pulse ? 0.4 + 0.35 * (1 + Math.sin((frame - delay) / 9)) : 0.5;
  return (
    <div
      style={{
        display: "inline-block",
        padding: "18px 34px",
        borderRadius: 12,
        backgroundColor: color,
        color: "#ffffff",
        fontFamily: body,
        fontWeight: 700,
        fontSize: 30,
        transform: `scale(${interpolate(s, [0, 1], [0.86, 1])})`,
        opacity: Math.min(1, s * 1.4),
        boxShadow: `0 0 ${18 + glow * 26}px rgba(63,179,195,${
          0.25 + glow * 0.3
        })`,
      }}
    >
      {label}
    </div>
  );
};

export const Kicker: React.FC<{ text: string; delay?: number }> = ({
  text,
  delay = 0,
}) => {
  const frame = useCurrentFrame();
  const o = interpolate(frame - delay, [0, 12], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  return (
    <div
      style={{
        fontFamily: body,
        fontSize: 24,
        letterSpacing: 5,
        textTransform: "uppercase",
        color: C.tealLight,
        opacity: o,
      }}
    >
      {text}
    </div>
  );
};

export const Title: React.FC<{
  text: string;
  delay?: number;
  size?: number;
}> = ({ text, delay = 0, size = 92 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({
    frame: frame - delay,
    fps,
    config: { damping: 200 },
    durationInFrames: 30,
  });
  return (
    <div
      style={{
        fontFamily: display,
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1.06,
        letterSpacing: -2.5,
        color: C.cream,
        opacity: s,
        transform: `translateY(${interpolate(s, [0, 1], [30, 0])}px)`,
      }}
    >
      {text}
    </div>
  );
};
