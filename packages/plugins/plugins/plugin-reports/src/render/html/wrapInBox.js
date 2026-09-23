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

// A block height sizes the canvas, but takumi's root element stays
// content-height inside it, so `height: 100%` in the markup has no definite
// parent to resolve against and a bordered tile ends up shorter than the box it
// was given. Wrapping the markup in a column of that exact height gives it one,
// which is what an author setting a height means: tiles in a row line up even
// when one of their labels wraps.
function wrapInBox({ html, width, height }) {
  if (height === undefined) return html;
  return `<div style="display: flex; flex-direction: column; width: ${width}px; height: ${height}px">${html}</div>`;
}

export default wrapInBox;
