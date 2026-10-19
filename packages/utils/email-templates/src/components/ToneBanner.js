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

import defaultTheme from '../defaultTheme.js';

const toneColors = {
  success: '#52c41a',
  warning: '#faad14',
  error: '#f5222d',
};

function ToneBanner({ tone, theme }) {
  const color = toneColors[tone] ?? theme?.primaryColor ?? defaultTheme.primaryColor;
  return (
    <div
      style={{
        backgroundColor: color,
        borderRadius: '2px',
        fontSize: '1px',
        height: '6px',
        lineHeight: '6px',
        margin: '0 0 24px 0',
      }}
    />
  );
}

export default ToneBanner;
