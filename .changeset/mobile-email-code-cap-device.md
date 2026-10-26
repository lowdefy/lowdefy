---
'@lowdefy/api': patch
'@lowdefy/shell': patch
---

fix(api,shell): A stranger can no longer keep a phone out of email-code sign-in

The phone email-code cap (5 per 15 minutes per address) could be kept full by anyone who knew the address, and parallel requests could get past it. Now:

- Each send takes a slot atomically, so the cap holds under parallel sends. Password-reset codes are capped too.
- The shell keeps a random device key in secure storage and sends it on its email-code calls. A phone that has signed in by code with an address before skips the address's cap and keeps a cap of its own.
- The server stores the key only as its SHA-256.
- A known phone's code is held for it until it expires. A stranger's send resends the same code rather than replacing it, and only that phone may try it, so wrong tries from anywhere else cannot use it up. The phone is recorded as known only once its sign-in keeps its session, after any second factor.
- When the cap is full, the sign-in screen asks for the newest code already sent, rather than staying on the email step.
