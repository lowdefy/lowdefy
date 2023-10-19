/*
  Copyright 2020-2021 Lowdefy, Inc

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

const ProgressBar = ({ blockId, methods, style, properties }) => {
  const {
    progress = 30,
    height = 4,
    transitionTime = 1000,
    // loaderSpeed = 500,
    // waitingTime = 1000,
    shadow = true,
  } = properties;

  return (
    <div
      id={blockId}
      className={methods.makeCssClass(style)}
      style={{
        '--height': `${height}px`,
        '--progress': `${progress}%`,
        '--transition': `all ${transitionTime}ms ease`,
        '--opacity': progress < 100 ? 1 : 0,
      }}
    >
      <div className="progress-bar-container">
        <div className="progress-bar-loader">
          {shadow ? <div className="progress-bar-shadow" /> : null}
        </div>
      </div>
    </div>
  );
};

ProgressBar.defaultProps = blockDefaultProps;
ProgressBar.meta = {
  category: 'display',
  icons: [],
  styles: ['blocks/ProgressBar/style.less'],
};

export default ProgressBar;
