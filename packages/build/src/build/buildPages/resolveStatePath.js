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

import { getSchemaAtPath } from '@lowdefy/ajv';

// Resolves a state path against a page's state contract, nested into one root
// schema with nestSchemaPaths from the dotted declaration on page.stateSchema.
// Returns the governing sub-schema, or null when the contract does not cover
// the path. Exported through collectStateUsage.js for other checks that type
// state reads against the contract.
function resolveStatePath({ stateSchema, path }) {
  return getSchemaAtPath({ schema: stateSchema, path });
}

export default resolveStatePath;
