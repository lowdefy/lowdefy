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

import YAML from 'yaml';
import { serializer, type } from '@lowdefy/helpers';

import { runClass } from '@lowdefy/operators';

// TODO: consider adding replacer and reviver args supported by yaml package.
function parse(input, options) {
  if (input === 'undefined') return undefined;
  if (!type.isString(input)) {
    throw new Error('requires a string type to parse.');
  }
  const loaded = YAML.parse(input, options);
  return serializer.deserialize(loaded);
}

function stringify(input, options) {
  if (input === undefined) return '';
  // TODO: option sortKeys: true, sort keys was supported by js-yaml and not by yaml.
  return YAML.stringify(serializer.serialize(input, { isoStringDates: true }), options);
}

const functions = { parse, stringify };
const meta = {
  stringify: { namedArgs: ['on', 'options'], validTypes: ['object', 'array'] },
  parse: { namedArgs: ['on', 'options'], validTypes: ['object', 'array'] },
};

function _yaml({ params, location, methodName }) {
  return runClass({
    functions,
    location,
    meta,
    methodName,
    operator: '_yaml',
    params,
  });
}

export default _yaml;
