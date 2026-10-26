---
'@lowdefy/blocks-native': patch
---

fix(blocks-native): Avatar photos from app paths load on phones

An avatar whose `src` is a path on the app server (`/avatars/u1.png`) showed only its initials on a phone, in Avatar, ListItem, ActivityTimeline, Composer suggestions and selector options. The path is now taken against the app server, as the Markdown block's images are.
