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
  // Buffer.from(input, 'base64') on the server also accepts base64url and missing padding.
  // Remove whitespace first, as atob does, so the padding is computed from the base64 characters.
  const base64 = input
    .replace(/[\t\n\f\r ]/g, '')
    .replace(/-/g, '+')
    .replace(/_/g, '/')
    .replace(/=+$/, '');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  // Throw on bytes that are not valid UTF-8 instead of replacing them with U+FFFD, so data that is
  // not UTF-8 text, such as Latin-1 values encoded by earlier versions, surfaces as an error.
  try {
    return new TextDecoder('utf-8', { fatal: true }).decode(bytes);
  } catch {
    throw new Error('_base64.decode received base64 that does not decode to valid UTF-8 text.');
  }
}

function encode(input) {
  const bytes = new TextEncoder().encode(input);
  return btoa(Array.from(bytes, (byte) => String.fromCharCode(byte)).join(''));
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
