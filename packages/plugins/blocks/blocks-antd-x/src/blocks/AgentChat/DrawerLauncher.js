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
import { FloatButton } from 'antd';
import { MessageOutlined } from '@ant-design/icons';

// Shared by the loading fallback and the drawer, so the button painted before the
// implementation loads is the same one that replaces it.
function DrawerLauncher({ config, onClick }) {
  return (
    <FloatButton icon={<MessageOutlined />} onClick={onClick} tooltip={config?.title ?? 'Chat'} />
  );
}

export default DrawerLauncher;
