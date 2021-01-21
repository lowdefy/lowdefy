/*
  Copyright 2020-2021 Lowdefy, Inc

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

import runInstance from '../runInstance';
import { type } from '@lowdefy/helpers';

const meta = {
  charAt: { namedArgs: ['on', 'index'], validTypes: ['array', 'object'] },
  // 'charCodeAt',
  concat: { validTypes: ['array'] },
  endsWith: { namedArgs: ['on', 'searchString', 'length'], validTypes: ['array', 'object'] },
  includes: { namedArgs: ['on', 'searchString', 'position'], validTypes: ['array', 'object'] },
  indexOf: { namedArgs: ['on', 'searchValue', 'fromIndex'], validTypes: ['array', 'object'] },
  lastIndexOf: { namedArgs: ['on', 'searchValue', 'fromIndex'], validTypes: ['array', 'object'] },
  // 'localeCompare',
  match: { namedArgs: ['on', 'regex', 'regexFlags'], validTypes: ['array', 'object'] },
  // 'matchAll',
  normalize: { namedArgs: ['on', 'form'], validTypes: ['array', 'object'] },
  padEnd: { namedArgs: ['on', 'targetLength', 'padString'], validTypes: ['array', 'object'] },
  padStart: { namedArgs: ['on', 'targetLength', 'padString'], validTypes: ['array', 'object'] },
  repeat: { namedArgs: ['on', 'count'], validTypes: ['array', 'object'] },
  replace: {
    namedArgs: ['on', 'regex', 'newSubstr', 'regexFlags'],
    validTypes: ['array', 'object'],
  },
  search: { namedArgs: ['on', 'regex', 'regexFlags'], validTypes: ['array', 'object'] },
  slice: { namedArgs: ['on', 'start', 'end'], validTypes: ['array', 'object'] },
  split: { namedArgs: ['on', 'separator'], validTypes: ['array', 'object'] },
  startsWith: { namedArgs: ['on', 'searchString', 'position'], validTypes: ['array', 'object'] },
  substring: { namedArgs: ['on', 'start', 'end'], validTypes: ['array', 'object'] },
  // toLocaleLowerCase: { namedArgs: ['on', 'locale'], validTypes: ['array', 'object'] },
  // toLocaleUpperCase: { namedArgs: ['on', 'locale'], validTypes: ['array', 'object'] },
  toLowerCase: { validTypes: ['string'], singleArg: true },
  toUpperCase: { validTypes: ['string'], singleArg: true },
  trim: { validTypes: ['string'], singleArg: true },
  trimEnd: { validTypes: ['string'], singleArg: true },
  trimStart: { validTypes: ['string'], singleArg: true },
  length: { validTypes: ['string'], property: true },
};

function _string({ params, location, methodName }) {
  if (type.isObject(params) && params.regex) {
    params.regex = new RegExp(params.regex, params.regexFlags);
  }
  return runInstance({
    location,
    meta,
    methodName,
    operator: '_string',
    params,
    instanceType: 'string',
  });
}

export default _string;
