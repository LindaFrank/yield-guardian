import React from "react";
import { AbsoluteFill } from "remotion";
import {
  linearTiming,
  springTiming,
  TransitionSeries,
} from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { wipe } from "@remotion/transitions/wipe";
import { S1Susan } from "./scenes/S1Susan";
import { S2Goal } from "./scenes/S2Goal";
import { S3Holdings } from "./scenes/S3Holdings";
import { S4Import } from "./scenes/S4Import";
import { S5Privacy } from "./scenes/S5Privacy";
import { S6Underperformers } from "./scenes/S6Underperformers";
import { S7Compare } from "./scenes/S7Compare";
import { S8Explainer } from "./scenes/S8Explainer";
import { S9Guest } from "./scenes/S9Guest";
import { S10Cta } from "./scenes/S10Cta";
import { SCENES, TRANSITION } from "./narration";
import { C } from "./theme";

const T = TRANSITION;

const wipeT = (
  <TransitionSeries.Transition
    presentation={wipe({ direction: "from-right" })}
    timing={springTiming({ config: { damping: 200 }, durationInFrames: T })}
  />
);

const fadeT = (
  <TransitionSeries.Transition
    presentation={fade()}
    timing={linearTiming({ durationInFrames: T })}
  />
);

export const MainVideo: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={SCENES.s1.duration}>
        <S1Susan />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence durationInFrames={SCENES.s2.duration}>
        <S2Goal />
      </TransitionSeries.Sequence>
      {wipeT}
      <TransitionSeries.Sequence durationInFrames={SCENES.s3.duration}>
        <S3Holdings />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence durationInFrames={SCENES.s4.duration}>
        <S4Import />
      </TransitionSeries.Sequence>
      {wipeT}
      <TransitionSeries.Sequence durationInFrames={SCENES.s5.duration}>
        <S5Privacy />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence durationInFrames={SCENES.s6.duration}>
        <S6Underperformers />
      </TransitionSeries.Sequence>
      {wipeT}
      <TransitionSeries.Sequence durationInFrames={SCENES.s7.duration}>
        <S7Compare />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence durationInFrames={SCENES.s8.duration}>
        <S8Explainer />
      </TransitionSeries.Sequence>
      {wipeT}
      <TransitionSeries.Sequence durationInFrames={SCENES.s9.duration}>
        <S9Guest />
      </TransitionSeries.Sequence>
      {fadeT}
      <TransitionSeries.Sequence durationInFrames={SCENES.s10.duration}>
        <S10Cta />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
