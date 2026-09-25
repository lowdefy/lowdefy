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

// Elements that already take focus and respond to Enter/Space on their own.
const NATIVE_INTERACTIVE = 'a[href], button, input, select, textarea, summary';

function isInPopoverContent(element) {
  return element.closest('[data-popover-content]') !== null;
}

function makeFocusable(element) {
  if (element.matches(NATIVE_INTERACTIVE) || element.hasAttribute('tabindex')) return;
  element.setAttribute('tabindex', '0');
}

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

// Runs once per applied HTML string, before any icon portal mounts:
// - captures each popover's content HTML (the nested HtmlComponent that shows
//   it enhances it, so the source subtree itself is left alone),
// - makes popover triggers buttons, and data-event targets focusable when the
//   HTML fires events (existing targets get focus, not a new role),
// - collects the data-icon placeholders whose names resolve to an icon.
function prepareHtmlEnhancements({ dataEvents, iconMap, root }) {
  const popoverContents = {};
  root.querySelectorAll('[data-popover-content]').forEach((element) => {
    popoverContents[element.getAttribute('data-popover-content')] = element.innerHTML;
  });

  // A native title would show a second tooltip next to the themed one.
  root.querySelectorAll('[data-tooltip][title]').forEach((element) => {
    element.removeAttribute('title');
  });

  root.querySelectorAll('[data-popover]').forEach((element) => {
    if (isInPopoverContent(element)) return;
    makeFocusable(element);
    if (!element.matches(NATIVE_INTERACTIVE) && !element.hasAttribute('role')) {
      element.setAttribute('role', 'button');
    }
    element.setAttribute('aria-expanded', 'false');
  });

  if (dataEvents) {
    root.querySelectorAll('[data-event]').forEach((element) => {
      if (isInPopoverContent(element)) return;
      makeFocusable(element);
    });
  }

  const icons = [];
  root.querySelectorAll('[data-icon]').forEach((element) => {
    if (isInPopoverContent(element)) return;
    const name = element.getAttribute('data-icon');
    // Existing markup may use data-icon for something else; an unknown name
    // renders nothing rather than the fallback icon.
    if (!Object.hasOwn(iconMap, name)) {
      console.warn(`data-icon="${name}" is not a known icon, so nothing was rendered.`);
      return;
    }
    labelIcon(element);
    icons.push({ element, name });
  });

  return { icons, popoverContents };
}

export { NATIVE_INTERACTIVE };
export default prepareHtmlEnhancements;
