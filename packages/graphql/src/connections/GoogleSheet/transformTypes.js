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

import { type } from '@lowdefy/helpers';

const readTransformers = {
  string: (value) => value,
  number: (value) => {
    const number = Number(value);
    if (isNaN(number)) return null;
    return number;
  },
  boolean: (value) => value === 'TRUE',
  date: (value) => {
    const date = new Date(value);
    if (isNaN(date.getTime())) return null;
    return date;
  },
  json: (value) => {
    try {
      return JSON.parse(value);
    } catch (_) {
      return null;
    }
  },
};


const transformObject = ({ transformers, types }) => (object) => {
  Object.keys(object).forEach((key) => {
    if (types[key]) {
      object[key] = transformers[types[key]](object[key]);
    }
  });
  return object;
};

function transformRead({ input, types = {} }) {
  if (type.isObject(input)) {
    return transformObject({ transformers: readTransformers, types })(input);
  }
  if (type.isArray(input)) {
    return input.map((obj) => transformObject({ transformers: readTransformers, types })(obj));
  }
  throw new Error(`transformRead received invalid input type ${type.typeOf(input)}.`);
}


export {
  transformRead,
};
