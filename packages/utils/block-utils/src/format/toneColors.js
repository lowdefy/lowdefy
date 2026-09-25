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

import TAG_COLORS from './tagColors.js';

// The tones HTML understands: the preset tag colours plus antd's status names.
const TONE_COLORS = {
  ...TAG_COLORS,
  success: 'var(--ant-color-success)',
  processing: 'var(--ant-color-info)',
  info: 'var(--ant-color-info)',
  warning: 'var(--ant-color-warning)',
  error: 'var(--ant-color-error)',
};

export default TONE_COLORS;
