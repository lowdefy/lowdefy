/*
  Copyright 2020 Lowdefy, Inc

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

import YAML from 'js-yaml';
import { serializer, type } from '@lowdefy/helpers';
import runClass from '../runClass';

function parse(input) {
  if (!type.isString(input)) {
    throw new Error(
      `Operator Error: _yaml_parse takes a string as input. Received: ${JSON.stringify(
        input
      )} at ${location}.`
    );
  }
  if (input === 'undefined') return undefined;
  const loaded = YAML.safeLoad(input);
  return serializer.deserialize(loaded);
}

function stringify(input) {
  return YAML.safeDump(serializer.serialize(input, { isoStringDates: true }), {
    sortKeys: true,
    noRefs: true,
  });
}

const Cls = { parse, stringify };
const allowedMethods = new Set(['parse', 'stringify']);

function _yaml({ params, location, method }) {
  return runClass({
    allowedMethods,
    allowedProperties: [],
    Cls,
    location,
    method,
    operator: '_yaml',
    params,
  });
}

export default _yaml;
