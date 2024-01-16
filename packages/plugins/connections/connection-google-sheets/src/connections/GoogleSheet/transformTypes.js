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
import moment from 'moment';

const readTransformers = {
  string: (value) => value,
  number: (value) => {
    const number = Number(value);
    if (isNaN(number)) return null;
    return number;
  },
  boolean: (value) => value === 'TRUE',
  date: (value) => {
    const date = moment.utc(value);
    if (!date.isValid()) return null;
    return date.toDate();
  },
  json: (value) => {
    try {
      return JSON.parse(value);
    } catch (_) {
      return null;
    }
  },
};

const writeTransformers = {
  string: (value) => value,
  number: (value) => (type.isNumber(value) ? value.toString() : value),
  boolean: (value) => {
    if (value === true) return 'TRUE';
    if (value === false) return 'FALSE';
    return value;
  },
  date: (value) => (type.isDate(value) ? value.toISOString() : value),
  json: (value) => {
    try {
      return JSON.stringify(value);
    } catch (_) {
      return value;
    }
  },
};

const transformObject =
  ({ transformers, types }) =>
  (object) => {
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

function transformWrite({ input, types = {} }) {
  if (type.isObject(input)) {
    return transformObject({ transformers: writeTransformers, types })(input);
  }
  if (type.isArray(input)) {
    return input.map((obj) => transformObject({ transformers: writeTransformers, types })(obj));
  }
  throw new Error(`transformWrite received invalid input type ${type.typeOf(input)}.`);
}

export { transformRead, transformWrite };
