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

import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

// Anti-aliasing and font hinting shift a few pixels between two renders of an
// identical page; pixelmatch's per-pixel colour threshold absorbs those, and
// the changed-pixel fraction is what --pixel-tolerance is compared against.
const PIXEL_THRESHOLD = 0.1;

// diffScreenshot compares two PNG buffers. Returns { changed, changedPixels,
// totalPixels, fraction, message, diff } where diff is a PNG buffer highlighting
// the changed pixels (only when the images could be compared). Differing
// dimensions are drift with a message, never a throw: a layout that grew is
// exactly the kind of change a check exists to catch.
function diffScreenshot({ expected, actual, tolerance = 0.001 }) {
  const expectedPng = PNG.sync.read(expected);
  const actualPng = PNG.sync.read(actual);
  if (expectedPng.width !== actualPng.width || expectedPng.height !== actualPng.height) {
    return {
      changed: true,
      changedPixels: undefined,
      totalPixels: undefined,
      fraction: 1,
      message: `screenshot size changed from ${expectedPng.width}x${expectedPng.height} to ${actualPng.width}x${actualPng.height}`,
    };
  }
  const { width, height } = expectedPng;
  const diffPng = new PNG({ width, height });
  const changedPixels = pixelmatch(expectedPng.data, actualPng.data, diffPng.data, width, height, {
    threshold: PIXEL_THRESHOLD,
  });
  const totalPixels = width * height;
  const fraction = changedPixels / totalPixels;
  const changed = fraction > tolerance;
  const percent = (fraction * 100).toFixed(3);
  return {
    changed,
    changedPixels,
    totalPixels,
    fraction,
    message: changed
      ? `screenshot changed: ${changedPixels} of ${totalPixels} pixels (${percent}%) differ, tolerance ${
          tolerance * 100
        }%`
      : `screenshot unchanged (${changedPixels} pixels within tolerance)`,
    diff: changed ? PNG.sync.write(diffPng) : undefined,
  };
}

export default diffScreenshot;
