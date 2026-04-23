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
import { diffLines } from 'diff';

import serializeYaml from '../serializeYaml.js';

const ADDED_STYLE = {
  background: 'var(--ant-color-success-bg, rgba(82,196,26,0.1))',
  color: 'var(--ant-color-success-text, var(--ant-color-text))',
  display: 'block',
};

const REMOVED_STYLE = {
  background: 'var(--ant-color-error-bg, rgba(255,77,79,0.1))',
  color: 'var(--ant-color-error-text, var(--ant-color-text))',
  display: 'block',
};

const CONTEXT_STYLE = {
  color: 'var(--ant-color-text-secondary, rgba(0,0,0,0.65))',
  display: 'block',
};

const PRE_STYLE = {
  fontFamily: 'var(--ant-font-family-code, monospace)',
  fontSize: 'var(--ant-font-size-sm, 12px)',
  padding: '12px',
  background: 'var(--ant-color-fill-tertiary, rgba(0,0,0,0.04))',
  borderRadius: 'var(--ant-border-radius-sm, 4px)',
  whiteSpace: 'pre',
  overflowX: 'auto',
  margin: 0,
};

function splitHunkLines(value) {
  const lines = value.split('\n');
  if (lines.length > 0 && lines[lines.length - 1] === '') lines.pop();
  return lines;
}

function GitDiffRenderer({ before, after, hide, show, classNames = {}, styles = {} }) {
  const beforeYaml = serializeYaml(before, { hide, show });
  const afterYaml = serializeYaml(after, { hide, show });
  const hunks = diffLines(beforeYaml, afterYaml);

  const nodes = [];
  hunks.forEach((hunk, hunkIndex) => {
    const lines = splitHunkLines(hunk.value);
    let prefix;
    let style;
    if (hunk.added) {
      prefix = '+ ';
      style = ADDED_STYLE;
    } else if (hunk.removed) {
      prefix = '- ';
      style = REMOVED_STYLE;
    } else {
      prefix = '  ';
      style = CONTEXT_STYLE;
    }
    lines.forEach((line, lineIndex) => {
      nodes.push(
        <span key={`${hunkIndex}-${lineIndex}`} style={style}>
          {`${prefix}${line}`}
        </span>
      );
    });
  });

  return (
    <pre className={classNames.group} style={{ ...PRE_STYLE, ...styles.group }}>
      {nodes}
    </pre>
  );
}

export default GitDiffRenderer;
