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

import containsFunction from './containsFunction.js';
import createOperatorCallClassifier from './createOperatorCallClassifier.js';

// Every recorded call signals the recorder at least once, so the engine can tell a block whose
// operators are all pure from one evaluated by a parser that does not record.
function recordClassification({ classification, recorder }) {
  switch (classification.kind) {
    case 'read':
      if (classification.keys.length === 0) {
        recorder.pure();
        return;
      }
      for (let index = 0; index < classification.keys.length; index += 1) {
        recorder.read(classification.keys[index]);
      }
      return;
    case 'volatile':
      recorder.volatile(classification.reason);
      return;
    case 'untracked':
      recorder.untracked(classification.reason);
      return;
    default:
      // 'pure': classifications only carry the four declared kinds.
      recorder.pure();
  }
}

// The recorder is read on every call, not captured: a closure made while a block evaluated (a
// _function body, a _js accessor) can run later, at render time, when nothing is recording.
// This runs for every operator call while a block evaluates, so it tests types natively.
function createTrackedOperator({ getRecorder, operatorFn, operatorName }) {
  const classify = createOperatorCallClassifier({ operatorFn, operatorName });
  return function trackedOperator(operatorContext) {
    const recorder = getRecorder();
    if (recorder === null || recorder === undefined) {
      return operatorFn(operatorContext);
    }
    const classification = classify(operatorContext);
    // Recorded before the call: an operator that throws still read its keys.
    recordClassification({ classification, recorder });
    const result = operatorFn(operatorContext);
    // A fresh function every pass is what function consumers expect (AgGrid refreshes cells on
    // function identity), and what a function reads is only known when it is called.
    if (
      typeof result === 'function' ||
      (classification.resultMayContainFunctions && containsFunction(result))
    ) {
      recorder.untracked(`${operatorName} returned a function`);
    }
    return result;
  };
}

export default createTrackedOperator;
