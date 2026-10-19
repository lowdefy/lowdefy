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

// The breakpoints of the _media size, matching Tailwind CSS. The engine diffs the same values on a
// resize, so a block that reads _media: size re-evaluates only when the breakpoint changes.
const breakpoints = [
  { size: 'xs', below: 640 },
  { size: 'sm', below: 768 },
  { size: 'md', below: 1024 },
  { size: 'lg', below: 1280 },
  { size: 'xl', below: 1536 },
];

function getMediaViewport({ window }) {
  const breakpoint = breakpoints.find(({ below }) => window.innerWidth < below);
  return {
    size: breakpoint?.size ?? '2xl',
    width: window.innerWidth,
    height: window.innerHeight,
  };
}

export default getMediaViewport;
