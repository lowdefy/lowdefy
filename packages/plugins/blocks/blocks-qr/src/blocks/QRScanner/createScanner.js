/*
  Copyright 2020-2026 Lowdefy, Inc

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/

import { type } from '@lowdefy/helpers';

import createDetector from './createDetector.js';
import getCameraError from './getCameraError.js';
import getCropRegion from './getCropRegion.js';
import openCamera from './openCamera.js';
import toScanType from './toScanType.js';

// HTMLMediaElement.HAVE_CURRENT_DATA: the video has a frame to read.
const HAVE_CURRENT_DATA = 2;

// A frame can be read once the video has one, and, with a qrbox, once the video is drawn: qrbox is
// in screen pixels, so the crop needs the drawn width, which is 0 until the block shows the video.
function isFrameReady({ canvas, video }) {
  if (video.readyState < HAVE_CURRENT_DATA) {
    return false;
  }
  return type.isNone(canvas) || video.clientWidth > 0;
}

function getFrame({ canvas, qrbox, video }) {
  if (type.isNone(canvas)) {
    return video;
  }
  const region = getCropRegion({
    displayWidth: video.clientWidth,
    qrbox,
    videoHeight: video.videoHeight,
    videoWidth: video.videoWidth,
  });
  canvas.width = region.width;
  canvas.height = region.height;
  canvas
    .getContext('2d')
    .drawImage(
      video,
      region.x,
      region.y,
      region.width,
      region.height,
      0,
      0,
      region.width,
      region.height
    );
  return canvas;
}

function getArea({ boundingBox }) {
  return boundingBox.width * boundingBox.height;
}

// Runs one camera session at a time: start opens the camera and reads a frame every 1/fps
// seconds, never starting a read before the last one finished; stop ends the session and
// releases the camera. A start while a session runs, or a stop with none, does nothing, so
// React's mount, unmount and remount in development leaves one session.
function createScanner({ getProperties, getVideo, onError, onPlaying, onRead }) {
  let session = null;

  function stop() {
    if (session === null) {
      return;
    }
    session.stopped = true;
    clearTimeout(session.timer);
    (session.stream?.getTracks() ?? []).forEach((track) => track.stop());
    const video = getVideo();
    if (!type.isNone(video)) {
      video.srcObject = null;
    }
    session = null;
    onPlaying(false);
  }

  // An error from a session that was already stopped is not reported: stopping it is what
  // aborts its video.play() or leaves its last read without a frame.
  function fail(current, error) {
    if (current.stopped) {
      return;
    }
    stop();
    onError(getCameraError({ error }));
  }

  function readFrames({ current, detector, properties }) {
    const canvas = type.isNone(properties.qrbox) ? null : document.createElement('canvas');
    async function read() {
      const video = getVideo();
      if (isFrameReady({ canvas, video })) {
        const codes = await detector.detect(getFrame({ canvas, qrbox: properties.qrbox, video }));
        if (current.stopped) {
          return;
        }
        codes
          .sort((a, b) => getArea(b) - getArea(a))
          .forEach((code) =>
            onRead({ data: code.rawValue, type: toScanType({ format: code.format }) })
          );
      }
      if (!current.stopped) {
        current.timer = setTimeout(run, 1000 / properties.fps);
      }
    }
    function run() {
      read().catch((error) => fail(current, error));
    }
    run();
  }

  async function start() {
    if (session !== null) {
      return;
    }
    const current = { stopped: false, stream: null, timer: null };
    session = current;
    const properties = getProperties();
    try {
      // Together, so the permission prompt and the camera do not wait for the ponyfill download.
      // allSettled, not all: a camera that opens after the detector failed must still be released.
      const [detectorResult, streamResult] = await Promise.allSettled([
        createDetector({ types: properties.types }),
        openCamera({
          aspectRatio: properties.aspectRatio,
          deviceId: properties.deviceId,
          facingMode: properties.facingMode,
          mediaDevices: navigator.mediaDevices,
          torch: properties.torch,
        }),
      ]);
      if (streamResult.status === 'fulfilled') {
        current.stream = streamResult.value;
      }
      if (current.stopped) {
        (current.stream?.getTracks() ?? []).forEach((track) => track.stop());
        return;
      }
      // The camera's error first: a denied permission is what the user can act on.
      if (streamResult.status === 'rejected') {
        throw streamResult.reason;
      }
      if (detectorResult.status === 'rejected') {
        throw detectorResult.reason;
      }
      const detector = detectorResult.value;
      const stream = streamResult.value;
      // The browser ends the track when the camera goes away under the scanner: unplugged,
      // taken by another app, or (iOS) the phone locked. Without this the video freezes on its
      // last frame and the scanner keeps reading it. stop() ending the track fires no event.
      stream.getVideoTracks().forEach((track) =>
        track.addEventListener('ended', () => {
          const error = new Error('The camera stopped.');
          error.name = 'CameraEndedError';
          fail(current, error);
        })
      );
      const video = getVideo();
      video.srcObject = stream;
      await video.play();
      if (current.stopped) {
        return;
      }
      onPlaying(true);
      readFrames({ current, detector, properties });
    } catch (error) {
      fail(current, error);
    }
  }

  return { start, stop };
}

export default createScanner;
