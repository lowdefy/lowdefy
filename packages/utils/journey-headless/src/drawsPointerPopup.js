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

// Block types whose component can show a tooltip or popover under the pointer on its own: a grid's
// buttons cells give an icon-only button its title as a tooltip.
const POINTER_POPUP_TYPES = new Set([
  'AgGridAlpine',
  'AgGridBalham',
  'AgGridLowdefy',
  'AgGridMaterial',
  'Popover',
  'Table',
  'TableLight',
  'Tooltip',
]);

// Whether the block can show a tooltip or popover where the pointer rests (pressEscape): a Button
// with a tooltip (its own, or its title when the title is hidden, as Button.js works it out), a
// FloatButton with a tooltip (antd draws one for any tooltip it can render), html with a
// data-tooltip or data-popover element, or a type in POINTER_POPUP_TYPES.
function drawsPointerPopup({ block }) {
  const properties = block.eval.properties ?? {};
  if (POINTER_POPUP_TYPES.has(block.type)) {
    return true;
  }
  if (block.type === 'Button') {
    const titleHidden =
      properties.hideTitle === true ||
      (properties.shape === 'circle' && type.isNone(properties.title));
    return type.isString(properties.tooltip) || (titleHidden && !type.isNone(properties.title));
  }
  if (block.type === 'FloatButton') {
    return !type.isNone(properties.tooltip) && !type.isBoolean(properties.tooltip);
  }
  if (block.type === 'Html' || block.type === 'ClickableHtml') {
    const html = String(properties.html ?? '');
    return html.includes('data-tooltip') || html.includes('data-popover');
  }
  return false;
}

export default drawsPointerPopup;
