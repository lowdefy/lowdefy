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

// A module's source names its package and version: "github:owner/repo/path@ref"
// is package "github:owner/repo/path" at version "ref"; a local "file:" source
// is version "local".
function parseModuleSource({ source }) {
  if (source.startsWith('file:')) {
    return { package: source, version: 'local' };
  }
  const at = source.lastIndexOf('@');
  if (at <= 0) {
    return { package: source, version: null };
  }
  return { package: source.slice(0, at), version: source.slice(at + 1) };
}

export default parseModuleSource;
