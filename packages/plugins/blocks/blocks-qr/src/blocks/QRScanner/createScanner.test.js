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

import { expect, test, vi } from 'vitest';

const createDetector = vi.fn();
const openCamera = vi.fn();

vi.doMock('./createDetector.js', () => ({ default: createDetector }));
vi.doMock('./openCamera.js', () => ({ default: openCamera }));

function createDeferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function createStream() {
  const track = new EventTarget();
  track.stop = vi.fn();
  return { track, getTracks: () => [track], getVideoTracks: () => [track] };
}

function createVideo() {
  return { play: vi.fn(async () => {}), readyState: 0, srcObject: null };
}

async function setup() {
  const { default: createScanner } = await import('./createScanner.js');
  const onError = vi.fn();
  const onPlaying = vi.fn();
  const video = createVideo();
  const scanner = createScanner({
    getProperties: () => ({ aspectRatio: 1, facingMode: 'environment', fps: 10, torch: false }),
    getVideo: () => video,
    onError,
    onPlaying,
    onRead: vi.fn(),
  });
  return { onError, onPlaying, scanner, video };
}

test('createScanner opens the camera while the detector is still loading', async () => {
  const detector = createDeferred();
  createDetector.mockReturnValue(detector.promise);
  openCamera.mockResolvedValue(createStream());
  const { onPlaying, scanner } = await setup();
  const started = scanner.start();
  expect(openCamera).toHaveBeenCalledTimes(1);
  detector.resolve({ detect: async () => [] });
  await started;
  expect(onPlaying).toHaveBeenCalledWith(true);
  scanner.stop();
});

test('createScanner releases the camera and reports the error when the detector fails to load', async () => {
  const stream = createStream();
  createDetector.mockRejectedValue(new Error('Failed to fetch'));
  openCamera.mockResolvedValue(stream);
  const { onError, onPlaying, scanner } = await setup();
  await scanner.start();
  expect(stream.track.stop).toHaveBeenCalled();
  expect(onPlaying).not.toHaveBeenCalledWith(true);
  expect(onError).toHaveBeenCalledWith({ name: 'Error', message: 'Failed to fetch' });
});

test('createScanner reports the camera error before a detector error', async () => {
  const denied = new Error('Permission denied');
  denied.name = 'NotAllowedError';
  createDetector.mockRejectedValue(new Error('Failed to fetch'));
  openCamera.mockRejectedValue(denied);
  const { onError, scanner } = await setup();
  await scanner.start();
  expect(onError).toHaveBeenCalledTimes(1);
  expect(onError).toHaveBeenCalledWith({
    name: 'NotAllowedError',
    message: 'Camera permission was denied.',
  });
});

test('createScanner stops and reports CameraEndedError when the camera track ends', async () => {
  const stream = createStream();
  createDetector.mockResolvedValue({ detect: async () => [] });
  openCamera.mockResolvedValue(stream);
  const { onError, onPlaying, scanner, video } = await setup();
  await scanner.start();
  stream.track.dispatchEvent(new Event('ended'));
  expect(onError).toHaveBeenCalledWith({
    name: 'CameraEndedError',
    message: 'The camera stopped.',
  });
  expect(onPlaying).toHaveBeenLastCalledWith(false);
  expect(video.srcObject).toBe(null);
});

test('createScanner reports nothing when the track ends after the scanner was stopped', async () => {
  const stream = createStream();
  createDetector.mockResolvedValue({ detect: async () => [] });
  openCamera.mockResolvedValue(stream);
  const { onError, scanner } = await setup();
  await scanner.start();
  scanner.stop();
  stream.track.dispatchEvent(new Event('ended'));
  expect(onError).not.toHaveBeenCalled();
});
