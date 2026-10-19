---
'@lowdefy/ai-utils': patch
---

fix(ai): A Decide answer outside its question's terms (an option or level the question does not have, a yes/no that is not a boolean, or no answer) comes back with every field `null`, its confidence and probability included. It used to keep the model's own confidence, so a made-up choice at 0.95 passed a review gate such as `_lt: [{ _step: triage.team.confidence }, 0.7]`. The evaluation backend applies the same check.
