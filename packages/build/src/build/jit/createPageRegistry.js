/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { serializer } from '@lowdefy/helpers';

function createPageRegistry({ components }) {
  const registry = new Map();

  for (const page of components.pages ?? []) {
    // Deep copy raw content fields so the shallow components object can be modified
    // independently (e.g., by skeleton build steps)
    registry.set(page.id, {
      pageId: page.id,
      auth: page.auth,
      type: page.type,
      refId: page['~r'] ?? null,
      rawContent: serializer.copy({
        blocks: page.blocks,
        areas: page.areas,
        events: page.events,
        requests: page.requests,
        layout: page.layout,
      }),
    });
  }

  return registry;
}

export default createPageRegistry;
