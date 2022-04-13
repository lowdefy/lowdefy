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

import React, { useReducer } from 'react';
import { makeCssClass } from '@lowdefy/block-utils';

const initialState = {
  progress: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return { progress: state.progress + (state.progress - 100) / 3 };
    case 'done':
      return { progress: 100 };
    default:
      throw new Error('Invalid action type for ProgressBarController reducer.');
  }
}

// TODO: inc every second
const ProgressBarController = ({ id, ProgressBar, content, lowdefy }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <ProgressBar
      basePath={lowdefy.basePath}
      blockId={id}
      components={lowdefy._internal.components}
      menus={lowdefy.menus}
      methods={{ makeCssClass }}
      pageId={lowdefy.pageId}
      properties={{ ...state }}
      user={lowdefy.user}
      content={{
        content: () => content.content({ state, dispatch }),
      }}
    />
  );
};

export default ProgressBarController;
