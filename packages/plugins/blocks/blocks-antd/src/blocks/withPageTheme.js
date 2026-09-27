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

// Page layout blocks render many antd components, so their `theme` holds global
// design tokens scoped to the page instead of one component's tokens (withTheme).
function withPageTheme(PageBlock) {
  const Wrapped = (props) => {
    const { theme, ...restProperties } = props.properties;
    if (!type.isObject(theme)) {
      return <PageBlock {...props} />;
    }
    return (
      <ConfigProvider theme={{ token: theme }}>
        <PageBlock {...props} properties={restProperties} />
      </ConfigProvider>
    );
  };
  Wrapped.displayName = PageBlock.displayName || PageBlock.name;
  return Wrapped;
}

export default withPageTheme;
