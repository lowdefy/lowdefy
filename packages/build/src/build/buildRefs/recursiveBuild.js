/*
  Copyright 2020-2022 Lowdefy, Inc

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
import evaluateBuildOperators from './evaluateBuildOperators.js';
import getRefContent from './getRefContent.js';
import getRefsFromFile from './getRefsFromFile.js';
import populateRefs from './populateRefs.js';
import runTransformer from './runTransformer.js';

async function recursiveParseFile({ context, refDef, count, referencedFrom }) {
  // TODO: Maybe it would be better to detect a cycle, since this is the real issue here?
  if (count > 40) {
    throw new Error(`Maximum recursion depth of references exceeded.`);
  }
  let fileContent = await getRefContent({ context, refDef, referencedFrom });

  const { foundRefs, fileContentBuiltRefs } = getRefsFromFile(
    fileContent,
    refDef.id,
    context.refMap
  );

  const parsedFiles = {};

  // Since we can have references in the variables of a reference, we need to first parse
  // the deeper nodes, so we can use those parsed files in references higher in the tree.
  // To do this, since foundRefs is an array of ref definitions that are in order of the
  // deepest nodes first we for loop over over foundRefs one by one, awaiting each result.

  for (const newRefDef of foundRefs.values()) {
    // Parse vars and path before passing down to parse new file
    const parsedRefDef = populateRefs({
      toPopulate: newRefDef,
      parsedFiles,
      refDef,
    });

    const parsedFile = await recursiveParseFile({
      context,
      refDef: parsedRefDef,
      count: count + 1,
      referencedFrom: refDef.path,
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

    parsedFiles[newRefDef.id] = evaluatedOperators;
  }
  return populateRefs({
    toPopulate: fileContentBuiltRefs,
    parsedFiles,
    refDef,
  });
}

export default recursiveParseFile;
