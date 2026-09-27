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

// The state a Dynamic block's endpoint carries while it evaluates :return.
// validatedStepIds collects the ValidateDynamic steps whose blocks :return may
// read as config. clientOperators is the app's set of client operator names, so
// only keys the client would run count as operators. dataObjects and dataShapes
// remember what operators returned as data (by identity, and by serialized form
// so a copy is still recognised), so the finished content can be checked for
// data that became blocks, actions or operators after the per-result scan.
function createLiteralData({ clientOperators = null, policyId = null }) {
  return {
    clientOperators,
    dataObjects: new WeakMap(),
    dataShapes: new Map(),
    policyId,
    validatedStepIds: new Set(),
  };
}

export default createLiteralData;
