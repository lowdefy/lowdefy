---
'@lowdefy/blocks-antd': minor
'@lowdefy/blocks-files': minor
'@lowdefy/docs': patch
---

feat: Expose antd 6 options on the overlay, feedback, layout and file blocks.

The overlay, feedback, layout and upload blocks now expose the antd 6.6 features that fit
declarative config, and several properties that silently did nothing now work.

**Modal, ConfirmModal and Drawer**

- `mask` also takes an object: `enabled`, `blur` (blur the page behind the dialog) and `closable`.
  `maskClosable` still works and is folded into `mask.closable`.
- `closable` also takes an object: `disabled` shows the close button disabled; on Drawer,
  `placement: end` moves it to the end of the header.
- New `focusable` object (`trap`, `focusTriggerAfterClose`; ConfirmModal adds `autoFocusButton`).
- New `keyboard` (Modal, ConfirmModal) and `scrollLock` (Modal, ConfirmModal).
- New `loading`, `destroyOnHidden` and `forceRender` (Modal, Drawer).
- Modal: responsive `width` object (`xs` to `xxl`), `afterOpenChange` event with `{ open }`, `title`
  cssKey. The `afterClose` event it already fired is now documented.
- Drawer: `size` (`default`, `large`, a number or a CSS length), `resizable` with `maxSize` and an
  `onResizeEnd` event with `{ size }`, html `title`, `title` cssKey, and `open` on the
  `afterOpenChange` event.
- ConfirmModal: `okButton` and `cancelButton` document their button properties, including
  `iconPlacement: end`.

**Message and Notification**

- Notification: `showProgress`, `pauseOnHover`, `closable`, `role`, the `top` and `bottom`
  placements, and `title`, `description`, `actions` and `progress` cssKeys.
- Notification: the `button` now closes the notification when clicked, as documented.
- Message: `pauseOnHover` and an `onClick` event.

**Tooltip and Popover**

- `arrow` (`false` hides it, `{ pointAtCenter: true }` centres it), the `contextMenu` trigger, and
  `{ open }` on the `onOpenChange` event.
- Popover: `destroyOnHidden`, html `title`, and the `width` and `minWidth` theme tokens.

**Flex, Masonry, MasonryList, Splitter and ConfigProvider**

- Flex: `orientation`, the `medium` gap preset, and the `start`, `end`, `left`, `right`, `normal`,
  `self-start` and `self-end` alignment values.
- Masonry and MasonryList: `item` cssKey and responsive `gutter` objects.
- Splitter: `collapsible` (`motion`, custom `icon.start` and `icon.end`), `destroyOnHidden` (also per
  panel), `draggerIcon`, the `onDraggerDoubleClick` event with `{ index }`, and `panel`, `dragger`,
  `draggerIcon` and `collapseIcon` cssKeys. Panel `collapsible` objects document `start`, `end` and
  `showCollapsibleIcon`.
- ConfigProvider: `virtual`, `popupMatchSelectWidth`, `popupOverflow`, `wave` and the `medium`
  component size.

**Upload, UploadDragger and UploadPhoto**

- `showUploadList` also takes an object with `showPreviewIcon`, `showRemoveIcon` and
  `showDownloadIcon`.
- Upload and UploadDragger: `directory` (upload a folder) and `listType` (`text` or `picture`).
- Upload and UploadPhoto: `pastable` (upload files pasted on the page).
- UploadDragger: `openFileDialogOnClick`, for a drop or paste only area.
- UploadPhoto: `capture` (`user` or `environment` camera on mobile) and `listType`
  (`picture-card` or `picture-circle`).
- Upload documents `iconPlacement` on its `button`.

**Fixes**

- Notification status icons lost their colour on antd 6.6; the colour class now reaches antd's icon
  wrapper. Notification passes `actions` instead of the deprecated `btn`.
- Modal and ConfirmModal no longer pass the deprecated `maskClosable`, Tooltip no longer passes
  `destroyTooltipOnHide` or the removed `arrowPointAtCenter`, Popover no longer passes
  `overlayInnerStyle`, and Splitter no longer passes `layout`. The Lowdefy properties keep working.
- The Modal `content` cssKey and the Tooltip `inner` cssKey styled nothing, because antd 6 renamed
  those parts to `container`. Modal `header`, `footer` and `content` styles were not passed.
- The Popover `inner`, `title` and `content` cssKeys were never wired.
- ConfirmModal ignored `theme` and never fired its `onClose` event.
- ConfigProvider ignored its `theme` property; it is now merged into the design tokens, with
  `token` taking precedence.
- ConfigProvider `componentSize: middle` and Flex `gap: middle` now reach antd as `medium`, the
  name antd 6 uses.
- Corrected documented defaults and descriptions: Drawer size (378px), Message duration (3s) and
  status (`success`), Popover placement (`top`) and hover delays (seconds), Masonry `fresh`, and
  the Flex theme tokens (the gap preset tokens `paddingXS`, `padding` and `paddingLG`).
- The MasonryList docs page linked to the antd List component instead of Masonry.
