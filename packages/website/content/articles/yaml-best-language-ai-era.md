---
title: 'Why YAML Might Be the Best Language for the AI Era'
subtitle: "YAML won't win any beauty contests. But as AI does more of the heavy lifting, a lighter vehicle matters more than it used to."
authorId: 'salahuddin'
publishedAt: '2026-03-25'
readTimeMinutes: 8
tags:
  - 'AI'
  - 'Developer Experience'
  - 'Opinion'
draft: false
---

YAML doesn't usually get much attention. It sits quietly in config files and CI pipelines, doing its job without much fanfare. Most developers learn it out of necessity and move on.

But as AI tools become a bigger part of how I work, I keep coming back to the same thought. YAML might have accidentally become one of the best languages to build in right now. Not because it's powerful in the traditional sense, but because of what it removes.

---

## The Learning Curve Is Real

When I first started building with Lowdefy, I came in with a background in conventional programming. JavaScript, component trees, state management. The usual. So writing applications as structured YAML config felt strange at first.

The syntax itself is clean and readable. That part clicked fast. What tripped me up was the mental model. Lowdefy has its own way of thinking about state. Mapping it to block IDs, understanding which blocks accept data versus which blocks you put data into. Coming from traditional code, the distinction between action blocks, connection blocks, display blocks, and input blocks takes some getting used to. My first real project was building an ECharts visualisation with hardcoded data, and I spent more time than I'd like to admit confused about exactly that.

But once it clicks, it really clicks. What you're left with is a codebase that's easy to read, maintain, and hand off. Even on complex projects, the config stays legible. You're not deciphering someone else's component architecture or untangling a mess of hooks. It's just YAML, top to bottom.

---

## The 90/10 Split

There's a ratio I've noticed when comparing Lowdefy work to React work.

In a typical React project, I'd say roughly 70% of my mental energy goes into _how_ to structure the code. Folder layout, component hierarchy, state management patterns, side effects. The actual feature gets maybe 30%.

With Lowdefy, that flips almost entirely. The framework isn't opinionated about how you organise your folders, but there is a correct way to structure a project. Pages, blocks, connections, requests — everything has a defined place and a defined role. Once you understand that, there's almost nothing to debate at the architectural level. I end up spending maybe 90% of my attention on the actual problem. The feature. The requirement. The thing that matters.

That shift is more significant than it sounds. Lowdefy was built this way on purpose, to move focus away from the code and toward the problem being solved. It just took me a while to appreciate how much overhead it was quietly absorbing.

---

## Then AI Got Involved

The goal of AI-assisted development is essentially the same thing. Shift attention away from _how_ you write the code and toward _what_ you're trying to build.

When I started using Claude and other LLMs in my Lowdefy workflow, the results were better than what I'd seen in other contexts. I think the reason is straightforward. YAML config has a consistent, learnable schema. There's a right way to reference a block, a right way to nest operators, a right place for everything. LLMs are good at learning and reproducing structured patterns, and Lowdefy's config gives them a clear target.

A few months back I was working on a feature for a client. A reasonably complex calculation that needed to sit in a specific part of the app and process a specific shape of data. I hadn't spent much time planning it. I gave Claude the relevant context, the input, what the output should look like, where it sits in the app. What came back was almost exactly what I needed. Minimal changes. Done.

What struck me wasn't just that it worked. It was how easy it was to review. No bloated syntax to wade through. No abstractions to untangle. The config said exactly what it did, and I could verify it line by line without much effort. That's not something I can always say about AI-generated React code.

There's something subtler worth mentioning too. Lowdefy's reliance on block ID references and nested state gives LLMs a concrete set of rules to follow. In my experience, Claude gets request calls, file references, and state keys right almost every time. Operator hallucinations do happen occasionally, but they're rare. And if something is off, the build will catch it. That reduces the review burden more than you'd expect.

---

## The Verbosity Problem

There's a fair criticism of YAML in Lowdefy worth addressing. Complex logic can get messy. If you're not disciplined, you can end up with 12 lines of config doing something that should take 3. Nested boolean checks, redundant state references, overly literal operator chains.

But that's not a YAML problem. That's a developer discipline problem. It exists in JavaScript, Python, and every other language. LLMs have the same tendency. They'll sometimes take the verbose path when a cleaner one exists. The difference is that in YAML, the mess is visible. You can see the redundancy. There's no compiled abstraction hiding it. It's right there, and it's fixable.

As Lowdefy grows and LLMs see more examples of well-written config, the quality of AI-generated YAML will keep improving. The framework is still relatively niche, but the models already handle it well. More open-source projects, more community examples, and the gap closes faster.

---

## Was This Intentional

I don't think the Lowdefy team designed the framework with the AI era in mind. That would have required a level of foresight that's hard to credit anyone with. But what they did design for, consistency, constraint, and keeping developer focus on the problem rather than the plumbing, lines up almost perfectly with what makes AI tooling effective.

The end goal of AI in development is a world where you describe what you want, the tooling builds it, and you spend your energy validating the result rather than producing it line by line. Lowdefy's structure puts us closer to that than most conventional codebases do. The correct-by-design patterns, the human-readable output, the concrete schema. It all reduces the gap between intent and implementation.

---

## The Honest Case for Trying It

If you're comfortable in React or Python and see no reason to change, that's fair. Learning a new framework always feels like overhead.

But programming languages are a means to an end. Most developers got into the field because they wanted to build something. Tools, products, solutions. The language was always just the vehicle. Lowdefy makes the vehicle lighter. And with AI doing more of the heavy lifting, a lighter vehicle matters more than it used to.

The closer we get to describing what we want and getting exactly that back, the less the language itself matters. What matters is the structure underneath it. YAML won't win any beauty contests. But right now, it might be one of the more practical bets a developer can make.
