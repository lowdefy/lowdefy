/*
  Copyright 2020-2021 Lowdefy, Inc

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

import * as nodePath from 'path';

import { getFileExtension, readFile } from '@lowdefy/node-utils';

import getFileContent from './getFileContent';
import getRefsFromFile from './getRefsFromFile';
import parseNunjucks from './parseNunjucks';
import refReviver from './refReviver';

async function recursiveParseFile({ context, path, count, vars }) {
  // TODO: Maybe it would be better to detect a cycle, since this is the real issue here?
  if (count > 20) {
    throw new Error(`Maximum recursion depth of references exceeded.`);
  }
  let fileContent = await getFileContent({ context, path });
  if (getFileExtension(path) === 'njk') {
    fileContent = parseNunjucks(fileContent, vars, path);
  }
  const { foundRefs, fileContentBuiltRefs } = getRefsFromFile(fileContent);
  const parsedFiles = {};

  // Since we can have references in the variables of a reference, we need to first parse
  // the deeper nodes, so we can use those parsed files in references higher in the tree.
  // To do this, since foundRefs is an array of ref definitions that are in order of the
  // deepest nodes first we for loop over over foundRefs one by one, awaiting each result.

  // eslint-disable-next-line no-restricted-syntax
  for (const refDef of foundRefs.values()) {
    if (refDef.path === null) {
      throw new Error(
        `Invalid _ref definition ${JSON.stringify({ _ref: refDef.original })} in file ${path}`
      );
    }
    const { path: parsedPath, vars: parsedVars } = JSON.parse(
      JSON.stringify(refDef),
      refReviver.bind({ parsedFiles, vars })
    );
    // eslint-disable-next-line no-await-in-loop
    let parsedFile = await recursiveParseFile({
      context,
      path: parsedPath,
      // Parse vars before passing down to parse new file
      vars: parsedVars,
      count: count + 1,
    });
    if (refDef.transformer) {
      const transformerFile = await readFile(
        nodePath.resolve(context.configDirectory, refDef.transformer)
      );
      const transformerFn = eval(transformerFile);
      parsedFile = transformerFn(parsedFile, parsedVars);
    }
    parsedFiles[refDef.id] = parsedFile;
  }
  return JSON.parse(JSON.stringify(fileContentBuiltRefs), refReviver.bind({ parsedFiles, vars }));
}

export default recursiveParseFile;
