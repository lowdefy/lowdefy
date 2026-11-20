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

import VerifyFixtureSignature from './VerifyFixtureSignature/VerifyFixtureSignature.js';

// The journey fixture's webhook verifier (api/payment_events.yaml): it computes in process and
// reaches no service and no database, so under a data set it runs as it is. 'walled' is the mode
// that passes a connection through unchanged; this one holds no database address at all.
export default {
  schema: {
    $schema: 'http://json-schema.org/draft-07/schema#',
    title: 'Lowdefy Connection Schema - FixtureSignature',
    type: 'object',
    properties: {},
    additionalProperties: false,
  },
  meta: { tenant: false, dataSet: 'walled' },
  requests: { VerifyFixtureSignature },
};
