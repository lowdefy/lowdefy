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

import { jest } from '@jest/globals';

// A stand-in for the engine's trace registry (the `trace` action argument): emit plays the
// engine, describeChain and pathEntryOf return what the test gives them, and isConfigText is
// true for the configTexts the test gives it. Like the engine, it holds
// failures emitted before the first replay subscriber and hands them to it inside subscribe.
function createFakeTrace({
  configTexts = [],
  describeChain = () => null,
  isConfigText = ({ text }) => configTexts.includes(text.replace(/\s+/g, ' ').trim()),
  pathEntryOf = () => null,
} = {}) {
  const listeners = [];
  let heldFailures = [];
  let holding = true;
  return {
    describeChain: jest.fn(describeChain),
    emit(payload) {
      if (holding && payload.success === false) {
        heldFailures.push(payload);
      }
      [...listeners].forEach((listener) => listener(payload));
    },
    isConfigText: jest.fn(isConfigText),
    listeners,
    pathEntryOf: jest.fn(pathEntryOf),
    subscribe: jest.fn((listener, { replay = false } = {}) => {
      listeners.push(listener);
      if (replay === true && holding) {
        const held = heldFailures;
        heldFailures = [];
        holding = false;
        held.forEach((payload) => listener(payload));
      }
      return () => {
        listeners.splice(listeners.indexOf(listener), 1);
      };
    }),
  };
}

export default createFakeTrace;
