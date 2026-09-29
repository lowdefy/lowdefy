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

import readableToneText from './readableToneText.js';

// antd's preset palettes, steps 1, 3, 6 and 7 of the default light palette: the fallbacks when a
// palette variable is missing.
const PRESET_PALETTES = {
  red: ['#fff1f0', '#ffa39e', '#f5222d', '#cf1322'],
  volcano: ['#fff2e8', '#ffbb96', '#fa541c', '#d4380d'],
  orange: ['#fff7e6', '#ffd591', '#fa8c16', '#d46b08'],
  gold: ['#fffbe6', '#ffe58f', '#faad14', '#d48806'],
  yellow: ['#feffe6', '#fffb8f', '#fadb14', '#d4b106'],
  lime: ['#fcffe6', '#eaff8f', '#a0d911', '#7cb305'],
  green: ['#f6ffed', '#b7eb8f', '#52c41a', '#389e0d'],
  cyan: ['#e6fffb', '#87e8de', '#13c2c2', '#08979c'],
  blue: ['#e6f4ff', '#91caff', '#1677ff', '#0958d9'],
  geekblue: ['#f0f5ff', '#adc6ff', '#2f54eb', '#1d39c4'],
  purple: ['#f9f0ff', '#d3adf7', '#722ed1', '#531dab'],
  magenta: ['#fff0f6', '#ffadd2', '#eb2f96', '#c41d7f'],
  pink: ['#fff0f6', '#ffadd2', '#eb2f96', '#c41d7f'],
};

// antd's status names and the colour token each uses (processing is antd's info colour).
const STATUS_TOKENS = {
  success: 'success',
  processing: 'info',
  info: 'info',
  warning: 'warning',
  error: 'error',
};

// A preset tag the way antd's Tag draws it (`<name>-1` fill, `<name>-3` border, `<name>-7` text),
// with the text taken 30% further toward the text colour: antd's own `-7` reads at under 3:1 on
// gold, yellow, lime, orange, green and cyan in light themes, and on purple and geekblue in dark
// ones. The palette variables come from the theme's algorithm, so a dark theme gets dark fills and
// light text.
function presetTone(name) {
  const [fill, border, base, text] = PRESET_PALETTES[name];
  return {
    color: `var(--ant-${name}-6, ${base})`,
    text: readableToneText({ color: `var(--ant-${name}-7, ${text})`, share: 70 }),
    bg: `var(--ant-${name}-1, ${fill})`,
    border: `var(--ant-${name}-3, ${border})`,
  };
}

// A status tag with antd's status tokens (`color<Status>Bg`, `color<Status>Border`, and
// `color<Status>Text` taken 40% toward the text colour: antd's status text is its `-6`, about 2:1
// on its fill).
function statusTone(token) {
  return {
    color: `var(--ant-color-${token})`,
    text: readableToneText({ color: `var(--ant-color-${token}-text)`, share: 60 }),
    bg: `var(--ant-color-${token}-bg)`,
    border: `var(--ant-color-${token}-border)`,
  };
}

// Every tone name: its colour (`color`, for status dots and progress bars) and its tag look
// (`text`, `bg`, `border`), as theme tokens so tags follow the theme and dark mode. `default` is
// antd's default tag: the text colour on the quaternary fill.
const TAG_TONES = {
  ...Object.fromEntries(Object.keys(PRESET_PALETTES).map((name) => [name, presetTone(name)])),
  ...Object.fromEntries(
    Object.entries(STATUS_TOKENS).map(([name, token]) => [name, statusTone(token)])
  ),
  default: {
    color: 'var(--ant-color-text-secondary)',
    text: 'var(--ant-color-text)',
    bg: 'var(--ant-color-fill-quaternary)',
    border: 'var(--ant-color-border)',
  },
};

export default TAG_TONES;
