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

import { escapeId } from './escapeId.js';

// The locator contract, in resolution order:
//   1. `[data-testid="<blockId>"]` — the block's own root element. Every block that
//      follows the block root contract renders it through `blockRootProps`, so the
//      element that carries the app author's `class:` and `style:` is the element a
//      test addresses.
//   2. `#bl-<blockId>` — the layout wrapper, used only when no root inside it carries
//      the test id: the blocks exempt from the contract (Icon, Throw, GoogleMapsScript),
//      a block whose root is routed into a portal, and any third-party block that has
//      not adopted the contract.
// The two alternatives exclude each other for a root rendered in place, so the union
// resolves to exactly one element. A root rendered into a portal matches the first while
// the wrapper still matches the second; `.first()` then resolves to the wrapper, which is
// the element that stays where the block sits in the layout — what a test on such a block
// has always addressed.
function getBlock(page, blockId) {
  // A block id may hold characters that need different escaping in an attribute value
  // (a quote, a backslash) than in an id selector; JSON.stringify produces exactly the
  // quoted, escaped string form a CSS attribute selector takes.
  const testId = `[data-testid=${JSON.stringify(blockId)}]`;
  return page.locator(`${testId}, #bl-${escapeId(blockId)}:not(:has(${testId}))`).first();
}

export { getBlock };
