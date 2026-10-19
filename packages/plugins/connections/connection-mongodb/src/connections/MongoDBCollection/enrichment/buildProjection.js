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

// A find projection of dot paths. MongoDB refuses a projection of both a path and a path
// inside it ("Path collision"), so a path inside another projected path is left out: the
// outer path already returns it.
function buildProjection(paths) {
  const unique = [...new Set(paths)].sort();
  const projection = {};
  unique.forEach((path) => {
    const covered = unique.some((other) => other !== path && path.startsWith(`${other}.`));
    if (!covered) projection[path] = 1;
  });
  return projection;
}

export default buildProjection;
