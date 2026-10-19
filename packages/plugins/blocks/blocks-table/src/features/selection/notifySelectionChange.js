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

// onSelectionChange carries the selection and, in client mode, the selected row objects.
function notifySelectionChange({ cause, value, api }) {
  if (cause !== 'select') return;
  const rowsById = api.table.getCoreRowModel().rowsById;
  const selection = api.state.rowSelection;
  const rows = [];
  Object.keys(selection).forEach((id) => {
    if (selection[id] === true && rowsById[id]) rows.push(rowsById[id].original);
  });
  api.methods.triggerEvent({
    name: 'onSelectionChange',
    event: { selected: value.selected, rows },
  });
}

export default notifySelectionChange;
