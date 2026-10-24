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

import { FEATURE_SHELLS } from '@lowdefy/blocks-native/device';

// An injected photo as a picked file: the PickImage shape, with its content inline.
function toPhotoFile(photo) {
  const mimeType = photo.mimeType ?? 'image/jpeg';
  return {
    name: photo.name ?? 'injected-photo.jpg',
    mimeType,
    size: Math.round((photo.base64.length * 3) / 4),
    uri: `data:${mimeType};base64,${photo.base64}`,
    width: photo.width ?? null,
    height: photo.height ?? null,
    base64: photo.base64,
  };
}

// A feature method that answers an injected result first, and asks the shell's own feature
// otherwise. Lowdefy Dev carries the field profile, so NFC has no feature of its own there: an
// injection is then the only answer, and a read with none throws as a shell without NFC does.
function answerFirst({ action, feature, method, read, real, toResult }) {
  return async (params) => {
    const value = read();
    if (value !== undefined) {
      return toResult(value);
    }
    if (real === undefined) {
      throw new Error(
        `${action} needs a shell that carries ${feature} (${FEATURE_SHELLS[feature]}). In Lowdefy Dev, inject one.`
      );
    }
    return real[method](params);
  };
}

/**
 * Lowdefy Dev's device: the shell's features, with the next scan, photo and NFC read answered by
 * what an agent or journey injected (src/device/injected.js) before the camera or the tag reader.
 *
 * @param {Object} params
 * @param {Object} params.features The shell's device features (src/device/device.js).
 * @param {(name: string) => any} params.read injected().
 */
function withInjectedDevice({ features, read }) {
  const photo = (method, feature, action) =>
    answerFirst({
      action,
      feature,
      method,
      read: () => read('photo'),
      real: features[feature],
      toResult: (value) => [toPhotoFile(value)],
    });
  return {
    ...features,
    camera: {
      ...features.camera,
      scanCode: answerFirst({
        action: 'ScanCode',
        feature: 'camera',
        method: 'scanCode',
        read: () => read('scan'),
        real: features.camera,
        toResult: (value) => ({ data: value.data, type: value.type ?? 'qr' }),
      }),
      takePhoto: photo('takePhoto', 'camera', 'TakePhoto'),
    },
    photos: { ...features.photos, pick: photo('pick', 'photos', 'PickImage') },
    nfc: {
      ...features.nfc,
      read: answerFirst({
        action: 'ReadNfc',
        feature: 'nfc',
        method: 'read',
        read: () => read('nfc'),
        real: features.nfc,
        toResult: (value) => value,
      }),
    },
  };
}

export default withInjectedDevice;
