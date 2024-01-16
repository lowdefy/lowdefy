/* eslint-disable no-param-reassign */

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

// Derived from source:
// https://github.com/jonschlinkert/unset-value/blob/master/index.js
// https://github.com/jonschlinkert/unset-value/issues/3
// The MIT License (MIT)
// Copyright (c) 2015, 2017, Jon Schlinkert

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
// THE SOFTWARE.

import type from './type.js';
import get from './get.js';

const hasValues = (val) => {
  switch (type.typeOf(val)) {
    case 'boolean':
    case 'date':
    case 'function':
    case 'null':
    case 'number':
      return true;
    case 'undefined':
      return false;
    case 'regexp':
      return val.source !== '(?:)' && val.source !== '';
    case 'buffer':
      return val.toString() !== '';
    case 'error':
      return val.message !== '';
    case 'string':
    case 'arguments':
      return val.length !== 0;
    case 'file':
    case 'map':
    case 'set':
      return val.size !== 0;
    case 'array':
    case 'object':
      // eslint-disable-next-line no-restricted-syntax
      // CHANGED - we are assuming that an empty object and array is a value.
      // for (const key of Object.keys(val)) {
      //   if (hasValues(val[key])) {
      //     return true;
      //   }
      // }
      // return false;
      return true;
    // everything else
    default: {
      return true;
    }
  }
};

const hasValue = (obj, path, options) => {
  if (type.isObject(obj) && (type.isString(path) || type.isArray(path))) {
    return hasValues(get(obj, path, options));
  }
  return false;
};

const unset = (obj, prop) => {
  // support array refence in the form a.0 , a.0.b or a[0] , a[0].b
  if (!type.isObject(obj)) {
    throw new TypeError('expected an object.');
  }
  if (Object.prototype.hasOwnProperty.call(obj, prop)) {
    delete obj[prop];
    return true;
  }

  if (hasValue(obj, prop)) {
    const segs = prop.split('.');
    let last = segs.pop();
    while (segs.length && segs[segs.length - 1].slice(-1) === '\\') {
      last = `${segs.pop().slice(0, -1)}.${last}`;
    }
    while (segs.length) obj = obj[segs.shift()];
    return delete obj[last];
  }
  return true;
};

export default unset;
