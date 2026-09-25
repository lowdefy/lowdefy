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
// mode. The grid's tag cells resolve with this table.
const TAG_COLORS = {
  red: 'var(--ant-color-error)',
  volcano: 'var(--ant-color-volcano, var(--ant-color-error))',
  orange: 'var(--ant-color-warning)',
  gold: 'var(--ant-color-gold, var(--ant-color-warning))',
  yellow: 'var(--ant-color-warning)',
  lime: 'var(--ant-color-lime, var(--ant-color-success))',
  green: 'var(--ant-color-success)',
  cyan: 'var(--ant-color-cyan, var(--ant-color-info))',
  blue: 'var(--ant-color-info)',
  geekblue: 'var(--ant-color-geekblue, var(--ant-color-info))',
  purple: 'var(--ant-color-purple, var(--ant-color-info))',
  magenta: 'var(--ant-color-magenta, var(--ant-color-error))',
  default: 'var(--ant-color-text-secondary)',
};

export default TAG_COLORS;
