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

function createPageRegistry({ components, context }) {
  const registry = new Map();

  (components.pages ?? []).forEach((page) => {
    // Read ~r from keyMap — addKeys moves ~r there and deletes it from objects.
    const refId = context.keyMap[page['~k']]?.['~r'] ?? null;
    registry.set(page.id, {
      pageId: page.id,
      auth: page.auth,
      refId,
      shallow: !!page['~shallow'],
    });
  });

  return registry;
}

export default createPageRegistry;
