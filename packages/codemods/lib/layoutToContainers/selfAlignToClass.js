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

// The legacy top/middle/bottom spelling is BlockLayout's ALIGN_SELF_MAP; the
// CSS spellings pass straight through to the matching Tailwind self-* class.
const SELF_ALIGN = {
  top: 'self-start',
  middle: 'self-center',
  bottom: 'self-end',
  'flex-start': 'self-start',
  'flex-end': 'self-end',
  start: 'self-start',
  center: 'self-center',
  end: 'self-end',
  stretch: 'self-stretch',
  baseline: 'self-baseline',
  auto: 'self-auto',
};

function selfAlignToClass(selfAlign) {
  return SELF_ALIGN[selfAlign] ?? null;
}

export default selfAlignToClass;
