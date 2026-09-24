---
'@lowdefy/actions-core': patch
'@lowdefy/email-templates': patch
'@lowdefy/engine': patch
'@lowdefy/client': patch
'@lowdefy/build': patch
'@lowdefy/api': patch
---

feat(api,client,build,actions-core): magic-link landing page keeps the token unconsumed until a real click

A magic-link sign-in token can only be used once, and the auth server spends it on
the first request to the link — including a request nobody made. Corporate email
security (Microsoft Defender Safe Links, Proofpoint URL Defense, Mimecast) opens
every link in a message as it is delivered, so by the time the person clicks, the
link is already used up and they land on the error page.

Set the new `auth.authPages.magicLink` to a page in your app and the sign-in email
links there instead, carrying the token and the sign-in destinations along. The
page just sits there when a scanner fetches it; a button on it runs the new
`MagicLinkVerify` action, which finishes the sign-in. The token is only spent when
a person clicks, so scanned mailboxes can sign in again.

`MagicLinkVerify` needs no configuration — it reads the token and the destinations
from the page's own address. Bind it to a button click, never to page load: a
scanner that runs the page's JavaScript would use up the token all the same.

Leave `auth.authPages.magicLink` unset and magic-link sign-in behaves exactly as
before. The sign-in email also now shows the link as readable text under the
button, for mail clients that strip or rewrite buttons.
