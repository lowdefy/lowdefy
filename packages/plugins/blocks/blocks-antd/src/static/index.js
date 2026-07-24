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

/**
 * Static report renderers for blocks-antd. Each export is keyed by block type
 * and exposes `{ toReport }`, mapping a block's evaluated properties to report
 * IR. This entry must stay free of React and antd so the server can load the
 * registry without a browser runtime; renderers emit plain IR object literals.
 */

export { Title } from './Title.js';
export { Paragraph } from './Paragraph.js';
export { Statistic } from './Statistic.js';
export { Divider } from './Divider.js';
export { Descriptions } from './Descriptions.js';
export { Card } from './Card.js';
export { Content } from './Content.js';
export { Alert } from './Alert.js';
export { Tabs } from './Tabs.js';
export { Collapse } from './Collapse.js';
