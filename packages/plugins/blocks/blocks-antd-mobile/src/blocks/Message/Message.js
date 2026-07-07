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

import React, { useEffect } from 'react';
import { Toast } from 'antd-mobile';
import { type } from '@lowdefy/helpers';
import { renderHtml, withBlockDefaults } from '@lowdefy/block-utils';

// antd's message statuses map onto Toast icons: success → success,
// error → fail, loading → loading; info/warning show plain content.
const toastIcons = {
  success: 'success',
  error: 'fail',
  loading: 'loading',
};

function MessageBlock({ blockId, methods, properties }) {
  useEffect(() => {
    methods.registerMethod('open', (args = {}) => {
      const status = args.status ?? properties.status ?? 'success';
      const duration = type.isNone(args.duration) ? properties.duration : args.duration;
      Toast.show({
        content: renderHtml({ html: args.content ?? properties.content ?? blockId, methods }),
        icon: toastIcons[status],
        // DisplayMessage durations are in seconds (antd message convention).
        duration: type.isNone(duration) ? 2000 : duration * 1000,
        afterClose: () => methods.triggerEvent({ name: 'onClose' }),
      });
    });
  });
  return <div id={blockId} />;
}

export default withBlockDefaults(MessageBlock);
