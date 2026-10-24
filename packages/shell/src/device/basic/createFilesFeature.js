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

import * as DocumentPicker from 'expo-document-picker';

import toPickedFile from './toPickedFile.js';

/**
 * The files device feature: picks files from Files (iOS) or the document picker (Android), copied
 * into the app's cache so they can be read and uploaded. [] when cancelled.
 */
function createFilesFeature() {
  return {
    async pick({ base64 = false, multiple = false, types }) {
      const result = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple,
        type: types ?? '*/*',
      });
      if (result.canceled) {
        return [];
      }
      return Promise.all(result.assets.map((asset) => toPickedFile({ asset, base64 })));
    },
  };
}

export default createFilesFeature;
