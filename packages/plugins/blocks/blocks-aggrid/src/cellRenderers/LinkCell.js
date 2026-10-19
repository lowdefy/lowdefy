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
import { type } from '@lowdefy/helpers';
import GridLink from './GridLink.js';
import NullCell from './NullCell.js';
import { resolveLink } from './resolveFieldRefs.js';

const linkStyle = {
  color: 'var(--ant-color-link)',
  cursor: 'pointer',
  textDecoration: 'none',
};

function LinkCell(params) {
  const { value, data, cellConfig, methods, components } = params;
  if (type.isNone(value) || value === '') {
    return <NullCell />;
  }

  const label = type.isString(cellConfig?.labelField)
    ? String(data?.[cellConfig.labelField] ?? value)
    : String(value);

  const link = resolveLink(
    {
      pageId: cellConfig?.pageId,
      href: cellConfig?.href,
      back: cellConfig?.back,
      home: cellConfig?.home,
      newTab: cellConfig?.newTab,
      pathParams: cellConfig?.pathParams,
      urlQuery: cellConfig?.urlQuery,
    },
    data
  );

  return (
    <GridLink
      link={link}
      components={components}
      methods={methods}
      row={data}
      value={value}
      style={linkStyle}
    >
      {label}
    </GridLink>
  );
}

export default LinkCell;
