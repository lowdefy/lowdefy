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
import { ConfigError } from '@lowdefy/errors';
import createRefReviver from './createRefReviver.js';
import evaluateBuildOperators from './evaluateBuildOperators.js';
import getKey from './getKey.js';
import getRefContent from './getRefContent.js';
import getRefPositions from '../jit/getRefPositions.js';
import getRefsFromFile from './getRefsFromFile.js';
import populateRefs from './populateRefs.js';
import runTransformer from './runTransformer.js';
import { shouldSkipResolution } from '../jit/pathMatcher.js';

async function recursiveBuild({
  context,
  refDef,
  count,
  referencedFrom,
  refChainSet = new Set(),
  refChainList = [],
  shallowOptions,
  jsonPath = '',
}) {
  // Detect circular references by tracking the chain of files being resolved
  // Skip circular reference checking for refs without paths (e.g., resolver refs)
  const currentPath = refDef.path;
  if (currentPath) {
    if (refChainSet.has(currentPath)) {
      const chainDisplay = [...refChainList, currentPath].join('\n  -> ');
      throw new ConfigError({
        message: `Circular reference detected. File "${currentPath}" references itself through:\n  -> ${chainDisplay}`,
        filePath: referencedFrom ?? null,
        lineNumber: referencedFrom ? refDef.lineNumber : null,
      });
    }
    refChainSet.add(currentPath);
    refChainList.push(currentPath);
  }

  // Keep count as a fallback safety limit
  if (count > 10000) {
    throw new ConfigError({
      message: `Maximum recursion depth of references exceeded (10000 levels). This likely indicates a circular reference.`,
      context,
    });
  }
  let fileContent = await getRefContent({ context, refDef, referencedFrom });
  const { foundRefs, fileContentBuiltRefs } = getRefsFromFile(
    fileContent,
    refDef.id,
    context.refMap
  );

  const parsedFiles = {};

  // Compute the JSON path position of each ref within the current file's content.
  // This lets us check if a ref should be skipped during shallow builds.
  const refPositions = shallowOptions ? getRefPositions(fileContentBuiltRefs, jsonPath) : null;

  // Since we can have references in the variables of a reference, we need to first parse
  // the deeper nodes, so we can use those parsed files in references higher in the tree.
  // To do this, since foundRefs is an array of ref definitions that are in order of the
  // deepest nodes first we for loop over over foundRefs one by one, awaiting each result.

  for (const newRefDef of foundRefs.values()) {
    // Check if this ref should be skipped (shallow build)
    const refJsonPath = refPositions?.get(newRefDef.id) ?? '';
    if (shallowOptions && shouldSkipResolution(refJsonPath, shallowOptions.stopAt)) {
      // Store shallow marker instead of resolving
      parsedFiles[newRefDef.id] = {
        '~shallow': true,
        _ref: newRefDef.original,
        _refId: newRefDef.id,
      };
      continue;
    }

    // Parse vars and path before passing down to parse new file
    const parsedRefDef = populateRefs({
      toPopulate: newRefDef,
      parsedFiles,
      refDef,
    });
    context.refMap[parsedRefDef.id].path = parsedRefDef.path;
    const parsedFile = await recursiveBuild({
      context,
      refDef: parsedRefDef,
      count: count + 1,
      referencedFrom: refDef.path,
      refChainSet,
      refChainList,
      shallowOptions,
      jsonPath: refJsonPath,
    });

    const transformedFile = await runTransformer({
      context,
      input: parsedFile,
      refDef: parsedRefDef,
    });

    // Evaluated in recursive loop for better error messages
    const evaluatedOperators = await evaluateBuildOperators({
      context,
      input: transformedFile,
      refDef: parsedRefDef,
    });

    const withRefKey = getKey({
      input: evaluatedOperators,
      refDef: parsedRefDef,
    });

    // Use serializer.copy to preserve non-enumerable properties like ~l.
    // Only set ~r if not already present to preserve original file references from nested imports.
    // Use child file's ref ID (parsedRefDef.id) not parent's (refDef.id) for correct error tracing.
    const reviver = createRefReviver(parsedRefDef.id);
    parsedFiles[newRefDef.id] = serializer.copy(withRefKey, { reviver });
  }
  // Backtrack: remove current file from chain so sibling refs can use it
  // Only remove if it was added (i.e., if currentPath exists)
  if (currentPath) {
    refChainSet.delete(currentPath);
    refChainList.pop();
  }

  return populateRefs({
    toPopulate: fileContentBuiltRefs,
    parsedFiles,
    refDef,
  });
}

export default recursiveBuild;
