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

// antd's preset tag colours, as theme tokens so tags follow the theme and dark
// mode. Status names use the semantic tokens; the other presets use antd's
// palette variables (`--ant-<name>-6`, which the dark algorithm also sets), with
// antd's default as the fallback. The grid's tag cells resolve with this table.
const TAG_COLORS = {
  red: 'var(--ant-color-error)',
  volcano: 'var(--ant-volcano-6, #fa541c)',
  orange: 'var(--ant-color-warning)',
  gold: 'var(--ant-gold-6, #faad14)',
  yellow: 'var(--ant-color-warning)',
  lime: 'var(--ant-lime-6, #a0d911)',
  green: 'var(--ant-color-success)',
  cyan: 'var(--ant-cyan-6, #13c2c2)',
  blue: 'var(--ant-color-info)',
  geekblue: 'var(--ant-geekblue-6, #2f54eb)',
  purple: 'var(--ant-purple-6, #722ed1)',
  magenta: 'var(--ant-magenta-6, #eb2f96)',
  pink: 'var(--ant-pink-6, #eb2f96)',
  default: 'var(--ant-color-text-secondary)',
};

export default TAG_COLORS;
