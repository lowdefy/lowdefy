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

import { type } from '@lowdefy/helpers';

// A single form submit writes half a dozen paths; asserting all of them buries
// the one that matters. Five is the cap, and leaf scalars come first because a
// scalar expectation names one fact while an object expectation locks a shape
// the app never promised.
const MAX_STATE_EXPECTATIONS = 5;

const SCALAR_TYPES = ['boolean', 'date', 'null', 'number', 'string'];

function isScalarWrite(write) {
  return SCALAR_TYPES.includes(write.type);
}

// A write of type `undefined` records a path the chain removed. `expect.state`
// asserts a value, and there is no value to assert, so a removal is left out
// rather than written as `equals: null` - which would be a different claim.
function isAssertable(write) {
  return type.isString(write.path) && write.path !== '' && write.type !== 'undefined';
}

function compileStateExpectations({ event }) {
  const writes = event.state_writes.filter(isAssertable);
  const ordered = [
    ...writes.filter((write) => isScalarWrite(write)),
    ...writes.filter((write) => !isScalarWrite(write)),
  ].slice(0, MAX_STATE_EXPECTATIONS);

  return ordered.map((write) => {
    // A prod trace carries no values (D3), so the expectation is written as a
    // path alone - a proposal `lowdefy test --update` fills from the observed
    // state and stamps `from: recorded`.
    const state = { path: write.path };
    if ('value' in write) state.equals = write.value;
    return { expect: { state } };
  });
}

export { MAX_STATE_EXPECTATIONS };

export default compileStateExpectations;
