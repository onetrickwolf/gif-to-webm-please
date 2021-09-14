"use strict";
const fs = require("fs");
const https = require("https");
const { spawnSync } = require("child_process");
const { randomUUID } = require("crypto");

module.exports.gif2webm = (event, context, callback) => {
  // let gif = 'https://static-cdn.jtvnw.net/emoticons/v2/emotesv2_447df256f3b1412b9fa0dfd3e9b6d84c/default/dark/3.0';
  let gif = event.queryStringParameters?.gif;
  if (gif === undefined) {
    return {
      statusCode: 400,
      headers: { "Content-Type": "text/plain" },
      body: "Required query params missing.",
    };
  }
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
      return {
        statusCode: err.statusCode || 500,
        headers: { "Content-Type": "text/plain" },
        body: err.message,
      };
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
    const response = {
      statusCode: 200,
      headers: {
        "Content-Type": "video/webm",
      },
      body: image.toString("base64"),
      isBase64Encoded: true,
    };
    callback(null, response);
  }
};
