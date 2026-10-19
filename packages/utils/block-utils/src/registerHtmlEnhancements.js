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

// The Lowdefy client registers { Icon, HtmlOverlay, icons } once at start-up so
// HtmlComponent can render data-icon, data-tooltip and data-popover wherever
// HTML renders — including Message, Notification and ConfirmModal content,
// which antd mounts outside the page's React tree. Unregistered (unit tests,
// standalone renders) HTML renders as plain sanitised markup.
let registered = null;

function registerHtmlEnhancements(enhancements) {
  registered = enhancements;
}

function getHtmlEnhancements() {
  return registered;
}

export { getHtmlEnhancements };
export default registerHtmlEnhancements;
