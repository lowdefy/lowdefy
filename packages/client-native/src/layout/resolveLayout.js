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

import { type } from '@lowdefy/helpers';

import breakpoints from './breakpoints.js';

// A block's layout may carry an object per breakpoint ({ span: 24, md: { span: 12 } }). Each
// breakpoint's object at or below the current one is laid over the base layout, smallest first.
function resolveLayout({ breakpoint, layout }) {
  const current = breakpoints.indexOf(breakpoint);
  const resolved = { ...layout };
  breakpoints.forEach((name) => {
    delete resolved[name];
  });
  breakpoints.forEach((name, index) => {
    if (index <= current && type.isObject(layout[name])) {
      Object.assign(resolved, layout[name]);
    }
  });
  return resolved;
}

export default resolveLayout;
