import { loadFont as loadSora } from "@remotion/google-fonts/Sora";
import { loadFont as loadManrope } from "@remotion/google-fonts/Manrope";

export const display = loadSora("normal", {
  weights: ["600", "700"],
  subsets: ["latin"],
}).fontFamily;

export const body = loadManrope("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
}).fontFamily;

export const C = {
  bg: "#08161d",
  bg2: "#0d2430",
  panel: "#102b37",
  panelLine: "#1d4653",
  teal: "#147a8a",
  tealLight: "#3fb3c3",
  cream: "#f2ece1",
  muted: "#9fb7bf",
  gold: "#d9a441",
  red: "#c9564b",
  green: "#4f9d6a",
};
