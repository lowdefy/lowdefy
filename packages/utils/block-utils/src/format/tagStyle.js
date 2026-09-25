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

// The tag look shared by grid tag and progress cells and by data-tag in HTML:
// a tinted fill and border in the tag colour.
function tagStyle(color) {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: 'var(--ant-padding-xxs, 4px) var(--ant-padding-xs, 8px)',
    borderRadius: 'var(--ant-border-radius-sm, 4px)',
    fontSize: 'var(--ant-font-size-sm, 12px)',
    fontWeight: 600,
    lineHeight: 1,
    color,
    background: `color-mix(in srgb, ${color} 12%, transparent)`,
    border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
  };
}

export default tagStyle;
