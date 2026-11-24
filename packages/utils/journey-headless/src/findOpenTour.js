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

// The first of `blocks` that is a Tour the page shows open (its `open` is true and its own
// `visible` is not false), or undefined. rc-tour puts an open Tour's mask on the Escape stack of
// antd's portals and closes the Tour on every Escape, whichever overlay is on top, unless its
// keyboard is off; even then the mask changes which overlay is on top. A headless press models
// neither, so it leaves Escape to a browser while one is open (pressEscape).
function findOpenTour({ blocks }) {
  return blocks.find(
    (block) =>
      block.type === 'Tour' &&
      block.visibleEval?.output !== false &&
      block.eval.properties?.open === true
  );
}

export default findOpenTour;
