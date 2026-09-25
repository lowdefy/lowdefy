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

import basicTypes from '@lowdefy/blocks-basic/types';
import loaderTypes from '@lowdefy/blocks-loaders/types';

// Client types the shell and engine look up by name, whatever a page uses:
// blocks-basic and blocks-loaders (Box, skeletons, ProgressBar), Message
// (DisplayMessage in @lowdefy/client), SetDarkMode (blocks-antd
// Header/PageHeaderMenu/PageSiderMenu darkModeToggle) and _not/_type (form
// validation). Every app bundles them, and every page's types include them.
const mandatoryClientTypes = {
  actions: ['SetDarkMode'],
  blocks: [...basicTypes.blocks, ...loaderTypes.blocks, 'Message'],
  operators: ['_not', '_type'],
};

export default mandatoryClientTypes;
