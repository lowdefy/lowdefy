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

// The reserved-segment rule is copied from
// packages/build/src/build/buildPages/buildBlock/namespaceBlockId.js rather
// than imported: this package is a standalone, dependency-light codemod core
// and must not pull @lowdefy/build in. A block id is a dot-separated state
// path; a segment may not be empty and may not start with "~", because either
// makes the path unaddressable by _state/_get.
const RESERVED_SEGMENT_PREFIX = '~';

function namespaceContainerId({ parentId, kind, index }) {
  if (typeof parentId !== 'string' || parentId === '') {
    throw new Error(
      `Container id prefix should be a non-empty string. Received ${JSON.stringify(parentId)}.`
    );
  }
  const id = `${parentId}_${kind}_${index}`;
  for (const segment of id.split('.')) {
    if (segment === '') {
      throw new Error(`Generated container id "${id}" has an empty path segment.`);
    }
    if (segment.startsWith(RESERVED_SEGMENT_PREFIX)) {
      throw new Error(
        `Generated container id "${id}" has a reserved path segment "${segment}". Block id segments may not start with "~".`
      );
    }
  }
  return id;
}

export default namespaceContainerId;
