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

function typeText(recordType) {
  if (typeof recordType === 'string') {
    return recordType;
  }
  return String.fromCharCode(...recordType);
}

/**
 * One NDEF record as ReadNfc returns it: { type, text?, uri?, payload }. Text and URI records are
 * decoded; any other record keeps its raw payload bytes.
 *
 * @param {Object} params
 * @param {Object} params.record A react-native-nfc-manager NdefRecord.
 * @param {Object} params.Ndef react-native-nfc-manager's Ndef helpers.
 */
function toNfcRecord({ Ndef, record }) {
  const recordType = typeText(record.type);
  const payload = Array.from(record.payload ?? []);
  if (record.tnf === Ndef.TNF_WELL_KNOWN && recordType === Ndef.RTD_TEXT) {
    return { type: 'text', text: Ndef.text.decodePayload(Uint8Array.from(payload)), payload };
  }
  if (record.tnf === Ndef.TNF_WELL_KNOWN && recordType === Ndef.RTD_URI) {
    return { type: 'uri', uri: Ndef.uri.decodePayload(Uint8Array.from(payload)), payload };
  }
  return { type: recordType, payload };
}

export default toNfcRecord;
