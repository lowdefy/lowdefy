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

import { Platform } from 'react-native';
import NfcManager, { Ndef, NfcError, NfcTech } from 'react-native-nfc-manager';

import toNfcRecord from './toNfcRecord.js';

let started = null;

function start() {
  if (started === null) {
    started = NfcManager.start();
  }
  return started;
}

// Runs one NFC session: waits for a tag, works with it, and always ends the session. A cancelled
// sheet answers null.
async function withTag(prompt, work) {
  await start();
  try {
    await NfcManager.requestTechnology(NfcTech.Ndef, { alertMessage: prompt });
    return await work();
  } catch (error) {
    if (error instanceof NfcError.UserCancel) {
      return null;
    }
    throw error;
  } finally {
    NfcManager.cancelTechnologyRequest().catch(() => {});
  }
}

function toRecordBytes(records) {
  return Ndef.encodeMessage(
    records.map((record) =>
      record.type === 'uri'
        ? Ndef.uriRecord(record.value)
        : Ndef.textRecord(record.value, record.language ?? 'en')
    )
  );
}

/**
 * The nfc device feature (profile field-nfc): ReadNfc and WriteNfc on NDEF tags
 * (react-native-nfc-manager). iOS shows its scan sheet with the prompt.
 */
const nfc = {
  read({ prompt = 'Hold the phone near the tag.' } = {}) {
    return withTag(prompt, async () => {
      const tag = await NfcManager.getTag();
      return {
        id: tag?.id ?? null,
        type: tag?.type ?? tag?.tech ?? null,
        records: (tag?.ndefMessage ?? []).map((record) => toNfcRecord({ Ndef, record })),
      };
    });
  },
  write({ prompt = 'Hold the phone near the tag to write it.', records }) {
    return withTag(prompt, async () => {
      await NfcManager.ndefHandler.writeNdefMessage(toRecordBytes(records));
      if (Platform.OS === 'ios') {
        await NfcManager.setAlertMessage('Done');
      }
      const tag = await NfcManager.getTag();
      return { id: tag?.id ?? null };
    });
  },
};

// The `field-nfc` profile's device features (profiles.js NFC_ENTRY).
const features = { nfc };
const hosts = [];

export { features, hosts };
