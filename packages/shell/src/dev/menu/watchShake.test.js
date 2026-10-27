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

import { jest } from '@jest/globals';

import watchShake from './watchShake.js';

function setup() {
  let listener = null;
  let time = 0;
  const onShake = jest.fn();
  const stop = watchShake({
    accelerometer: {
      setUpdateInterval: jest.fn(),
      addListener: (fn) => {
        listener = fn;
        return { remove: jest.fn() };
      },
    },
    now: () => time,
    onShake,
  });
  function read(g, at) {
    time = at;
    listener({ x: g, y: 0, z: 0 });
  }
  return { onShake, read, stop };
}

test('three jolts within 0.8 s open the menu once, then it rests for 1.5 s', () => {
  const { onShake, read } = setup();
  read(2.5, 0);
  read(2.5, 200);
  expect(onShake).not.toHaveBeenCalled();
  read(2.5, 400);
  expect(onShake).toHaveBeenCalledTimes(1);
  [500, 600, 700].forEach((at) => read(2.5, at));
  expect(onShake).toHaveBeenCalledTimes(1);
  [2000, 2100, 2200].forEach((at) => read(2.5, at));
  expect(onShake).toHaveBeenCalledTimes(2);
});

test('a phone at rest, or jolts spread out, do not open the menu', () => {
  const { onShake, read } = setup();
  [0, 100, 200, 300].forEach((at) => read(1, at));
  [1000, 2000, 3000].forEach((at) => read(2.5, at));
  expect(onShake).not.toHaveBeenCalled();
});
