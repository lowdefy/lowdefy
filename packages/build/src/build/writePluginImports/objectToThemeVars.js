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

// Flatten a nested tailwind theme object into `@theme` CSS custom-property
// declarations: `{ color: { brand: '#722ed1' } }` → `  --color-brand: #722ed1;`.
// Shared by writeGlobalsCss (client) and writeReportStyles (report stylesheet).
function objectToThemeVars(obj, prefix) {
  const lines = [];
  for (const [key, value] of Object.entries(obj)) {
    const varName = prefix ? `${prefix}-${key}` : `--${key}`;
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      lines.push(...objectToThemeVars(value, varName));
    } else {
      lines.push(`  ${varName}: ${value};`);
    }
  }
  return lines;
}

export default objectToThemeVars;
