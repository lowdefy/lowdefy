/*
  Copyright 2020-2026 Lowdefy, Inc

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

import { runClass } from '@lowdefy/operators';

// atob and btoa work on Latin-1 characters, one byte each. Encode the UTF-8 bytes instead, like the
// server and build _base64, so any string encodes and decodes to the same value everywhere.
function decode(input) {
  const binary = atob(input);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encode(input) {
  const bytes = new TextEncoder().encode(input);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary);
}

const functions = { encode, decode };
const meta = {
  encode: { singleArg: true, validTypes: ['string'] },
  decode: { singleArg: true, validTypes: ['string'] },
};

function _base64({ params, location, methodName }) {
  return runClass({
    functions,
    location,
    meta,
    methodName,
    operator: '_base64',
    params,
  });
}

_base64.dynamic = true;
_base64.tracking = { kind: 'pure' };

export default _base64;
