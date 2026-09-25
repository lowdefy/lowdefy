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

function closeTooltip({ host, relatedTarget }) {
  const { overlay } = host;
  if (overlay?.kind !== 'tooltip' || overlay.target.contains(relatedTarget)) return;
  host.closeOverlay();
}

function openTooltip({ event, host }) {
  const { overlay } = host;
  if (overlay?.kind === 'popover') return;
  const target = host.closestInRoot(event, '[data-tooltip]');
  if (!target || overlay?.target === target) return;
  host.openOverlay({ kind: 'tooltip', target, content: target.getAttribute('data-tooltip') });
}

// data-tooltip="Text" shows a themed tooltip on hover and keyboard focus.
const tooltipEnhancer = {
  name: 'tooltip',
  attributes: ['data-tooltip'],
  prepare({ select }) {
    // A native title would show a second tooltip next to the themed one.
    select('[data-tooltip][title]').forEach((element) => {
      element.removeAttribute('title');
    });
  },
  onMouseOver: openTooltip,
  onFocus: openTooltip,
  onMouseOut({ event, host }) {
    closeTooltip({ host, relatedTarget: event.relatedTarget });
  },
  onBlur({ event, host }) {
    closeTooltip({ host, relatedTarget: event.relatedTarget });
  },
};

export default tooltipEnhancer;
