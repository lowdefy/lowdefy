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

import ajv from './ajvInstance.js';

// The shared instance keeps every schema object it compiles, keyed by the
// object and by its $id. Callers compile fresh copies of the same schema (a
// config file read again after the file cache evicts it, a step property
// evaluated per call), which would grow that cache for the life of the server
// and fail the second copy of a schema with an $id as a duplicate. The caller
// holds the validator; the instance keeps nothing. Boolean schemas are cached
// by value, so they never grow it.
function compile({ schema }) {
  const validator = ajv.compile(schema);
  if (typeof schema === 'object') {
    ajv.removeSchema(schema);
  }
  return (data) => {
    const valid = validator(data);
    return { valid, errors: valid ? [] : validator.errors || [] };
  };
}

export default compile;
