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

import fireEvent, { afterEvent } from './fireEvent.js';

// What blocks-antd's Drawer does (Drawer.js): an open fires onOpen and sets the open state; a
// close waits on onClose and closes only when it neither failed nor bounced; once antd sees the
// state change it fires, after its animation, afterOpenChange { drawerOpen, open }, and
// afterClose after it on a close. toggleOpen fires onToggle first.
function openDrawer({ actor, block }) {
  const fired = fireEvent({ actor, block, name: 'onOpen' });
  if (!actor.setOpen({ block, open: true })) {
    return;
  }
  actor.track(
    afterEvent(fired).then(() => {
      fireEvent({
        actor,
        block,
        name: 'afterOpenChange',
        event: { drawerOpen: true, open: true },
      });
    })
  );
}

async function closeDrawer({ actor, block }) {
  const response = await fireEvent({ actor, block, name: 'onClose' });
  if (response.success === false || response.bounced === true) {
    return;
  }
  if (!actor.setOpen({ block, open: false })) {
    return;
  }
  fireEvent({ actor, block, name: 'afterOpenChange', event: { drawerOpen: false, open: false } });
  fireEvent({ actor, block, name: 'afterClose' });
}

function setDrawerOpen({ actor, block, open }) {
  if (open) {
    openDrawer({ actor, block });
    return;
  }
  actor.track(closeDrawer({ actor, block }));
}

function registerMethods({ actor, block }) {
  block.registerMethod('setOpen', ({ open } = {}) =>
    setDrawerOpen({ actor, block, open: Boolean(open) })
  );
  block.registerMethod('toggleOpen', () => {
    const open = actor.page.openBlocks.has(block.id);
    fireEvent({ actor, block, name: 'onToggle' });
    setDrawerOpen({ actor, block, open: !open });
  });
}

export default { registerMethods };
