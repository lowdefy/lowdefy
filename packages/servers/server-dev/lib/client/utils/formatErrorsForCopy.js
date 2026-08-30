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

import groupNotices from './groupNotices.js';

function formatEntry(error) {
  const prefix = error.prodError === true ? `[${error.type}] (fails in prod)` : `[${error.type}]`;
  let text = `${prefix} ${error.message}`;
  if (error.source) text += `\n  Source: ${error.source}`;
  if (error.stack) text += `\n${error.stack}`;
  return text;
}

// Errors and warnings first, then the tenant: none notices under their own
// heading with their source lines, so a pasted bar reads as two lists.
function formatErrorsForCopy(errors) {
  const { entries, tenantNotices } = groupNotices(errors);
  const sections = [entries.map(formatEntry).join('\n\n')];
  if (tenantNotices.length > 0) {
    const lines = tenantNotices.map((notice) => {
      const source = notice.source ? `\n  Source: ${notice.source}` : '';
      return `${notice.message}${source}`;
    });
    sections.push(`Unscoped reads (tenant: none):\n${lines.join('\n')}`);
  }
  return sections.filter((section) => section !== '').join('\n\n');
}

export default formatErrorsForCopy;
