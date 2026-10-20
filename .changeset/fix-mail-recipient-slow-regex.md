---
'@lowdefy/connection-sendgrid': patch
'@lowdefy/connection-smtp': patch
---

fix: Long crafted recipient addresses no longer stall the server in the SMTP and SendGridMail connections.

Reading recipient addresses used regular expressions that slow down with the square of the input length, so a recipient of a few hundred kilobytes (for example an email address a user typed into a form) could block the server for seconds to minutes. Recipients are now read in linear time, with the same results.
