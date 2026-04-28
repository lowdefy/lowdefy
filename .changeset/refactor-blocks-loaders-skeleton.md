---
'@lowdefy/blocks-loaders': patch
---

refactor(blocks-loaders): Modernize skeleton shimmer animation.

The skeleton placeholder now uses a compositor-accelerated `transform: translateX` shimmer on a `::after` pseudo-element, replacing the older `left`-animated `::before` gradient. The shimmer is softer (three-stop gradient over secondary/quaternary fills), the base element uses `isolation: isolate` to scope its stacking context, and `prefers-reduced-motion` disables the animation for accessibility.

`SkeletonInput` and `SkeletonParagraph` also switch to a flex-column layout with gap spacing: tighter rhythm between rows, distinct border radii for the label vs input, and a slightly wider trailing line (60%) in paragraphs for a more readable look. Purely visual — no API changes.
