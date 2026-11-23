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

// The width of the browser runner's page (server-dev runJourney's default viewport), which every
// journey `lowdefy test` and the journey route run in the browser uses.
const RUNNER_WIDTH = 1280;
// Tailwind's breakpoints: a `md:` utility applies from 768px, a `max-md:` one below it.
const BREAKPOINTS = { sm: 640, md: 768, lg: 1024, xl: 1280, '2xl': 1536 };

// Whether one variant of a class token applies at the runner's width: true or false for a
// breakpoint (sm: to 2xl:, max-sm: to max-2xl:, min-[Npx]: and max-[Npx]:), null for any other
// (hover:, dark:, a breakpoint the app names itself), which the run cannot tell.
function readVariant(variant) {
  if (Object.hasOwn(BREAKPOINTS, variant)) return RUNNER_WIDTH >= BREAKPOINTS[variant];
  const named = variant.match(/^max-(sm|md|lg|xl|2xl)$/);
  if (named !== null) return RUNNER_WIDTH < BREAKPOINTS[named[1]];
  const arbitrary = variant.match(/^(min|max)-\[(\d+(?:\.\d+)?)px\]$/);
  if (arbitrary !== null) {
    const width = Number(arbitrary[2]);
    return arbitrary[1] === 'min' ? RUNNER_WIDTH >= width : RUNNER_WIDTH < width;
  }
  return null;
}

// A class token as Tailwind reads it at the browser runner's width: { utility, applies }, the
// utility after its variants and whether it applies there (true, false, or null when a variant
// is no breakpoint), so `max-[899px]:hidden` does not hide at 1280px and `min-[900px]:hidden`
// may.
function readClassToken(token) {
  const parts = token.split(':');
  const utility = parts.pop();
  let applies = true;
  for (const variant of parts) {
    const read = readVariant(variant);
    if (read === false) return { utility, applies: false };
    if (read === null) applies = null;
  }
  return { utility, applies };
}

// Whether any of an element's (or a block's) class tokens may apply a utility `pattern` names at
// the runner's width.
function mayApplyClass({ tokens, pattern }) {
  return tokens.some((token) => {
    const { utility, applies } = readClassToken(token);
    return applies !== false && pattern.test(utility);
  });
}

export { mayApplyClass, RUNNER_WIDTH };
export default readClassToken;
