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
import { type } from '@lowdefy/helpers';

import evaluateBuildOperators from './evaluateBuildOperators.js';
import getKey from './getKey.js';
import getRefContent from './getRefContent.js';
import getRefsFromFile from './getRefsFromFile.js';
import populateRefs from './populateRefs.js';
import runTransformer from './runTransformer.js';

async function recursiveBuild({ context, refDef, count, referencedFrom, refCache, profiler }) {
  const time = profiler?.time ?? ((_, fn) => fn());
  const timeSync = profiler?.timeSync ?? ((_, fn) => fn());

  // TODO: Maybe it would be better to detect a cycle, since this is the real issue here?
  if (count > 10000) {
    throw new Error(`Maximum recursion depth of references exceeded.`);
  }

  if (refCache.has(refDef.hash)) {
    return refCache.get(refDef.hash);
  }

  let fileContent = await time('getRefContent', () =>
    getRefContent({ context, refDef, referencedFrom })
  );

  const { foundRefs, fileContentBuiltRefs } = timeSync('getRefsFromFile', () =>
    getRefsFromFile(fileContent, refDef.hash, context.refMap)
  );

  // Since we can have references in the variables of a reference, we need to first parse
  // the deeper nodes, so we can use those parsed files in references higher in the tree.
  // To do this, since foundRefs is an array of ref definitions that are in order of the
  // deepest nodes first we for loop over over foundRefs one by one, awaiting each result.

  for (const newRefDef of foundRefs.values()) {
    // Parse vars and path before passing down to parse new file
    const parsedRefDef = timeSync('populateRefs:vars', () =>
      populateRefs({
        toPopulate: newRefDef,
        refCache,
        refDef,
      })
    );
    context.refMap[parsedRefDef.hash].path = parsedRefDef.path;

    const parsedFile = await recursiveBuild({
      context,
      refDef: parsedRefDef,
      count: count + 1,
      referencedFrom: refDef.path,
      refCache,
      profiler,
    });

    const transformedFile = await time('runTransformer', () =>
      runTransformer({
        context,
        input: parsedFile,
        refDef: parsedRefDef,
      })
    );

    // Evaluated in recursive loop for better error messages
    const evaluatedOperators = await time('evaluateBuildOperators', () =>
      evaluateBuildOperators({
        context,
        input: transformedFile,
        refDef: parsedRefDef,
      })
    );

    const withRefKey = timeSync('getKey', () =>
      getKey({
        input: evaluatedOperators,
        refDef: parsedRefDef,
      })
    );

    timeSync('cacheWithReviver', () => {
      const reviver = (_, value) => {
        if (!type.isObject(value)) return value;
        Object.defineProperty(value, '~r', {
          value: refDef.hash,
          enumerable: false,
          writable: true,
          configurable: true,
        });
        return value;
      };
      refCache.set(newRefDef.hash, JSON.parse(JSON.stringify(withRefKey), reviver));
    });
  }

  const result = timeSync('populateRefs:final', () =>
    populateRefs({
      toPopulate: fileContentBuiltRefs,
      refCache,
      refDef,
    })
  );

  refCache.set(refDef.hash, result);

  return result;
}

export default recursiveBuild;
