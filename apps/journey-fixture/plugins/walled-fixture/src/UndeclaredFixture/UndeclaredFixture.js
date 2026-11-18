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

import UndeclaredFixtureEcho from './UndeclaredFixtureEcho/UndeclaredFixtureEcho.js';

// A connection type that declares no meta.dataSet, as a plugin that reaches an outside database
// would: a data-set journey's click rails refuse a click whose request uses it
// (packages/servers/server-dev/test/journeyFixture/rails.test.mjs). Its request reaches nothing.
export default {
  schema: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Lowdefy Connection Schema - UndeclaredFixture',
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  meta: { tenant: false },
  requests: { UndeclaredFixtureEcho },
};
