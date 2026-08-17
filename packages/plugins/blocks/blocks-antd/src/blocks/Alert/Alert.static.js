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

import { isBlank } from '../../static.utils.js';

// Alert severity doubles as the IR text `tint` hint; the reports translator
// maps these to colours (error/warning/success/info).
const TINTS = new Set(['success', 'info', 'warning', 'error']);

/**
 * Alert → `text` carrying the message and description (newline-separated),
 * tinted by the alert `type`. An alert with neither yields no node.
 */
export const Alert = {
  toReport: ({ block }) => {
    const { message, description, type: severity } = block.properties;
    const parts = [];
    if (!isBlank(message)) parts.push(String(message));
    if (!isBlank(description)) parts.push(String(description));
    if (parts.length === 0) return null;
    const tint = TINTS.has(severity) ? severity : 'info';
    return { kind: 'text', text: parts.join('\n'), tint };
  },
};
