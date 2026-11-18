---
'@lowdefy/email-templates': patch
---

fix(deps): Remove the deprecated @react-email/components package

`@lowdefy/email-templates` no longer depends on `@react-email/components`, which react-email has deprecated in favour of its `react-email` package (which also carries its CLI and preview server). The twelve components the built-in email templates use (`Body`, `Button`, `Container`, `Head`, `Heading`, `Hr`, `Html`, `Img`, `Link`, `Preview`, `Section`, `Text`) are now part of the package, copied from react-email 6.11.11 with the MIT licence notice kept. Emails are still rendered by `@react-email/render`. This removes 32 packages from the package's dependencies, including Tailwind and Prism.

Coming from react-email 6.11.11, the built-in emails pick up these upstream fixes in their HTML. The plain-text version of every email is unchanged.

- The email body has `dir="ltr"` and `lang="en"` set, for screen readers.
- The preview text is also written as the document `<title>`, and is cut at 200 characters instead of 150, with matching hidden padding so Gmail does not pull body text into the inbox preview. The padding no longer contains the direction marks U+200E and U+200F, which spam filters such as rspamd score as hidden text.
- The content container's padding is set on its inner table cell instead of the table, so it applies in Outlook desktop and Klaviyo.
- The Outlook spacer on buttons sets `mso-text-raise` with a `px` unit; without one, Outlook ignored it.
- The footer divider keeps its colour and sets its other borders to transparent.
