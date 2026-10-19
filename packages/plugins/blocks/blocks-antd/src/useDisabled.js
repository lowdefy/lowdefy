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

import { ConfigProvider } from 'antd';

import getDisabled from './getDisabled.js';

// For block markup antd doesn't render (custom pills, icons, rc components that don't read
// antd's disabled context): resolves the block's disabled state the way antd components do,
// falling back to ConfigProvider `componentDisabled` when `properties.disabled` is unset.
function useDisabled({ loading, properties }) {
  const { componentDisabled } = ConfigProvider.useConfig();
  return getDisabled({ loading, properties }) ?? componentDisabled;
}

export default useDisabled;
