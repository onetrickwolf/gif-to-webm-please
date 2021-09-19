"use strict";
const fs = require("fs");
const https = require("https");
const { spawnSync } = require("child_process");
const { randomUUID } = require("crypto");

module.exports.gif2webm = async (event, context, callback) => {
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

  // TODO: making https.get a promise within a lambda sucks, was trying avoid libraries but this could be easier to read

  const promise = new Promise(function (resolve, reject) {
    https
      .get(gif, (res) => {
        if (res.statusCode !== 200) {
          resolve({
            statusCode: 404,
            headers: { "Content-Type": "text/plain" },
            body: "GIF does not exist",
          });
        } else {
          const writeStream = fs.createWriteStream(gif_path);
          res.pipe(writeStream);
          writeStream.on("finish", () => {
            writeStream.close();
            if (exists(gif_path)) {
              console.info("GIF Download Completed");
              convert(resolve, reject);
            } else {
              resolve({
                statusCode: 404,
                headers: { "Content-Type": "text/plain" },
                body: "GIF could not be downloaded",
              });
            }
          });
        }
      })
      .on("error", (err) => {
        console.error(err.message);
        resolve({
          statusCode: err.statusCode || 500,
          headers: { "Content-Type": "text/plain" },
          body: err.message,
        });
      });
  });

  function exists(filePath) {
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const fileSizeInBytes = stats.size;

      if (fileSizeInBytes > 0) {
        console.info(
          `${filePath} exists and is ${fileSizeInBytes} bytes in size`
        );
        return true;
      } else {
        console.error(`${filePath} exists but is 0 bytes in size`);
        return false;
      }
    } else {
      console.error(`${filePath} does not exist`);
      return false;
    }
  }

  function convert(resolve, reject) {
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

    if (exists(webm_path)) {
      const image = fs.readFileSync(webm_path);
      const response = {
        statusCode: 200,
        headers: {
          "Content-Type": "video/webm",
          "Access-Control-Allow-Origin": "*",
        },
        body: image.toString("base64"),
        isBase64Encoded: true,
      };
      resolve(response);
    } else {
      resolve({
        statusCode: 500,
        headers: { "Content-Type": "text/plain" },
        body: "WebM conversion failed",
      });
    }
  }

  return promise;
};
