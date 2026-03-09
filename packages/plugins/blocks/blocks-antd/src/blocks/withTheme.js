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
import { ConfigProvider } from 'antd';
import { type } from '@lowdefy/helpers';

function withTheme(antdComponentName, BlockComponent) {
  const Wrapped = (props) => {
    const { theme, ...restProperties } = props.properties;
    // Only intercept object themes (design tokens for ConfigProvider).
    // String themes (e.g. Menu's 'dark'/'light') pass through to the component.
    if (!type.isObject(theme)) {
      return <BlockComponent {...props} />;
    }
    return (
      <ConfigProvider theme={{ components: { [antdComponentName]: theme } }}>
        <BlockComponent {...props} properties={restProperties} />
      </ConfigProvider>
    );
  };
  Wrapped.meta = BlockComponent.meta;
  Wrapped.defaultProps = BlockComponent.defaultProps;
  Wrapped.displayName = BlockComponent.displayName || BlockComponent.name;
  return Wrapped;
}

export default withTheme;
