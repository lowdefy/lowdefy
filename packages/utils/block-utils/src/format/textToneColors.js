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

// The tones data-tone gives text: antd's secondary text colours and its status
// text colours (the tokens Typography uses, which a theme can tune for contrast).
const TEXT_TONE_COLORS = {
  secondary: 'var(--ant-color-text-secondary)',
  tertiary: 'var(--ant-color-text-tertiary)',
  quaternary: 'var(--ant-color-text-quaternary)',
  success: 'var(--ant-color-success-text, var(--ant-color-success))',
  warning: 'var(--ant-color-warning-text, var(--ant-color-warning))',
  error: 'var(--ant-color-error-text, var(--ant-color-error))',
  info: 'var(--ant-color-info-text, var(--ant-color-info))',
};

export default TEXT_TONE_COLORS;
