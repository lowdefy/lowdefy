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

// A marker an action returns to end its event chain, reported as a success
// rather than an error. The only callers are engine actions that have
// navigated the browser away, where every remaining step in the chain would
// act on a page that is being replaced - and one of those steps competing
// with the navigation is the defect this exists to close.
//
// Not an app-facing control: ':return' is how app config ends a chain, and it
// is unchanged. There is deliberately no CONTROL_KEYS entry here.
//
// A symbol, not a string key: the wrapper is only ever inspected by callAction
// one frame later, and a symbol cannot collide with a field of an action's own
// response the way a string marker could. It also cannot survive JSON
// serialization, which is correct - this is an in-process control signal,
// never something to persist or send over the wire.
const STOP_CHAIN = Symbol('lowdefyStopChain');

function stopChain(response) {
  return { [STOP_CHAIN]: true, response };
}

function isStopChain(value) {
  return type.isObject(value) && value[STOP_CHAIN] === true;
}

export { STOP_CHAIN, isStopChain };
export default stopChain;
