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

function isSameTargets(a, b) {
  if (a.length !== b.length) return false;
  return a.every(
    (target, i) =>
      target.id === b[i].id &&
      target.element === b[i].element &&
      target.status === b[i].status &&
      target.message === b[i].message
  );
}

export default isSameTargets;
