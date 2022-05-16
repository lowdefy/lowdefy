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

import React, { useReducer, useEffect } from 'react';
import { makeCssClass } from '@lowdefy/block-utils';

const initialState = {
  progress: 0,
  onMounts: 0,
};

function reducer(state, action) {
  switch (action.type) {
    case 'increment':
      return {
        ...state,
        progress: state.progress + (100 - state.progress) / 3,
      };
    case 'increment-on-mount':
      return {
        ...state,
        onMounts: state.onMounts + 1,
      };
    case 'auto-increment':
      return {
        ...state,
        progress: state.progress + (100 - state.progress) / 200,
      };
    case 'done':
      return {
        progress: state.onMounts - 1 === 0 ? 100 : state.progress,
        onMounts: state.onMounts - 1,
      };
    case 'reset':
      return {
        progress: 0,
        onMounts: 0,
      };
    default:
      throw new Error('Invalid action type for ProgressBarController reducer.');
  }
}

const ProgressBarController = ({ id, lowdefy, resetContext }) => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const ProgressBar = lowdefy._internal.blockComponents.ProgressBar;
  lowdefy._internal.progress.state = state;
  lowdefy._internal.progress.dispatch = dispatch;
  useEffect(() => {
    const timer =
      state.progress < 95 && setInterval(() => dispatch({ type: 'auto-increment' }), 500);
    return () => clearInterval(timer);
  }, [state]);
  if (resetContext.reset && state.progress === 100) {
    dispatch({ type: 'reset' });
  }
  return (
    <ProgressBar
      basePath={lowdefy.basePath}
      blockId={id}
      components={lowdefy._internal.components}
      menus={lowdefy.menus}
      methods={{ makeCssClass }}
      pageId={lowdefy.pageId}
      properties={state}
    />
  );
};

export default ProgressBarController;
