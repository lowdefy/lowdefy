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

// Every block method of blocks-table's Table (its meta), by what it does. The Table stand-in
// models none of them: each changes the rows a person sees, keeps state the stand-in does not
// keep, returns what only the component knows or opens a panel of the component's own. So a
// CallMethod with one leaves the journey to the browser at that step (registerBrowserOnlyMethods).
// A test reads Table's meta and fails on a method not listed here.
const TABLE_METHODS = {
  applyTransaction: 'changes its rows',
  clearFilters: 'clears its filters',
  clearSelection: 'clears its row selection',
  collapseAllGroups: 'collapses its groups',
  expandAllGroups: 'expands its groups',
  exportCsv: 'exports its rows',
  openCellDetails: 'opens the details of a cell',
  openColumnManager: 'opens its column manager',
  openColumnPicker: 'opens its column picker',
  openFilter: 'opens its filter builder',
  openImport: 'opens its import dialog',
  refresh: 'refetches its rows',
  scrollToRow: 'scrolls a row into view',
  selectAllMatching: 'selects the rows its view matches',
  setFilter: 'sets a filter',
  setGroup: 'groups its rows',
  setSearch: 'sets a search',
};

export default TABLE_METHODS;
