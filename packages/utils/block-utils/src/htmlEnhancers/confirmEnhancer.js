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

function createConfirmOverlay({ fire, host, message, target }) {
  let fired = false;
  return {
    kind: 'confirm',
    target,
    content: message,
    onConfirm() {
      // A second click on OK can already be queued when the first one closes it.
      if (fired) return;
      fired = true;
      host.closeOverlay('confirm');
      fire();
    },
    onClose(reason) {
      // After an outside click, focus stays where the user put it.
      if (reason !== 'outside' && target.isConnected) {
        target.focus();
      }
    },
  };
}

// data-confirm="Delete this row?" on a ClickableHtml data-event target asks
// before the event fires. The overlay shows the message with OK and Cancel;
// only OK fires, and only once. An event the block's dataEvents lists with
// confirm always asks: with its confirm message, or the target's data-confirm.
// A confirm is never carried to new HTML (it has no retarget): the event's
// data-* values can name a row by position, and new HTML can put another row
// there, so an open confirm closes when the HTML changes.
const confirmEnhancer = {
  name: 'confirm',
  attributes: ['data-confirm'],
  prepare({ dataEvents, select }) {
    select('[data-confirm]').forEach((element) => {
      if (!dataEvents) {
        console.warn('data-confirm only works in ClickableHtml, on an element with data-event.');
        return;
      }
      if (!element.hasAttribute('data-event')) {
        console.warn('data-confirm needs data-event on the same element, so it was ignored.');
      }
    });
  },
  gateDataEvent({ confirm, confirmMessage, fire, host, target }) {
    if (!confirm && !target.hasAttribute('data-confirm')) return false;
    // A second click on the target keeps its open confirm.
    if (host.overlay?.kind === 'confirm' && host.overlay.target === target) return true;
    const message =
      confirmMessage ??
      (target.getAttribute('data-confirm') || host.registration.translate('client.confirm'));
    host.openOverlay(createConfirmOverlay({ fire, host, message, target }));
    return true;
  },
};

export default confirmEnhancer;
