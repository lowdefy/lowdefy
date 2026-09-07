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

// Add a decoration to a style, keeping any decoration already there.
function withDecoration(style, decoration) {
  const current = style.decoration;
  if (current === undefined) return { ...style, decoration };
  const list = type.isArray(current) ? current : [current];
  return { ...style, decoration: [...list, decoration] };
}

export default withDecoration;
