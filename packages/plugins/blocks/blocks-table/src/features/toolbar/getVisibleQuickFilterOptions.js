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

// The indices of the options a quick filter lists for its search: those whose label contains the
// search (case-insensitive), and every checked one. Checked options stay listed because antd's
// Checkbox.Group reports only the values of the checkboxes it renders, so hiding one unchecks it.
function getVisibleQuickFilterOptions({ options, search, values }) {
  const term = search.trim().toLowerCase();
  const indices = [];
  options.forEach((option, index) => {
    if (
      term === '' ||
      values.includes(option.value) ||
      String(option.label).toLowerCase().includes(term)
    ) {
      indices.push(index);
    }
  });
  return indices;
}

export default getVisibleQuickFilterOptions;
