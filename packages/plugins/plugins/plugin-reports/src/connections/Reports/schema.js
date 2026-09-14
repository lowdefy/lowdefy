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

// The Reports connection has no properties: nothing about a report is per-
// connection configuration. It exists only because request types belong to
// connections, so RenderReport needs one to hang off.
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Connection Schema - Reports',
  type: 'object',
  properties: {},
  additionalProperties: false,
  errorMessage: {
    type: 'Reports connection properties should be an object.',
    additionalProperties: 'Reports connection does not take any properties.',
  },
};
