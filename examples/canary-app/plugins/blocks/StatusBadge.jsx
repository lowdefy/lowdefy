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

// A file plugin: one .jsx file under plugins/blocks, with its meta and schema in
// the sibling StatusBadge.json. No package, no types barrel, no plugins: entry.
const toneColors = {
  positive: 'var(--ant-color-success)',
  negative: 'var(--ant-color-error)',
  neutral: 'var(--ant-color-text-secondary)',
};

function StatusBadge({ blockId, properties }) {
  return (
    <span
      id={blockId}
      style={{
        border: `1px solid ${toneColors[properties.tone] ?? toneColors.neutral}`,
        borderRadius: 12,
        color: toneColors[properties.tone] ?? toneColors.neutral,
        display: 'inline-block',
        padding: '2px 8px',
      }}
    >
      {properties.label}
    </span>
  );
}

export default StatusBadge;
