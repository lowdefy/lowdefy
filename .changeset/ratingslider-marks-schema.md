---
'@lowdefy/blocks-antd': patch
---

fix(blocks-antd): Declare `marks` in the RatingSlider schema

RatingSlider has always used a `marks` property in place of the marks `showMarks` draws, but its
schema left it out, so each RatingSlider that set `marks` got a `plugin-schema` build warning:
`Block "RatingSlider" property "marks" is not allowed.` The schema now declares `marks` as an
object whose keys are slider values and whose values are labels (a string, or `{ style, label }`
as antd takes), and the RatingSlider docs page lists it. A `marks` that is not an object still
warns.
