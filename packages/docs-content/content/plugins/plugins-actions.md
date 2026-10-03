# Action Plugins

Actions are functions that are triggered by [events](https://docs.lowdefy.com/events-and-actions) in a Lowdefy app. Actions can be `async` functions. The response returned by the action can be read using the `_actions` operator. If a promise is returned, the promise will be awaited before the next action is run.

The Lowdefy engine provides a context object to the action with the following parameters:

- `globals: object`: Commonly used Javascript global objects. These are passed to the action for easier testing.
  - `document: object`: The browser [`window.document`](https://developer.mozilla.org/en-US/docs/Web/API/Document/Document) global variable.
  - `fetch: function`: The global [`fetch`](https://developer.mozilla.org/en-US/docs/Web/API/fetch) Javascript method.
  - `window: object`: The browser [`window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) global variable.
- `methods: object`:
  - `callMethod: function`: Call the CallMethod action.
  - `displayMessage: function`: Call the DisplayMessage action.
  - `getActions: function`: Get data from previous actions in the action chain.
  - `getBlockId: function`: Get the blockId of the block that triggered the event.
  - `getEvent: function`: Get event data from the event that triggered the action.
  - `getGlobal: function`: Get data from the Lowdefy global object.
  - `getInput: function`: Get data from the Lowdefy input object.
  - `getLocale: function`: Return the active i18n locale code (or undefined when `config.i18n` is not configured).
  - `getPageId: function`: Get the pageId of the block that the action is defined on.
  - `getRequestDetails: function`: Get data from Lowdefy requests.
  - `getState: function`: Get data from the Lowdefy state object.
  - `getUrlQuery: function`: Get data from the Lowdefy urlQuery object.
  - `getUser: function`: Get data from the Lowdefy user object.
  - `link: function`: Call the Link action.
  - `login: function`: Call the Login action.
  - `logout: function`: Call the Logout action.
  - `request: function`: Call the Request action.
  - `reset: function`: Call the Reset action.
  - `resetValidation: function`: Call the ResetValidation action.
  - `setGlobal: function`: Call the SetGlobal action.
  - `setState: function`: Call the SetState action.
  - `translate: function`: Look up a translation key (`(key, values?) => string`) — same lookup chain as the [`_t`](/_t) operator. See [i18n](/i18n) for the plugin-author contract.
  - `validate: function`: Call the Validate action.
- `params: any`: The `params` defined by the user in the Lowdefy configuration. Operators are evaluated before the params are passed to the action. No validation is performed on this object.
- `trace: object`: Observe completed block and app events, for example to send them to an analytics tool.
  - `subscribe: function`: `subscribe(listener, { state }) => unsubscribe`. The listener is called once for every block or app event that ran its actions, after the event finished, with `{ scope, pageId, blockId, blockType, eventName, success, failure, debounceMs, actions, record, context }`. `scope` is `page` or `app`. `failure` is `null` for a successful event, else `{ actionId, actionType, configKey, errorName, invalidBlocks }`: ids only, never an error message or a value. An event with no actions, a bounced debounced event and an event an inner block already handled are not reported. Pass `{ state: true }` to also receive `stateBefore`, a copy of the page state before the actions ran. A listener that throws is logged once and never stops the event or the other listeners.
  - `describeElement: function`: `describeElement(element)` returns the journey target a DOM element describes as: `{ page_id, block_id, block_type, row, column, text, nth, option, block_ids }`.
  - `describeChain: function`: `describeChain(elementsChain)` returns the same target from a PostHog `$elements_chain` string, with `nth` always `null`.
  - `pageIdOf: function`: `pageIdOf(url)` returns the page id a URL shows, or the configured home page at the app root.

#### Examples

###### The Lowdefy SetState action:
```js
function SetState({ methods: { setState }, params }) {
  setState(params);
}

export default SetState;
```

###### The Lowdefy Fetch action:
```js
async function Fetch({ globals, params }) {
  const { fetch } = globals;
  const { url, options, responseFunction } = params;
  const res = await fetch(url, options);
  if (responseFunction) {
    return res[responseFunction]();
  }
  return res;
}

export default Fetch;
```

###### An action that shows the user confetti using the js-confetti package:
```js
// Confetti.js
import JSConfetti from 'js-confetti';

async function Confetti({ params }) {
  const jsConfetti = new JSConfetti();
  const { emojis, confettiRadius = 3, confettiNumber = 50, emojiSize = 10 } = params;
  jsConfetti.addConfetti({
    emojis,
    confettiRadius,
    confettiNumber,
    emojiSize,
  });
}

export default Confetti;
```
