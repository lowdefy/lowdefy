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
import getUserJavascriptFunction from './getUserJavascriptFunction.js';

async function runRefResolver({ context, refDef, referencedFrom }) {
  const resolverFn = await getUserJavascriptFunction({
    context,
    filePath: refDef.resolver || context.refResolver,
  });
  let content;
  try {
    content = await resolverFn(refDef.path, refDef.vars, context);
  } catch (error) {
    throw new Error(
      `Error calling resolver "${refDef.resolver}" from "${referencedFrom}": ${error.message}`
    );
  }
  if (type.isNone(content)) {
    throw new Error(
      `Tried to reference with resolver "${refDef.resolver}" from "${referencedFrom}", but received "${content}".`
    );
  }
  return content;
}

export default runRefResolver;
