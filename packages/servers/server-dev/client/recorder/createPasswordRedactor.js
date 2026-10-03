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

import { journeyTargetSelectors } from '@lowdefy/helpers';

const { blockWrapperPrefix } = journeyTargetSelectors;

function isPasswordInput(element) {
  return (
    typeof element?.tagName === 'string' &&
    element.tagName.toLowerCase() === 'input' &&
    element.type === 'password'
  );
}

function redactWrites(event, passwordBlocks) {
  if (event === null || event === undefined) return;
  (event.state_writes ?? []).forEach((write) => {
    if (passwordBlocks.has(write.path)) {
      write.value = null;
      write.redacted = true;
    }
  });
}

// Password inputs are never recorded. A block is a password block when the
// interaction's element, or its block's `<blockId>_input` element, is an
// `<input type="password">`. It is remembered for the rest of the tab session,
// so its value is redacted from every later change and from every state write
// to its path, a later SetState echo included.
function createPasswordRedactor() {
  const passwordBlocks = new Set();

  function isPassword(element) {
    if (isPasswordInput(element)) return true;
    const wrapper = element?.closest?.(`[id^="${blockWrapperPrefix}"]`);
    if (!wrapper) return false;
    const blockId = wrapper.id.slice(blockWrapperPrefix.length);
    return isPasswordInput(element.ownerDocument?.getElementById(`${blockId}_input`));
  }

  function remember(blockId) {
    if (typeof blockId === 'string' && blockId !== '') {
      passwordBlocks.add(blockId);
    }
  }

  function redact(record) {
    if (record.kind === 'change' && passwordBlocks.has(record.target?.block_id)) {
      record.value = null;
      record.redacted = true;
    }
    redactWrites(record.event, passwordBlocks);
    (record.also ?? []).forEach((event) => redactWrites(event, passwordBlocks));
    return record;
  }

  return { isPassword, redact, remember };
}

export default createPasswordRedactor;
