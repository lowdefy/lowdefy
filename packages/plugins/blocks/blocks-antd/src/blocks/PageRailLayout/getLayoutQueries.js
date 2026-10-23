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

// The breakpoints are properties, so CSS media queries cannot hold them: the block reads the
// mode here and the stylesheet keys off data-mode.
function getLayoutQueries({ drawerBreakpoint, mobileBreakpoint }) {
  return {
    phone: `(max-width: ${mobileBreakpoint - 0.02}px)`,
    tablet: `(max-width: ${drawerBreakpoint - 0.02}px)`,
  };
}

export default getLayoutQueries;
