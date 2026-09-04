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

// A file plugin: one .js file under plugins/actions. The default export is the
// action; its params schema is in the sibling CopyRow.json.
function CopyRow({ methods: { setState }, params }) {
  if (!params.rowId) {
    throw new Error('CopyRow requires a "rowId" parameter.');
  }
  setState({ copied_row_id: params.rowId });
}

export default CopyRow;
