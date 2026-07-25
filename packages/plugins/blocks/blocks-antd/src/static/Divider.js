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

/** Divider → `divider`, a horizontal rule; a title becomes a small heading
 * below the rule, labelling the section that follows (antd renders the title
 * on the line itself — the closest document equivalent). */
export const Divider = {
  toReport: ({ block }) => {
    const title = block.properties?.title;
    if (title == null || title === '') return { kind: 'divider' };
    return [{ kind: 'divider' }, { kind: 'heading', text: String(title), level: 4 }];
  },
};
