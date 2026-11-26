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

// skeletonSourceFiles.json after endpoint builds: the files the rest of the
// config read, and the files each endpoint reads now.
function listSkeletonSourceFiles({ endpointRegistry }) {
  const files = new Set(endpointRegistry.otherSkeletonFiles);
  for (const entry of endpointRegistry.endpoints.values()) {
    for (const file of entry.files) {
      files.add(file);
    }
  }
  return [...files].sort();
}

export default listSkeletonSourceFiles;
