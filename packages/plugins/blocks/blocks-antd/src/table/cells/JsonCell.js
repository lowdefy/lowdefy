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
import { type } from '@lowdefy/helpers';

import EmptyCell from './EmptyCell.js';

const MAX_LENGTH = 200;

// A one-line JSON preview; the whole value is on hover.
function JsonCell({ value }) {
  if (type.isUndefined(value)) return <EmptyCell />;
  const text = JSON.stringify(value);
  const preview = text.length > MAX_LENGTH ? `${text.slice(0, MAX_LENGTH)}…` : text;
  return (
    <code className="lf-table-json" title={text.length > MAX_LENGTH ? text : undefined}>
      {preview}
    </code>
  );
}

export default JsonCell;
