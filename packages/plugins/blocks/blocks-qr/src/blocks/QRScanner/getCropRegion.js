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

import toBoxSize from './toBoxSize.js';

// The part of the camera frame to read, in video pixels. qrbox is in screen pixels on the video
// as drawn (full width, height from the frame's shape), so it scales by the frame's width over
// the drawn width. A box larger than the frame is clipped to it.
function getCropRegion({ displayWidth, qrbox, videoHeight, videoWidth }) {
  const box = toBoxSize({ qrbox });
  const scale = videoWidth / displayWidth;
  const width = Math.round(Math.min(box.width * scale, videoWidth));
  const height = Math.round(Math.min(box.height * scale, videoHeight));
  return {
    x: Math.round((videoWidth - width) / 2),
    y: Math.round((videoHeight - height) / 2),
    width,
    height,
  };
}

export default getCropRegion;
