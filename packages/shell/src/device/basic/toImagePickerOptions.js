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

const MEDIA_TYPES = { images: 'images', videos: 'videos' };

/**
 * PickImage and TakePhoto params as expo-image-picker options. Videos come back as files; photos
 * are compressed to `quality`.
 *
 * @param {Object} params
 */
function toImagePickerOptions({
  maxCount,
  mediaTypes = ['images'],
  multiple = false,
  quality = 0.7,
}) {
  return {
    allowsMultipleSelection: multiple,
    base64: false,
    exif: false,
    mediaTypes: mediaTypes.map((mediaType) => MEDIA_TYPES[mediaType]),
    quality,
    selectionLimit: multiple ? maxCount ?? 0 : 1,
  };
}

export default toImagePickerOptions;
