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

import defaultPackages from './defaultPackages.js';

// Web-only block packages are excluded from the mobile types map so that using
// them in a mobile page is a "type not defined" build error (per-target
// resolution). All non-block packages are target-neutral and shared — but only
// blocks from mobileBlockPackages register block types into the mobile map
// (some target-neutral packages like plugin-aws also ship antd-based blocks).
const webOnlyBlockPackages = [
  '@lowdefy/blocks-aggrid',
  '@lowdefy/blocks-antd',
  '@lowdefy/blocks-antd-x',
  '@lowdefy/blocks-diff',
  '@lowdefy/blocks-echarts',
  '@lowdefy/blocks-files',
  '@lowdefy/blocks-google-maps',
  '@lowdefy/blocks-markdown',
  '@lowdefy/blocks-qr',
  '@lowdefy/blocks-tiptap',
];

const mobileBlockPackages = [
  '@lowdefy/blocks-antd-mobile',
  '@lowdefy/blocks-basic',
  '@lowdefy/blocks-loaders',
];

// blocks-antd-mobile registers last so its types win colliding names
// (e.g. List is blocks-basic's on web but antd-mobile's on mobile).
const defaultPackagesMobile = [
  ...defaultPackages.filter((packageName) => !webOnlyBlockPackages.includes(packageName)),
  '@lowdefy/blocks-antd-mobile',
];

export { mobileBlockPackages };

export default defaultPackagesMobile;
