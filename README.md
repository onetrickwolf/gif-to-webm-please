# GIF to WebM Serverless Lambda API

Uses FFmpeg to convert animated GIFs to WebM video files on demand.

## Motivation

- Most renderers like Three.js or PixiJS do not support GIFs as textures but support video files.
- WebMs can massively reduce file size.
- Generally more performant than existing methods of parsing and loading GIFs as textures.

[//]: # (TODO: insert gif webm comparison)

I specifically made this API in order to dynamically load Twitch and BTTV animated emotes into PixiJS for streamer
overlays. There were some existing methods but the performance generally suffered when trying to load thousands of
emotes.

### Known Issues

- Delay on the last frame gets dropped. This can cause the loop timing of some animations to be off. This is
  a [known issue with FFMPEG.](https://trac.ffmpeg.org/ticket/6294#comment:6) Working on implementing fix for next
  release.

### Roadmap

- Would like to eventually implemented this with [FFmpeg WASM](https://github.com/ffmpegwasm/ffmpeg.wasm) as well so
  conversion can be done completely in browser.
- Add caching to cache previously requested URLs.
- I plan to restrict public API to only convert URLs from Twitch and BTTV to prevent general usage making my AWS 
  bill go crazy