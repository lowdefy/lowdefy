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

import React, { forwardRef, useEffect, useId, useImperativeHandle } from 'react';
import { Popover, Tooltip } from 'antd';

// The target lives in HTML React does not own, so antd cannot wrap it. antd's
// trigger resolves its anchor from the child's ref, so a child that renders
// nothing and hands back the target element anchors the popup on the target
// itself, and the trigger follows its scrolling and resizing.
const TargetAnchor = forwardRef(function TargetAnchor({ target }, ref) {
  useImperativeHandle(ref, () => target, [target]);
  return null;
});

function HtmlOverlay({ content, kind, onClose, target }) {
  const popupClassName = `lowdefy-html-${kind}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    // A click on the trigger toggles the popover itself; one inside the popup
    // is inside the overlay.
    function onPointerDown(event) {
      if (kind !== 'popover') return;
      if (target.contains(event.target)) return;
      if (event.target.closest?.(`.${popupClassName}`)) return;
      onClose();
    }
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [kind, onClose, popupClassName, target]);

  const Overlay = kind === 'popover' ? Popover : Tooltip;
  const contentProps = kind === 'popover' ? { content } : { title: content };
  return (
    <Overlay
      {...contentProps}
      open={true}
      placement="top"
      rootClassName={popupClassName}
      trigger={[]}
    >
      <TargetAnchor target={target} />
    </Overlay>
  );
}

export default HtmlOverlay;
