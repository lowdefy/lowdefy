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

import React, { forwardRef, useEffect, useId, useImperativeHandle, useRef } from 'react';
import { Popconfirm, Popover, Tooltip } from 'antd';

// The target lives in HTML React does not own, so antd cannot wrap it. antd's
// trigger resolves its anchor from the child's ref, so a child that renders
// nothing and hands back the target element anchors the popup on the target
// itself, and the trigger follows its scrolling and resizing.
const TargetAnchor = forwardRef(function TargetAnchor({ target }, ref) {
  useImperativeHandle(ref, () => target, [target]);
  return null;
});

// Open popovers and confirms, newest last. Escape and outside clicks close only
// the newest, so a confirm opened inside a popover closes before the popover,
// and a click in the confirm is not an outside click for the popover.
const dismissable = [];

function isTop(entry) {
  return dismissable[dismissable.length - 1] === entry;
}

function ConfirmOverlay({ content, onClose, onConfirm, popupClassName, target }) {
  const messageId = `${useId().replace(/[^a-zA-Z0-9_-]/g, '')}-message`;
  const cancelRef = useRef(null);
  return (
    <Popconfirm
      afterOpenChange={(open) => {
        // The least destructive action takes focus (WAI-ARIA alert dialog),
        // once the popup is placed so focusing it cannot scroll the page.
        if (open) cancelRef.current?.focus();
      }}
      cancelButtonProps={{ 'aria-describedby': messageId, ref: cancelRef }}
      okButtonProps={{ 'aria-describedby': messageId }}
      onCancel={() => onClose('cancel')}
      onConfirm={onConfirm}
      open={true}
      placement="top"
      rootClassName={popupClassName}
      title={<span id={messageId}>{content}</span>}
      trigger={[]}
    >
      <TargetAnchor target={target} />
    </Popconfirm>
  );
}

function HtmlOverlay({ content, kind, onClose, onConfirm, target }) {
  const popupClassName = `lowdefy-html-${kind}-${useId().replace(/[^a-zA-Z0-9_-]/g, '')}`;

  useEffect(() => {
    // Tooltips close on Escape but take no clicks, so they are not dismissable.
    const entry = kind === 'tooltip' ? null : {};
    if (entry) dismissable.push(entry);
    // A click on the trigger toggles the overlay itself; one inside the popup
    // is inside the overlay.
    function onPointerDown(event) {
      if (!entry || !isTop(entry)) return;
      if (target.contains(event.target)) return;
      if (event.target.closest?.(`.${popupClassName}`)) return;
      onClose('outside');
    }
    function onKeyDown(event) {
      if (event.key !== 'Escape' || event.isComposing) return;
      // Every tooltip closes on Escape; of popovers and confirms, the newest.
      if (!entry || isTop(entry)) onClose('escape');
    }
    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      if (entry) dismissable.splice(dismissable.indexOf(entry), 1);
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [kind, onClose, popupClassName, target]);

  if (kind === 'confirm') {
    return (
      <ConfirmOverlay
        content={content}
        onClose={onClose}
        onConfirm={onConfirm}
        popupClassName={popupClassName}
        target={target}
      />
    );
  }
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
