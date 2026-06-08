/* eslint-disable no-param-reassign */

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

import { serializer, type } from '@lowdefy/helpers';

// Prepend the resolved app overlay blocks (see buildOverlay) onto a single
// page's blocks, so the overlay renders on every page. Called before buildPage
// runs, so the injected blocks go through the normal block build (id scoping,
// plugin/icon/operator detection) like any other page block.
//
// A page opts out via `overlay.exclude` (by pageId) or `properties.overlay: false`.
function injectOverlayBlocks({ page, context }) {
  const overlayBlocks = context.overlayBlocks ?? [];
  if (overlayBlocks.length === 0) return;
  if (!type.isObject(page)) return;

  // At injection time buildPage hasn't run yet, so the raw page id is `page.id`
  // (pageId is set later); fall back to pageId for callers that set it first.
  const pageId = page.pageId ?? page.id;
  if (context.overlayExclude?.has(pageId)) return;
  if (type.isObject(page.properties) && page.properties.overlay === false) return;

  // Deep-clone per page so each page owns its block instances — buildBlock
  // assigns ids/keys independently when it processes each page.
  const clones = overlayBlocks.map((block) => serializer.copy(block));
  page.blocks = [...clones, ...(type.isArray(page.blocks) ? page.blocks : [])];
}

export default injectOverlayBlocks;
