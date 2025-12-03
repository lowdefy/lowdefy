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

import createBuildProfiler from '../../utils/createBuildProfiler.js';
import recursiveBuild from './recursiveBuild.js';
import makeRefDefinition from './makeRefDefinition.js';
import evaluateBuildOperators from './evaluateBuildOperators.js';
import invalidateChangedFiles from '../../utils/invalidateChangedFiles.js';

async function buildRefs({ context }) {
  const profiler = createBuildProfiler({ logger: context.logger, prefix: 'buildRefs' });

  // For incremental builds, invalidate caches for changed files and their dependents
  if (context.changedFiles && context.changedFiles.length > 0) {
    invalidateChangedFiles({
      changedFiles: context.changedFiles,
      dependencyGraph: context.dependencyGraph,
      parsedContentCache: context.parsedContentCache,
      refCache: context.refCache,
      pathToRefHashes: context.pathToRefHashes,
      logger: context.logger,
    });
  }

  const refDef = makeRefDefinition('lowdefy.yaml', null, context.refMap);

  // Use persistent refCache from context for incremental builds
  const refCache = context.refCache;

  let components = await profiler.time('recursiveBuild', () =>
    recursiveBuild({
      context,
      refDef,
      count: 0,
      refCache,
      profiler,
    })
  );

  components = await profiler.time('evaluateBuildOperators:final', () =>
    evaluateBuildOperators({
      context,
      input: components,
      refDef,
    })
  );

  profiler.printSummary();
  return components ?? {};
}

export default buildRefs;
