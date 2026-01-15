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

import { type } from '@lowdefy/helpers';
import { runInstance } from '@lowdefy/operators';

const prepRegex = (regexIndex, flagsIndex) => (args) => {
  if (args[regexIndex]) {
    args[regexIndex] = new RegExp(args[regexIndex], args[flagsIndex]);
  }
  if (type.isNone(args[0])) {
    args[0] = '';
  }
  return args;
};

const prep = (args) => {
  if (type.isNone(args[0])) {
    args[0] = '';
  }
  return args;
};

const meta = {
  charAt: { namedArgs: ['on', 'index'], prep, validTypes: ['array', 'object'] , dynamic: false},
  // 'charCodeAt',
  concat: { prep, validTypes: ['array'] , dynamic: false},
  endsWith: { namedArgs: ['on', 'searchString', 'length'], prep, validTypes: ['array', 'object'] , dynamic: false},
  includes: {
    namedArgs: ['on', 'searchString', 'position'],
    prep,
    validTypes: ['array', 'object'],
  },
  indexOf: { namedArgs: ['on', 'searchValue', 'fromIndex'], prep, validTypes: ['array', 'object'] , dynamic: false},
  lastIndexOf: {
    namedArgs: ['on', 'searchValue', 'fromIndex'],
    prep,
    validTypes: ['array', 'object'],
  },
  // 'localeCompare',
  match: {
    namedArgs: ['on', 'regex', 'regexFlags'],
    prep: prepRegex(1, 2),
    validTypes: ['array', 'object'],
  },
  // 'matchAll',
  normalize: { namedArgs: ['on', 'form'], prep, validTypes: ['array', 'object'] , dynamic: false},
  padEnd: { namedArgs: ['on', 'targetLength', 'padString'], prep, validTypes: ['array', 'object'] , dynamic: false},
  padStart: {
    namedArgs: ['on', 'targetLength', 'padString'],
    prep,
    validTypes: ['array', 'object'],
  },
  repeat: { namedArgs: ['on', 'count'], prep, validTypes: ['array', 'object'] , dynamic: false},
  replace: {
    namedArgs: ['on', 'regex', 'newSubstr', 'regexFlags'],
    prep: prepRegex(1, 3),
    validTypes: ['array', 'object'],
  },
  search: {
    namedArgs: ['on', 'regex', 'regexFlags'],
    prep: prepRegex(1, 2),
    validTypes: ['array', 'object'],
  },
  slice: { namedArgs: ['on', 'start', 'end'], prep, validTypes: ['array', 'object'] , dynamic: false},
  split: { namedArgs: ['on', 'separator'], prep, validTypes: ['array', 'object'] , dynamic: false},
  startsWith: {
    namedArgs: ['on', 'searchString', 'position'],
    prep,
    validTypes: ['array', 'object'],
  },
  substring: { namedArgs: ['on', 'start', 'end'], prep, validTypes: ['array', 'object'] , dynamic: false},
  // toLocaleLowerCase: { namedArgs: ['on', 'locale'], validTypes: ['array', 'object'] },
  // toLocaleUpperCase: { namedArgs: ['on', 'locale'], validTypes: ['array', 'object'] },
  toLowerCase: { validTypes: ['string', 'null'], singleArg: true, prep , dynamic: false},
  toUpperCase: { validTypes: ['string', 'null'], singleArg: true, prep , dynamic: false},
  trim: { validTypes: ['string', 'null'], singleArg: true, prep , dynamic: false},
  trimEnd: { validTypes: ['string', 'null'], singleArg: true, prep , dynamic: false},
  trimStart: { validTypes: ['string', 'null'], singleArg: true, prep , dynamic: false},
  length: { validTypes: ['string', 'null'], property: true, prep , dynamic: false},
};

function _string({ params, location, methodName }) {
  return runInstance({
    location,
    meta,
    methodName,
    operator: '_string',
    params,
    instanceType: 'string',
  });
}

_string.dynamic = false;

export default _string;
