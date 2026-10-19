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

function handleTreeClick(event, api) {
  if (!api.config.tree) return false;
  const toggle = event.target.closest('[data-lf-tree-toggle]');
  if (!toggle || !api.contains(toggle)) return false;
  const rowElement = toggle.closest('[data-row-key]');
  api.actions.toggleRowExpanded({ id: rowElement.dataset.rowKey });
  return true;
}

export default handleTreeClick;
