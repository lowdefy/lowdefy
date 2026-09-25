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
import { withBlockDefaults } from '@lowdefy/block-utils';

// An Icon block with an onClick event is a control, so it takes keyboard focus
// and Enter/Space fire the event like a click. The icon component other blocks
// render (inside a Button, an Alert) stays untouched: their block is the control.
const IconBlock = ({ components: { Icon }, events, methods, ...props }) => {
  const keyboardProps = events.onClick
    ? {
        tabIndex: 0,
        onKeyDown: (event) => {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          methods.triggerEvent({ name: 'onClick' });
        },
      }
    : {};
  return <Icon events={events} methods={methods} {...keyboardProps} {...props} />;
};

export default withBlockDefaults(IconBlock);
