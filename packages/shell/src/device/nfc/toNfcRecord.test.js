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

import toNfcRecord from './toNfcRecord.js';

const Ndef = {
  TNF_WELL_KNOWN: 0x01,
  RTD_TEXT: 'T',
  RTD_URI: 'U',
  text: { decodePayload: () => 'ASSET-0042' },
  uri: { decodePayload: () => 'https://example.com/a/42' },
};

test('toNfcRecord decodes a text record from iOS type bytes', () => {
  expect(toNfcRecord({ Ndef, record: { tnf: 1, type: [0x54], payload: [2, 101, 110] } })).toEqual({
    type: 'text',
    text: 'ASSET-0042',
    payload: [2, 101, 110],
  });
});

test('toNfcRecord decodes a URI record from an Android type string', () => {
  expect(toNfcRecord({ Ndef, record: { tnf: 1, type: 'U', payload: [4] } })).toEqual({
    type: 'uri',
    uri: 'https://example.com/a/42',
    payload: [4],
  });
});

test('toNfcRecord keeps the raw payload of any other record', () => {
  expect(toNfcRecord({ Ndef, record: { tnf: 2, type: 'text/plain', payload: [1, 2] } })).toEqual({
    type: 'text/plain',
    payload: [1, 2],
  });
});
