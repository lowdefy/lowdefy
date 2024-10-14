# Actions and Events in Lowdefy

```yaml ldf
_ref: pages/blog/categories/how_to/generate-pdf/styledCallout.yaml
```

Lowdefy `actions` are triggered by page `events`.

Lowdefy includes a list of predefined actions, like the ones below:

- `onClick` when a user clicks a button
- `onEnter` when the page loads.

These built-in actions cover a lot of use cases, but you have the freedom to do more.

With custom actions, you can fine tune your Lowdefy app to perfectly fit your needs.

## Generating PDFs

A common task is to generate a PDF of a standard type of document.
This could be a quote, an invoice, a contract, or even a recipe.

Whichever it may be, we would want consistent formatting

We often have data that needs to be presented as a standard type of document.
This may be a quote, an invoice, a contract or a recipe.

Being able to auto-generate these documents is incredibly useful.

In each case, the document should be formatted a certain way, and include the latest information.

Auto-generated PDFs are a great solution to both problems.

In this how-to example we will create a custom action to generate PDF documents client side or in the browser.

> The full project folder for this how-to is available [here](https://github.com/lowdefy/lowdefy/tree/main/packages/docs/howto/generatePdf)

### Desired Functionality

The example we'll be covering in this tutorial adds the functionality below:

- Event: User clicks button
- Actions:
  - App generates formats data

1. The user clicks a button
2. The app generates a PDF of a requested invoice
3. The PDF is downloaded

Click the button below for an example:

@todo: replace with pdf button

```yaml ldf
_ref: pages/blog/categories/how_to/generate-pdf/twitter-button.yaml
```

Now click this button to share this article on Twitter ;)

```yaml ldf
_ref: pages/blog/categories/how_to/generate-pdf/twitter-button.yaml
```

### Creating the Action

#### tl;dr

1. Select a client side PDF library and add the JavaScript to your Lowdefy app.
2. Register a [JsAction](https://docs-v3.lowdefy.com/JsAction) method to generate the PDF document.
3. Load the custom JavaScript using a script tag.
4. Add a button with a onClick action to call the generate PDF method.
5. Define the content of your PDF and add data variables as needed.

@todo: styling

```yaml ldf
_ref: pages/blog/categories/how_to/generate-pdf/loom-video.yaml
```

> [!NOTE]
>
> This how-to assumes that you are already running a Lowdefy app locally in dev mode. If not:
>
> 1. Create a empty folder.
> 2. Open your terminal or cmd and cd to your empty folder.
> 3. Run `npx lowdefy@latest init && npx lowdefy@latest dev` to initialize and start your Lowdefy app development server.
