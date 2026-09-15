import { bundle } from "@remotion/bundler";
import {
  renderMedia,
  renderStill,
  selectComposition,
  openBrowser,
} from "@remotion/renderer";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const stillsArg = args.find((a) => a.startsWith("--stills="));
const rangeArg = args.find((a) => a.startsWith("--range="));
const outArg = args.find((a) => a.startsWith("--out="));

const bundled = await bundle({
  entryPoint: path.resolve(__dirname, "../src/index.ts"),
  webpackOverride: (c) => c,
});

const browser = await openBrowser("chrome", {
  browserExecutable: process.env.PUPPETEER_EXECUTABLE_PATH ?? "/bin/chromium",
  chromiumOptions: {
    args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  },
  chromeMode: "chrome-for-testing",
});

const composition = await selectComposition({
  serveUrl: bundled,
  id: "main",
  puppeteerInstance: browser,
});

if (stillsArg) {
  const frames = stillsArg.split("=")[1].split(",").map(Number);
  for (const f of frames) {
    await renderStill({
      composition,
      serveUrl: bundled,
      frame: f,
      output: `/tmp/qa/frame-${f}.png`,
      puppeteerInstance: browser,
    });
    console.log("still", f);
  }
} else {
  const frameRange = rangeArg
    ? rangeArg.split("=")[1].split("-").map(Number)
    : undefined;
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: "h264",
    crf: 20,
    outputLocation: outArg ? outArg.split("=")[1] : "/mnt/documents/susan.mp4",
    puppeteerInstance: browser,
    muted: true,
    concurrency: 4,
    frameRange,
    onProgress: ({ progress }) => {
      if (Math.round(progress * 100) % 10 === 0)
        console.log("progress", Math.round(progress * 100));
    },
  });
}

await browser.close({ silent: false });
console.log("done");
