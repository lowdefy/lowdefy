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

// Referenced from config with `_js: { fn: ./lib/items.js#summarizeItem }` so the
// canary exercises module references, not only inline bodies.
export function summarizeItem({ args }) {
  const { name, category, quantity } = args.item ?? {};
  if (!name) {
    return '';
  }
  return `${quantity} x ${name} (${category})`;
}

export function countLabel({ args }) {
  const total = args.total ?? 0;
  if (total === 1) {
    return '1 item';
  }
  return `${total} items`;
}
