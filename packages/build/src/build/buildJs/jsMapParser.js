/*
  Copyright 2020-2024 Lowdefy, Inc

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

import { serializer, type } from '@lowdefy/helpers';
import crypto from 'crypto';

class JsMapParser {
  constructor({ jsMap }) {
    this.jsMap = jsMap;
    this.parse = this.parse.bind(this);
    this.makeHash = this.makeHash.bind(this);
  }

  makeHash(jsDefinition) {
    // could we use swc here to transpile / cleaanup js for further deduplication and to catch syntax errors at build time?
    const hash = crypto.createHash('sha512').update(jsDefinition).digest('hex');
    if (this.jsMap[hash]) {
      // is this nesasery?
      if (this.jsMap[hash] !== jsDefinition) {
        throw new Error('Data of same hash does not match.');
      }
    }
    this.jsMap[hash] = jsDefinition;
    return hash;
  }
  // TODO: consider including the ~k values in the map to point errors to function.
  // might not parse becuase of ~k value in obj.
  parse({ input, operatorName = '_js' }) {
    const reviver = (_, value) => {
      if (!type.isObject(value)) return value;
      if (Object.keys(value).length !== 1) return value;

      const key = Object.keys(value)[0];
      if (key !== operatorName) return value;

      if (!type.isString(value[key])) {
        throw new Error('_js operator expects the JavaScript definition as a string.');
      }
      return this.makeHash(value[key]);
    };
    return serializer.copy(input, { reviver });
  }
}

export default JsMapParser;
