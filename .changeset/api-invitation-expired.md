---
'@lowdefy/api': patch
---

Accepting an expired or cancelled invitation now fails with the code `INVITATION_EXPIRED` and the message "This invitation has expired. Ask the person who invited you to send a new one.", instead of "Invitation not found", which invitees read as a broken link. An unknown invitation id still answers "Invitation not found".
