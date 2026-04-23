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

const wrapperStyle = {
  position: 'absolute',
  inset: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'color-mix(in srgb, var(--ant-color-bg-container) 70%, transparent)',
  zIndex: 2,
  pointerEvents: 'all',
};

const boxStyle = {
  padding: '8px 16px',
  borderRadius: 'var(--ant-border-radius)',
  boxShadow: 'var(--ant-box-shadow-secondary)',
  backgroundColor: 'var(--ant-color-bg-container)',
  color: 'var(--ant-color-text)',
  border: '1px solid var(--ant-color-border)',
  fontSize: 'var(--ant-font-size)',
};

function LoadingOverlay() {
  return (
    <div style={wrapperStyle}>
      <div style={boxStyle}>Loading...</div>
    </div>
  );
}

export default LoadingOverlay;
