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

import * as ImagePicker from 'expo-image-picker';

import toImagePickerOptions from './toImagePickerOptions.js';
import toPickedFile from './toPickedFile.js';

/**
 * The photos device feature: picks photos and videos with the system picker, which needs no
 * permission (PHPicker on iOS, the Photo Picker on Android). [] when cancelled.
 */
function createPhotosFeature() {
  return {
    async pick(params) {
      const result = await ImagePicker.launchImageLibraryAsync(toImagePickerOptions(params));
      if (result.canceled) {
        return [];
      }
      return Promise.all(
        result.assets.map((asset) => toPickedFile({ asset, base64: params.base64 === true }))
      );
    },
  };
}

export default createPhotosFeature;
