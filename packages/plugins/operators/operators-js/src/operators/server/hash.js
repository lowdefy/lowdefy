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

import crypto from 'crypto';
import { runClass } from '@lowdefy/operators';

function hash(algorithm, data) {
  return crypto.createHash(algorithm).update(data).digest('hex');
}

function md5(data) {
  return hash('md5', data);
}

function sha1(data) {
  return hash('sha1', data);
}

function sha256(data) {
  return hash('sha256', data);
}

function sha512(data) {
  return hash('sha512', data);
}

function ripemd160(data) {
  return hash('ripemd160', data);
}

const functions = { md5, sha1, sha256, sha512, ripemd160 };

const meta = {
  md5: { validTypes: ['string'], singleArg: true },
  sha1: { validTypes: ['string'], singleArg: true },
  sha256: { validTypes: ['string'], singleArg: true },
  sha512: { validTypes: ['string'], singleArg: true },
  ripemd160: { validTypes: ['string'], singleArg: true },
};

function _hash({ params, location, methodName }) {
  return runClass({
    functions,
    location,
    meta,
    methodName,
    operator: '_hash',
    params,
  });
}

export default _hash;
