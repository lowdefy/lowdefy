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

async function getConfigFile({ context, refDef, referencedFrom }) {
  if (!type.isString(refDef.path)) {
    throw new Error(
      `Invalid _ref definition ${JSON.stringify({
        _ref: refDef.original,
      })} in file ${referencedFrom}`
    );
  }

  const content = await context.readConfigFile(refDef.path);

  if (content === null) {
    throw new Error(
      `Tried to reference file "${refDef.path}" from "${referencedFrom}", but file does not exist.`
    );
  }

  return content;
}

export default getConfigFile;
