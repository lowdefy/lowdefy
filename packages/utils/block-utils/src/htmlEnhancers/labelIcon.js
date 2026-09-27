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

// An icon placeholder with no text is decorative unless it is a control. A
// tooltip names an icon-only element for screen readers too.
function labelIcon(element) {
  if (element.hasAttribute('aria-label') || element.textContent.trim() !== '') return;
  const tooltip = element.getAttribute('data-tooltip');
  if (tooltip) {
    element.setAttribute('aria-label', tooltip);
    if (!element.hasAttribute('role')) {
      element.setAttribute('role', 'img');
    }
    return;
  }
  if (element.matches('[data-event], [data-popover]')) return;
  element.setAttribute('aria-hidden', 'true');
}

export default labelIcon;
