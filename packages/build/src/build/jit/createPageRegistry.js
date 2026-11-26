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
import { resolveKeyEntry } from '@lowdefy/errors';

import findSourceRef from './findSourceRef.js';
import getModuleEntryId from './getModuleEntryId.js';

function createPageRegistry({ components, context }) {
  const registry = new Map();
  const unresolvedRefVars = context.unresolvedRefVars ?? {};

  (components.pages ?? []).forEach((page) => {
    // addKeys moves ~r into the keyMap and deletes it from objects. A page
    // inline in a ref file carries no ref of its own, so resolve it.
    const refId = resolveKeyEntry({ keyMap: context.keyMap, configKey: page['~k'] })?.refId ?? null;
    const sourceRef = !type.isNone(refId)
      ? findSourceRef({ refId, refMap: context.refMap, unresolvedRefVars })
      : null;

    // Inline pages (defined directly in lowdefy.yaml) have a refId pointing to
    // the root ref but findSourceRef returns null because there is no
    // separate source file. Set refId to null so buildPageJit serves them from
    // the pre-built artifact written by buildShallowPages.
    const isInline =
      !type.isNone(refId) &&
      sourceRef === null &&
      !type.isNone(context.refMap[refId]) &&
      type.isNone(context.refMap[refId].parent);

    registry.set(page.id, {
      pageId: page.id,
      auth: page.auth,
      path: page.path,
      // Set by buildMobile on mobile and shared pages; a web page has none until buildPage.
      target: page.target,
      refId: isInline ? null : refId,
      refPath: sourceRef?.path ?? null,
      unresolvedVars: sourceRef?.unresolvedVars ?? null,
      resolverOriginal: sourceRef?.original ?? null,
      // A resolver page's transformer is in resolverOriginal.
      transformer: sourceRef?.transformer ?? null,
      moduleEntryId: getModuleEntryId(page.id, context),
    });
  });

  return registry;
}

export default createPageRegistry;
