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

import React, { useState } from 'react';
import { Drawer } from 'antd';

import DrawerLauncher from './DrawerLauncher.js';

function DrawerWrapper({ blockId, config, defaultOpen, children, Icon }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <>
      <DrawerLauncher blockId={blockId} config={config} Icon={Icon} onClick={() => setOpen(true)} />
      <Drawer
        title={config?.title ?? 'Chat'}
        placement={config?.placement ?? 'right'}
        width={config?.width ?? 400}
        onClose={() => setOpen(false)}
        open={open}
        styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
      >
        {children}
      </Drawer>
    </>
  );
}

export default DrawerWrapper;
