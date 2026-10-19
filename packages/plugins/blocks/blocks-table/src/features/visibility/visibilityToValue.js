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

// `view.collapsedColumnGroups`, only on tables with collapsible column groups, so other tables'
// values are unchanged.
function visibilityToValue({ state, api }) {
  if (api.config.columnGroups.groups.length === 0) return null;
  return { view: { collapsedColumnGroups: state.collapsedColumnGroups } };
}

export default visibilityToValue;
