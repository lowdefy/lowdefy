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
import runClass from '../runClass';

function decode(input) {
  if (!type.isString(input)) {
    throw new Error('Input must be a string type.');
  }
  return decodeURIComponent(input);
}

function encode(input) {
  if (!type.isString(input)) {
    throw new Error('Input must be a string type.');
  }
  return encodeURIComponent(input);
}

const Cls = { encode, decode };
const allowedMethods = new Set(['encode', 'decode']);

function _uri({ params, location, method }) {
  return runClass({
    allowedMethods,
    allowedProperties: new Set([]),
    Cls,
    location,
    method,
    operator: '_uri',
    params,
  });
}

export default _uri;
