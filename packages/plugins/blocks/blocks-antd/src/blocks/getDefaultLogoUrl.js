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

// The logo a page layout shows when the app sets none: a file the app serves
// from its public folder. apiBase is the base the app is reached under: its
// basePath on the web, and its origin and basePath for a page that runs on
// another origin, such as an MCP App view, where a URL from the root would
// name the frame's own origin.
function getDefaultLogoUrl({ apiBase, darkMode, square }) {
  const shape = square === true ? 'logo-square' : 'logo';
  const theme = darkMode === true ? 'dark' : 'light';
  return `${apiBase}/${shape}-${theme}-theme.png`;
}

export default getDefaultLogoUrl;
