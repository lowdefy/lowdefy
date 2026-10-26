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

// The antd-to-Tailwind theme bridge: Tailwind theme variables that point at
// antd's CSS variables, so classes like bg-primary follow the antd theme. The
// web writes these into globals.css; the mobile build resolves them against
// the computed antd tokens.
const tailwindBridgeDefaults = {
  color: {
    primary: 'var(--ant-color-primary)',
    'primary-hover': 'var(--ant-color-primary-hover)',
    'primary-active': 'var(--ant-color-primary-active)',
    'primary-bg': 'var(--ant-color-primary-bg)',
    success: 'var(--ant-color-success)',
    warning: 'var(--ant-color-warning)',
    error: 'var(--ant-color-error)',
    info: 'var(--ant-color-info)',
    'text-primary': 'var(--ant-color-text)',
    'text-secondary': 'var(--ant-color-text-secondary)',
    'bg-container': 'var(--ant-color-bg-container)',
    'bg-layout': 'var(--ant-color-bg-layout)',
    border: 'var(--ant-color-border)',
  },
  radius: {
    DEFAULT: 'var(--ant-border-radius)',
    sm: 'var(--ant-border-radius-sm)',
    lg: 'var(--ant-border-radius-lg)',
  },
  'font-size': {
    DEFAULT: 'var(--ant-font-size)',
    sm: 'var(--ant-font-size-sm)',
    lg: 'var(--ant-font-size-lg)',
  },
  'font-family': {
    sans: 'var(--ant-font-family)',
  },
};

export default tailwindBridgeDefaults;
