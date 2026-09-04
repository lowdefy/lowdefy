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

// The single vocabulary of the journey and request-test grammar. The CLI
// (`lowdefy test`) and the dev server (POST /lowdefy-docs/journey, the
// lowdefy_run_journey MCP tool, snapshotPage) both validate against these
// lists, so a step the CLI accepts is a step the runner can execute.

const JOURNEY_KEYS = ['fixtures', 'name', 'pageId', 'steps', 'urlQuery', 'user'];

const JOURNEY_STEP_KEYS = [
  'click',
  'fill',
  'set',
  'select',
  'press',
  'wait',
  'screenshot',
  'expect',
];

const WAIT_KEYS = ['ms', 'request', 'state'];

const EXPECT_KEYS = ['state', 'visible', 'text', 'url', 'dom', 'durationMsUnder'];

const EXPECT_TEXT_KEYS = ['contains', 'equals', 'notContains'];

// `equals` is optional in the file: a state expectation written with a path and
// no value is a proposal `lowdefy test --update` fills from the observed state,
// stamping `from: recorded` on what it wrote.
const EXPECT_STATE_KEYS = ['path', 'equals', 'from'];

const EXPECT_DOM_KEYS = ['hasClass', 'notHasClass', 'matches', 'attribute'];

const PRESS_KEYS = ['key', 'blockId'];

const REQUEST_TEST_KEYS = [
  'endpointId',
  'expect',
  'fixtures',
  'name',
  'pageId',
  'payload',
  'requestId',
  'seed',
  'user',
];

// A request-test `expect` that is an object with exactly one of these keys is
// an assertion form rather than data. A response document whose only top-level
// key is literally one of these cannot be asserted as a literal subset — the
// documented collision. `~schema` is the escape hatch for `schema`.
const REQUEST_EXPECT_MARKERS = ['schema', '~schema', 'contains', 'reject'];

const REJECT_KEYS = ['messageContains', 'name'];

export {
  EXPECT_DOM_KEYS,
  EXPECT_STATE_KEYS,
  EXPECT_KEYS,
  EXPECT_TEXT_KEYS,
  JOURNEY_KEYS,
  JOURNEY_STEP_KEYS,
  PRESS_KEYS,
  REJECT_KEYS,
  REQUEST_EXPECT_MARKERS,
  REQUEST_TEST_KEYS,
  WAIT_KEYS,
};
