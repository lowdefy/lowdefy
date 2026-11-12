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

import * as Crypto from 'expo-crypto';
import { Directory, File } from 'expo-file-system';

import shareFolder from './shareFolder.js';

// expo-sharing deletes its own copies when its payloads are cleared, so each file is copied to a
// folder of its own in the shell's share folder: two files with the same name keep apart.
async function copySharedFile(file) {
  const folder = new Directory(shareFolder(), Crypto.randomUUID());
  folder.create({ intermediates: true });
  await new File(file.uri).copy(folder);
  const [copy] = folder.list();
  return { ...file, uri: copy.uri };
}

/**
 * Copies the files shared into the app (toSharePayload's files) out of expo-sharing's folder into
 * the shell's share folder (shareFolder.js), and returns them with the copies' URIs.
 *
 * @param {Object} params
 * @param {Object[]} params.files [{ name, mimeType, size, uri, type }].
 * @returns {Promise<Object[]>}
 */
async function copySharedFiles({ files }) {
  return Promise.all(files.map(copySharedFile));
}

export default copySharedFiles;
