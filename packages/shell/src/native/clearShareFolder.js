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

import shareFolder from './shareFolder.js';

/**
 * Deletes the copies of files shared into the app. It runs when the app opens (startShareIn.js),
 * not when the next share arrives, so a page still uploading a file shared earlier keeps it.
 */
function clearShareFolder() {
  const folder = shareFolder();
  if (folder.exists) folder.delete();
}

export default clearShareFolder;
