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

import { compile, getSchemaAtPath, nestSchemaPaths } from '@lowdefy/ajv';
import { get, type } from '@lowdefy/helpers';

function instancePathToStatePath(instancePath) {
  return instancePath
    .split('/')
    .filter((segment) => segment !== '')
    .map((segment) => segment.replaceAll('~1', '/').replaceAll('~0', '~'))
    .join('.');
}

function joinPath(a, b) {
  if (a === '') return b;
  if (b === '') return a;
  return `${a}.${b}`;
}

// Compares live page state against the page's declared state contract. Each
// entry names the state path that drifted, ajv's message, the declared
// fragment at that path and the value the page actually holds.
function getStateSchemaDrift({ stateSchema, state }) {
  const schema = nestSchemaPaths({ paths: stateSchema });
  const { errors } = compile({ schema })(type.isNone(state) ? {} : state);
  return errors.map((error) => {
    let path = instancePathToStatePath(error.instancePath);
    if (error.keyword === 'required') {
      path = joinPath(path, error.params.missingProperty);
    }
    return {
      path,
      message: error.message,
      declared: getSchemaAtPath({ schema, path }),
      received: path === '' ? state : get(state, path),
    };
  });
}

export default getStateSchemaDrift;
