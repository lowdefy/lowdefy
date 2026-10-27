---
'@lowdefy/shell': patch
---

fix(shell): Unregister a phone's push token with the session that is signing out

Sign-out reads the device push token before it calls the app's unregister endpoint, and cleared the session token meanwhile, so the call usually went out with no session and was refused: the signed-out person's notifications kept reaching a shared phone. The call now carries the session token as it was when sign-out began.
