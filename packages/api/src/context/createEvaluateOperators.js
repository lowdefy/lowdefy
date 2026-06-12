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

import { ServerParser } from '@lowdefy/operators';
import { evaluateClosures } from '@lowdefy/compile/runtime';

function createEvaluateOperators(context) {
  const { appMeta, i18n, jsMap, operators, secrets, user } = context;

  const operatorsParser = new ServerParser({
    i18n,
    jsMap,
    lowdefyApp: appMeta,
    operators,
    secrets,
    user,
  });
  function evaluateOperators({ input, items, location, payload, state, steps }) {
    // S3a adapter: compiled builds ship config properties as closure
    // modules — a function input evaluates directly (same {output, errors}
    // contract, gated bit-for-bit against ServerParser); data inputs keep
    // the parser tree-walk.
    if (typeof input === 'function') {
      const { output, errors } = evaluateClosures({
        closure: input,
        operators,
        items,
        location,
        payload,
        state,
        steps,
        i18n,
        jsMap,
        lowdefyApp: appMeta,
        secrets,
        user,
        parser: operatorsParser,
      });
      if (errors.length > 0) {
        throw errors[0];
      }
      return output;
    }
    const { output, errors } = operatorsParser.parse({
      input,
      items,
      location,
      payload,
      state,
      steps,
    });
    if (errors.length > 0) {
      throw errors[0];
    }

    return output;
  }

  return evaluateOperators;
}

export default createEvaluateOperators;
