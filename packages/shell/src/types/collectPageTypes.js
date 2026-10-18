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

import { type } from '@lowdefy/helpers';

function collectEventActions({ events, actions }) {
  Object.values(events ?? {}).forEach((event) => {
    [...(event?.try ?? []), ...(event?.catch ?? [])].forEach((action) => {
      if (type.isString(action?.type)) actions.add(action.type);
    });
  });
}

function collectBlock({ block, blocks, actions }) {
  if (type.isString(block.type)) blocks.add(block.type);
  collectEventActions({ events: block.events, actions });
  Object.values(block.slots ?? {}).forEach((slot) => {
    (slot.blocks ?? []).forEach((child) => collectBlock({ block: child, blocks, actions }));
  });
}

// The block and action types a page uses, read from its config. The dev server builds pages on
// demand and sends no type set, so a dev shell checks a page's types when the page arrives, by
// name only: a dev shell runs the same Lowdefy version as the dev server.
function collectPageTypes(pageConfig) {
  const blocks = new Set();
  const actions = new Set();
  collectBlock({ block: pageConfig, blocks, actions });
  return {
    blocks: [...blocks].sort(),
    actions: [...actions].sort(),
  };
}

export default collectPageTypes;
