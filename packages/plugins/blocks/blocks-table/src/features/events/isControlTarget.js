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

const CONTROL_SELECTOR =
  'a[href], button, input, select, textarea, label, summary, [role="button"], [role="checkbox"], [role="switch"], [role="link"], [data-event], [data-lf-control], [contenteditable="true"]';

// Clicks on controls inside a cell (buttons, links, inputs, `data-event` HTML) are the control's,
// never a row click or row link (D5).
function isControlTarget({ target, cell }) {
  const control = target.closest(CONTROL_SELECTOR);
  return Boolean(control && control !== cell && cell.contains(control));
}

export default isControlTarget;
