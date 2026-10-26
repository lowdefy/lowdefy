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

import DocumentScanner, { ResponseType } from 'react-native-document-scanner-plugin';

import toPickedFile from '../basic/toPickedFile.js';

/**
 * The documentScanner device feature (profile field): the system document scanner (VisionKit on
 * iOS, ML Kit on Android) finds each page's edges, crops and straightens it. Pages come back as
 * JPEG files; [] when cancelled.
 */
function createDocumentScannerFeature() {
  return async function scanDocument({ base64 = false, maxPages, quality = 0.8 }) {
    const { scannedImages, status } = await DocumentScanner.scanDocument({
      croppedImageQuality: Math.round(quality * 100),
      maxNumDocuments: maxPages,
      responseType: ResponseType.ImageFilePath,
    });
    if (status === 'cancel' || !Array.isArray(scannedImages)) {
      return [];
    }
    return Promise.all(
      scannedImages.map((uri, index) =>
        toPickedFile({
          asset: {
            mimeType: 'image/jpeg',
            name: `scan-${Date.now()}-${index + 1}.jpg`,
            uri: uri.startsWith('file://') ? uri : `file://${uri}`,
          },
          base64,
        })
      )
    );
  };
}

export default createDocumentScannerFeature;
