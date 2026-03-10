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

import React from 'react';
import { ConfigProvider as AntdConfigProvider, theme } from 'antd';

const algorithmMap = {
  default: theme.defaultAlgorithm,
  dark: theme.darkAlgorithm,
  compact: theme.compactAlgorithm,
};

function resolveAlgorithm(algorithm) {
  if (!algorithm) return undefined;
  if (Array.isArray(algorithm)) {
    return algorithm.map((a) => algorithmMap[a] ?? a);
  }
  return algorithmMap[algorithm] ?? algorithm;
}

const ConfigProviderBlock = ({ blockId, content, properties }) => {
  const themeConfig = {};
  if (properties.token) {
    themeConfig.token = properties.token;
  }
  if (properties.algorithm) {
    themeConfig.algorithm = resolveAlgorithm(properties.algorithm);
  }
  if (properties.components) {
    themeConfig.components = properties.components;
  }

  return (
    <AntdConfigProvider
      componentDisabled={properties.componentDisabled}
      componentSize={properties.componentSize}
      direction={properties.direction}
      variant={properties.variant}
      theme={Object.keys(themeConfig).length > 0 ? themeConfig : undefined}
    >
      <div id={blockId}>{content.content && content.content()}</div>
    </AntdConfigProvider>
  );
};

ConfigProviderBlock.meta = {
  category: 'container',
  icons: [],
  cssKeys: [],
};

export default ConfigProviderBlock;
