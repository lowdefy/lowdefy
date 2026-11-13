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

import openCamera from './openCamera.js';

function createMediaDevices({ torch }) {
  const track = {
    applyConstraints: vi.fn(async () => {}),
    getCapabilities: () => (torch ? { torch: true } : {}),
  };
  const stream = { getVideoTracks: () => [track] };
  return {
    mediaDevices: { getUserMedia: vi.fn(async () => stream) },
    stream,
    track,
  };
}

test('openCamera asks for the facing camera at the aspect ratio, without audio', async () => {
  const { mediaDevices, stream } = createMediaDevices({ torch: false });
  const result = await openCamera({ aspectRatio: 1, facingMode: 'environment', mediaDevices });
  expect(result).toBe(stream);
  expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({
    audio: false,
    video: { facingMode: 'environment', aspectRatio: { ideal: 1 } },
  });
});

test('openCamera asks for an exact camera when deviceId is set', async () => {
  const { mediaDevices } = createMediaDevices({ torch: false });
  await openCamera({ aspectRatio: 1, deviceId: 'cam-2', facingMode: 'environment', mediaDevices });
  expect(mediaDevices.getUserMedia).toHaveBeenCalledWith({
    audio: false,
    video: { deviceId: { exact: 'cam-2' }, aspectRatio: { ideal: 1 } },
  });
});

test('openCamera turns the torch on only where the camera has one', async () => {
  const withTorch = createMediaDevices({ torch: true });
  await openCamera({ aspectRatio: 1, mediaDevices: withTorch.mediaDevices, torch: true });
  expect(withTorch.track.applyConstraints).toHaveBeenCalledWith({ advanced: [{ torch: true }] });

  const withoutTorch = createMediaDevices({ torch: false });
  await openCamera({ aspectRatio: 1, mediaDevices: withoutTorch.mediaDevices, torch: true });
  expect(withoutTorch.track.applyConstraints).not.toHaveBeenCalled();
});

test('openCamera throws a SecurityError when the page cannot use the camera', async () => {
  await expect(openCamera({ aspectRatio: 1, mediaDevices: undefined })).rejects.toMatchObject({
    name: 'SecurityError',
  });
});
