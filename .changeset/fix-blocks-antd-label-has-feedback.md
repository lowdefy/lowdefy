---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Honour `label.hasFeedback: false`.

The Label rendered the validation status icon (and message) regardless of `hasFeedback`, so an input configured with `label.hasFeedback: false` still showed a detached grey icon after `Validate`. Both the icon and the feedback message are now gated on `hasFeedback`; validation itself and the input's error/warning styling are unchanged.
