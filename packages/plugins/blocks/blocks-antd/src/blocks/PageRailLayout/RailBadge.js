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

import React from 'react';

function RailBadge({
  count,
  dot = false,
  showZero = false,
  overflowCount = 99,
  tone = 'default',
  color,
}) {
  if (!dot && !count && !showZero) return null;
  const text = count > overflowCount ? `${overflowCount}+` : String(count);
  return (
    <span
      className={`lf-rail-badge${dot ? ' lf-rail-badge-dot' : ''}`}
      data-tone={tone}
      style={color ? { '--lf-rail-badge-bg': color } : undefined}
    >
      {dot ? null : text}
    </span>
  );
}

export default RailBadge;
