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
// The paths one row writes must not overlap: MongoDB refuses an update that sets both
// "address" and "address.city", and an insert document can not hold both. The row key field
// is the row's identity, so the changes can not rewrite it.
function assertPatchPaths({ patch, keyField, location }) {
  const paths = [...patch.keys()];
  paths.forEach((path) => {
    if (path === keyField) {
      throw new Error(
        `MongoDBTableChanges ${location}: the row key field "${keyField}" can not be changed.`
      );
    }
    const parent = paths.find((other) => path.startsWith(`${other}.`));
    if (parent !== undefined) {
      throw new Error(
        `MongoDBTableChanges ${location}: "${parent}" and "${path}" overlap, so they can not both be written.`
      );
    }
  });
}

export default assertPatchPaths;
