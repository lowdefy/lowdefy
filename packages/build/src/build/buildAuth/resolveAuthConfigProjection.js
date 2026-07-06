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

import { ConfigError } from '@lowdefy/errors';
import { type } from '@lowdefy/helpers';
import operators from '@lowdefy/operators-js/operators/build';

import { resolve, WalkContext, cloneForResolve } from '../buildRefs/walker.js';
import evaluateStaticOperators from '../buildRefs/evaluateStaticOperators.js';
import collectDynamicIdentifiers from '../collectDynamicIdentifiers.js';
import validateOperatorsDynamic from '../validateOperatorsDynamic.js';
import collectExceptions from '../../utils/collectExceptions.js';
import computeAuthConfigProjection from './computeAuthConfigProjection.js';

validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

// Scoped pre-pass: resolve the auth: subtree of the parsed root lowdefy.yaml —
// its refs and operators, including module content the block refs in — and
// compute the _build.authConfig projection onto the build context. Runs after
// buildModuleDefs and before the main buildRefs walk (the computeAppMeta
// precedent) so the operator can resolve everywhere downstream: the main walk
// and the dev server's JIT page walks. The walk operates on a clone, so the
// main walk still resolves the auth: block from source exactly as before.
// _build.authConfig inside the resolving subtree is a build error — the
// WalkContext deliberately carries no authConfig, so the operator throws the
// self-reference error, which the walker collects onto the context.
async function resolveAuthConfigProjection({ context }) {
  const authSource = context.lowdefyConfig?.auth;
  if (type.isNone(authSource)) {
    context.authConfigProjection = computeAuthConfigProjection();
    return;
  }

  // Set by buildModuleDefs when it parses the root lowdefy.yaml.
  const refDef = context.lowdefyYamlRefDef;
  const ctx = new WalkContext({
    buildContext: context,
    refId: refDef.id,
    sourceRefId: null,
    vars: {},
    path: 'auth',
    currentFile: refDef.path,
    refChain: new Set(refDef.path ? [refDef.path] : []),
    operators,
    env: process.env,
    lowdefyApp: context.appMeta,
    dynamicIdentifiers,
  });

  try {
    let auth = await resolve(cloneForResolve(authSource), ctx);
    auth = evaluateStaticOperators({ context, input: auth, refDef });
    context.authConfigProjection = computeAuthConfigProjection(auth);
  } catch (error) {
    // Resolution failures (e.g. a circular ref rooted at the auth: block) are
    // collected so the main walk reports them with full location context; the
    // build stops at the next logCollectedErrors checkpoint.
    if (!(error instanceof ConfigError)) {
      throw error;
    }
    collectExceptions(context, error);
    context.authConfigProjection = computeAuthConfigProjection();
  }
}

export default resolveAuthConfigProjection;
