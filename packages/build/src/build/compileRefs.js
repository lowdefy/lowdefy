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
import { createRequire } from 'module';
import { compileDir } from '@lowdefy/compile';
import { createScope } from '@lowdefy/compile/runtime';
import operators from '@lowdefy/operators-js/operators/build';

import buildRefs from './buildRefs/buildRefs.js';
import evaluateStaticOperators from './buildRefs/evaluateStaticOperators.js';
import { resolve, WalkContext } from './buildRefs/walker.js';
import collectDynamicIdentifiers from './collectDynamicIdentifiers.js';
import validateOperatorsDynamic from './validateOperatorsDynamic.js';
import collectExceptions from '../utils/collectExceptions.js';
import makeId from '../utils/makeId.js';

validateOperatorsDynamic({ operators });
const dynamicIdentifiers = collectDynamicIdentifiers({ operators });

// Compiled modules live in a tmp directory with no node_modules — the
// runtime import is emitted as a relative path to the resolved package.
const require = createRequire(import.meta.url);
const runtimePath = fs.realpathSync(
  path.join(path.dirname(require.resolve('@lowdefy/compile')), 'runtime/index.js')
);

// Config-compiler S1: replaces the walker for ref resolution. Mirrors the
// buildRefs contract — returns the resolved components tree, collects
// ConfigErrors into context.errors, populates context.refMap, and runs the
// same bare-operator static pass. Compiled modules emit walker-compatible
// ~r/~l markers, so addKeys and the keyMap pipeline run unchanged.
async function compileRefs({ context }) {
  // A global ref resolver intercepts every config read — the compiled
  // reader would bypass it. Those builds stay on the walker (S1 scope).
  if (context.refResolver) {
    context.logger.warn(
      'Global refResolver configured — the config compiler does not support it yet; building with the walker.'
    );
    return buildRefs({ context });
  }

  context.unresolvedRefVars = context.unresolvedRefVars ?? {};
  const configDir = context.directories.config;

  let entry = 'lowdefy.yaml';
  if (
    !fs.existsSync(path.join(configDir, 'lowdefy.yaml')) &&
    fs.existsSync(path.join(configDir, 'lowdefy.yml'))
  ) {
    entry = 'lowdefy.yml';
  }

  // Compiled modules live under the build directory: importable everywhere
  // (incl. jest, which cannot dynamic-import outside its roots), cleaned by
  // cleanBuildDirectory, and free of tmpdir symlink issues. A unique dir per
  // build keeps Node's ESM cache from serving stale modules across rebuilds.
  fs.mkdirSync(context.directories.build, { recursive: true });
  const outDir = fs.realpathSync(fs.mkdtempSync(path.join(context.directories.build, '.compile-')));
  const result = await compileDir({ configDir, outDir, entry, mode: 'markers', runtimePath });

  // Walker parity: the root ref consumes the id counter first (so addKeys ids
  // line up) and registers a path-less refMap entry. Instance ref ids are
  // global tree paths with a counter fallback on collision — allocation is
  // injected so the build owns the counter and the refMap.
  const rootRefId = makeId.next();
  context.refMap[rootRefId] = { parent: null, lineNumber: undefined };

  const mod = await import(result.entryUrl);
  const scope = createScope({
    vars: {},
    importer: result.importer,
    file: entry,
    refChain: [entry],
    onError: (error) => {
      collectExceptions(context, error);
    },
    env: process.env,
    refId: rootRefId,
    walkPath: '',
    refTracker: {
      alloc: (globalPath, refMapEntry) => {
        const id =
          globalPath != null && context.refMap[globalPath] === undefined
            ? globalPath
            : makeId.next();
        context.refMap[id] = refMapEntry;
        return id;
      },
      setPath: (id, refPath) => {
        context.refMap[id].path = refPath;
      },
    },
    // Ref forms the compiler does not resolve itself (module/component/menu,
    // resolver refs, non-YAML content, dynamic paths) delegate to the real
    // walker with a context built from the call site — same refMap, same id
    // counter, identical output by construction.
    walkerResolve: (node, site) =>
      resolve(
        node,
        new WalkContext({
          buildContext: context,
          refId: site.refId,
          sourceRefId: site.sourceRefId,
          vars: site.vars ?? {},
          path: site.walkPath,
          currentFile: site.file,
          refChain: new Set(site.refChain),
          operators,
          env: process.env,
          dynamicIdentifiers,
        })
      ),
  });
  let components = await mod.default(scope);

  // The same static pass the walker output goes through — bare `_` operators
  // with static subtrees evaluate at build; typeNames and dynamic identifiers
  // defer runtime operators.
  components = evaluateStaticOperators({
    context,
    input: components,
    refDef: { path: entry },
  });
  return components ?? {};
}

export default compileRefs;
