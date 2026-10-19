---
'@lowdefy/build': patch
---

fix(build): Icon name validation skips antd theme tokens and catches malformed qualified names. A block's `properties.theme.colorIcon: white` failed the build as an unknown icon, because the key ends in "icon". A name qualified with an installed icon set but a malformed icon part, like `lucide:pencil` or `react-icons:user`, passed the build and rendered the missing icon; it now fails with a suggestion such as `lucide:Pencil`.
