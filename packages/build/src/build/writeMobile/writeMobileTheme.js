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

function cssVariableLines(theme) {
  return Object.entries(theme)
    .filter(([key]) => key !== 'dark' && !key.startsWith('~'))
    .map(([key, value]) => `  ${key}: ${value};`);
}

// antd-mobile theming surface: CSS variables on :root, with the dark set
// scoped to the data-prefers-color-scheme attribute the mobile client stamps
// on <html>. Doubled :root wins over antd-mobile's own variable definitions.
function writeMobileTheme({ components, context }) {
  const theme = components.mobile?.theme ?? {};
  const lines = cssVariableLines(theme);
  const darkLines = cssVariableLines(theme.dark ?? {});
  let css = '';
  if (lines.length > 0) {
    css += `:root:root {\n${lines.join('\n')}\n}\n`;
  }
  if (darkLines.length > 0) {
    css += `html[data-prefers-color-scheme='dark']:root:root {\n${darkLines.join('\n')}\n}\n`;
  }
  return context.writeBuildArtifact('mobile/theme.css', css);
}

export default writeMobileTheme;
