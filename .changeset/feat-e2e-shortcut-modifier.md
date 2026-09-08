---
'@lowdefy/e2e-utils': minor
'@lowdefy/block-dev-e2e': minor
---

Add `getShortcutModifier` for testing `mod` keyboard shortcuts.

A `mod` shortcut resolves to Cmd or Ctrl from the platform the browser reports, and Playwright emulates that platform per project — a Desktop Chrome project reports Windows even when the test runner is on macOS. A test that derives the key from `process.platform` therefore presses a key the app is not listening for, and only on some host operating systems.

`getShortcutModifier(page)` reads the platform from the page instead, so the key a test presses is always the key the app is listening for:

```javascript
import { getShortcutModifier } from '@lowdefy/e2e-utils';

const mod = await getShortcutModifier(page);
await page.keyboard.press(`${mod}+k`);
```
