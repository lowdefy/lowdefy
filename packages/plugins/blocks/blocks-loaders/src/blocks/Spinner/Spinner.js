/*
  Copyright 2020-2023 Lowdefy, Inc

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

const Spinner = ({ properties, methods }) => {
  return (
    <div
      className={methods.makeCssClass({
        height: properties.height || '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: properties.shaded === true && '#f1f1f1',
      })}
    >
      <div style={{ width: properties.size || 50, margin: 'auto', height: properties.size || 50 }}>
        <div
          className={methods.makeCssClass({
            textAlign: 'center',
            color: '#bfbfbf',
            fontSize: 12,
            paddingTop: 2,
            fontFamily:
              '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,"Noto Sans",sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol","Noto Color Emoji"',
          })}
        >
          Lowdefy
        </div>
      </div>
    </div>
  );
};

Spinner.defaultProps = blockDefaultProps;
Spinner.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/Spinner/style.less'],
};

export default Spinner;
