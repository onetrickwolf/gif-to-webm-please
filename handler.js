const serverless = require("serverless-http");
const express = require("express");
const app = express();

const fs = require("fs");
const https = require("https");
const { spawnSync } = require("child_process");
const { randomUUID } = require("crypto");

app.get("/", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from root!",
  });
});

app.get("/hello", (req, res, next) => {
  return res.status(200).json({
    message: "Hello from path!",
  });
});

app.get("/convert", (req, res, next) => {
  if (!req.query.gif) {
    return res.status(400).json({ error: "Required query params missing" });
  }
  // let gif = 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_447df256f3b1412b9fa0dfd3e9b6d84c/default/dark/3.0';
  let gif = req.query.gif;
  let gif_path = `/tmp/${randomUUID()}.gif`;
  let webm_path = `/tmp/${randomUUID()}.webm`;

  // TODO: Replace callback hell with promises maybe use got or node-fetch
  https
    .get(gif, (res) => {
      const writeStream = fs.createWriteStream(gif_path);
      res.pipe(writeStream);
      writeStream.on("finish", () => {
        writeStream.close();
        console.info("GIF Download Completed");
        convert();
      });
    })
    .on("error", (err) => {
      console.error(err.message);
      return res.status(500).send(err.message);
    });

  function convert() {
    const ffmpeg = spawnSync(
      "/opt/bin/ffmpeg",
      [
        "-y",
        "-i",
        gif_path,
        "-c:v",
        "libvpx",
        "-qmin",
        "0",
        "-qmax",
        "18",
        "-crf",
        "9",
        "-b:v",
        "1400K",
        "-quality",
        "good",
        "-cpu-used",
        "0",
        "-auto-alt-ref",
        "0",
        "-pix_fmt",
        "yuva420p",
        "-an",
        "-sn",
        webm_path,
      ],
      {
        // stdio: ['ignore', 1, 2]
      }
    );

    const image = fs.readFileSync(webm_path);

    res.set({
      "Content-Type": "video/webm",
      "Access-Control-Allow-Headers": "Content-Type",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "OPTffmpegIONS,POST,GET",
      isBase64Encoded: true,
    });

    return res.status(200).send(image.toString("base64"));
  }
});

app.use((req, res, next) => {
  return res.status(404).json({
    error: "Not Found",
  });
});

module.exports.handler = serverless(app);
