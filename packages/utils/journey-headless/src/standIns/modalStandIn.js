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

import { type } from '@lowdefy/helpers';

import HeadlessStepError from '../HeadlessStepError.js';
import describeBlock from './describeBlock.js';
import destroysContentOnHidden from './destroysContentOnHidden.js';
import fireEvent, { afterEvent } from './fireEvent.js';
import findOneControl from './findOneControl.js';
import readControlKey from './readControlKey.js';
import unmountContent from './unmountContent.js';

// What blocks-antd's Modal does (Modal.js, triggerSetOpen): setOpen and toggleOpen fire onOpen or
// onClose on every call, then set the open state; once antd sees it change it fires, after its
// animation, afterOpenChange { open: true } on an open, and afterClose then
// afterOpenChange { open: false } on a close (rc-dialog's onDialogVisibleChanged). A close with
// destroyOnHidden unmounts the content, so the next open mounts it again.
function setModalOpen({ actor, block, open }) {
  const fired = fireEvent({ actor, block, name: open ? 'onOpen' : 'onClose' });
  if (!actor.setOpen({ block, open })) {
    return;
  }
  if (!open && destroysContentOnHidden({ block })) {
    unmountContent({ actor, block });
  }
  actor.track(
    afterEvent(fired).then(() => {
      if (!open) {
        fireEvent({ actor, block, name: 'afterClose' });
      }
      fireEvent({ actor, block, name: 'afterOpenChange', event: { open } });
    })
  );
}

const BUTTONS = [
  { key: 'ok', event: 'onOk', props: 'okButtonProps' },
  { key: 'cancel', event: 'onCancel', props: 'cancelButtonProps' },
];

// antd draws no OK or Cancel button when the footer is turned off, the block fills its footer
// area, which replaces the default footer, or the modal is loading, which draws no footer.
function readFooter(block) {
  if (block.eval.properties?.footer === false) {
    return 'its footer is off (footer: false)';
  }
  if (block.eval.properties?.loading) {
    return 'it is loading (loading: true)';
  }
  if ((block.slots?.footer?.blocks ?? []).length > 0) {
    return 'the blocks in its footer area replace the default footer';
  }
  return null;
}

// A { blockId, control: ok | cancel } click on an open Modal: the button's event, then the close
// the component makes unless the event failed or bounced. The step runner waits for the Modal to
// show (be open) before this runs.
async function click({ actor, block, target }) {
  const control = readControlKey({ block, target });
  const footer = readFooter(block);
  const button = findOneControl({
    block,
    control,
    controls: footer === null ? BUTTONS : [],
    noun: 'footer button',
  });
  const description = describeBlock(block);
  if (block.eval.properties?.[button.props]?.disabled === true) {
    throw new HeadlessStepError(`The ${control} button of ${description} is disabled.`, {
      actual: 'disabled',
      expected: `an enabled ${control} button in ${description}`,
    });
  }
  const response = await fireEvent({ actor, block, name: button.event });
  if (response.success === false || response.bounced === true) {
    return;
  }
  setModalOpen({ actor, block, open: false });
}

// Escape on the open Modal, when it is the overlay that opened last: rc-dialog calls antd's
// handleCancel unless keyboard is set falsy (it defaults to true only when undefined), which fires
// onCancel; the block then closes, as its Cancel button does, unless onCancel failed or bounced. antd's closable and maskClosable leave
// Escape alone. handleCancel does nothing while onOk runs (confirmLoading), which a headless step
// never meets: the step that clicked OK settles once onOk has finished.
async function escape({ actor, block }) {
  const keyboard = block.eval.properties?.keyboard;
  if (!type.isUndefined(keyboard) && !keyboard) {
    return;
  }
  const response = await fireEvent({ actor, block, name: 'onCancel' });
  if (response.success === false || response.bounced === true) {
    return;
  }
  setModalOpen({ actor, block, open: false });
}

function registerMethods({ actor, block }) {
  block.registerMethod('setOpen', ({ open } = {}) =>
    setModalOpen({ actor, block, open: Boolean(open) })
  );
  block.registerMethod('toggleOpen', () =>
    setModalOpen({ actor, block, open: !actor.page.openBlocks.has(block.id) })
  );
}

export default { click, escape, registerMethods };
