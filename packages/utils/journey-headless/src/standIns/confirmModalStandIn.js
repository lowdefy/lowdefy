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

import HeadlessStepError from '../HeadlessStepError.js';
import describeBlock from './describeBlock.js';
import fireEvent from './fireEvent.js';
import findOneControl from './findOneControl.js';
import readControlKey from './readControlKey.js';
import unmountContent from './unmountContent.js';

// What blocks-antd's ConfirmModal does (ConfirmModal.js): its open({ status }) method fires onOpen
// and opens an antd modal.confirm dialog of that status (from args, else properties.status, else
// confirm), drawing the block's content area in it. Each call opens another dialog; state.dialogs
// holds their statuses, oldest first. OK fires onOk and Cancel onCancel; the dialog stays open only
// when the event failed and did not bounce (the component throws then, which keeps antd's dialog
// open), else it closes and antd's afterClose fires onClose. Only a confirm dialog has a Cancel
// button: info, success, warning and error dialogs show OK alone. A button its properties
// (okButton, cancelButton) disable refuses the click, as a browser cannot click it.
const BUTTONS = [
  { key: 'ok', event: 'onOk', props: 'okButton' },
  { key: 'cancel', event: 'onCancel', props: 'cancelButton' },
];

function registerMethods({ actor, block, state }) {
  block.registerMethod('open', (args = {}) => {
    const status = args.status || block.eval.properties?.status || 'confirm';
    fireEvent({ actor, block, name: 'onOpen' });
    state.dialogs = [...(state.dialogs ?? []), { status }];
    actor.setOpen({ block, open: true });
  });
}

async function click({ actor, block, state, target }) {
  const control = readControlKey({ block, target });
  const dialogs = state.dialogs ?? [];
  const description = describeBlock(block);
  if (dialogs.length > 1) {
    throw new HeadlessStepError(
      `${description} has ${dialogs.length} dialogs open, each with its own ${control} button; a control target names one.`,
      { actual: `${dialogs.length} dialogs`, expected: `one open dialog of ${description}` }
    );
  }
  // The step runner waits for the block to show, which it does while a dialog is open.
  const [dialog] = dialogs;
  const button = findOneControl({
    block,
    control,
    controls: dialog.status === 'confirm' ? BUTTONS : BUTTONS.slice(0, 1),
    noun: `${dialog.status} dialog button`,
  });
  if (block.eval.properties?.[button.props]?.disabled === true) {
    throw new HeadlessStepError(`The ${control} button of ${description} is disabled.`, {
      actual: 'disabled',
      expected: `an enabled ${control} button in ${description}`,
    });
  }
  const response = await fireEvent({ actor, block, name: button.event });
  if (response.success === false && response.bounced !== true) {
    return;
  }
  state.dialogs = dialogs.filter((open) => open !== dialog);
  // A closed dialog unmounts its content, so the next open mounts it again.
  if (state.dialogs.length === 0) {
    actor.setOpen({ block, open: false });
    unmountContent({ actor, block });
  }
  fireEvent({ actor, block, name: 'onClose' });
}

export default { click, registerMethods };
