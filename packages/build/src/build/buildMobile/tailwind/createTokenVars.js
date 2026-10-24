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

// antd's CSS variable name for a token, as @ant-design/cssinjs writes it
// (colorPrimary is --ant-color-primary, borderRadiusSM is --ant-border-radius-sm).
function tokenCssVarName(token) {
  return `--ant-${token}`
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z]+)([A-Z][a-z0-9]+)/g, '$1-$2')
    .replace(/([a-z])([A-Z0-9])/g, '$1-$2')
    .toLowerCase();
}

// Maps each computed antd token of one mode to its CSS variable name, the
// names the Tailwind bridge points at.
function createTokenVars(token) {
  return Object.fromEntries(
    Object.entries(token).map(([name, value]) => [tokenCssVarName(name), value])
  );
}

export default createTokenVars;
