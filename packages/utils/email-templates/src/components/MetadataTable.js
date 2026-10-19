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

const labelStyle = {
  color: '#8c8c8c',
  fontSize: '13px',
  lineHeight: '20px',
  padding: '4px 16px 4px 0',
  verticalAlign: 'top',
  whiteSpace: 'nowrap',
};

const valueStyle = {
  color: '#333333',
  fontSize: '13px',
  lineHeight: '20px',
  padding: '4px 0',
  verticalAlign: 'top',
};

function MetadataTable({ metadata }) {
  if (!type.isArray(metadata) || metadata.length === 0) {
    return null;
  }
  return (
    <table style={{ borderCollapse: 'collapse', margin: '0 0 16px 0' }}>
      <tbody>
        {metadata.map((item, index) => (
          <tr key={index}>
            <td style={labelStyle}>{item.label}</td>
            <td style={valueStyle}>{item.value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default MetadataTable;
