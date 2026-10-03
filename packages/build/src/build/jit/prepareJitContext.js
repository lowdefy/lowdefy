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

import fs from 'fs';
import path from 'path';
import { type } from '@lowdefy/helpers';

import createJitMaps from './createJitMaps.js';
import getJitIconContext from './getJitIconContext.js';

// Restore the skeleton-computed auth config projection so _build.authConfig
// resolves in JIT page builds identically to a full build. The dev server's
// JIT context is rebuilt from build artifacts in a separate process, so the
// projection is read from the artifact shallowBuild writes.
function readAuthConfigProjection({ directories }) {
  const projectionPath = path.join(directories.build, 'authConfigProjection.json');
  try {
    return JSON.parse(fs.readFileSync(projectionPath, 'utf8'));
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    return undefined;
  }
}

// Fills, on the context JIT page builds share, every field build code would
// otherwise fill on first use. Each page build runs on a shallow copy of this
// context (createPageBuildContext), so a field first set during a build would
// land on that build's copy and be loaded again by the next build. Safe to call
// more than once: it only fills what is missing.
function prepareJitContext(context) {
  if (type.isUndefined(context.authConfigProjection) && type.isString(context.directories?.build)) {
    context.authConfigProjection = readAuthConfigProjection({ directories: context.directories });
  }

  // A context made without jitMaps (a test, or buildPageJit's minimal
  // context) starts its log here, before its first page build adds an entry.
  context.jitMaps ??= createJitMaps({
    keyMap: context.keyMap,
    refMap: context.refMap,
    name: 'jit',
  });

  context.deferred ??= {};
  context.unresolvedRefVars ??= {};
  context.dynamicIconData ??= {};

  // buildSubscriptions validates against websocketIds — the dev server
  // restores the set from the websocketIds.json skeleton artifact. Fill it
  // from skeleton-built websockets when the context doesn't carry them. The
  // set is filled in place: page builds made earlier share it.
  context.websocketIds ??= new Set();
  if (context.websocketIds.size === 0) {
    for (const websocket of context.components?.websockets ?? []) {
      context.websocketIds.add(websocket.websocketId);
    }
  }

  // The icon sets load once per context, shared by every page build on it.
  // The load starts now; a page build that needs it awaits it and gets its
  // error, so a failed load here is not an unhandled rejection.
  if (context.bundledIcons && type.isNone(context.iconContextPromise)) {
    getJitIconContext({ context }).catch(() => {});
  }

  return context;
}

export default prepareJitContext;
