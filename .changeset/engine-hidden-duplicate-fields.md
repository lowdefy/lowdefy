---
'@lowdefy/engine': patch
---

fix(engine): a hidden block no longer deletes the state field of a visible block in another container.

Hidden blocks' fields are removed from state after each evaluation, but a visible block only kept
its field from a hidden block with the same id inside the same container. A hidden block with the
same id in another container, a hidden duplicate of a list, or a hidden container named like the
parent of a visible field deleted the visible block's field, including a visible list row's field.
Fields are now collected over the whole page and a field that holds a visible block's value is
kept.
