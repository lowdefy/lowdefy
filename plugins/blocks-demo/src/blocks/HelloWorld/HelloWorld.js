/*
  Copyright 2020-2024 Lowdefy, Inc

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
import { blockDefaultProps } from '@lowdefy/block-utils';

const HelloWorld = ({ blockId, events, methods, properties }) => {
  if (properties.throwError) {
    throw new Error(`HelloWorld error: ${properties.throwError}`);
  }
  return (
    <div
      id={blockId}
      data-testid={blockId}
      onClick={() => {
        methods.triggerEvent({ name: 'onClick' });
      }}
      className={methods.makeCssClass([
        {
          padding: '24px',
          borderRadius: '8px',
          backgroundColor: '#f0f5ff',
          border: '1px solid #d6e4ff',
          cursor: events.onClick && 'pointer',
        },
        properties.style,
      ])}
    >
      <div
        className={methods.makeCssClass({
          fontSize: '24px',
          fontWeight: 600,
          color: '#1d39c4',
          marginBottom: '8px',
        })}
      >
        {properties.title ?? 'Hello, World!'}
      </div>
      {properties.subtitle && (
        <div
          className={methods.makeCssClass({
            fontSize: '14px',
            color: '#595959',
          })}
        >
          {properties.subtitle}
        </div>
      )}
    </div>
  );
};

HelloWorld.defaultProps = blockDefaultProps;
HelloWorld.meta = {
  category: 'display',
  icons: [],
  styles: [],
};

export default HelloWorld;
