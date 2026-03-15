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

function SearchHighlight({ text, terms, className, style }) {
  if (!text || !terms || terms.length === 0) {
    return (
      <span className={className} style={style}>
        {text}
      </span>
    );
  }

  const escaped = terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  const pattern = new RegExp(`(${escaped.join('|')})`, 'gi');
  const parts = text.split(pattern);

  return (
    <span className={className} style={style}>
      {parts.map((part, i) => (pattern.test(part) ? <mark key={i}>{part}</mark> : part))}
    </span>
  );
}

export default SearchHighlight;
