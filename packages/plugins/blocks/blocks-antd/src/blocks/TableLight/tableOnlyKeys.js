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

// The Table features TableLight leaves out, by the key that turns them on,
// with the feature named in the error. The schema (meta.js) and the runtime
// check (validateTableLightProperties.js) both read these, so the message is
// the same wherever the key is caught.
const TABLE_ONLY_KEYS = {
  properties: {
    rowSelection: 'row selection',
    toolbar: 'the toolbar',
    views: 'saved views',
    activeView: 'saved views',
    defaultView: 'views',
    persist: 'view persistence',
    virtual: 'virtualisation',
    headerMenu: 'the header menu',
    reorderable: 'column reordering',
    stickyHeader: 'sticky header control',
    rowHeight: 'fixed row heights',
    tree: 'tree data',
    expandable: 'expandable rows',
    keyboard: 'keyboard grid navigation',
    rowVersionField: 'row change tracking',
  },
  columns: {
    filterable: 'column filters',
    resizable: 'column resizing',
    groupable: 'grouping',
    editable: 'editing',
    validate: 'editing',
    flex: 'flexible column widths',
    maxWidth: 'maximum column widths',
  },
};

export default TABLE_ONLY_KEYS;
