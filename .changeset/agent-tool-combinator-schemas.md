---
'@lowdefy/ai-utils': patch
---

fix(ai-utils): Agent endpoint tools with a top-level `oneOf`, `anyOf` or `allOf` in their payloadSchema work on Anthropic models

Anthropic (directly, or through the AI Gateway, Bedrock or Vertex) and OpenAI refuse a tool whose input schema has `oneOf`, `anyOf` or `allOf` at the top level, and fail the whole request, so every turn of such an agent failed. The model now gets the payloadSchema without the top-level combinator, with the constraint as a line at the head of the tool's description (`Input constraint: Provide parameters for exactly one of: (title, body) or (id).`) and with any properties defined only inside the branches. The endpoint still validates each call against its full payloadSchema, so a payload that breaks the constraint comes back to the model as an error to correct.
