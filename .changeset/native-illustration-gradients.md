---
'@lowdefy/blocks-native': patch
---

fix(blocks-native): An Illustration's user-space gradients fade where the drawing puts them

react-native-svg on iOS does not place a `gradientUnits="userSpaceOnUse"` gradient in the drawing's coordinates, so a fade drawn that way showed as a flat fill. An Illustration now redraws each shape's user-space linear gradient along an axis in the shape's own bounding box, the units every platform draws, so the fade lands where the drawing puts it, in cropped layers too.
