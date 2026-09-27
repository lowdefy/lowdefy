---
'@lowdefy/ai-utils': patch
'@lowdefy/build': patch
---

fix(ai): Decide reads a structured-output choice that is not one of the question's options as `null`, like an unknown score level. The AI SDK parses the model's output without checking it against the answer schema, so a model that made up an option returned it as the choice, and a branch on the choice silently never matched.

fix(build): The Decide branch check skips a question whose `options` or `levels` are built by an operator. It used to fail the build with a false "not an option" error for `options`, and with a `TypeError` for `levels`.
