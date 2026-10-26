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

import { randomBytes } from 'node:crypto';

const DEFAULT_PRIMARY_COLOR = '#1677ff';

// Only a plain hex colour is written into the page's style.
const HEX_COLOR = /^#(?:[0-9a-fA-F]{3,4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

function createStyle({ primaryColor }) {
  return `
:root { color-scheme: light dark; --primary: ${primaryColor}; }
* { box-sizing: border-box; }
body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  background: Canvas; color: CanvasText; }
main { width: 100%; max-width: 400px; padding: 32px 24px; text-align: center; }
h1 { font-size: 22px; line-height: 1.3; margin: 0 0 12px; }
p { font-size: 15px; line-height: 1.5; margin: 0 0 24px; opacity: 0.8; }
form { display: flex; flex-direction: column; gap: 12px; }
button { font: inherit; font-size: 16px; font-weight: 600; padding: 12px 16px; border-radius: 8px;
  cursor: pointer; border: 1px solid var(--primary); }
button.primary { background: var(--primary); color: #fff; }
button.secondary { background: transparent; color: var(--primary); }
`;
}

// The small server-rendered pages of the phone sign-in sheet (the
// confirmation page and the app-link fallback). They run no app code and load
// nothing: a strict Content-Security-Policy allows only the page's own style
// and script, by a nonce made for each response, and no site may frame them,
// so no other page can overlay or click the confirmation. They are never
// stored by a cache, and send no Referer by default. A page that posts a form
// to its own origin takes `same-origin`: under `no-referrer` a browser sends
// that post with `Origin: null`, which isSameOriginRequest refuses.
function createMobileAuthPageResponse({
  content,
  primaryColor,
  referrerPolicy = 'no-referrer',
  script = null,
  status = 200,
  title,
  headers = {},
}) {
  const nonce = randomBytes(16).toString('base64');
  const color = HEX_COLOR.test(primaryColor ?? '') ? primaryColor : DEFAULT_PRIMARY_COLOR;
  const scriptElement = script === null ? '' : `<script nonce="${nonce}">${script}</script>`;
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="referrer" content="${referrerPolicy}" />
<title>${title}</title>
<style nonce="${nonce}">${createStyle({ primaryColor: color })}</style>
${scriptElement}
</head>
<body>
<main>
${content}
</main>
</body>
</html>`;
  return new Response(html, {
    status,
    headers: {
      ...headers,
      'cache-control': 'no-store',
      'content-type': 'text/html; charset=utf-8',
      'content-security-policy': `default-src 'none'; style-src 'nonce-${nonce}'; script-src 'nonce-${nonce}'; base-uri 'none'; frame-ancestors 'none'`,
      'referrer-policy': referrerPolicy,
      'x-content-type-options': 'nosniff',
      'x-frame-options': 'DENY',
    },
  });
}

export default createMobileAuthPageResponse;
