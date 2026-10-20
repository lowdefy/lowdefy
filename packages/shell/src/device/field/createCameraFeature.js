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

import { Camera } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';

import scanRequests from './scanRequests.js';
import ScannerView from './ScannerView.js';
import toImagePickerOptions from '../basic/toImagePickerOptions.js';
import toPickedFile from '../basic/toPickedFile.js';

/**
 * The camera device feature (profile field): ScanCode's sheet, TakePhoto's capture and the live
 * ScannerView the QRScanner block draws. Each asks for the camera the first time; a refusal throws.
 */
function createCameraFeature() {
  async function allowCamera() {
    const { granted } = await Camera.requestCameraPermissionsAsync();
    if (!granted) {
      throw new Error('Camera permission was denied.');
    }
  }
  return {
    ScannerView,
    async scanCode(params) {
      await allowCamera();
      return scanRequests.open(params);
    },
    async takePhoto(params) {
      await allowCamera();
      const result = await ImagePicker.launchCameraAsync(toImagePickerOptions(params));
      if (result.canceled) {
        return [];
      }
      return Promise.all(
        result.assets.map((asset) => toPickedFile({ asset, base64: params.base64 === true }))
      );
    },
  };
}

export default createCameraFeature;
