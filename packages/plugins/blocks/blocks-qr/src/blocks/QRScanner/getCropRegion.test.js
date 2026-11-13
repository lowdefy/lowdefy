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

import { expect, test } from 'vitest';

import getCropRegion from './getCropRegion.js';

test('getCropRegion scales a square qrbox from screen to video pixels and centres it', () => {
  expect(
    getCropRegion({ displayWidth: 320, qrbox: 160, videoHeight: 480, videoWidth: 640 })
  ).toEqual({ x: 160, y: 80, width: 320, height: 320 });
});

test('getCropRegion takes a { width, height } qrbox', () => {
  expect(
    getCropRegion({
      displayWidth: 640,
      qrbox: { width: 300, height: 100 },
      videoHeight: 480,
      videoWidth: 640,
    })
  ).toEqual({ x: 170, y: 190, width: 300, height: 100 });
});

test('getCropRegion clips a qrbox larger than the frame to the frame', () => {
  expect(
    getCropRegion({ displayWidth: 320, qrbox: 400, videoHeight: 480, videoWidth: 640 })
  ).toEqual({ x: 0, y: 0, width: 640, height: 480 });
});
