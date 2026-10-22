# Quickstart

A running Lowdefy app in five minutes. You need [Node.js](https://nodejs.org) v24 or newer and [pnpm](https://pnpm.io) installed.

## 1. Create an app

Initialize a new app and start the dev server:

$

pnpx lowdefy@5 init && pnpx lowdefy@5 dev

This creates a `lowdefy.yaml` in the current directory and opens your app at
[http://localhost:3000](http://localhost:3000). The dev server reloads on every save.

## 2. Add a block

Pages are lists of blocks. Open `lowdefy.yaml` and add a `TextInput` and a `Title` to the first page's `blocks`:

```yaml
blocks:
  - id: name
    type: TextInput
    properties:
      title: What is your name?
  - id: greeting
    type: Title
    properties:
      content:
        _nunjucks:
          template: 'Hello {{ name }}!'
          on:
            name:
              _state: name
```

Save, and type into the input — the title updates as you type.

## 3. What just happened

You used three of the four primitives:

- The **blocks** `TextInput` and `Title` render the UI.
- The **operators** `_state` and `_nunjucks` read the input's value from page state and template the greeting. Operators re-evaluate whenever state changes.
- Behind the scenes, typing fires **events** — the fourth primitive, **actions**, lets you respond to them (navigate, call APIs, set state).

Add a **connection** and a request when you're ready to talk to a database or API.

## Next steps

- Take the [full tutorial](/tutorial-start) — build a complete app with requests and data, in about an hour.
- Read [The Four Primitives](/four-primitives) for the mental model.
- Browse the [Reference](/reference) to see everything Lowdefy ships.
