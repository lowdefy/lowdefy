<!-- 
Date Generated: 2025-07-01 08:24:34 UTC
Branch: develop
-->

# Lowdefy Documentation

---

## File: `introduction.yaml`

# Introduction

Lowdefy makes it really easy to build web apps. With Lowdefy you can build CRUD apps, admin panels, internal tools, BI dashboards, workflow apps, websites, blogs, webforms or even documentation pages such as this one.

Lowdefy apps are defined in YAML config that follows a structured schema - this makes Lowdefy apps easy to read, write and understand.

## Quickstart

Run the following command to initialize a new Lowdefy app in your current working directory.


This will create a file called `lowdefy.yaml` in the current working directory that contains the configuration for a Lowdefy app (as well as a `.gitignore`) and launch a local development server at http://localhost:3000. Make changes in the `lowdefy.yaml` file to see them reflect in the app.

> You need Node v18 or newer and pnpm installed to run Lowdefy. For more details see [the tutorial](/tutorial-start).

## Why create web apps using a YAML schema?

The Lowdefy schema is a simple definition of a web app which primarily makes use of block, action, operator and request definitions.

Some advantages of writing web apps in YAML are:
  - All apps use the same schema. This makes it easy to debug large apps or pick up where others left off.
  - Nothing is hidden in a GUI. This allows you to do basic stuff, like copy, paste, find, replace etc. which makes developing apps more productive.
  - App config is just data, thus you can develop scripts to create and manage your apps.
  - YAML files work with your favorite developer and source control tools.

> If you aren't a fan of YAML, you can also build your app using JSON files.

## Build future proof web apps on an source available platform

To date, more than 25 000 apps have been built by the Lowdefy community. We hope to see many community Lowdefy apps and plugins in the future and actively nurture the Lowdefy community on [Github](https://github.com/lowdefy/lowdefy/discussions) and [Discord](https://discord.gg/QQY9eJ7A2D) to help other developers to get started with Lowdefy and grow the ecosystem.

We've built Lowdefy to scale our own ability to develop and maintain web apps and internal tools for customers. Currently, we also provide Custom Software as a Service for larger customers, as well as support plans for those who need some extra help. Using Lowdefy we've built ticketing systems, call center solutions, advanced CRMs, custom MRPs, surveys and BI dashboard solutions and more for startup to enterprise customers. If you are looking for a Custom Software as a Service partner, please [reach out to us](http://lowdefy.com/contact-us).

## Tutorial

The easiest way to get started with Lowdefy is to follow the tutorial. In this tutorial we will be building a simple Lowdefy app to get you started.



---

## File: `concepts/secrets.yaml`

# Secrets

**Section:** Concepts

The `secrets` object is an object that can be used to securely store sensitive information such as passwords and API keys. Secrets can be accessed using the [`_secret`](/_secret) operator.

The secrets object only exists on the backend server, and therefore the `_secret` operator can only be used in `connections` and `requests`.

Secrets can be set by creating an environment variable prefixed with `LOWDEFY_SECRET_`. The secret will then be available in the secrets object with the remaining part of the name as key.

For example, if the environment variable `LOWDEFY_SECRET_MY_SECRET` is set to `supersecret`, then `_secret: MY_SECRET` will return `supersecret`.

To use secrets in the local development environment, environment variables can be set using a `.env` file. Create a file called `.env` at the root of the project directory, then set environment variables as follows:

```
# .env
LOWDEFY_SECRET_MY_SECRET=supersecret
```



---

## File: `concepts/references-and-templates.yaml`

# References and Templates

**Section:** Concepts

References and templates have the following use cases:
- Splitting out the config for readability and code navigation.
- Splitting out a piece of config in order to use the exact same config in multiple places.
- Using a reference with variables to make use of a shared piece of config with dynamic variables.
- Using a `.njk` file to create config files using the Nunjucks templating language.
- Using resolver and transformer functions to create Lowdefy config using Javascript functions.

## Using References to Improve Readability

References are made using the [`_ref`](/_ref) operator. If the referenced file has a `.yaml` or `.json` extension, the contents of the file will be parsed, else the file content is included as a string (this is useful for `.md` or `.html` files). As an example of splitting an app into logically distinct files, references can be used to write each page as a separate file:

###### lowdefy.yaml
```yaml
lowdefy: LOWDEFY_VERSION

pages:
  _ref: pages/page1.yaml # Path to the referenced file. Always from the root of the project.
  _ref: pages/page1.yaml
```

## Using References as Templates for Improved Reusability

The `_ref` operator can take an argument called `vars`. This can be any data, and is passed down to later be accessed with the [`_var`](/_var) operator. By using vars, the referenced file can become a template, using the given variables. For example, a standard page template might be used for multiple pages in an app:

###### pages/page1.yaml
```yaml
_ref:
  path: templates/text_page.yaml
  vars:
    id: page1
    title: Page 1
    content:
      _ref: markdowns/content.md
```

###### markdowns/content.md
```yaml
Page content text.
```

###### templates/text_page.yaml
```yaml
id:
  _var: id
type: PageHeaderMenu
properties:
  title:
    _var: title
blocks:
  - id: content_card
    type: Card
    blocks:
      - id: title
        type: Title
        properties:
          content:
            _var: title
      - id: content
        type: Markdown
        properties:
          content:
            _var: content
```

## Nunjucks Templating

Templating can be taken further by referencing [Nunjucks](https://mozilla.github.io/nunjucks/) template files. If a file ends with the `.njk` file extension, the file will first be hydrated as a Nunjucks template, using the `vars` as template variables. If the file ends with `.yaml.njk` or `.json.njk`, the output of the template will then be parsed. Nunjucks templates are useful since the template file does not need to be valid yaml before it is hydrated, and features like for-loops and if-statements can be used.

Templating is used extensively to create the Lowdefy docs (these docs are a Lowdefy app). You can look at how they are used [here](https://github.com/lowdefy/lowdefy/tree/main/packages/docs).

We can modify the example above to make use of nunjucks templating to allow us to add subsections to our page. This can be done as follows:

###### pages/page1.yaml
```yaml
_ref:
  path: templates/text_page.yaml.njk
  vars:
    id: page1
    title: Page 1
    content:
      _ref: markdowns/content.md
    subsections:
      - id: subsection1
        title: Subsection 1
        content: |
          Subsection 1 content text.
      - id: subsection2
        title: Subsection 2
        content: |
          Subsection 2 content text.
```

###### markdowns/content.md
```yaml
Page content text.
```

###### templates/text_page.yaml.njk
```yaml
id:
  _var: id
type: PageHeaderMenu
properties:
  title:
    _var: title
blocks:
  - id: content_card
    type: Card
    blocks:
      - id: title
        type: Title
        properties:
          content:
            _var: title
      - id: content
        type: Markdown
        properties:
          content:
            _var: content
      {% if subsections %}
      {% for subsection in subsections %}
      - id: {{ subsection.id }}_title
        type: Title
        properties:
          content: {{ subsection.title }}
      - id: {{ subsection.id }}_content
        type: Markdown
        properties:
          content: {{ subsection.content }}
      {% endfor %}
      {% endif %}
```

## Custom JavaScript Functions

The `_ref` operator can also be extended with custom JavaScript functions. A `resolver` function can be specified, which can overwrite the default way configuration files are read from the filesystem. A `transformer` function can be used to transform the value returned by the `_ref` operator.

### Resolver

This resolver function will first look for the configuration file in the current working directory, but if the file is not found it will be read from an adjacent "shared" directory. This pattern can be used to build apps that mostly use a shared configuration, with a few components that are customised per app.

###### resolvers/useLocalOrSharedConfig.js
```js
const fs = require('fs');
const path = require('path');
const { promisify } = require('util');

const readFilePromise = promisify(fs.readFile);

async function useLocalOrSharedConfig(refPath, vars, context) {
  let fileContent
  try {
    fileContent =  await readFilePromise(path.resolve(refPath), 'utf8');
    return fileContent;
  } catch (error) {
    if (error.code === 'ENOENT') {
      fileContent = readFilePromise(path.resolve('../shared', refPath), 'utf8');
      return fileContent;
    }
    throw error;
  }


}

module.exports = useLocalOrSharedConfig;
```

###### lowdefy.yaml
```yaml
lowdefy: LOWDEFY_VERSION

cli:
  refResolver: resolvers/useLocalOrSharedConfig.js

pages:
  - _ref: pages/local-page.yaml
  - _ref: pages/shared-page.yaml
```

### Transformer

This transformer adds a standard footer to each page:

###### transformers/addFooter.js
```js
function addFooter(page, vars) {
  const footer = {
    // ...
  };
  page.areas.footer = footer;
  return page;
}
module.exports = addFooter;
```

###### lowdefy.yaml
```yaml
lowdefy: LOWDEFY_VERSION

pages:
  - _ref:
      path: pages/page1.yaml
      transformer: transformers/addFooter.js
```



---

## File: `concepts/page-and-app-state.yaml`

# Page and App State

**Section:** Concepts


---
**Nunjucks Template:**
```yaml
A Lowdefy app has a few different data objects which can be accessed and modified. The app wide objects are the `global`, `media` and `user` objects. Then there are page specific objects like the `state`, `urlQuery` and `input` objects.

## State

Each page in a Lowdefy app has a `state` object which serves as the general data store for that page.

Every [`input` category block](/blocks) inside the page will have a value in the `state` object, with their `id` as the key in the `state` object. If the block is not visible the input value is removed from the state object.

The [`_state`](/_state) operator can be used to read from `state` and the [`SetState`](/SetState) action can be used to modify or add new values in `state` object in the same page from which `SetState` is called.

> See [`operators`](/operators) and [`events-and-actions`](/events-and-actions) for more details.

Page states remain even as users navigate to new pages - so if a user returns to a page, the state as they left it will remain.

### Reading from state
Here is an example showing how to read `input` block values from `state`:
```yaml
id: my-page
type: PageHeaderMenu
blocks:
  - id: Name
    type: TextInput
  - id: Age
    type: NumberInput
  - id: MyDisplay
    type: Html
    properties:
      html:
        _string.concat:
          - <b>Name:</b>
          - _state: Name
          - <br/><b>Age:</b>
          - _state: Age
```

### Modifying state
The following examples demonstrates how to modify `state`:
```yaml
id: my-page
type: PageHeaderMenu
blocks:
  - id: Name
    type: TextInput
  - id: Age
    type: NumberInput
  - id: Button
    type: Button
    events:
      onClick:
        - id: set_person_object
          type: SetState
          params:
            person:
              name:
                _state: Name
              age:
                _state: Age
              example: true
```

This will result in a `state` which looks like:
```json5
{
  "Name": "Alice", // The TextInput value
  "Age": 99, //The NumberInput value
  "person": {
    "name": "Alice",
    "age": 99,
    "example": true
  }
}
```

## Global
The `global` object is a single app level data object defined in the Lowdefy [config root](/lowdefy-schema). This object is the same for every page. The `global` object can be modified using the [`SetGlobal`](/SetGlobal) action.

> Note that when `SetGlobal` is called, `global` will not be consistent between clients, like different users, or a single user with multiple tabs open.

### Reading from global
This example shows how you can create and read from `global`:

`lowdefy.yaml`
```yaml
lowdefy: {{ version }}
global:
  key: value
pages:
  - id: my-page
    type: PageSiderMenu
    blocks:
      id: DisplayGlobalKey
      type: Html
      html:
        _global: key ## Returns 'value'
```

### Modifying global
The following examples shows how to modify the `global` object:

`lowdefy.yaml`
```yaml
lowdefy: {{ version }}
global:
  key: value
pages:
  - id: my-page
    type: PageSiderMenu
    blocks:
      - id: DisplayGlobalKey
        type: Html
        html:
          _global: key ## Returns `value`
      - id: ModifyGlobal
        type: Button
        events:
          onClick:
            - id: modify_global_key
              type: SetGlobal
              params:
                key: New Value
      - id: DisplayModifiedGlobalKey
        type: Html
        html:
          _global: key ## Returns `New Value`
```
## URL query
The `urlQuery` object is used to access variables set in the URL. URL query parameters can be set using the `urlQuery` field in the [`Link`](/Link) action and read using the [`_url_query`](/_url_query) operator. It can be useful to create sharable links containing some additional information other than the page route. For example setting a document id in the url so that the document can be retrieved when the link is opened during the page [`onMount`](/events-and-actions) event.

> Note that any variables set to `urlQuery` will be visible to users of the app.

### Example using `urlQuery` and `Link`

`first-page.yaml`
```yaml
id: first-page
type: PageSiderMenu
blocks:
  - id: LinkButton
    type: Button
    events:
      - id: link_to_second_page
        type: Link
        params:
          pageId: second-page
          urlQuery:
            document-id: ABC123
```

`second-page.yaml`
```yaml
id: second-page
type: PageSiderMenu
events:
  onMount:
    - id: set_url_id
      type: SetState
      params:
        myDocId:
          _url_query: document-id ## Returns 'ABC123'
```

## Input

The `input` object is unique to a page, and works similar to the `urlQuery` object. The `input` object is used to pass information between page transitions. Variables set to the `input` object are not written to the URL, so they are not visible to app users but also cannot be used to share the data in a link since a `input` object is only consistent between one page and the next to which it links. A `input` object is set using the `input` param of the [`Link`](/Link) action or the `input` property of an [`Anchor`](/Anchor) block when linking from a page to another page in the app and can be read using the [`_input`](/_input) operator.

> Note `input` cannot be passed between pages when using the `newTab: true` param in the [`Link`](/Link) action.

### Example of setting and reading `input`

`first-page.yaml`
```yaml
id: first-page
type: PageSiderMenu
blocks:
  - id: LinkButton
    type: Button
    events:
      - id: link_to_second_page
        type: Link
        params:
          pageId: second-page
          input:
            document-id: 1234
```

`second-page.yaml`
```yaml
id: second-page
type: PageSiderMenu
events:
  onMount:
    - id: set_input_id
      type: SetState
      params:
        myDocId:
          _input: document-id ## Returns '1234'
```
## Media

The `media` object contains some information about the client screen size, and can be accessed using the [`_media`](/_media) operator. This can be used to add additional responsive logic to a page.

Here is an example showing how to read the screen size of a smartphone:
```yaml
id: DisplayScreenSize
type: Html
properties:
  html:
    _media: size ## Returns xs if used on phone width screen width < 576px
```

## User

If authentication is configured and a user is logged in, data about the user can be accessed using the [`_user`](/_user) operator. See [User Authentication](/users-introduction) for more details.

This example shows how to read a logged-in user's username and id:
```yaml
id: my-page
type: PageSiderMenu
blocks:
  - id: DisplayUserName
    type: Html
    properties:
      html:
        _string.concat:
          - <b>Name: </b>
          - _user: name
  - id: DisplayUserId
    type: Html
    properties:
      html:
        _string.concat:
          - <b>ID: </b>
          - _user: id
```

#### TLDR
  - There are app wide and page specific data objects.
  - App wide are `global`, `media` and `user`.
  - Page specific are `state`, `urlQuery` and `input`.
  - All input blocks write their value to `state`, with the their `id` as the key in the `state` object.
  - Input blocks which are not visible are removed from `state`.
  - The `SetState` action can also modify the `state` object.
```
---


---

## File: `concepts/overview.yaml`

# Overview

**Section:** Concepts

A Lowdefy app is a [Next.js](https://nextjs.org) application, that interprets / evaluates Lowdefy config. Lowdefy apps are written as YAML configuration files, which are easy to read, write and understand - and can be managed in source control. This makes Lowdefy quick to learn, maintain and pick up where others left off.

Lowdefy can be considered as another level of abstraction on top of Next.js. The Lowdefy schema is designed to be a standardized, declarative and flexible expression of application parameters and logic. This allows developers to focus on translating the business problem into configuration.

The Lowdefy schema abstracts app definitions into 5 categories:
- [**Blocks**](/blocks): The building blocks of the UI, the client-side React component to render. Blocks are usually stateless since all app state is managed by the Lowdefy engine.
- [**Operators**](/operators): The application logic is defined using operator functions, which can be used both server-side and client-side. These are synchronous methods, which are continuously evaluated every time the app state changes.
- [**Actions**](/events-and-actions): Asynchronous client-side methods triggered by events, such as clicking a button or initializing the page state. These methods usually apply an action like setting state, using the ([SetState](/SetState)) action, or calling a request, using the [Request]/Request action.
- [**Connections and Requests**](connections-and-requests): Server-side methods, which allow a Lowdefy app to make server requests to other services like APIs or databases. Requests are evoked by the [Request]/(/Request) action, and are only called after all user authentication and authorization checks have passed. Requests consume a payload from the client, and have access to server-side secrets like passwords and API keys.
- [**Auth Providers and Adapters**](/authentication): Lowdefy implements [NextAuth.js](https://next-auth.js.org) for authentication. NextAuth allows for the configuration of a wide range of authentication providers and adapters, which can be configured in Lowdefy apps.

The diagram below provides an overview of the Lowdefy app schematic:
![Lowdefy App Diagram](/images/lowdefy_app_schema.png)

Lowdefy offers a large number of default actions, blocks, operators, connections, and auth integrations - but also provides a [plugin interface](/plugins) for the extension of new types. All plugins are installed as [npm](https://www.npmjs.com/) modules, which means you can extend your Lowdefy application by any existing npm module - enabling developers to make use of anything that is available in the Javascript ecosystem.

Since Lowdefy apps are self-hosted Next.js applications, they do not ship with a built in data store and typically connect to one or more APIs or databases. Server instances are also stateless, which simplifies deployment. We recommend using [Vercel](https://vercel.com) since it is the hosting platform provided by the team behind Next.js. Alternatively, you can deploy your app using Docker or use another hosting provider that supports hosting Next.js applications.



---

## File: `concepts/operators.yaml`

# Operators

**Section:** Concepts

Operators are functions, that can be used to express logic. They are the reason why Lowdefy apps are not completely static, but can react to data and inputs. Operators can be used in `blocks`, `actions`, `requests`, and `connections`. See the specific documentation for more details.

Each operators expects arguments with a specific structure. They can be the result of other operators, since operators are evaluated beginning with the most nested operators.

If an operator errors while evaluating, it returns a `null` value, and logs the error to the console.

## Client or server operators

Some operators are only available on either the client or the server. For example, the [`_menu`](/_menu) operator is only useful on the client and is thus not included in server requests. Likewise, the [`_secret`](/_secret) operator is only available on the server for security reasons.

If a operator has special environment considerations, it is indicated on the individual operator documentation page. If no indication is made, the operator can be used under both environments.

##### Client only operators:
- [_actions](/_actions)
- [_media](/_media)
- [_menu](/_menu)
- [_request](/_request)

##### Server only operators:
- [_diff](/_diff)
- [_secret](/_secret)
- [_uuid](/_uuid)

Operators that are client side only cannot be used in `Requests` and `Connections`, and operators which are server side only cannot be used in `Blocks` and `Actions`.

## Build time operators

Besides the client and server environment, app build time is considered a third environment where special operator logic applies.

The `_ref` and `_var` operators do not work like other operators. They are evaluated while an app is being built, and can thus be used anywhere in the app configuration. They are used to split an app into multiple files, and to reuse configuration. See [`_ref`](/_ref) for more details.

Some operators can be evaluated at build time by using the [`_build`](/_build) operator. This is useful for once-off calculations when an app is built, for example looping over a list in a reference JSON file to calculate a value at build time instead of using normal operators which re-evaluate whenever the app state changes. It can also be used to read an environment variable.



---

## File: `concepts/menus.yaml`

# Menus

**Section:** Concepts

Menu objects describe links to pages, within the app or external. Menu lists are filtered to only show pages that the user is authorized to see as a result of public, private or role based access controlled (RBAC) configuration. Blocks such as `PageSiderMenu` render menu links. If no menu defined, a default menu is created, containing links to all pages defined in the app.

By default blocks using a menu, like `PageSiderMenu`, will use the menu with `id: default`. This means that if you create a menu object with `id: default`, this will be used unless another menu is configured and referenced under the block properties, allowing for page specific menu configurations.

More than one menu can be configured in an app. As an example, this can be used when two logically different sections in the app need different menus.

The menu objects can be referenced by using the [`_menu`](/_menu) operator.

The schema for a menu object is:

- `id: string`: __Required__ - A identifier for the menu. If it is `default`, it will be used as default by blocks, like `PageHeaderMenu`, which display a menu.
- `links: object[]`: An array of `MenuLink` or `MenuGroup` objects that form the links in the menu. `MenuGroups` can be two levels deep.

The schema for a `MenuLink` is:
- `id: string`: __Required__ - A identifier for the link unique to the menu.
- `type: string`: __Required__ - The type should be `MenuLink`.
- `pageId: string`: The id of the page to link to. Used as the menu item title if no title is provided.
- `url: string`: An external url to link to.
-  `properties: object`: The properties of the menu link. These are:
    - `title: string`: The title to display for the link.
    - `icon: string | object`: The name of a [React Icon](https://react-icons.github.io/react-icons/search) or properties of an Icon block to use as the icon for the link.

The schema for a `MenuGroup` is:
- `id: string`: __Required__ - A identifier for the group unique to the menu.
- `type: string`: __Required__ - The type should be `MenuGroup`.
-  `properties: object`: The properties of the menu group. These are:
    - `title: string`: The title to display for the group.
    - `icon: string | object`: The name of a [React Icon](https://react-icons.github.io/react-icons/search) or properties of an Icon block to use as the icon for the group.
- `links: object[]`: An array of `MenuLink` or `MenuGroup` objects that should be grouped together in the group.

###### Menus example:
```yaml
lowdefy: LOWDEFY_VERSION
menus:
  - id: default
    links:
      - id: page1
        type: MenuLink
        pageId: page1
        properties:
          title: Page 1
          icon: AiOutlineFile
      - id: top-group
        properties:
          title: Group
          icon: AiOutlineGroup
        links:
          - id: page2
            type: MenuLink
            pageId: page2 # pageId will be used as link title
          - id: external
            type: MenuLink
            url: https://external.com
            properties:
              title: External site
          - id: nested-group
            type: MenuGroup
            properties:
              title: Nested Group
            links:
              - id: page3
                type: MenuLink
                pageId: page3
                properties:
                  title: Page 3
  - id: page-1-and-3
    links:
      - id: page1
        type: MenuLink
        pageId: page1
        properties:
          title: Page 1
          icon: AiOutlineFile
      - id: page3
        type: MenuLink
        pageId: page3
        properties:
          title: Page 3
          icon: AiOutlineControl
```

We can make use of [protected pages](/protected-pages) and [roles](/roles) to filter the menu items according to the pages that the user has access to.

###### lowdefy.yaml
```yaml
lowdefy: LOWDEFY_VERSION

auth:
  # ...
  pages:
    protected: true
    public:
      - login
      - '404'
    roles:
      admin:
        - page2
        - page3
      user:
        - page1

menus:
  - id: default
    links:
      - id: page1
        type: MenuLink
        pageId: page1
        properties:
          title: Page 1
          icon: AiOutlineFile
      - id: page2
        type: MenuLink
        pageId: page2 # pageId will be used as link title
      - id: page3
        type: MenuLink
        pageId: page3
        properties:
          title: Page 3
  ```

  In the example above, public users can only view the `login` and `404` pages, all other pages require the user to be logged in. If the authorized user had been given only the `user` role, they will only be able to see `page1`. In order to see `page2` and `page3`, the authorized user will need to have the `admin` role assigned to them. The menu will be filtered accordingly and will only contain the menu items that the user has access to.



---

## File: `concepts/lowdefy-schema.yaml`

# Lowdefy App Schema

**Section:** Concepts

A Lowdefy app is written as YAML or JSON files, which are combined together using the [`_ref`](/_ref) operator when the app is built into a configuration object that describes the app. This object has different sections that describe different parts of the Lowdefy app.


The root schema for a Lowdefy app is:
- `lowdefy: string`: __Required__ - The Lowdefy version number that the app uses. This is required and cannot be a reference to another file.
- `name: string`: A name for the application.
- `version: string`: The version number of the app that you are building. This is optional and allows you indicate the version of your app.
- `license: string`: A [SPDX license ID](https://spdx.org/licenses/). You can use this to indicate the project's license if you are licensing your project under a specific software license. If you wish to indicate to others that you do not grant the right to use your project, you can use `UNLICENSED` for this field. How you share your Lowdefy config is up to you.
- `cli: object`: An object with configuration for the CLI.
- `config: object`: An object with app configuration like the home page pageId.
- `auth: object` An object with authentication and authorization configuration.
- `global: object`: A data object that can be accessed anywhere in the app using the [`_global`](/_global) operator.
- `connections: object[]`: An array of [`connection`](/connections-and-requests) objects.
- `plugins: object[]`: An array of `plugin` objects to customize and add block types.
- `menus: object[]`: An array of menu objects.
- `pages: object[]`: An array of page objects.

Pages are made up of blocks. Blocks have the following basic schema:
- `id: string`: An identifier for a block.
- `type: string`: __Required__ - This is the block type identifier and defines which block will render.
- `properties: object`: The settings passed to a block component.
- `layout`: Control how the block will be rendered in the page flow, or in other words, how the block is placed in relation to other blocks. See [layout](/layout-overview) for more details.
- `blocks: array`: An array of blocks to render within this block.

Find the more detailed block schema [here](/blocks).


## Config

The config object has the following properties:

- `basePath: string`: Set the base path to serve the Lowdefy application from. This will route all pages under `https://example.com/<base-path>/<page-id>` instead of the default `https://example.com/<page-id>`. The basePath value must start with "/".
- `homePageId: string`: The id of the page that will load when a visitor navigates to the home route, in other words, when the visitor navigates to `yourdomain.com` or `yourdomain.com/`.

## Auth

The auth object is used to configure user authentication, and has the following properties:

- `adapter: object`: Configure a database adapter.
- `authPages: object`: Configure pages like the sign in page used by authentication flows.
- `callbacks: object[]`: Configure callback functions.
- `debug: boolean`: Can be set to false to disable auth debugging if the log level is set to debug.
- `events: object[]`: Configure event functions.
- `pages: object`: Configure which pages should be protected.
- `providers: object[]`: Configure authentication providers.
- `session: object`: Configure session.
- `theme: object`: Configure theme for default authentication pages.
- `userFields: object`: Map data from the provider to the user object.
- `advanced: object`: Set advanced authentication options.

See more about how user authentication and authorization [here](/users-introduction).

## Global

In a Lowdefy app, you can define global variables in the __global__ object, which can be accessed using the [`_global`](/_global) operator, and modified using the [`SetGlobal`](/SetGlobal) action. This is a good place to store data or configuration that is used over various pages throughout the app, for example, user preferences that can be modified using `SetGlobal` on one page and easily referenced on all others.

## Connections

In a Lowdefy app you can integrate with other services like API's or databases using `connections` and `requests`. Use connections to configure the settings to a service, for example, settings such as urls or [`secrets`](/secrets) like passwords or API keys. Requests use connections to interact with external services, for example, inserting a data record or executing a query on a database, or simply calling an API end-point.

See more about how `connections` and `requests` are used together [here](/connections-and-requests).

## Plugins

The plugins section is used to configure which plugin packages should be used in the app. It contains an array of plugin definitions, which have the following properties:

- `name: string`: The name of the package. If published to npm, this is the name under which the package is published on npm.
- `version: string`: An npm or pnpm version specifier of the package to use.
- `typePrefix: string`: A prefix to append to all types exported by the package to prevent type name clashes.

## Menus

Menu objects describe links to pages, within the app or external. Menu lists are filtered to only show pages that the user is authorized to see as a result of public, private or [role based access controlled (RBAC)](/roles) pages. Blocks such as `PageSiderMenu` render menu links. If no menu defined, a default menu is created, containing links to all pages defined in the app.

See more about how menu objects are used and defined [here](/menus).

## Pages

Pages in a Lowdefy app are actually just blocks, the building blocks of a Lowdefy app, with a few extra restrictions and features.

Each page should have an `id` that is unique among all pages in the app. Each page is served with the `pageId` as the url route. That is, if a page is created with id `page1`, it will be served at `domain.com/page1`.

If `properties.title` is set on a page block, the title will be set as the page title (This is the title displayed on the tabs in your browser).


In order to keep files neat and generally easier to read and understand, we suggest making use of references and templating.

## References and templates

References and templates have the following use cases:

- Splitting out the config for readability and code navigation.
- Splitting out a piece of config in order to use the exact same config in multiple places.
- Using a reference with variables to make use of a shared piece of config with dynamic variables.
- Using a `.njk` file to create config files using the Nunjucks templating language.
- Using resolver and transformer functions to create Lowdefy config using Javascript functions.

References can be used anywhere in the configuration, as long as the configuration resolves to comply with the Lowdefy app schema. Templating can be taken further by referencing [Nunjucks](https://mozilla.github.io/nunjucks/) template files by simply adding .njk to the file extensions, for example, .yaml.njk. Nunjucks templates hydrate variables at build time, before the yaml is parsed, enabling Nunjucks features like for-loops and if-statements.

See more about references and templates [here](/references-and-templates).

## Lowdefy versions and version updates

Lowdefy is versioned using semantic versioning, with a three part version number, with the form `major.minor.patch`. Lowdefy is under active development and is widely used in enterprise projects. New features and fixes are published on a regular basis, see our [changelog](https://github.com/lowdefy/lowdefy/blob/main/CHANGELOG.md) for the latest release notes.

[TODO]: <> (# TODO: Add roadmap, for whats to expect next.)

To update the version of your app, change the `lowdefy` version field in the `lowdefy.yaml` file, and redeploy the app. You might also need to make some changes to your app configuration to be compatible with the new version.

Patch updates only contain fixes, and you should be safe to update to a patched version without any changes to your app. Since we are actively developing new features, most releases will be minor version updates, and patches won't be made to older versions.

Minor version changes include new features. At this stage, since the project is still in early development, they might also have minor breaking changes to individual blocks, actions, operators or connections. Please check the [changelog](https://github.com/lowdefy/lowdefy/blob/main/CHANGELOG.md) to see if any configuration changes are needed before updating.

Major version updates may include major breaking changes or architecture changes. You might need to make more changes to your configuration to be compatible with the new version. We don't intend to release major versions regularly, and try to minimize breaking changes.



---

## File: `concepts/lists.yaml`

# Lists

**Section:** Concepts

List category blocks render multiple [`content areas`](/layout), based on data in the [`state`](/page-and-app-state) object.

Since the content area might contain input blocks, the block has an array value in state, with it's `block id` as key. For each item in the array, an content area (or set of content areas is rendered). Multiple list blocks can be nested.

### List indices and block ids

If a block is to be rendered in an list's content area, the block id should contain a list index placeholder (specified with the `$` symbol) for each list it is a part of. These placeholders will be populated with the blocks `list indices`. The `list indices` are a array of integers, indicating at which position in the list the block is, for each level of list blocks (zero indexed). The block id should be in valid dot-notation once the placeholders have been substituted.

This can be made more clear with a example. Suppose we have a list block with id `contacts`. Inside this list we have a text input block for the contact name. We would like our state to look like:
```yaml
contacts:
  - name: Name 1
  - name: Name 2
```

The id for the text input block should be `contacts.$.name`. Each text input block will be given an indexed id based on it's position in the contacts list (`contacts.0.name`, `contacts.1.name`, etc.).

Suppose we also want to add a emails array for each contact. To do this, we can add another list block in the `contacts` array, and add a text input inside the emails array. If we want the emails to be a array of strings, i.e. our `state` should look like:

```yaml
contacts:
  - name: Name 1
    emails:
      - email1@example.com
      - email2@example.com
  - name: Name 2
    emails: []
```

our config should look like:
```yaml
id: contacts
type: ControlledList
properties:
  # ...
blocks:
  - id: contacts.$.name
    type: TextInput
    properties:
      # ...
  - id: contacts.$.emails
    type: ControlledList
    properties:
      # ...
    blocks:
      - id: contacts.$.emails.$
        type: TextInput
        properties:
          # ...
```

Note that the id of the emails list block is `contacts.$.emails` and that it has one `$` placeholder since it is inside the `contacts` list, and the id of the email text input is `contacts.$.emails.$`, which has two `$` placeholders since it is in both the `contacts` and `contacts.$.emails` lists.

The ids of the `contacts.$.emails.$` text input blocks will look like `contacts.0.emails.3` or `contacts.2.emails.1`, and this will result in the `state` where the emails on a contact are an array of strings.

### List indices in operators

List indices are also supported in "getter" operators like `_state`. If the operator is given a key that contains `$` placeholders, and the operator is called from a block with list indices, the placeholders will be populated with the blocks list indices. These indices are populated on `actions` called by the block, and are even populated in `connections` and `requests` if the block that triggered the `Request` action has list indices. This can be used to get values from the `state` array the block is a part of, or even values from another array at the same index.

### List block methods

List blocks can provide methods to change their values. These are

#### `pushItem`
Add an item at the end of the list.

#### `unshiftItem`
Add an item at the start of the list.

#### `removeItem`
Remove an item at the specified index.

#### `moveItemDown`
Move the item at the specified index one position to the start of the list. If the item is at the start if the list, the item remains at position `0`.

#### `moveItemUp`
Move the item at the specified index one position to the end of the list. If the item is at the end if the list, the item remains at it's position.

#### Example
```yaml
id: page
type: PageHeaderMenu
blocks:
  - id: add_item_at_start
    type: Button
    events:
      onClick:
        - id: add_item_at_start
          type: CallMethod
          params:
            blockId: list
            method: unshiftItem
  - id: add_item_at_end
    type: Button
    events:
      onClick:
        - id: add_item_at_end
          type: CallMethod
          params:
            blockId: list
            method: pushItem
  - id: list
    type: List
    blocks:
      - id: list.$.move_item_down
        type: Button
        events:
          onClick:
            - id: move_item_down
              type: CallMethod
              params:
                blockId: list
                method: moveItemDown
                args:
                  - _index: 0 # Get the first index in the indices array
      - id: list.$.move_item_up
        type: Button
        events:
          onClick:
            - id: move_item_up
              type: CallMethod
              params:
                blockId: list
                method: moveItemUp
                args:
                  - _index: 0
      - id: list.$.remove_item
        type: Button
        events:
          onClick:
            - id: remove_item
              type: CallMethod
              params:
                blockId: list
                method: removeItem
                args:
                  - _index: 0
```

### Lists and state

List blocks create a content area for each item in `state`. If `state` is updated, the list block will also update, creating or destroying content areas as necessary. Thus list blocks can also be manipulated by setting `state` directly using the [`SetState`](/SetState) operator.



---

## File: `concepts/licenses.yaml`

# Licenses

**Section:** Concepts

Lowdefy software is distributed under three different software licenses.

- The Apache License Version 2.0 Open Source license
- The Lowdefy Commercial License
- The Business Source License Version 1.1

## Open Source License

An Open Source version of Lowdefy is available, licensed under the [Apache License Version 2.0](https://github.com/lowdefy/lowdefy/blob/main/licenses/Apache-2.0.txt). Lowdefy Commercial features are not available under the Apache License.

The Open Source licensed version can be used by setting the community edition flag when running the CLI. To build a Open Source production server:

```
pnpx lowdefy@4 build --community-edition
```

## Lowdefy Commercial License

To use Lowdefy commercial features in production, a [Lowdefy Commercial License](https://lowdefy.com/terms) is needed. Some features are available for free, while others require a paid plan, as presented on the [pricing page](https://lowdefy.com/pricing).

#### Obtaining a License Key

A Free or Business tier licence can be obtained by signing up for an account at [https://cloud.lowdefy.com](https://cloud.lowdefy.com).

For Enterprise licenses, contact <a href='mailto:sales@lowdefy.com'>sales@lowdefy.com</a>.

Keep your license keys secret, as app usage with these keys will be billed to your account.

#### Setting a License

To set a license key, set the `LOWDEFY_LICENSE_KEY` environment variable. When developing locally, a `.env` file can be used.

Most hosting providers have a way to set environment variables. Documentation for some hosting providers are listed below:

- [Vercel](https://vercel.com/docs/projects/environment-variables)
- [Fly.io](https://fly.io/docs/reference/runtime-environment/)

## Business Source License

“Business Source License” is a trademark of MariaDB Corporation Ab.

Lowdefy commercial features are also available under the [Business Source License version 1.1](https://github.com/lowdefy/lowdefy/blob/main/licenses/BUSL-1.1.txt). This license allows you to make **non-production use** of the Lowdefy commercial features. Lowdefy code release under this license convert to the Apache 2.0 license at the specified change date, or four years after its release. To use Lowdefy under the terms of the Business Source License, do not set the `LOWDEFY_LICENSE_KEY` environment variable.

## Third Party Licenses

Lowdefy, or third party Lowdefy plugins, may use, or provide you access to third party software which may be subject to the terms of a third party open source license or other terms and conditions governing their use.



---

## File: `concepts/layout-overview.yaml`

# Layout

**Section:** Concepts

Containers blocks are used to arrange blocks on a page. Blocks of category `container` and `list` all function as container blocks. Container blocks have content areas into which a list of blocks are rendered. `List` category blocks can render container areas for each element in the data array.

Blocks on a page can be arranged using a __span__ or __flex__ layout. Blocks in __span__ layout are placed in a 24 column grid system, whereas __flex__ blocks dynamically grows or shrink to fit content into a row depending on content size and screen size.

Under the hood, Lowdefy layouts are based on the [Ant Design Grid System](https://ant.design/components/grid/). The content areas are implemented as a row, and blocks are implemented as a column.

# Content areas

Each container has content areas - these are areas where nested blocks can be placed. All container blocks have a primary content area. This area is called `content`. Container blocks might have other content areas, like `header`, `footer`, or `title`. These content areas are implemented specifically by the block.

To place blocks in the primary content area of a container, the block definitions for those blocks can be placed inside the `blocks` array of the container block.

> In the following examples, blocks of type `Container` will represent a generic container block, and blocks of type `Block` will represent a generic block. The `Container` block might be a [`Box`](/Box), a [`Card`](/Card), a [`PageHeaderMenu`](/PageHeaderMenu) or any other container block. The `Block` blocks could be any type of block, including other container blocks.


###### Two blocks in the primary content area (`content`) of a container:
```yaml
- id: container
  type: Container
  blocks:
    - id: block1
      type: Block
    - id: block2
      type: Block


To place blocks in other content areas, the block definitions can be placed in the `blocks` array of the specific area in the `areas` object:

> Note the blocks are placed under `areas.[areaName].blocks`


###### Blocks in the `header`, `content` and `footer` areas:
```yaml
- id: container
  type: Container
  areas:
    header:
      blocks:
        - id: block1
          type: Block
    content:
      blocks:
        - id: block2
          type: Block
    footer:
      blocks:
        - id: block3
          type: Block


Placing blocks both in the `blocks` array, as well as under the `areas.content.blocks` array is an anti-pattern, and in this case the blocks under `blocks` will overwrite those under `areas.content.blocks`.

###### Anti-pattern: Blocks in the `blocks` and `areas.content.blocks`:
```yaml
- id: container
  type: Container
  blocks:
    - id: block1
      type: Block
  areas:
    content:
      blocks:
        - id: block2
          type: Block


# Layouts using span

Each content area has 24 columns. Blocks have a `span` property, which determines how many columns the block occupies. Blocks are laid out horizontally, until the sum of the spans is more than 24, then the last block block is wrapped to the next row.

By default a block is given a span of 24. This is what makes blocks lay out vertically below each other.

> Blocks are also given a default span of 24 for mobile layouts, even if another span is given, to provide a good default mobile experience. Read more about responsive layouts below.

###### Block spans example:
```
- id: container
  type: Container
  blocks:
    - id: block1
      type: Block # Default span of 24
    - id: block2
      type: Block
      layout:
        span: 16 # Two thirds of the area
    - id: block3
      type: Block
      layout:
        span: 8 # Remaining one third of the area
    - id: block4
      type: Block
      layout:
        span: 12
    - id: block5
      type: Block
      layout:
        span: 18 # Sum would be over 24, so wraps to the next row
```


# Layouts using flex

Blocks can also be laid out using [CSS flexbox](https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Flexible_Box_Layout/Basic_Concepts_of_Flexbox) properties. These properties are `grow` (`flex-grow`), `shrink` (`flex-shrink`), `size` (`flex-basis`) and `flex` (`flex`). If any of these properties are set, the default span of 24 or any span set in the configuration is not applied. If one of `grow`, `shrink`, or `size` are set, the other properties take their default values. The `flex` property overwrites the `grow`, `shrink`, and `size` properties.


# Block layout properties

The `layout` object on blocks can be used to control how a block is placed in the layout. The `layout` properties that can be defined are:

- `align`: _Enum_ - Align block vertically in the area. Options are `top`, `middle`, and `bottom`. Default `top.`
- `flex`: _String_ - Set the [`flex`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex) CSS property. This overwrites the `grow`, `shrink`, and `size` properties.
- `grow`: _Number_ - Set the [`flex-grow`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-grow) CSS property. Default 0.
- `order`: _Number_ - Change the order blocks are rendered in. By default blocks are rendered in the order they appear in the blocks array.
- `offset`: _Number_ - Number of grid cells to shift the block to the right.
- `pull`: _Number_ - Shift the block this number of cells to the left. This will make it overlap above with previous blocks.
- `push`: _Number_ - Shift the block this number of cells to the right. This will make it overlap under with the following blocks.
- `shrink`: _Number_ - Set the [`flex-shrink`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-shrink) CSS property. Default 1.
- `size`: _String_ | _Number_ - Set the [`flex-basis`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-basis) CSS property. Default `auto`.
- `span`: _Number_ - Number of grid cells the block should occupy.

### Responsive layouts


All the settings defined in the Block `layout` and `style` properties can be defined for the various responsive breakpoints. Breakpoints apply to all window width sizes smaller than the breakpoint width, where the smallest breakpoint setting takes precedence.

The responsive breakpoints are:

  - `xs`: window width less than 576px
  - `sm`: window width greater than 576px
  - `md`: window width greater than 768px
  - `lg`: window width greater than 992px
  - `xl`: window width greater than 1200px
  - `xxl`: window width greater than  1600px

The responsive layout settings are applied to the `layout` object. For example making a block half container width and full container width for devices like tablets or smaller:
```yaml
id: responsive_block
type: Box
layout:
  span: 12
  md:
    span: 24
```

The same can be done for the `style` object, for example, making reducing padding on xs and sm devices:
```yaml
id: responsive_block
type: Box
style:
  padding: 64
  sm:
    padding: 32
```

The responsive breakpoint settings applies to all properties in `layout` and `style` objects on blocks.

### Block layout properties usage examples:


# Area layout properties

Properties can be set on each area to control how blocks are layed out inside that area. These properties are set under the `areaName` key:

The properties that can be set are:
  - `align`: _Enum_ - Align blocks vertically in the area. Options are `top`, `middle`, and `bottom`. Default `top.`
  - `direction`: _Enum_ - Set the [`flex-direction`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-direction) CSS property for the area. Options are `row`, `row-reverse`, `column`, and and `column-reverse`. Default `row`.
  - `gutter`: _Number_ | _Array_  - Create gutter (space) between blocks placed in the area. If an array, the first element is the horizontal gutter, and the second is the vertical gutter.
  - `justify`: _Enum_ - Justify blocks horizontally inside the area. Options are `start`, `end`, `center`, `space-around`, and `space-between`. Default `start`.
  - `overflow`: _Enum_ - Set the [`overflow`](https://developer.mozilla.org/en-US/docs/Web/CSS/overflow) CSS property for the area. Options are `visible`, `hidden`, `scroll`, and `space-between`. Default `visible`.
  - `wrap`: _Enum_ - Set the [`flex-wrap`](https://developer.mozilla.org/en-US/docs/Web/CSS/flex-wrap) CSS property for the area. Options are `wrap`, `nowrap`, and `wrap-reverse`. Default `wrap`.

### Area layout properties examples:



---

## File: `concepts/hosting-files.yaml`

# Hosting Files

**Section:** Concepts

A Lowdefy app provides a convenient method to host __public__ files under the `/*` app route. Add content to be hosted publicly by creating a folder named `public` in the root of a Lowdefy project folder, next to the `lowdefy.yaml` file. Place the public content in this folder to host this content with your app.

All content in this folder will be publicly accessible at `{{ APP_URL }}/{{ FILE_PATH_NAME }}`. For example, the logo at the top of this page is hosted at [`https://docs.lowdefy.com/logo-light-theme.png`](http://docs.lowdefy.com/logo-light-theme.png). Sub-folders inside the public folder are supported.

By default, the `public` folder of a Lowdefy app will serve some files which most apps need:
- `apple-touch-icon.png`: A 180x180px png image file to be used as the apple PWA icon.
- `icon-32.png`: A 32x32px png image file to be used as fallback favicon for some browsers.
- `icon-512.png`: A 512x512px png image icon.
- `icon.svg`: A svg image file which will be used as favicon if supported by browser.
- `logo-dark-theme.png`: A ~250x72px png image used as the header image for [`PageHeaderMenu`](/PageHeaderMenu) and [`PageSiderMenu`](/PageSiderMenu) blocks on desktop when the block theme is set to `dark`.
- `logo-light-theme.png`: A ~250x72px png image used as the header image for `PageHeaderMenu` and `PageSiderMenu` blocks on desktop when the block theme is set to `light`.
- `logo-square-dark-theme.png`: A ~125x125px png image used as the header image for `PageHeaderMenu` and `PageSiderMenu` blocks on mobile when the block theme is set to `dark`.
- `logo-square-light-theme.png`: A ~125x125px png image used as the header image for `PageHeaderMenu` and `PageSiderMenu` blocks on mobile when the block theme is set to `light`.
- `manifest.webmanifest`: The app [web manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest).

Any of these files can be overwritten by replacing the file with a modified version. For example, to replace the logo inside the header of `PageSiderMenu` on all pages, add a ~250x72px logo inside the project folder at `/logo-light-theme.png`.



---

## File: `concepts/events-and-actions.yaml`

# Events and Actions

**Section:** Concepts

Blocks can define _events_ which the block can trigger when something happens on the page, like a button being clicked, an input's value being modified or a page being loaded. Some examples are `onClick` on a [`Button`](/Button) or `onMount` on a [`PageHeaderMenu`](/PageHeaderMenu) block.

All blocks implement `onMount` and `onMountAsync` events. These are useful for triggering actions when a block is mounted. For the `onMount` event, the block only mounts when the event action chain is completed, however, for the `onMountAsync` event, the block will mount as soon as possible while the event actions completes execution.

_Actions_ are tasks that can be executed, like calling a request, linking to a new page or changing a value in state. An array of actions can be defined for an event on a block. If that event gets triggered, those actions will execute sequentially.

The chain of actions will stop executing if the action raises a break condition, or if the action throws an unexpected error.

If a break condition was raised, the user will be shown an error message and no further actions will execute. If an unexpected error is thrown, the app will show an error screen and the error will be logged. To handle errors and break conditions, a `catch` action chain can be defined on the event to handle the error, as described below.

Actions which are `async: true` are an exception to the sequential rule of the actions chain. These actions will be executed asynchronously and the next actions in the chain will not wait for them to finish. If any `async: true` action throws an error, the chain will not be stopped and the event will still be completed successfully.

Each action has an `id`, unique to that action chain, and a `type` field which are required.

Actions can have a `params` field for specifying input parameters when executing the action. Operators used in action `params` will be evaluated right before the action is executed. Some events might have data relating to that event, such as what the new value of an input is, or the row that was clicked in a table. The `event` object can be used in the action using the [`_event`](/_event) operator. Some actions also return values which can be passed to succeeding actions in the same action chain using the [`_actions`](/_actions) operator.

Actions can also have a `skip` field. Operators in the `skip` field will be evaluated before an action is executed, and if the evaluated result is `true`, that action is skipped and the next action is executed.

## Action Schema

The schema for a Lowdefy action is:

- `id: string`: __Required__ - An identifier for the action. It must be unique within the action chain it is defined in.
- `type: string`: __Required__ - The action type to be used. It must be a valid action type.
- `skip: boolean`: The test that determines whether the action will be skipped or not. This is usually written as operators which evaluates to a `true` or `false`. __Operators are evaluated__.
- `async: boolean`: This determines whether the action will be evaluated asynchronously. Operators are __not__ evaluated on `async`.
- `messages: object`:  __Operators are evaluated__.
  -  `error: boolean | string`: If `boolean`, whether an error message should be displayed if the action throws an error. Error messages are shown by default. If a `string`, the error message to show to the user.
  -  `loading: boolean | string`: If `boolean`, whether a loading message should be displayed while the action is executing. Loading messages are not shown by default. If a `string`, the loading message to show to the user.
  -  `success: boolean | string`: If `boolean`, whether a success message should be displayed if the action completes successfully. Success messages are not shown by default. If a `string`, the success message to show to the user.
- `params: object`: The input passed to the action. __Operators are evaluated__.

###### Events and actions definition example:
```yaml
- id: block_with_actions
  type: Block
  properties:
    # ...
  events:
    onEvent1:
      - id: action1
        type: ActionType1
        skip:
          # Operator expression that returns true if action should be skipped.
        params:
          # ...
      - id: action2
        type: ActionType2
    onEvent2:
      - id: action3
        type: ActionType3
        params:
          # ...
```
## The actions object

When events are triggered, each completed action writes its response to the actions object under the action id object key. Thus all following actions in a event action list have access to the responses of all preceding actions in the same event list through the [`_actions`](/_actions) operator.

## The event object

When events are triggered, they can provide a data object describing the event (e.g. a description of the clicked item or uploaded file). This data object can be accessed using the [`_event`](/_event) operator in an action definition.

The schema for passing actions to Lowdefy events is:
```
  (eventName: action[])
  (eventName: {
    debounce?: {
      ms?: number,
      immediate?: boolean,
    },
    try: action[],
    catch?: action[],
  })
```

## Catching action errors

If one action in the chain of event actions fails by throwing an error, the actions in the list following the failed action will not be executed. To handle any errors thrown by an action, Lowdefy event actions can be provided as lists of `try` and `catch` actions.

###### Event try catch actions example for dealing with action errors:
```yaml
- id: block_with_actions
  type: Block
  properties:
    # ...
  events:
    onEvent1:
      try:
        - id: action1
          type: ActionType1
          params:
            # ...
        - id: action2
          type: ActionType2
      catch:
        - id: unsuccessful
          type: ActionType1
          params:
            # ...
```

## Debouncing events

Event debouncing can be turned on by setting the `debounce` field on event objects. If `debounce.immediate` is `true`, leading edge debouncing or throttling will apply, else it will be debounced as trailing edge.

To control the debounce delay, set `debounce.ms` to the number of milliseconds to delay. The default delay is 300 milliseconds. If an event is triggered within that time, the event will not be triggered again. See [debounce vs throttling](https://redd.one/blog/debounce-vs-throttle) for a more detailed explanation.

###### Event trailing edge debouncing example:
```yaml
- id: block_with_actions
  type: Block
  properties:
    # ...
  events:
    onEvent1:
      debounce:
        ms: 1000
      try:
        - id: action1
          type: ActionType1
          params:
            # ...
        - id: action2
          type: ActionType2
```

###### Event throttling or leading edge debouncing example:
```yaml
- id: block_with_actions
  type: Block
  properties:
    # ...
  events:
    onEvent1:
      debounce:
        ms: 1000
        immediate: true
      try:
        - id: action1
          type: ActionType1
          params:
            # ...
        - id: action2
          type: ActionType2
```

## Page initialization events

The first blocks on a page, usually a [`container`](/container) type block, can define `onInit` and `onInitAsync` events. All blocks have `onMount` and `onMountAsync` events, that can be used to initialize the page or blocks.

The `onInit` event is triggered the first time a page is loaded. This event blocks page render, in other words, the page __will__ remain in a loading state, rendering only the progress bar, until all the actions have completed execution. It can be used to set up [`state`](/page-and-app-state). Actions that take a long time to execute, like `Request`, should be used sparingly here for a better user experience.

The `onInitAsync` event is triggered the first time a page loaded, but does not block page render. In other words, the page __will not__ remain in a loading state until all the actions have completed execution. This is a good place to execute non-blocking tasks or requests that might take longer to execute.

The `onMount` event is triggered every time a block is rendered on a page. This event can be used on any block, and causes the block and it's children to render in their loading state. It typically executes actions that should be run each time a block is loaded, like checking if an id is present in the [url query parameters](/_url_query), or fetching data for [`Selector`](/Selector) options using a [`Request`](/Request) action.

The `onMountAsync` event is triggered every time a block is mounted, but does not render the block in loading.

## Action types

The following actions can be used:

- [`CallMethod`](/CallMethod) - Call a method defined by another block.
- [`Link`](/Link) - Link to another page.
- [`Message`](/Message) - Show a message to the user.
- [`Notification`](/Notification) - Show a notification to the user.
- [`Request`](/Request) - Call a request.
- [`Reset`](/Reset) - Reset the page validation and `state`.
- [`ScrollTo`](/ScrollTo) - Scroll to a point on the page.
- [`SetGlobal`](/SetGlobal) - Set a value to the `global` variable object.
- [`SetState`](/SetState) - Set a value to the page `state`.
- [`Validate`](/Validate) - Validate the inputs on the page.

See additional action type available under the Actions tab in the menu.

## TLDR
- Events are triggered when something happens on a page, like clicking a button or loading a page.
- A list of actions are executed sequentially by a triggered event.
- If an action errors, the actions that follow are skipped.
- Actions that are `async: true` will not be executed sequentially nor stop the event if they error.
- Action errors can be handled by providing a list of `try` and `catch` actions to the event.
- Operators used in action `params` are evaluated right before the action is executed.
- The [`_actions`](/_actions) operator is available for sequential actions to use the values returned from preceding actions in the chain.
- Actions have a `skip` field that can be used to skip action execution.
- The `onInit` event is triggered the first time a page is mounted and keeps the page in loading until all actions have finished.
- The `onInitAsync` event is triggered the first time a page is mounted and does not keep the page in loading.
- The `onMount` events is triggered the every time a block is mounted and keeps the block in loading until all actions have finished.
- The `onMountAsync` event is triggered the every time a block is mounted, after `onMount` has completed, and does not keep the block in loading.



---

## File: `concepts/custom-styling.yaml`

# Custom Styling

**Section:** Concepts

In order to add custom styling to a Lowdefy app, a [`less`](https://lesscss.org/) file named `styles.less` can be added in the [public folder](/hosting-files).
This file allows the default styling in Lowdefy to be overwritten, but also allows for extra custom styling.

Any valid css or less styles can we added within the `styles.less` file. For example, less variables can also be declared.

```Less
// styles.less

@new-color: #2ac8bb;

h1 {
  font-size: 32px;
  color: @new-color;
}
```

Additional css files can be imported within the `styles.less` file. These files should be placed within the public folder.

```CSS
// other.css

h1 {
  font-size: 32px;
}
```

```Less
// styles.less

@import 'other.css';
```

Lowdefy makes use of [Ant Design](https://4x.ant.design/docs/react/introduce) for most of it's components. Ant Design uses theme variables which can be overwritten in the `styles.less` file. The list of Ant theme variables can be found [here](https://github.com/ant-design/ant-design/blob/4.x-stable/components/style/themes/default.less).

Below is an example of how the `primary-color` theme variable can be overwritten.

```Less
// styles.less

@primary-color: #2ac8bb;
```

Custom themes can be created by overwriting these variables, see more about this [here](https://4x.ant.design/docs/react/customize-theme).

Existing Ant themes can be applied by importing them in the `styles.less` file. For example, dark mode can be applied by importing the following:

```Less
// styles.less

@import 'antd/dist/antd.dark.less';
```

Or compact mode can be applied by importing:

 ```Less
// styles.less

@import 'antd/dist/antd.compact.less';
```



---

## File: `concepts/custom-html.yaml`

# Custom HTML

**Section:** Concepts


---
**Nunjucks Template:**
```yaml
Lowdefy runs as Next.Js app. It is possible to extend the functionality of a Lowdefy app by loading custom code (HTML, CSS and JavaScript) into the HTML `head` and `body` of all pages. This can be useful for executing third party code such as Google Analytics, Intercom, etc. However, if the goal is to extend the functionality of your Lowdefy app with custom blocks, operators, actions or requests, use [plugins](/plugins).

The content loaded into the `head` and `body` tag can be any valid HTML. Be sure to only load trusted code into your app, as this code will be able to execute JavaScript on all pages of your Lowdefy app, which could expose you app or data to security vulnerabilities. Your own code can also be hosted from the [Lowdefy public folder](/hosting-files).

## Schema to load custom code

- `app.html.appendHead: string`: Any valid HTML content can be loaded just before the `</head>` tag of the page.
- `app.html.appendBody: string`: Any valid HTML content can be loaded just before the `</body>` tag of the page.

Most often it is convenient to abstract this HTML out to a separate file using the [`_ref`](/_ref) operator.

> __Warning__: Code imported using `appendHead` or `appendBody` will be loaded, and can execute JavaScript on every page of your Lowdefy app.

#### Examples

###### Loading third party code snippet like Google Analytics:

To add [Google Analytics](/https://developers.google.com/analytics/devguides/collection/analyticsjs) to a Lowdefy app, the `lowdefy.yaml` can be setup with:

```yaml
name: google-analytics-example
lowdefy: {{ version }}
# ...
app:
  html:
    appendHead: |
      <!-- Google Analytics -->
      <script>
      (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
      (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
      m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
      })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');

      ga('create', 'UA-XXXXX-Y', 'auto');
      ga('send', 'pageview');
      </script>
      <!-- End Google Analytics -->
# ...
```
```
---


---

## File: `concepts/connections-and-requests.yaml`

# Connections and Requests

**Section:** Concepts

In a Lowdefy app you can integrate with other services like API's or databases using `connections` and `requests`. Connections configure the settings to the external service, and often contain parameters like connection strings, urls and secrets like passwords or API keys. Requests are used to interact with the connection, such as inserting a data record, executing a query or calling an API end-point.



---
**Nunjucks Template:**
```yaml
To implement requests, the following steps are required:
- Define a connection.
- Define a request.
- Call the request using a [Request](/Request) action.
- Use returned data by making use of the [_request](/_request) operator.

## Connections

Connections are defined at the root of your Lowdefy configuration, in the `connections` array. Each connection must have an `id`, a `type`, and `properties` defining the connection. Operators in connection properties are evaluated every time a request is called.

The schema for a Lowdefy connection is:

- `id: string`: __Required__ - A unique identifier for the connection. This is used by requests to specify which connection to use.
- `type: string`: __Required__ - The connection type to be used.
- `properties: object`: The settings passed to the connection. __Operators are evaluated__.

###### Connections definition example:
```yaml
lowdefy: {{ version }}
connections:
  - id: connection1
    type: ConnectionType1
    properties:
      # ...
  - id: connection2
    type: ConnectionType2
    properties:
      # ...
pages:
  # ...
```

Our goal is to make connections for everything. As the Lowdefy community grows, we will continue to develop the most requested connections. If the connection you require is not supported yet, please head over to our [new connections voting board](https://github.com/lowdefy/lowdefy/discussions/309) to request and vote for new connections.

## Requests

Requests can be defined on any block, and the results of the request can be access using the `_request` operator anywhere on the same page. Requests must have an `id`, `type`, `connectionId` field specifying the connection to use, and `properties` defining the request settings. Requests can be called using the [`Request`](/Request) action.

Data that should be passed to the request from the client can be defined in the `payload` field. Operators can be used to create the payload. An example of this would be to use the `_state` operator to include the value of an input block in the payload. The data in the payload can be accessed in the request by making use of the `_payload` operator in the `properties` field. The operators defined in the properties field are evaluated on the server, while those defined in the payload field are evaluated on the client. Operators in the request are evaluated every time a request is called.
```
---


---
**Nunjucks Template:**
```yaml
The schema for a Lowdefy request is:

- `id: string`: __Required__ - A identifier for the request. It must be unique within the page the request is defined in.
- `type: string`: __Required__ - The request type to be used. It must be a type supported by the connection type.
- `payload: object`: The operators to be used inside of the request. __Operators are evaluated on the client__.
- `connectionId: string`: __Required__ - The `id` of the connection that should be used.
- `properties: object`: The settings passed to the request. Make use of `_payload` operator to use operators that were evaluated in `payload` mentioned above. __Operators are evaluated on the server__.

###### Requests definition example:
```yaml
id: block_with_requests
type: BlockType
requests:
  - id: request1
    type: RequestType1
    connectionId: connectionId1 # Connection with id: connectionId1 must be defined
    payload:
      field:
        _state: field
    properties:
      # ...
  - id: request2
    type: RequestType2
    connectionId: connectionId2 # Connection with id: connectionId2 must be defined
    properties:
      # ...
properties:
  # ...
```

## Request Action

The `Request` action calls a request, or if used during an `onInit` event, calls those requests while a page loads. Read more about the `Request` action [here](/Request).

###### Call a single request:
```yaml
- id: call_one_request
  type: Request
  params: request1
```

## _request operator

The `_request` operator returns the response value of a request. If the request has not yet been called, or is still executing, the returned value is `null`. Read more about the `_request` operator [here](/_request). For more detailed information about a request, the [_request_details](/_request_details) operator can be used.

###### Using a request response:
```yaml
_request: my_request
```

## General Example

###### lowdefy.yaml
```yaml
lowdefy: {{ version }}

connections:
  - id: connection1
    type: ConnectionType1
    properties:
      # ...

pages:
  - id: page1
    type: PageHeaderMenu
    properties:
      title: Page 1
    requests:
      - id: request1
        type: RequestType1
        connectionId: connection1
        properties:
          # ...
    events:
      onInit:
        - id: call_request
          type: Request
          params: request1
    blocks:
      - id: content_card
        type: Card
        blocks:
          - id: paragraph
            type: Paragraph
            properties:
              content:
                _request: request1
```

## Working Example

For this example, a connection to [{JSON}Placeholder](https://jsonplaceholder.typicode.com/) will be used.
To create this `connection`, define the connection as follows in the `lowdefy.yaml` file:

###### lowdefy.yaml
```yaml
lowdefy: {{ version }}

connections:
  - id: my_api
    type: AxiosHttp
    properties:
      baseURL: https://jsonplaceholder.typicode.com

pages:
  - id: home
    type: PageHeaderMenu
```

To use this connection, a `request` must be defined, which references the corresponding `connectionId`. A request to get the list of users can be added to the home page as follows:

###### lowdefy.yaml
```yaml
lowdefy: {{ version }}

connections:
  - id: my_api
    type: AxiosHttp
    properties:
      baseURL: https://jsonplaceholder.typicode.com

pages:
  - id: home
    type: PageHeaderMenu

    requests:
      - id: get_users
        type: AxiosHttp
        connectionId: my_api
        properties:
          url: /users
```

This request should be called when the page is mounted. To do this, the [`Request`](/Request) action will be used during the `onMount` event of the home page[`PageHeaderMenu`](/PageHeaderMenu) block.

###### lowdefy.yaml
```yaml
lowdefy: {{ version }}

connections:
  - id: my_api
    type: AxiosHttp
    properties:
      baseURL: https://jsonplaceholder.typicode.com

pages:
  - id: home
    type: PageHeaderMenu

    requests:
      - id: get_users
        type: AxiosHttp
        connectionId: my_api
        properties:
          url: /users

    events:
      onMount:
        - id: fetch_get_users
          type: Request
          params: get_users
```

A block can be added to the page, that can use or display the data returned by this request. The [`_request`](/_request) operator is used to get the the results of the request.
In this example, a [`Selector`](/Selector) block will be added. The [`_array.map`](/_array) operator is used to get the data in a form that can be used by the Selector.

###### lowdefy.yaml
```yaml
lowdefy: {{ version }}

connections:
  - id: my_api
    type: AxiosHttp
    properties:
      baseURL: https://jsonplaceholder.typicode.com

pages:
  - id: home
    type: PageHeaderMenu

    requests:
      - id: get_users
        type: AxiosHttp
        connectionId: my_api
        properties:
          url: /users

    events:
      onMount:
        - id: fetch_get_users
          type: Request
          params: get_users

    blocks:
      - id: user_id
        type: Selector
        properties:
          title: Select a User
          options:
            _array.map:
              - _request: get_users.data
              - _function:
                  label:
                    __args: 0.name
                  value:
                    __args: 0.id
```

To get the posts made by the selected user, a new request should be created and called once the value of the Selector changes.
To do this, create a new request that will make use of a `payload` to get the posts with the selected user id. Add an `onChange` event on the `Selector` block, during which the new request is called.

###### lowdefy.yaml
```yaml
lowdefy: {{ version }}

connections:
  - id: my_api
    type: AxiosHttp
    properties:
      baseURL: https://jsonplaceholder.typicode.com

pages:
  - id: home
    type: PageHeaderMenu

    requests:
      - id: get_users
        type: AxiosHttp
        connectionId: my_api
        properties:
          url: /users
      - id: get_posts
        type: AxiosHttp
        connectionId: my_api
        payload:
          id:
            _state: user_id
        properties:
          url:
            _string.concat:
              - /users/
              - _payload: id
              - /posts

    events:
      onMount:
        - id: fetch_get_users
          type: Request
          params: get_users

    blocks:
      - id: user_id
        type: Selector
        properties:
          title: Select a User
          options:
            _array.map:
              - _request: get_users.data
              - _function:
                  label:
                    __args: 0.name
                  value:
                    __args: 0.id
        events:
          onChange:
            - id: fetch_get_posts
              type: Request
              params: get_posts
```

Set the data from the result of this request in state by using the [`SetState`](/SetState) action. To display the posts, make use of a [`List`](/List) block. In this `List` block, display the data returned of each post in a `Markdown` block.
This is done as follows:

###### lowdefy.yaml
```yaml
lowdefy: {{ version }}

connections:
  - id: my_api
    type: AxiosHttp
    properties:
      baseURL: https://jsonplaceholder.typicode.com

pages:
  - id: home
    type: PageHeaderMenu

    requests:
      - id: get_users
        type: AxiosHttp
        connectionId: my_api
        properties:
          url: /users

      - id: get_posts
        type: AxiosHttp
        connectionId: my_api
        payload:
          id:
            _state: user_id
        properties:
          url:
            _string.concat:
              - /users/
              - _payload: id
              - /posts

    events:
      onMount:
        - id: fetch_get_users
          type: Request
          params: get_users

    blocks:
      - id: user_id
        type: Selector
        properties:
          title: Select a User
          options:
            _array.map:
              - _request: get_users.data
              - _function:
                  label:
                    __args: 0.name
                  value:
                    __args: 0.id
        events:
          onChange:
            - id: fetch_get_posts
              type: Request
              params: get_posts
            - id: set_posts
              type: SetState
              params:
                posts:
                  _request: get_posts.data

      - id: posts
        type: List
        blocks:
          - id: posts.$
            type: Markdown
            style:
              padding: 10
            properties:
              content:
                _string.concat:
                  - |
                    ```yaml
                  - _yaml.stringify:
                      - _state: posts.$
                  - |
                    ```

```

### TLDR
  - `connections` define links to other services, like connecting to a database. They are defined at the root of the lowdefy configuration.
  - `requests` use connections to make a call to the connected external services.
  - Use the `payload` object on a request to pass data such as state values from the app client to the server as required.
  - Use the [`_secret`](/_secret) operator to reference API keys or other secrets as required - do not code secrets into your config or commit secrets to your config source control.
```
---


---

## File: `concepts/cli.yaml`

# The CLI

**Section:** Concepts

The Lowdefy CLI is used to develop a Lowdefy app locally, and to build Lowdefy apps for deployment.

We recommend running the CLI using `pnpx`, to always use the latest version:

```
pnpx lowdefy@4 <command>
```

or, to use a specific version:

```
pnpx lowdefy@version <command>
```

Alternative, you can install the CLI globally or to a Javascript project (with a `package.json` file) via pnpm.

To install the CLI globally run:

```
pnpm add -g lowdefy
```

The CLI can then be run using `lowdefy` as the executable name:

```
lowdefy <command>
```

# CLI commands

## build

The `build` command runs a Lowdefy build. This builds a production Lowdefy app in the server directory, which can then be started using the `lowdefy start` command. The options are:

- `--community-edition`: Use the Apache 2.0 licensed community edition server.
- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--no-next-build`: Do not build the Next.js server, and only build the Lowdefy config. Used in some deployment scripts where the Next.js build is done as a separate step.
- `--ref-resolver <ref-resolver-function-path>`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.
- `--server-directory <server-directory>`: Change the server directory, the directory in which the production server is placed. The default is `<config-directory>/.lowdefy/server`.


## dev

The `dev` command starts a Lowdefy development server, running locally. It can be accessed in a browser at [http://localhost:3000](http://localhost:3000). The CLI watches the file system, and rebuilds the app and reloads served pages every time a change is made to any of the files in the project directory. The `dev` command should not be used to serve a production app, the `build` and `start` commands should be used instead.

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--dev-directory <dev-directory>`: Change the dev directory, the directory in which the development server is placed. The default is `<config-directory>/.lowdefy/dev`.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--no-open`: Do not open a new tab in the default browser.
- `--port <port>`: Change the port the server is hosted at. The default is `3000`.
- `--ref-resolver <ref-resolver-function-path>`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.
- `--watch <paths...>`: A list of paths to files or directories that should be watched for changes. Globs are supported. Specify each path to watch separated by spaces.
- `--watch-ignore <patterns...>`: A list of paths to files or directories that should be ignored by the file watcher. Globs are supported. Specify each path to watch separated by spaces.

## init

The `init` command initializes a Lowdefy application. It creates the `lowdefy.yaml` and `.gitignore` in the working directory.

- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.

## init-docker

The `init-docker` command initializes a Dockerfile in the config directory that can be used to build a Docker image of the Lowdefy app.

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.

## init-vercel

The `init-vercel` command initializes the installation scripts needed to deploy an app on [Vercel](https://vercel.com). It creates a directory called deploy, and a script called vercel.install.sh. It also creates a README file with instructions on how to configure Vercel.

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.

## start

The `start` command starts a Lowdefy production server. To start a Lowdefy server, tha app should first be built using the `build` command.

- `--config-directory <config-directory>`: Change the config directory. The default is the current working directory.
- `--disable-telemetry`: Disable telemetry.
- `--log-level <level>`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `--port <port>`: Change the port the server is hosted at. The default is `3000`.
- `--server-directory <server-directory>`: Change the server directory, the directory in which the production server is placed. The default is `<config-directory>/.lowdefy/server`.


#### Examples


Run the dev server, watching a relative directory for file changes:
```txt
pnpx lowdefy@4 dev --watch ../other-project
```

Run the dev server, ignoring the public directory:
```txt
pnpx lowdefy@4 dev --watch-ignore public/**
```



# Configuration

All the CLI options can either be set as command line options, or the `cli` config object in your `lowdefy.yaml` file. Options set as command line options take precedence over options set in the `lowdefy.yaml` file. The config in the `lowdefy.yaml` cannot be referenced using the `_ref` operator, but need to be set in the file itself.

Options set in the `lowdefy.yaml` should be defined in camelCase. The options that can be set are:
- `communityEdition: boolean`: Use the Apache 2.0 licensed community edition server.
- `devDirectory: string`: Change the dev directory, the directory in which the development server is placed. The default is `<config-directory>/.lowdefy/dev`.
- `disableTelemetry: boolean`: Disable telemetry.
- `logLevel: enum`: The minimum severity of logs to show in the CLI output. Options are `debug`, `info`, `warn` or `error`. The default is `info`.
- `noOpen`: Do not open a new tab in the default browser.
- `port: number`: Change the port the server is hosted at. The default is `3000`.
- `refResolver: string`: Path to a JavaScript file containing a `_ref` resolver function to be used as the app default `_ref` resolver.
- `serverDirectory: string`: Change the server directory, the directory in which the production server is placed. The default is `<config-directory>/.lowdefy/server`.
- `watch: string[]`: A list of paths to files or directories that should be watched for changes.
- `watchIgnore: string[]`: A list of paths to files or directories that should be ignored by the file watcher. Globs are supported.

The `--config-directory` option cannot be set from the `lowdefy.yaml` file.

# Telemetry

The CLI collects usage and error information to help us fix bugs, prioritize features, and understand how Lowdefy is being used.

All telemetry can be disabled by setting the `disableTelemetry` flag in `cli` config object in your `lowdefy.yaml` file (this cannot be a reference to another file), or by using the `--disable-telemetry` command line flag.:

###### `lowdefy.yaml`
```yaml
lowdefy: LOWDEFY_VERSION

cli:
  disableTelemetry: true
```

We collect the following information:

- The CLI version.
- The Lowdefy version of your app.
- A random local app id (stored locally in your project folder at `.lowdefy/cli.json`).
- The CLI command used.
- Your IP address.
- Error messages and stack traces for any errors.



---

## File: `concepts/blocks.yaml`

# Blocks

**Section:** Concepts


---
**Nunjucks Template:**
```yaml
A Lowdefy page is compiled out of an arrangement of blocks. Every HTML element of this page is rendered as a result of a block placed and configured on the page. A Lowdefy Block is just a React component. A large number of default blocks make it easy to build apps with Lowdefy, and for more specific requirements, custom blocks can be added to apps as [plugins](/plugins).

Blocks make it simple for Lowdefy developers to create apps since they only have to decide which block type to use, where in the layout the block should render, and what the block should do by defining the block's `properties` and `events`. How a block implements these `properties` and `events` is up to the specific block type.

All Lowdefy blocks are categorized according to their primary function:
- `display` - Display page elements.
- `input` - Modify a value in [`state`](/page-and-app-state).
- `container` - Render other blocks into [`content areas`](/layout).
- `list` - Render `content areas` and blocks for each element in the data array represented in [`state`](/page-and-app-state).

When `state` updates or a requests call completes, the Lowdefy engine re-evaluates all operators and re-renders blocks for which the operator evaluation is different from the previous render result. The result is _live updates_ to all blocks on a page. Operators can be used to build _live update_ logic into all block fields, except for the `id`, `type`, `areas` and `blocks` fields.

The schema for a Lowdefy block is:

- `id: string`: An identifier for a block. For `Input` blocks the block `id` sets the field key which the block will modify in `state`. Field _dot-notation_ can be used to express fields which are nested in objects or arrays.
- `type: string`: __Required__ - This is the block type identifier and defines what block to use. The block type used must either be a default block type or can defined in the app's [`plugins`](/plugins) configuration.
- `properties: object`: All the settings passed to a block component. __Operators are evaluated__.
- `blocks: array`: A array of blocks to render to the default `content` area for `container` and `list` blocks. See [layout](/layout-overview) for more details on how to use the `blocks` array.
- `areas: object`: Used to set the content areas and content layout settings for `container` and `list` blocks. See [layout](/layout-overview) for more details on how to use `areas`.
- `events: object`: Used to define [`actions`](/events-and-actions) that run when the block triggers an [`event`](/events-and-actions).
- `layout: object`: Used to define the [layout](/layout-overview) settings for a block. __Operators are evaluated__.
- `skeleton: object`: Used to overwrite a block's default loading behavior by rendering a skeleton. Any block types from [`@lowdefy/blocks-basic`](https://github.com/lowdefy/lowdefy/tree/main/packages/plugins/blocks/blocks-basic/src/blocks) and [`@lowdefy/blocks-loaders`](https://github.com/lowdefy/lowdefy/tree/main/packages/plugins/blocks/blocks-loaders/src/blocks) can be used in the skeleton definition, including sub-blocks. __Operators are evaluated__.
- `loading: boolean`: When true, renders the block in loading. If a `skeleton` is defined, it will be rendered, else the block's default loading behavior will be rendered. __Operators are evaluated__.
- `required: boolean | string`: For `input` blocks, whether or not a value is required in `state` when the [`Validate`](/Validate) action is called. Can be either a boolean or a string that is used as the validation error message . __Operators are evaluated__.
- `style: css object`: Used to apply css style settings to the block's top level `div` element. __Operators are evaluated__.
- `validate: array`: A list of validation tests to pass when the [`Validate`](/Validate) action is called. __Operators are evaluated__.
- `visible: boolean`: Controls whether or not to render a block. Operators are generally used here, and must evaluate to `false` to make the block invisible. Blocks with `visible: false` are excluded from `state`. __Operators are evaluated__.

## Block types

Lowdefy has a set of default block types as defined in the Lowdefy docs. Most of the default Lowdefy blocks aim to cover a very generic implementation of the [Ant Design](https://ant.design/components/overview/) React component library, but some addition component libraries are also included. To use all the default block types, you can simply use the block `type` key, such as [`Button`](/Button), [`TextInput`](/TextInput), or [`Box`](/Box).

###### Default block type config example:
```yaml
lowdefy: {{ version }}
pages:
  - id: example_dashboard
    type: PageHeaderMenu
    blocks:
      - id: basic_chart
        type: EChart
        properties:
          # ... EChart properties
```

However, the default types can be overwritten or additional types can be defined as required. This is done by defining additional [`plugins`](/plugins).

## Input block validation

All `input` block types maintain a value in the page [`state`](/page-and-app-state). This value is set to the field name matching the block `id`. Nested fields can be created by using _dot notation_ in the `id` to specify the field path, for example, `id: "a.b.c"` will produce a value `{"a": {"b": {"c": null }}}` in the page `state`.

Client side field validation can be applied by setting the `required` and / or `validate` block fields. Field validation is first evaluated when the [`Validate`](/Validate) action is invoked on a page.

##### required schema:

`required` can be a `boolean` or `string` type. When `required: true` the field label will indicate this with a red asterisk for user feedback, and a value will have to be supplied to the field in order to pass validation. If `required` is set to a `string`, this string will be used as the feedback message when the validation fails.

```yaml
- id: name
  type: TextInput
  required: Please provide your name.
  properties:
    title: Name
```

##### validate schema:

The `validate` field takes an `array` of test `objects` to evaluate before passing the field validation. This list of tests are evaluated sequentially, so the first test that fails will be used as the feedback message to the user.

The schema for the validation test `objects`:
- `pass: boolean`: __Required__ - The test that validates if this item passes or not. This is usually written with operators which evaluate to `true` or `false`. __Operators are evaluated__.
- `message: string`: __Required__ - The feedback message to the user if this validation tests fails. __Operators are evaluated__.
- `status: enum`: The feedback type to present to the user. Option are `error` and `warning`. Default is `error`. __Operators are evaluated__.

The following `validate` example first verifies that something was entered into the `email` field, then checks that the field passes a email regex validation using the [`_regex`](/_regex) operator:

```yaml
  - id: email
    type: TextInput
    validate:
      - message: Please enter a email address.
        status: error
        pass:
          _ne:
            - _state: email
            - null
      - message: Please provide a valid email address.
        status: error
        pass:
          _regex: '^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$'
    properties:
      title: Email
```

## Block events

By default all blocks implement `onMount` and `onMountAsync` events. Both the `onMount` and `onMountAsync` events are triggered when the block is mounted. For the `onMount` event, the block only mounts when the event action chain is completed, however, for the `onMountAsync` event, the block will mount as soon as possible while the event actions complete execution.

Apart from the `onMount` and `onMountAsync` events, most blocks also implement their own block specific events such as `onOpen` for [Modal](/Modal) or `onClick` for [Button](/Button). See the events tab on each block's documentation for more details.

See [the events and actions page](/events-and-actions) for more details.

## Block loading

Blocks will only start rendering when the `onInit` event has completed its actions. The `onMount` event on blocks will render blocks with loading active. By default, some blocks will change behavior while they are loading. For example, input blocks will be disabled during loading. The loading behavior of blocks can be controlled using the `loading` block property. Setting `loading` to `true` on a container or list block, will result in rendering all child blocks with loading active.

Often it is useful to render a skeleton of blocks instead of the blocks' default loading behavior. When block definitions are provided to the `skeleton` property on a block, this `skeleton` definition will be rendered when loading is active. Any block types from [`@lowdefy/blocks-basic`](https://github.com/lowdefy/lowdefy/tree/main/packages/plugins/blocks/blocks-basic/src/blocks) and [`@lowdefy/blocks-loaders`](https://github.com/lowdefy/lowdefy/tree/main/packages/plugins/blocks/blocks-loaders/src/blocks) can be used as the skeleton definition. Skeleton blocks are not real blocks, they do not have values in state or events, but they can contain other skeleton blocks as children.

##### Block `loading` and `skeleton` example:

```yaml
pages:
  - id: page_one
    type: Box
    blocks:
      # ...
      - id: paragraph_one
        type: Paragraph
        loading:
          _eq:
            - _state: done
            - false
        skeleton:
          type: SkeletonParagraph
          properties:
            lines: 1
        properties:
          content: Lorem ipsum dolor sit amet.
      # ...
```

## TLDR
  - All user interfaces in Lowdefy are assembled out of blocks, which are React components.
  #### Block types
  - There are four block categories: `display`, `input`, `container` and `list`.
  - Operators re-evaluate on every [`state`](/page-and-app-state) update or when request calls complete. This allows blocks to _live update_.
  - Lowdefy has built in default block types, however this can be overwritten or extended with custom blocks by defining [`plugins`](/plugins) on the Lowdefy config root.
  - `input` blocks maintain a value in `state` matching the block `id` key. _Dot notation_ applies to specify nested fields.
  #### Block validation
  - Field level input validation can be achieved by marking an `input` block as `required` or by specifying a list of `validate` tests.
  - Validation is invoked using the [`Validate`](/Validate) action.
  #### Block events
  - All blocks have`onMount` and `onMountAsync` events.
  - Each block implements it's own additional events such as `onClick` etc.
  #### Block loading
  - Some blocks gracefully handle a loading state while `onMount` events are being executed.
  - A block's default loading can be overwritten by defining custom `skeleton` settings on a block.
```
---


---

## File: `tutorial/tutorial-start.yaml`

# 1. Getting started

**Section:** Tutorial

In this tutorial, we will be creating a simple ticketing app that allows users to file new tickets and see a list of outstanding tickets. The app reads product data from [DummyJSON](https://dummyjson.com/) and will write the ticket data to an [SQLite](https://www.sqlite.org/) database.

### Requirements

The Lowdefy CLI (Command Line Interface) is needed to run the development server. To run the Lowdefy CLI you need to install Node.js at version 18 or greater. If you don't have it installed, download Node.js from https://nodejs.org/en/download/, and follow the installation steps for your computer. All of the default settings given by the installer are fine for what we need. You will also need a text editor to modify the Lowdefy configuration files.

Lowdefy also requires [`pnpm`](https://pnpm.io/) to be installed. We recommend making activating [Corepack](https://nodejs.org/api/corepack.html), even though it is an experimental feature, as this is the simplest way to install `pnpm`. Alternative methods to install `pnpm` can also be found [here](https://pnpm.io/installation). To activate Corepack, run the following in your computer's command line interface (Windows CMD, Terminal on MacOS).


##### YAML files

If you don't have any experience using YAML, please familiarize yourself YAML before continuing.

[This video is a good introduction to YAML.](https://www.youtube.com/embed/cdLNKUoMc6c?origin=https://docs.lowdefy.com)

Lowdefy apps are written using YAML files. YAML files are useful for storing structured data, like the configuration of all of the elements of your app. YAML files focus on being easily readable by humans, this means they don't use lots of syntactic elements like brackets that make it difficult for humans to read, but instead use __indentation to indicate structure__. While this does make the file easier to read, this means care has to be taken that the data structure is as you intended.

> Lowdefy apps can also be defined using JSON files, or a mix of YAML and JSON. We find YAML files more convenient to write.

#### 1.1. Create a project directory

Create a directory (folder) on your computer where you would like to create the configuration files for your project. We will be referring to this directory as the project directory.

#### 1.2. Open a command line interface

Open your computer's command line interface and change directory (`cd`) to the project directory.

#### 1.3. Initialize an app

Use the Lowdefy CLI to initialize your project. We recommend using [`pnpx`](https://pnpm.io/6.x/pnpx-cli) to run the Lowdefy CLI, since this will always run the latest version of the CLI.

Run the following in your terminal:


This will create two files in your current working directory. The first file, called `lowdefy.yaml` is the starting point of your app's configuration. The second, called `.gitignore`, is a hidden file that tells `git`, a version control tool, not to version or upload some specific files.

> __Error: A "lowdefy.yaml" file already exists__: Try running the command in a new directory or consider deleting the _lowdefy.yaml_ file in your current working directory.


#### 1.4. Start the development server

Run:


Your browser should open on http://localhost:3000, and you should see the following:


> __Error: Could not find "lowdefy.yaml"__: Make sure your current working directory contains the _lowdefy.yaml_ file. You can verify this by running the `dir` (Windows) or `ls` (MacOS) command.



---
**Nunjucks Template:**
```yaml
#### 1.5. Open the configuration file

Open the `lowdefy.yaml` file using a text editor like [VS Code](https://code.visualstudio.com/download). The content of the file should look like this:

```yaml
lowdefy: {{ version }}
name: Lowdefy starter

pages:
  - id: welcome
    type: PageHeaderMenu
    properties:
      title: Welcome
    areas:
      content:
        justify: center
        blocks:
          - id: content_card
            type: Card
            style:
              maxWidth: 800
            blocks:
              - id: content
                type: Result
                properties:
                  title: Welcome to your Lowdefy app
                  subTitle: We are excited to see what you are going to build
                  icon:
                    name: AiOutlineHeart
                    color: '#f00'
                areas:
                  extra:
                    blocks:
                      - id: docs_button
                        type: Button
                        properties:
                          size: large
                          title: Let's build something
                        events:
                          onClick:
                            - id: link_to_docs
                              type: Link
                              params:
                                url: https://docs.lowdefy.com
                                newWindow: true
      footer:
        blocks:
          - id: footer
            type: Paragraph
            properties:
              type: secondary
              content: |
                Made by a Lowdefy 🤖
```

This configuration completely describes the app you are running.

#### 1.6. Make some changes

Let's modify the button to link to the Lowdefy Discord community instead of to the Lowdefy docs.

First, change `Let's build something` to `Join Lowdefy on Discord`, then save the file. Your page should automatically refresh and you should see the changed text of the button.

Next, update the link url to the Lowdefy Discord link, replace `https://docs.lowdefy.com` with [`https://discord.gg/QQY9eJ7A2D`](https://discord.gg/QQY9eJ7A2D), then save the file. If you now click the button it should open a new window linking to the Lowdefy Discord Channel - Join our community to ask questions or learn more regarding Lowdefy ❤️
```
---

### What happened

The Lowdefy CLI helps you develop a Lowdefy app.

We used the `pnpx lowdefy@4 init` command to initialize a new project. This created all the essential files.

We also used the `pnpx lowdefy@4 dev` command to start a development server. The development server runs a Lowdefy app locally on your computer, which can be accessed at http://localhost:3000. The development server watches your configuration files, and if any of them changes it "builds" (compiles the configuration together for the server to serve) the configuration again and refreshes the browser to show the changes.

### Up next

Let's see how easy it is to create a new page.



---

## File: `tutorial/tutorial-requests-sql.yaml`

# 6. Saving data to SQL

**Section:** Tutorial

If you have been following along, you can continue with your current config. Else, you can find the config from the previous section [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/05-requests-api).

We will now add a `SQLite` [connection and request](/connections-and-requests) to our app to save user tickets to the SQLite database file.

## Configuring the SQLite Connection and Request

We will be saving the data from our form in a SQLite database, using the [`Knex`](/SQLite) connection. To do this, we will first need to set up an SQLite database as described in the following steps:

#### 6.1. Setting up the SQLite database

We will make use of an SQLite database with a table called `tickets`, that has the following columns:

- ticket_title
- ticket_type
- ticket_description
- product
- purchase_in_last_month
- created_date


The database used in this tutorial can be downloaded <a href="/tutorial/tutorial_db.sqlite" download>here</a>.



---
**Nunjucks Template:**
```yaml
Alternatively, install [SQLite](https://www.sqlite.org/) on your computer and use the following to create the needed table:

```
CREATE TABLE tickets (
  ticket_title varchar(100),
  ticket_type varchar(50),
  ticket_description varchar(200),
  product varchar(100),
  purchase_in_last_month real,
  created_date real
);
```

#### 6.2. Setting app environment variables

Create a file called `.env` in your project directory with the following content:

##### `.env`
```
LOWDEFY_SECRET_SQLITE_FILENAME= __ABSOLUTE_PATH_TO_SQLITE_DB_FILE__
```

#### 5.2.3. Setting the connection environment variable secrets

In your `lowdefy.yaml` file, add the following:

##### `lowdefy.yaml`

```yaml
name: lowdefy-project-template
version: {{ version }}

connections:
  # ...
################ -------- Copy from here -------- ################
    - id: knex
      type: Knex
      properties:
        client: sqlite
        connection:
          filename:
            _secret: SQLITE_FILENAME
################ ------- Copy to here ----------- ################

menus:
  # ...
```

#### 6.3. Creating a save data request

In your `new-ticket.yaml` file, add the following request:

##### `pages/new-ticket.yaml`

```yaml
id: new-ticket
type: PageHeaderMenu
requests:
  # ...
################ -------- Copy from here -------- ################
  - id: save_new_ticket
    type: KnexRaw
    connectionId: knex
    payload:
      _state: true
    properties:
      query: |
        INSERT INTO tickets (
        ticket_title,
        ticket_type,
        ticket_description,
        product,
        purchase_in_last_month,
        created_date)
        VALUES(
        :ticket_title,
        :ticket_type,
        :ticket_description,
        :product,
        :purchase_in_last_month,
        :created_date)
      parameters:
        ticket_title:
          _payload: ticket_title
        ticket_type:
          _payload: ticket_type
        ticket_description:
          _payload: ticket_description
        product:
          _payload: product
        purchase_in_last_month:
          _payload: purchase_in_last_month
        created_date:
          _date: now
################ ------- Copy to here ----------- ################

properties:
  title: New ticket # The title in the browser tab.
layout:
  contentJustify: center # Center the contents of the page
blocks:
  # ...
```

#### 6.4. Triggering the save data request

In your `new-ticket.yaml` file, add the following action to the submit button:

##### `pages/new-ticket.yaml`

```yaml
id: new-ticket
# ...
blocks:
  - id: content_card
    # ...
    blocks:
      - id: page_heading
        # ...
        # ...
        # ...
      - id: submit_button
        type: Button
        #...
        events:
          onClick:
            - id: validate
              type: Validate
            ################ -------- Copy from here -------- ################
            - id: save_new_ticket # Make a request to the SQLite database
              type: Request
              params: save_new_ticket
            - id: reset # Reset the form once data has been submitted
              type: Reset
            ################ ------- Copy to here ----------- ################
```

If you click the submit button, your form data should be added into the tickets table.

### What happened

We set up the table and column names we will be using in our SQLite database. We need to do this to use the `SQLite` connection.

We defined the `Knex` connection, with the SQLite client.

We also defined a `KnexRaw` request, to save the data to our SQLite database, and called that request when clicking the submit button. This was done by making use of the `onCLick` event on the button to execute the [`Request`](/Request) action to make the API call.

> You can find the final configuration files for this section [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/06-requests-sql).

### Up next

Next, we will add a new page to display all open tickets an a table.
```
---


---

## File: `tutorial/tutorial-requests-api.yaml`

# 5. API / HTTP requests

**Section:** Tutorial


---
**Nunjucks Template:**
```yaml
If you have been following along, you can continue with your current config. Else, you can find the config from the previous section [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/04-interactive-pages).

We will now add a `AxiosHttp` [connection and request](/connections-and-requests) to get the list of products that tickets can be logged for from an external API endpoint.

## Configuring the AxiosHttp Connection and Request

We want to add a [`Selector`](/Selector) block to our form that will allow the user to select which product they are logging a ticket about, from a preset list of options. This list of preset product options will be obtained from the [DummyJSON](https://dummyjson.com/) API.

For this, we will make use of an [`AxiosHttp`](/AxiosHttp) connection as described in the following steps:

#### 5.1. Adding a new connection to the app

In your `lowdefy.yaml` file, add the following:

##### `lowdefy.yaml`

```yaml
name: lowdefy-project-template
version: {{ version }}

################ -------- Copy from here -------- ################
connections:
  - id: dummy_api
    type: AxiosHttp
    properties:
      baseURL: https://dummyjson.com/
################ ------- Copy to here ----------- ################

menus:
  # ...
```

#### 5.2. Adding a request to the page

In your `new-ticket.yaml` file, add the following request:

##### `pages/new-ticket.yaml`

```yaml
id: new-ticket
type: PageHeaderMenu
################ -------- Copy from here -------- ################
requests:
  - id: get_products
    type: AxiosHttp
    connectionId: dummy_api
    properties:
      url: /products
################ ------- Copy to here ----------- ################

properties:
  title: New ticket # The title in the browser tab.
layout:
  contentJustify: center # Center the contents of the page
blocks:
  # ...
```

#### 5.3. Triggering the request on page load

In your `new-ticket.yaml` file, add an onMount event that calls `get_products` request:

##### `pages/new-ticket.yaml`

```yaml
requests:
  - id: get_products
    type: AxiosHttp
    connectionId: dummy_api
    properties:
      url: /products

################ -------- Copy from here -------- ################
events:
  onMount:
    - id: fetch_products
      type: Request
      params: get_products
################ ------- Copy to here ----------- ################

properties:
  title: New ticket # The title in the browser tab.
layout:
  contentJustify: center # Center the contents of the page
blocks:
  # ...
```

#### 5.4. Using the request response as selector options

In your `new-ticket.yaml` file, add the a Selector block and populate it with the results from the `get_products` request. We will make use of [`_array.map`](/_array#map_title) operator to get the product titles from the response obtained from the request. This is done as follows:

##### `pages/new-ticket.yaml`

```yaml
id: new-ticket
    # ...
blocks:
  - id: content_card
    # ...
    blocks:
      - id: page_heading
        type: Title
        properties:
          content: Log a ticket # Change the title on the page.
          level: 3 # Make the title a little smaller (an html `<h3>`).
      - id: ticket_title
        type: TextInput
        properties:
          title: Title
      - id: ticket_type
        type: ButtonSelector
        properties:
          title: Ticket type
          options: # Set the allowed options
            - Suggestion
            - Complaint
            - Question

################ ------- Copy from here -------- ################
      - id: product
        type: Selector
        required: true
        properties:
          title: Product
          options:
            # Map over API response to create an array of product titles
            _array.map:
              # use dot notation to access value in response object properties
              - _request: get_products.data.products
              - _function:
                  __args: 0.title
################ ------- Copy to here -------- ################

      - id: ticket_description
        type: TextArea
        properties:
          title: Description
```

### What happened

We defined the [`AxiosHttp`](/AxiosHttp) connection to be used to obtain the list of products that tickets can be created for.

We also defined an [`AxiosHttp`](/AxiosHttp) request, to fetch the products data when the page is mounted. To do this, we used the onMount event to execute the Request action to make the API call.

We then mapped the request response to the product selector options by using the [_request](/_request) and [_array.map](/_array#map_title) operators.

> You can find the final configuration files for this section [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/05-requests-api).

### Up next

Next we will save the form data to a SQLite database file.
```
---


---

## File: `tutorial/tutorial-next-steps.yaml`

# Next steps

**Section:** Tutorial

Congratulations! You have completed the tutorial and built a basic functioning app, which can request data from an API, as well as validate and save user input to a database.

Next, consider joining the Lowdefy community, and exploring Lowdefy in more detail.

### Join the community

Whether Get help with any problems you have, share you ideas, ask questions, and show off the apps you have built, join and hlep us grow the Lowdefy community.

- [Github Discussions](https://github.com/lowdefy/lowdefy/discussions)
- [Lowdefy Discord](https://discord.gg/QQY9eJ7A2D)
- [Lowdefy Twitter](https://twitter.com/lowdefy)

### Understand the concepts

To get a more in-depth understanding of how everything works, you can start [here](/overview).

### Play with blocks

The docs are interactive, so you can adjust a block's properties and see how that affects the block in real time. Go look at what you can do with a [`Button`](/Button).

### Look at an example app

One of the best ways to learn is by doing things for yourself. You can clone an example app that is similar to something you want to build, and start experimenting from there.

###### CRUD example

This example shows patterns to implement a data admin app which allows users to view, create new, edit and delete data records.

- [Example demo.](https://example-crud.lowdefy.com)
- [App source code.](https://github.com/lowdefy/lowdefy-example-crud)

###### Survey example

This is a simple customer survey example built with Lowdefy. With this example we demonstrate how simple it is to define a public webform and thank you page in Lowdefy.

- [Example demo.](https://example-survey.lowdefy.com)
- [App source code.](https://github.com/lowdefy/lowdefy-example-survey)

###### Case management (ticketing) system example

This example focuses on building a rich UI for a hypothetical case management app, in a customer relations setting.

- [Example demo.](https://example-case-management.lowdefy.com)
- [App source code.](https://github.com/lowdefy/lowdefy-example-case-management)

###### Movies reporting example

This example demonstrates useful patterns for building a BI report/dashboard pages in Lowdefy. It connects to a MongoDB database with the Atlas Movies sample dataset pre-loaded.

- [Example demo.](https://example-reporting.lowdefy.com)
- [App source code.](https://github.com/lowdefy/lowdefy-example-reporting)



---

## File: `tutorial/tutorial-display-data-page.yaml`

# 7. Display ticket data

**Section:** Tutorial

If you have been following along, you can continue with your current config. Else, you can find the config from the previous section [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/06-requests-sql).

In this section we will add a page with a table to view the tickets that have been saved to our database.

We will make use of the concepts shown throughout the previous steps of this tutorial. If you would like to skip this, the final config can be found [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/07-display-data) and you can move on to [Next Steps](/tutorial-next-steps).

#### 7.1. Create `view-tickets.yaml`

Create a new YAML file in the project directory (the same directory as the `lowdefy.yaml` file) called `view-tickets.yaml`.

In this file we will add an `AgGridBalham` table block, using [Ag-Grid](https://www.ag-grid.com/), that will be used to display the tickets that are currently in our SQLite table.

We shall start with the basic page structure, as follows:

```yaml
id: view-tickets
type: PageHeaderMenu

properties:
  title: View tickets # The title in the browser tab.
layout:
  contentJustify: center # Center the contents of the page.
blocks:
  - id: content_card
    type: Card
    layout:
      size: 1000 # Set the size of the card so it does not fill the full screen.
      contentGutter: 28 # Make a 28px gap between all blocks in this card.
    blocks:
      - id: page_heading
        type: Title
        properties:
          content: View Tickets # Change the title on the page.
          level: 3 # Make the title a little smaller (an html `<h3>`).
```

#### 7.2. Add request to `view-tickets.yaml`

Next we shall add a request to fetch the tickets currently in the tickets table in the SQLite database. To do this, we shall create a `fetch_tickets` request and call it when the page is mounted.

```yaml
id: view-tickets
type: PageHeaderMenu

################ -------- Copy from here -------- ################
requests:
  - id: fetch_tickets
    type: KnexRaw
    connectionId: knex
    properties:
      query: SELECT * FROM "tickets"

events:
  onMount:
    - id: fetch_tickets
      type: Request
      params: fetch_tickets
################ -------- Copy to here -------- ################

properties:
  title: View tickets # The title in the browser tab.
#...
```

### 7.3. Add an `AgGridBalham` block

We will add an `AgGridBalham` table block to our page to display the tickets that have been saved in the tickets table. We want to display five columns in our table; `ticket_title`, `created_date`, `ticket_type`, `product` and `ticket_description`.

The `rowData` used for our table will be the result from our `fetch_tickets` request and is accessed by making use of the [_request](/_request) operator.

In order to display the `created_date` in a more compact format, we will make use of the [_nunjucks](/_nunjucks) operator.

Add the following config to the `view-tickets.yaml` filename:

```yaml
#...

blocks:
  - id: page_heading
    type: Title
    properties:
      content: View Tickets # Change the title on the page.
      level: 3 # Make the title a little smaller (an html `<h3>`).

  ################ -------- Copy from here -------- ################
  - id: view_tickets_table
    type: AgGridBalham
    properties:
      enableCellTextSelection: true
      pagination: true
      rowData:
        _request: fetch_tickets
      defaultColDef:
        sortable: true
        resizable: true
        filter: true
      columnDefs:
        - headerName: Title
          field: ticket_title
          width: 200
          filter: false
        - headerName: Date Created
          field: created_date
          width: 140
          cellRenderer:
            _function:
              __nunjucks:
                template: |
                  {{ created_date | date('DD MMM YYYY') }}
                on:
                  __args: 0.data
        - headerName: Ticket Type
          field: ticket_type
          width: 150
          filter: false
        - headerName: Product
          field: product
          width: 200
          filter: false
        - headerName: Ticket Description
          field: ticket_description
          width: 250
          filter: false
    ################ -------- Copy to here -------- ################
  ```

#### 7.4. Update `lowdefy.yaml`

Last step is to add the page to our app. In order to do this, we need to update the `lowdefy.yaml`.

Change the `lowdefy.yaml` to include `view-tickets.yaml` in the list of pages and the list of menu items:

```lowdefy.yaml
#...
menus:
  - id: default
    links:
      - id: welcome
        type: MenuLink
        properties:
          icon: AiOutlineHome
          title: Home
        pageId: welcome
      - id: new-ticket
        type: MenuLink
        properties:
          icon: AiOutlineAlert
          title: New ticket
        pageId: new-ticket
      ################ -------- Copy from here -------- ################
      - id: view-tickets
        type: MenuLink
        properties:
          icon: AiOutlineDatabase
          title: View tickets
        pageId: view-tickets
      ############### -------- Copy to here ---------- ################

pages:
  - _ref: new-ticket.yaml
  ################ -------- Copy from here -------- ################
  - _ref: view-tickets.yaml
  ################ -------- Copy to here ---------- ################
  - id: welcome
    type: PageHeaderMenu
    properties:
      title: Welcome
    # ...
```

### What happened

We added a new page in order to view the tickets saved in our database.

We defined a `KnexRaw` request, to read the ticket data from our SQLite database, and called that request when the page was mounted.

The data from this request was then displayed in an `AgGridBalham` table block, which we added to the new page.

Lastly, we linked this new page to our app.



---

## File: `tutorial/tutorial-deploy.yaml`

# 6. Deploy to Netlify

**Section:** Tutorial

<iframe
  width="800"
  height="470"
  src="https://www.youtube.com/embed/VPUYzywryuQ" frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen>
</iframe>


[Netlify](https://www.netlify.com) is a web app hosting service that is a great match for Lowdefy. They have great integrations with GitHub, GitLab, and Bitbucket, which make it easy to set up a continuous deployment process to deploy your apps.

### Requirements

You will need to have the following:

- A Github account. You can create one [here](https://github.com/join).
- A Netlify account. You can create one [here](https://app.netlify.com/signup). It is easiest if you sign up with your Github account.
- [`git`](https://git-scm.com/downloads) version control installed on your computer.

#### 6.1 - Create a Github repository

Create a new Github repository. You can do that [here](https://github.com/new). Do not initialize the repository with a `.gitignore`, `README`, or license file.

#### 6.2 - Add your files to the repository

Run the `git` commands to create a new repository on the command line:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/__GITHUB_USERNAME__/__REPO_NAME__.git
git push -u origin main
```

If you refresh your browser, you should see the `lowdefy.yaml` and `.gitignore` files in the repository.

#### 6.3 - Link your Github project to Netlify.

- Once logged in to Netlify, click the "New site from git" button.
- Choose Github, and authorize Netlify to access your repositories.
- Select your repository.


#### 6.4 - Configure your Netlify deployment.

- Set your build command to `npx lowdefy@latest build-netlify`.
- Set your publish directory to `.lowdefy/publish`.
- Review the other settings, and deploy your site


#### 6.5 - Configure the Lowdefy server.

- Click the "Site settings" button.
- Choose the "Functions" section in the left menu.
- Edit the settings and set your functions directory to `.lowdefy/functions`.

#### 6.6 - Add your Google Sheets credentials

Go to "Site settings", then "Build and deploy" in the left menu. Scroll down and select "Edit variables" in the "Environment" section.

Set the variables `LOWDEFY_SECRET_SHEETS_CLIENT_EMAIL` and `LOWDEFY_SECRET_SHEETS_PRIVATE_KEY` to the same values as in your `.env` file.

#### 6.7 - Redeploy your site

- Go to the "Deploys" tab.
- Click the "Trigger deploy" button and deploy your site.
- Wait for you site to finish deploying.

#### 6.8 - Enjoy your app

Go to your shiny new app. On the "Site overview" tab you will find your site url. Go to this url and you should see your app.

#### 6.9 - Try out Netlify's deploy preview.

Edit the `lowdefy.yaml` file on Github. Commit the changes on a new branch, and create a pull request. Netlify will run checks on your pull request, and generate a deploy preview. Once the deploy preview has finished building, you can click on the "details" link and this will take you to preview of your changes.

### Up next

This is the end of the tutorial. If you have any feedback or suggestions, we would greatly appreciate that. You can start a new discussion [here](https://github.com/lowdefy/lowdefy/discussions).

Our next steps will show you some of the things you could do next.



---

## File: `tutorial/tutorial-create-page.yaml`

# 2. Creating a page

**Section:** Tutorial


---
**Nunjucks Template:**
```yaml
Let's create a page for a web form where users can log a new ticket.

#### 2.1. Create `new-ticket.yaml`

Create a new YAML file in the project directory (the same directory as the `lowdefy.yaml` file) called `new-ticket.yaml`, with the following content:

```yaml
id: new-ticket
type: PageHeaderMenu
properties:
  title: New ticket # The title in the browser tab.
layout:
  contentJustify: center # Center the contents of the page.
blocks:
  - id: content_card
    type: Card
    layout:
      size: 800 # Set the size of the card so it does not fill the full screen.
      contentGutter: 16 # Make a 16px gap between all blocks in this card.
    blocks:
      - id: page_heading
        type: Title
        properties:
          content: Log a ticket # Change the title on the page.
          level: 3 # Make the title a little smaller (an html `<h3>`).
```

#### 2.2. Update `lowdefy.yaml`

Change the `lowdefy.yaml` to look like this:

```yaml
name: lowdefy-project-template
lowdefy: {{ version }}

pages:
################ -------- Copy from here -------- ################
  - _ref: new-ticket.yaml
################ -------- Copy to here ---------- ################
  - id: welcome
    type: PageHeaderMenu
    properties:
      title: Welcome
    # ...
```
```
---

#### 2.3. Navigate to the new page

Your browser should reload, and you should see a link in the header menu to the booking page. If you click on that link it should take you to a page that looks like this:


If you click on the link in the menu, you should see that your browser path (the part after `localhost:3000` or `example.com`) changes from `welcome` to `new-ticket`.

### What happened

- We created a new page with id `new-ticket`.
- We used the [`_ref` operator](/_ref) to reference configuration in another file.
- That page can now be found at the `/new-ticket` route.
- A link to that page was created in the menu. These links are in the order of the pages.

## Menus

A menu is created by default from all the pages in your app, in the order that they appear in the pages array. Often more control is needed over the menu. You might want to group menu items into different groups, change the title, exclude a page or add an icon. To do this, we can define a menu in the `menus` section of the `lowdefy.yaml` file.

#### 2.4 - Add the menu configuration

Copy the following and add it to your `lowdefy.yaml` file just before the pages section:

```yaml
################ -------- Copy from here -------- ################
menus:
  - id: default
    links:
      - id: new-ticket
        type: MenuLink
        properties:
          icon: AiOutlineAlert
          title: New ticket
        pageId: new-ticket
      - id: welcome
        type: MenuLink
        properties:
          icon: AiOutlineHome
          title: Home
        pageId: welcome
################ -------- Copy to here ---------- ################
pages:
  - _ref: new-ticket.yaml
    # ...
```

The menu links will now have icons and titles.

> If you would like to see how your config should look at this point, you can find it [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/02-creating-a-page).

### Up next

In the next section we will add some more blocks to our page to create a form to capture the ticket data.



---

## File: `tutorial/tutorial-add-blocks.yaml`

# 3. Adding blocks

**Section:** Tutorial

We would like to add an input form with the following fields:

- A title for the ticket.
- The type of ticket. This should be a selection from a list of types.
- A description of the ticket.

There should also be submit and reset buttons at the bottom of the page.

#### 3.1. Add some input blocks

Copy the following blocks and add them in the card's blocks array.

###### `new-ticket.yaml`
```yaml
id: new-ticket
    # ...
blocks:
  - id: content_card
    # ...
    blocks:
      - id: page_heading
        type: Title
        properties:
          content: Log a ticket # Change the title on the page.
          level: 3 # Make the title a little smaller (an html `<h3>`).
################ ------- Copy from here -------- ################
      - id: ticket_title
        type: TextInput
        properties:
          title: Title
      - id: ticket_type
        type: ButtonSelector
        properties:
          title: Ticket type
          options: # Set the allowed options
            - Suggestion
            - Complaint
            - Question
      - id: ticket_description
        type: TextArea
        properties:
          title: Description
      - id: reset_button
        type: Button
        layout:
          span: 12 # Set the size of the button (span 12 of 24 columns)
        properties:
          title: Reset
          block: true # Make the button fill all the space available to it
          type: default # Make the button a plain button
          icon: AiOutlineClear
      - id: submit_button
        type: Button
        layout:
          span: 12
        properties:
          title: Submit
          block: true
          type: primary # Make the button a primary button with color
          icon: AiOutlineSave
################ -------- Copy to here ---------- ################
```

Your new-ticket page should look something like this:


>  If you would like to see how your config should look at this point, you can find it [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/03-adding-blocks).

### What happened

We added 3 form input blocks to the page. For each of those blocks, we set the `title` property, and for the ticket type selector we set a list of ticket types to the `options` property.

We also added reset button and submit button. We set a few more properties on the buttons to set their layout and appearance.

### How it works

Lowdefy apps are made from blocks. These blocks can be the page layout with header and menu, a piece of text, a chart or table, tabs or even a popup message or icon. You specify which block is rendered with the `type` field. There are 4 block categories, namely display, input, container, and list.

All blocks need to have an `id` that identifies the block. Blocks of category input and list use this `id` as the object key to represent a value in page state, but more on this later.

### Up next

Currently our form doesn't do very much. In the next section we will use [actions](/events-and-actions) and [operators](/operators) to make it more interactive.



---

## File: `tutorial/tutorial-actions-operators.yaml`

# 4. Interactive pages with actions and operators

**Section:** Tutorial

If you have been following along, you can continue with your current config. Else, you can find the config from the previous section [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/03-adding-blocks).

## Configuring the reset button

The reset button should reset all the user's inputs. To do this, we can add a [Reset action](/Reset) to the reset button.

#### 4.1. Configure the reset button

Copy the following into the definition of the reset button:

##### `new-ticket.yaml`
```yaml
id: new-ticket
# ...
blocks:
  - id: content_card
    # ...
    blocks:
      - id: page_heading
        # ...
        # ...
        # ...
      - id: reset_button
        type: Button
        layout:
          span: 12
        properties:
          title: Reset
          block: true
          type: default
          icon: AiOutlineClear
################ -------- Copy from here -------- ################
        events:
          onClick:
            - id: reset
              type: Reset
################ -------- Copy to here ---------- ################
      - id: submit_button
        type: Button
        # ...
```

If you add some inputs into the form and click the reset button, those inputs should be cleared.

### How it works

Blocks can define events, which they can trigger when certain events happen on the page. You can then define a array of actions, that are executed sequentially when a block triggers an event. The button triggers an event called `onClick` when it gets clicked. We can add an array of action definitions that will be executed when this action is fired. We only added one action, the [`Reset` action](/Reset), that resets the page state as it was when it first loaded.

## Required fields

We should validate the form to make sure the user input data is clean for the app to work as expected. The `ticket_title` and `ticket_type` fields should be compulsory, and the user should not be able to submit the ticket if they are not completed.

#### 4.2. Mark fields as required

To make the fields required, add a required property to the input blocks like this:

```yaml
- id: ticket_title
  type: TextInput
  required: true
  properties:
    title: Title
```

A red asterisk should appear next to each input field, looking like this:


We can now add a [`Validate` action](/Validate) to the submit button. This will validate the inputs and give an error if any inputs are not filled in.

#### 4.3. Add a Validate action

Add the validate action like this:

##### `new-ticket.yaml`
```yaml
id: new-ticket
# ...
blocks:
  - id: content_card
    # ...
    blocks:
      - id: page_heading
        # ...
        # ...
        # ...
      - id: submit_button
        type: Button
        layout:
          span: 12
        properties:
          title: Submit
          block: true
          type: primary
          icon: AiOutlineSave
################ -------- Copy from here -------- ################
        events:
          onClick:
            - id: validate
              type: Validate
################ -------- Copy to here ---------- ################
```

Now if we click the submit button and all our inputs aren't complete, a message pops up saying we have validation errors on the page. All the fields that have not been completed are highlighted in red.

The result should look and work like this. The examples in this tutorial are live versions of the tutorial app, so you can verify that they work like your own app.


### How it works

The [Validate action](/Validate) we added to the submit button evaluates all the input blocks on the page, and gives an error if any of them fail the validation. This will also stop the execution of any actions after that action. For example, the app won't insert the data into our database if a Request action is used after a failing Validate action. The first time a Validate action is called on a page it sets a flag that tells all the input blocks to show their validation errors.

## Hiding blocks

We would like to ask the user if they had purchased the product within the last month, for which they are formulating a complaint. To do this, we will add a input block with a `visible` property. This property expects a boolean value. In Lowdefy, we can make use of [operators](/operators) to evaluate logic. We'll use the [`_eq`](/_eq) operator to test if the ticket type is equal to `Complaint`.

#### 4.4. Add a block with a visible condition

Add the following [`ButtonSelector`](/ButtonSelector) to your app.

##### `pages/new-ticket.yaml`
```yaml
id: new-ticket
# ...
blocks:
  - id: content_card
    # ...
    blocks:
      # ...
      - id: ticket_description
        type: TextArea
        properties:
          title: Description
################ -------- Copy from here -------- ################
      - id: purchase_in_last_month
        type: ButtonSelector
        visible: # Test if block should be visible to the user
          _eq: # Equals operator
            - _state: ticket_type # Get the ticket_type value from state.
            - Complaint
        properties:
          title: Did you purchase this product within the last month?
          label:
            colon: false # Hide the label colon
          options:
            - Yes
            - No
################ -------- Copy to here ---------- ################
      - id: reset_button
        type: Button
```

If you select the "Complaint" ticket type, the selector confirming if you purchased the product within the last month should appear.

### How it works

If the visible field value is `false`, the block won't be rendered. To change this value while our app is running, we use an operator. [Operators](/operators) evaluate every time something in the app changes, like when a user provides an input.

We used the [`_eq`](/_eq) operator to check the ticket type is equal to 'Complaint'.

To get the value of the `ticket_type` input, we use the [`_state`](/_state) operator. This get a value from the page's [`state`](/page-and-app-state). The page `state` is an object to temporary store page data. All inputs automatically write their values to `state` under the object key of the block `id`, and you can also set values to the page `state` by using the [`SetState`](/SetState) action.

## Validation rules

We would like to add a validation rule on the `purchase_in_last_month` block to warn users that the product that they have purchased may not be eligible for replacement.

#### 4.5. Add a validation rule

Add the following to your app
##### `pages/new-ticket.yaml`
```yaml
id: new-ticket
# ...
blocks:
  - id: content_card
    # ...
    blocks:
      # ...
      - id: purchase_in_last_month
        type: ButtonSelector
        visible: # Test if block should be visible to the user
          _eq: # Equals operator
            - _state: ticket_type # Get the ticket_type value from state.
            - Complaint
################ ------- Copy from here -------- ################
        validate:
          # Show a warning that shows before validate is called
          # and does not block Validate action.
          - status: warning
            message: If you have had the product for over a month, we may not be able to replace it.
            pass:
              _eq:
                - _state: confirm_restart
                - Yes
################ -------- Copy to here ---------- ################
        properties:
          title: Did you purchase this product within the last month?
          label:
            colon: false # Hide the label colon
          options:
            - Yes
            - No
```

Your app should now show a warning message if `purchase_in_last_month` is not yes.

### How it works

The `validate` field contains an array of validation rules that can be evaluated using operators.

If the pass field receives `true`, the rule passes and nothing happens. If the rule fails and the status is error, the `Validate` action will fail, like it did for required fields. If the status is warning, a warning will be shown to the user, but the `Validate` action will still pass.

Your final new ticket page should look and work like this:


> You can find the final configuration files for this section [here](https://github.com/lowdefy/lowdefy-example-tutorial/tree/main/04-interactive-pages).

## Up next

Our app doesn't save the form data anywhere when the submit button is clicked. In the next section we will set up a connection and a request to save the data in a local SQLite database.



---

## File: `deployment/vercel.yaml`

# Deploy with Vercel

**Section:** Deployment

To deploy a Lowdefy app on Vercel a custom install script needs to run to download the server and build the Lowdefy configuration. This script creates a Next.js application that can then be built by Vercel. The install script needs to be placed in an empty directory and it installs the server in its working directory - by default this directory is called `deploy`.

The script can be created using the `init-vercel` CLI command, or the following file can be created at `<config-directory>/deploy/vercel.install.sh`:

###### vercel.install.sh

```bash
# Read Lowdefy version from lowdefy.yaml using sed
LOWDEFY_VERSION=$(sed -nE "s/lowdefy:(.*)/\1/p" ../lowdefy.yaml)
# Substitution params are to trim whitespace from the LOWDEFY_VERSION var
npx lowdefy@${LOWDEFY_VERSION//[[:space:]]/} build --config-directory ../  --server-directory . --no-next-build --log-level=debug
```

To deploy a Lowdefy app on Vercel:

- Create a new project
- Connect the GitHub, Gitlab or BitBucket repository with your Lowdefy app to the Vercel project
- The framework preset should be Next.js
- The root directory should be `<config-directory>/deploy`
    -  `<config-directory>` is the path to the directory in which the `lowdefy.yaml` file is placed
    - Eg: If the `lowdefy.yaml` is in the top level of the repository the configured root directory should be `deploy`
    - Eg: If the `lowdefy.yaml` is in the directory `apps/app_name` the configured root directory should be `apps/app_name/deploy`
- The build command should be `pnpm next build`
- The install command should be `sh vercel.install.sh`


Secrets can be set in the Environment Variables settings section by creating environment variables prefixed with `LOWDEFY_SECRET_`. Different secrets can be set for production and preview deployments.

All other Vercel configuration like domain names, preview deploy branches, serverless regions and redirects can be configured as desired.



---

## File: `deployment/node-server.yaml`

# Deploy with Node.js

**Section:** Deployment

### Run with Lowdefy CLI:

To test the production server, it can be run locally. In order to do this, first create the production build output using:

`pnpx lowdefy@4 build`

The production server can then be run using:

`pnpx lowdefy@4 start`

### Create Standalone Folder:

The following steps are used to create a standalone folder that copies only the necessary files for a production deployment.

Update the .env file to contain the following:

###### .env

```
# ...
LOWDEFY_BUILD_OUTPUT_STANDALONE = 1
```

The production build output is then created by running:

`pnpx lowdefy@4 build`

The above creates a Next.js standalone folder at `<config-directory>/.lowdefy/server/.next/standalone`. Read more about this [here](https://nextjs.org/docs/pages/api-reference/next-config-js/output).

This folder can be copied or moved around as needed and can be run using:

```node .lowdefy/server/.next/standalone/server.js```

or with the applicable path if the standalone folder has been moved.

Files in the `public` and `.next/static` folders do not get copied over into this standalone folder and should therefore be copied over manually or be served from a CDN. Read more [here](https://nextjs.org/docs/pages/api-reference/next-config-js/output#automatically-copying-traced-files).

### Alternative

An alternative option would be to make use of [Docker](./docker) to deploy the app. Docker has a few advantages, including scalability, application portability, version control and deployment speed, amoung others.



---

## File: `deployment/docker.yaml`

# Deploy with Docker

**Section:** Deployment

### Building a Lowdefy app image

A Lowdefy app can be self-hosted or deployed to many hosting providers using Docker containers. The app needs to build into a Docker image, containing all the app configuration and a [Next.js Docker server](https://nextjs.org/docs/deployment#docker-image).

The `init-docker` CLI command can be used to create a Dockerfile, or the following Dockerfile can be used:

```text
FROM node:18-buster AS builder

WORKDIR /lowdefy

COPY . .
# Configure standalone next build
ENV LOWDEFY_BUILD_OUTPUT_STANDALONE 1

# Enable pnpm using corepack
RUN corepack enable

# Build lowdefy app
RUN pnpx lowdefy@4 build --log-level=debug

FROM node:18-alpine AS runner

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

WORKDIR /lowdefy

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 lowdefy

COPY --from=builder --chown=lowdefy:nodejs /lowdefy/.lowdefy/server/public ./public
COPY --from=builder --chown=lowdefy:nodejs /lowdefy/.lowdefy/server/.next/standalone ./
COPY --from=builder --chown=lowdefy:nodejs /lowdefy/.lowdefy/server/.next/static ./.next/static

USER lowdefy

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```

with a `.dockerignore` file:

```
Dockerfile
.dockerignore
.env
node_modules
README.md
.lowdefy
.next
.git
```

An image can be built by running:

```
docker build -t <tag> .
```

The container can be run by:

```
docker run -p 3000:3000 <tag>
```

Docker compose can also be used. Add a `docker-compose.yaml` file:

```yaml
version: "3.9"
services:
  lowdefy:
    build: .
    ports:
      - "3000:3000"
```

To build the image, run:

```
docker compose build
```

To run the app, run:

```
docker compose up
```

### Secrets and Environment Variables

When running you app in production we recommend using your hosting provider's preferred method for setting environment variables and secrets. This can often be configured using their admin interface, and secrets are usually encrypted.

When running locally, you can use the `--env-file` Docker CLI option to load a `.env` file into your container:
```
docker run -p 3000:3000 --env-file ./.env <tag>
```

If using Docker compose:

```yaml
version: "3.9"
services:
  lowdefy:
    build: .
    ports:
      - "3000:3000"
    env_file: ./.env # Path to env file
```

### Config files or plugins outside the config directory

For security reasons, only files inside the directory of the Dockerfile can be accessed by the Dockerfile during the build process.

Sometimes files outside of the config directory need to be accessed by the Lowdefy app during build - for example using the `_ref` operator on shared config files, or when using pnpm local workspace plugins. In this case, the Dockerfile needs to be moved to a directory that includes all the files that need to be accessed and the Dockerfile needs to be modified to take this into account.

###### In pnpm monorepo with plugins

```text
FROM node:18-buster AS builder

WORKDIR /lowdefy

COPY . .
# Configure standalone next build
ENV LOWDEFY_BUILD_OUTPUT_STANDALONE 1

# Enable pnpm using corepack
RUN corepack enable

# TODO: Change config-directory (./app) as appropriate here
RUN pnpx lowdefy@4 build --config-directory ./app --log-level=debug

RUN pnpm --filter=@lowdefy/server --prod deploy ./deploy

FROM node:18-alpine AS runner

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

WORKDIR /lowdefy

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 lowdefy

# TODO: Change from-directory (/lowdefy/app/.lowdefy/server/*) as appropriate here
COPY --from=builder --chown=lowdefy:nodejs /lowdefy/app/.lowdefy/server/public ./public
COPY --from=builder --chown=lowdefy:nodejs /lowdefy/app/.lowdefy/server/.next/standalone ./
COPY --from=builder --chown=lowdefy:nodejs /lowdefy/app/.lowdefy/server/.next/static ./.next/static

COPY --from=builder --chown=lowdefy:nodejs /lowdefy/deploy/node_modules ./node_modules

EXPOSE 3000

ENV PORT 3000

CMD ["node", "server.js"]
```



---

## File: `plugins/plugins-operators.yaml`

# Operator Plugins

**Section:** Plugins

Operators are synchronous functions that are used in Lowdefy to express logic. If you need to use asynchronous code, or promises, write an [action](/plugins-actions) instead.  Operator names should start with a single underscore, as this is used by the Lowdefy engine to identify and evaluate operators. By convention, operator functions are written in _snake_case_.

Operators are used in both the web client and server runtimes. Some operators make sense in both environments, but other operators only work in one or the other. The `types.js` file declares the server and client operators exported by an app in the `operators.client` and `operators.server` fields. The operator named exports are exported under the `./operators/client` and `./operators/server` package entry points for client and server operators respectively. The same function can be exported for both the client and the server runtimes, or two different implementations can be exported in each file.

Client parameters:
- `actions: object`: The actions data object.
- `args: array`: If the operator is used inside a `_function` operator, `args` is an array of arguments passed to the function.
- `basePath: string`: The configured app URL basePath.
- `event: object`: The event data object.
- `globals: object`: Commonly used Javascript global objects. These are passed to the operator for easier testing.
  - `document: object`: The browser [`window.document`](https://developer.mozilla.org/en-US/docs/Web/API/Document/Document) global variable.
  - `window: object`: The browser [`window`](https://developer.mozilla.org/en-US/docs/Web/API/Window) global variable.
- `home: object`:
  - `configured: boolean`: True if the user configured a home pageId.
  - `pageId: string`: The pageId of the home page. Either the user configured home pageId, or the pageId of the first page visible to the user in the default menu.
- `input: object`: The input data object.
- `lowdefyGlobal: `: The Lowdefy global data object.
- `menus: array`: The app menus.
- `methodName: string`: The name of the method if the operator is called with a method (as `_operator.methodName`).
- `operators: object`: An object with all the operator functions used on the client.
- `pageId: string`: The pageId of the page the operator is evaluated on.
- `params: any`: The `params` defined by the user in the Lowdefy configuration. Operators are evaluated before the params are passed to the operator. No validation is performed on this object.
- `requests: object`: The requests data object.
- `runtime: string`: The runtime is set to the constant `"browser"`.
- `state: object`: The state data object.
- `user: object`: The user data object.


Server parameters:
- `args: array`: If the operator is used inside a `_function` operator, `args` is an array of arguments passed to the function.
- `methodName: string`: The name of the method if the operator is called with a method (as `_operator.methodName`).
- `operators: object`: An object with all the operator functions used on the server.
- `params: any`: The `params` defined by the user in the Lowdefy configuration. Operators are evaluated before the params are passed to the operator. No validation is performed on this object.
- `payload: object`: The payload object passed to a request. Operators are evaluated on the client before the payload is passed to the server request function.
- `runtime: string`: The runtime is set to the constant `"node"`.
- `secrets: object`: The secrets data object.
- `user: object`: The user data object.

### Pure Functions

Operators in Lowdefy are usually pure functions - given a specific input they always give the same output. If a operator is used in blocks, they must be pure functions because operators are evaluated every time a page is re-rendered. Operators in block properties are evaluated recursively until the evaluated result matches the previous evaluated result.

#### Examples

###### An operator that multiplies a number by 11:
```js
function _times_eleven({ params }) {
  return params.number * 11;
}

export default _times_eleven;
```

###### The _eq operator:
```js
import { type } from '@lowdefy/helpers';

function _eq({ params }) {
  if (!type.isArray(params)) {
    throw new Error('Operator Error: _eq takes an array type as input.');
  }
  if (params.length !== 2) {
    throw new Error('Operator Error: _eq takes an array of length 2 as input');
  }
  return params[0] === params[1];
}

export default _eq;
```



---

## File: `plugins/plugins-introduction.yaml`

# Plugins

**Section:** Plugins

Lowdefy plugins provides an interface to extend the platform functionality with custom javascript code. Plugins are installed into the Lowdefy app during the Lowdefy build process, and as a result are included as part of the Next.js build output. This enables plugin developers to use any npm packages when building Lowdefy plugins.

Lowdefy plugins can be used to create custom blocks, connections, requests, action, operators and auth providers, adapters, callbacks and events. These plugins are written as standard [npm modules](https://docs.npmjs.com/about-packages-and-modules#about-modules), so community plugins can be published to npm, and the workspace and git protocols can be used for project specific or private plugins. Since plugins are npm packages most Javascript features and third-party npm packages can be used in plugins.

## Using a plugin

To use a plugin in an app, the plugin name and version should be specified in the `plugins` section of the Lowdefy config. Once the plugin is included, the types (blocks, connections, etc) defined in the plugin can be used anywhere in the app.

If two plugins export types with the same type name, user defined plugins will override the default Lowdefy types, and user defined plugins will overwrite other plugins defined before them in the plugins array.

The `typePrefix` property can be used to prevent plugins with the same name overwriting each other. If specified, the type names of all plugins in that package will have the prefix appended. For example, if a package contains a block with type `Button` and the typePrefix is set to `Other`, that block can be used with type name `OtherButton`, and the default Lowdefy `Button` block will still be available.

###### Example

```yaml
plugins:
  # plugins installed remotely from npm
  - name: npm-plugin
    version: 1.0.0
    # local plugins in pnpm monorepo
  - name: local-plugin
    version: workspace:*
  # Add a prefix to type names
  - name: other-plugin
    version: 1.0.0
    typePrefix: Other
```



---

## File: `plugins/plugins-dev.yaml`

# Developing Plugins

**Section:** Concepts

To develop plugins and publish plugins to npm or to use unpublished, project-specific plugins, we recommend using a pnpm monorepo with the plugin packages and a Lowdefy app, as demonstrated in [this example](https://github.com/lowdefy/lowdefy-example-plugins). The [Lowdefy default plugin packages](https://github.com/lowdefy/lowdefy/tree/main/packages/plugins) can also be used as examples.

> In this documentation the collection of blocks, connections, actions, etc. will be referred to as _types_, not to be confused with Typescript types.


A plugin package needs to include the following:

- A `package.json` file which declares the package and exports the plugin types.
- A `types.js` file which exports the plugin type names.
- Files that export all the types as named exports.
- The code for the types exposed by the plugin package.

### package.json

Lowdefy plugin packages should be an [ECMAScript module](https://nodejs.org/api/esm.html#modules-ecmascript-modules). To configure a package as an ECMAScript module, the `type` field in the `package.json` file should be set to `"module"`.

Lowdefy uses the [`exports`](https://nodejs.org/api/packages.html#exports) package entry points to map to the `types.js` and plugin named export files.

```json
{
  "name": "plugin-name",
  "version": "1.0.0",
  "type": "module",
  "exports": {
    "./actions": "./src/actions.js",
    "./auth/callbacks": "./src/auth/callbacks.js",
    "./auth/events": "./src/auth/events.js",
    "./auth/providers": "./src/auth/providers.js",
    "./blocks": "./src/blocks.js",
    "./connections": "./src/connections.js",
    "./operators/client": "./src/operators/client.js",
    "./operators/server": "./src/operators/server.js",
    "./types": "./src/types.js"
  },
  "files": ["src/*"],
  "dependencies": {}
}
```

The `./types` entry point is required, and the other entry points are only required if the package exports the corresponding types.

You can change your folder structure in your package, but then you need to change the `exports` entry points in the `package.json` file to match your file structure.

##### Compiling React for blocks

To develop a block plugin, the React code needs to compiled before it can be used in the Lowdefy app. The [Lowdefy plugin example](https://github.com/lowdefy/lowdefy-example-plugins) has an example of this configured using SWC.

### types.js

The `types.js` file declares the different types provided by the plugin package. This is used by the Lowdefy build process to map plugin types used in the Lowdefy config to plugin packages.

The file should export an object that contains the type names (the names used in the Lowdefy config) for all the different types provided by the package.

###### Example with all types

```js
export default {
  actions: ['Action'],
  auth: {
    callbacks: ['Callback'],
    events: ['Event'],
    provider: ['Provider'],
  },
  blocks: ['Block'],
  connections: ['Connection'],
  requests: ['Request'],
  operators: {
    build: ['_build_operator', '_shared_operator'],
    client: ['_client_operator', '_shared_operator'],
    server: ['_server_operator', '_shared_operator'],
  },
};
```

The type names do not need to be hard coded, and can be generated by importing the plugin types.

###### Example `types.js` for connections

```js
import * as connections from './connections.js';

export default {
  connections: Object.keys(connections),
  requests: Object.keys(connections)
    .map((connection) => Object.keys(connections[connection].requests))
    .flat(),
};
```

When developing blocks, the names of any react-icons used by the block, as well the path to any CSS or LESS files used by the block also need to be included in the types object, as discussed in more detail [here](/plugins-blocks).

###### Example `types.js` for blocks

```js
import * as blocks from './blocks.js';

const icons = {};
const styles = {};
Object.keys(blocks).forEach((block) => {
  icons[block] = blocks[block].meta.icons || [];
  styles[block] = blocks[block].meta.styles || [];
});

export default {
  blocks: Object.keys(blocks),
  icons,
  styles: { default: [], ...styles },
};
```

### Named export files

A file that exports the plugin types as named exports is needed for each kind of plugin-types. This is so that the Lowdefy server can import these directly to allow for tree shaking to reduce bundle size by excluding unused code. In the default configuration these file names correspond to the package entry point paths, for example, the files are named `actions.js`, `blocks.js`, and `operators/client.js`, but different file names and folder structures can be configured.

###### Example `actions.js` file
```js
export { default as MyAction } from './actions/MyAction.js';
```

In the Lowdefy server, the types will be imported as:
```js
import { MyAction as MyAction } from 'my-plugin-package/actions';
```

### Plugin code

Most types are written as standard Javascript functions, and blocks are written as React components. The function names should be in _CapitalCase_, except for operators which should be written in _snake_case_ and start with an underscore.

Lowdefy uses object [destructuring](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Destructuring_assignment) to provide parameters to the type functions. These parameters include the parameters or properties defined by the user in the Lowdefy configuration. Any operators used in the configuration will be evaluated before it is passed to the type function. Other relevant metadata and helper functions are also passed to the plugin function.



---

## File: `plugins/plugins-connections.yaml`

# Connection and Request Plugins

**Section:** Plugins

Connections and requests are used to integrate with other services like API's or databases.

Connections configure the settings to the external service, and often contain parameters like connection strings, urls and secrets like passwords or API keys. Lowdefy does not execute any code for the connection, it is merely a convenient object to hold configuration that is shared by multiple requests.

Each connection type can include a number of request types. Requests are the functions that the Lowdefy server executes. The response returned by the request function will be serialised into JSON (with additional support for dates and Javascript errors) and used as the response value for the request by the client. If a promise is returned it wil be awaited.

Request parameters:
- `connection: object`: The connection `properties` defined by the user in the Lowdefy configuration. Operators are evaluated before the properties are passed to the request.
- `connectionId: string`: The connectionId used by the request and as set on the request.
- `pageId: string`: The pageId from which the request was called.
- `payload: object`: The payload data object passed to the request. Operators are evaluated on the client before the payload is passed to the server request function.
- `request: object`: The request `properties` defined by the user in the Lowdefy configuration. Operators are evaluated before the properties are passed to the request.
- `requestId: object`: The requestId of the request.

#### Schema Validation

A [JSON Schema](https://json-schema.org/) schema can be used to validate the connection and request properties before they are passed to the request function. The [ajv-errors](https://ajv.js.org/packages/ajv-errors.html) package is used to provide useful error messages if the schema validation fails. Attached the json-schema to the request function with property `schema`, to validate request input before the request function is called.

#### Examples

###### A simplified version of the AxiosHttp request:

```js
import axios from 'axios';
import { mergeObjects } from '@lowdefy/helpers';

import schema from '../schema.js';

async function AxiosHttp({ request, connection }) {
  const config = mergeObjects([connection, request]);
  const res = await axios(config);
  const { status, statusText, headers, method, path, data } = res;
  return { status, statusText, headers, method, path, data };
}

AxiosHttp.schema = schema; // Attached json-schema used to validate request input before the request function is called.
AxiosHttp.meta = {
  checkRead: false,
  checkWrite: false,
};

export default AxiosHttp;
```



---

## File: `plugins/plugins-actions.yaml`

# Action Plugins

**Section:** Plugins

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
  - `validate: function`: Call the Validate action.
- `params: any`: The `params` defined by the user in the Lowdefy configuration. Operators are evaluated before the params are passed to the action. No validation is performed on this object.

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



---

## File: `users/users-introduction.yaml`

# Introduction

**Section:** User Authentication

Lowdefy uses the [Next-Auth](https://next-auth.js.org) package to implement user authentication. Next-Auth has built in support for many sign-in services, and can be extended using Lowdefy [plugins](/plugins). User authentication can be stateless using JSON Web Tokens (JWT) or can use database sessions.

User authorization is done at the page level. Pages can be set as public or private, and role-based-access control can be used to [restrict access](https://docs.lowdefy.com/protected-pages) to pages based on a user's [roles](https://docs.lowdefy.com/roles). Authorisation checks are done on the Lowdefy server when executing requests, respecting the same authorization rules as the page the request is defined on.

The authentication system consists of the following components:

## Providers

Providers configure the identity provider used to authenticate the user. These are typically OAuth based identity providers like Google or Auth0. All the default providers in the Next-Auth package can be used, and additional providers can be added as plugins. Multiple providers can be configured, but at least one should be configured to have a working authentication system.

## Adapters

Adapters configure the connection to the database if a database is used, allowing for database sessions. This is optional, and JSON Web Tokens will be used if no adapter is configured.

## Callbacks

Callbacks are functions that are executed during certain actions of the authentication process. They are blocking - if an error is thrown they stop the action, so they can be used for access control checks. A few default callbacks are provided, but a [custom plugin](https://docs.lowdefy.com/plugins-dev) will likely need to be written.

## Events

Events are functions that are executed after certain actions of the authentication process. They are not blocking to authentication, and are best used for audit logs/ reporting or other side effects.

## Login and Logout actions

The Login and Logout actions are used to start the login and logout processes.

## \_user operator

The `_user` operator can be used to access data in the user object received from the identity provider. The OpenID Connect standard claims (fields like `name` or `email`) are mapped to the user object by default and addition fields can be configured using the `userFields` configuration option.



---

## File: `users/user-object.yaml`

# User Object

**Section:** User Authentication


---
**Nunjucks Template:**
```yaml
The `user` object contains data about the currently logged in user, and can be accessed using the [`_user`](/_user) operator. The data on the user object depends on the fields returned by the provider. By default, Next-Auth will add the `name`, `email` and `image` fields.

Lowdefy will also map the `roles` and the standard OpenID Connect claim fields from the provider to the user object. The OpenID Connect claims are:
- `sub`: The user id (Subject).
- `name`
- `given_name`
- `family_name`
- `middle_name`
- `nickname`
- `preferred_username`
- `profile`
- `picture`
- `website`
- `email`
- `email_verified`
- `gender`
- `birthdate`
- `zoneinfo`
- `locale`
- `phone_number`
- `phone_number_verified`
- `address`
- `updated_at`

To map additional fields to the user object the `auth.userFields` configuration option can be used. This should be an object, where the key is the key in the user object to which the field should be mapped, and the value is the key of the value in the data from the provider. Next-Auth provides three data objects called `account`, `profile` and `user`.

## Examples

###### Use the user profile picture in a Avatar block:
```yaml
id: avatar
type: Avatar
properties:
  src:
    _user: image
````

###### Insert user name and id (sub) when inserting a document in MongoDB:
```yaml
id: insert_data
type: MongoDBInsertOne
properties:
  doc:
    field:
      _state: field
    created_by:
      name:
        _user: name
      id:
        _user: sub
````

######  Setting all the data from the provider to the user object (Use this in development to see the data from the provider - it is not recommended to do this in production):
```yaml
lowdefy: {{ version }}
auth:
  userFields:
    account: account
    profile: profile
    user: user
```

######  Mapping fields to user object:
```yaml
lowdefy: {{ version }}
auth:
  userFields:
    id: profile.id
    roles: profile.my_roles
    # Some providers like Auth0 require custom claims to be added under a URL namespace
    openid_custom_claim: 'profile.https://example.com/custom'
```
```
---


---

## File: `users/roles.yaml`

# Roles

**Section:** User Authentication


---
**Nunjucks Template:**
```yaml
Roles can be used to limit user access to certain pages. Only users with a role linked to the page will be able to see that page, and the page will be filtered from menus if the user does not have the role.

Roles can be read from the `roles` field on the user object. It should be an array of strings which are the role names. If the provider returns a `roles` field on the user profile then this will be used, otherwise the `auth.userFields` configuration can be used to map another field to the `roles` field on the user object. Custom auth callback plugins can also be used to add a roles field to the user object.

## Examples

######  Setting user roles to the `my_roles` field returned from provider:
```yaml
lowdefy: {{ version }}
auth:
  userFields:
    roles: profile.my_roles
```

The pages that are protected by roles are configured in the `auth.roles` section in the Lowdefy configuration. This should be an object, where the keys are the role names, and the values are an array of pageIds that are protected by that role.

###### Protect pages using roles:
```yaml
lowdefy: {{ version }}
auth:
  roles:
    user-admin:
      - users
      - new-user
      - edit-user
    sales:
      - customers
      - new-customer
      - edit-customer
    reports:
      - sales-report
      - operations-report
````
```
---


---

## File: `users/protected-pages.yaml`

# Protected pages

**Section:** User Authentication


---
**Nunjucks Template:**
```yaml
By default, all the pages in a Lowdefy app are public. Protected pages are pages that can only be accessed by a logged in user. If a user that is not logged in tries to access a protected page, the user will be redirected to the 404 page. Pages that a user are not allowed to see will be filtered from the app menus.

The config can either be set to protect all pages, except for a list of public pages, or vice-versa, all pages are public except for a a list of protected pages.

Protected and public pages can be configured in the `auth.pages` section of the Lowdefy configuration. Here the fields `protected` and `public` fields can be set to true, or a list of pageIds. You cannot set `protected` or `public` to `false`, and both can't be an array or `true`.

When protecting all pages in the app, you will need to set at least one page as public, to allow users to log in to the app.

The 404 page (used to indicate that a requested page cannot be found) is always a public page. A default 404 page will be created if you do not specify one, but if you create a page with pageId `'404'` then that page will be the 404 page.

## Examples

###### List specific public pages:
```yaml
lowdefy: {{ version }}
auth:
  pages:
    protected: true
    public:
      - '404'
      - login
      - public-page
````
###### List specific protected pages:
```yaml
lowdefy: {{ version }}
auth:
  pages:
    public: true
    protected:
      - admin
      - users
````
```
---


---

## File: `users/login-and-logout.yaml`

# Login and Logout

**Section:** User Authentication

The [`Login`](/Login) and [`Logout`](/Logout) actions can be used to log users in and out.

## Login

The `Login` action is used to start the user login flow. If only one OAuth provider is configured, or the `Login` action is called with a `providerId`, the `Login` action requests the Provider's authorization URL from the Lowdefy server, and redirects the user to this URL. Otherwise, the action redirects the user to a page where the user can choose which provider to use to sign in.

The authorization url usually hosts a page where the user can input their credentials. After the user has logged in successfully, the user is redirected to the `/api/auth/callback/<provider_id>` route in the Lowdefy app, where the rest of the authorization code flow is completed. This URL usually needs to be configured in the identity provider's settings.

The `callbackUrl` parameters of the Login action specify where the user is redirected after login is complete. If `callbackUrl` parameters not set, the user will return to the page from which the action was called.

The parameters are:
- `authUrl: object`:
  - `urlQuery: object`: Query parameters to set for the authorization URL.
- `callbackUrl: object`:
  - `home: boolean`: Redirect to the home page after the login flow is complete.
  - `pageId: string`: The pageId of the page to redirect to after the login flow is complete.
  - `url: string`: The URL to redirect to after the login flow is complete.
  - `urlQuery: object`: The urlQuery to set for the page the user is redirected to after login.
- `providerId: string`: The ID of the provider that should be used for login. If not set and only one provider is configured the configured provider will be used. Else the user will be redirected to a sign in page where they can choose a provider.

## Examples

###### A login page that redirects users in the onMount event:
```yaml
id: login
type: Box
events:
  onMount:
    # Redirect to "page1" if user is already logged in.
    - id: logged_in_redirect
      type: Link
      skip:
        _eq:
          - _user: sub
          - null
      params:
        pageId: page1
    # Call the Login action to log the user in.
    - id: login
      type: Login
      skip:
        _ne:
          - _user: sub
          - null
      params:
        # Redirect to "page1" after login is complete.
        callbackUrl:
          pageId: page1
```

###### A set of login and logout buttons:
```yaml
id: login_logout
type: Box
blocks:
  - id: Login
    type: Button
    visible:
      _eq:
        - _user: sub
        - null
    events:
      onClick:
        - id: login
          type: Login
  - id: Logout
    type: Button
    visible:
      _ne:
        - _user: sub
        - null
    events:
      onClick:
        - id: logout
          type: Logout
```

###### A signup button that uses `authUrl.urlQuery` to request the signup screen:
```yaml
id: Signup
type: Button
events:
  onClick:
    - id: signup
      type: Login
      params:
        authUrl:
          urlQuery:
            screen_hint: signup
```

## Logout

When the `Logout` action is called, the user data and authorization cookies are cleared by the app.

The `callbackUrl` parameters of the Logout action specify where the user is redirected after logout is complete. If `callbackUrl` parameters are not set, the user will return to the page from which the action was called.

The parameters are:
- `callbackUrl: object`:
  - `home: boolean`: Redirect to the home page after the login flow is complete.
  - `pageId: string`: The pageId of the page to redirect to after the login flow is complete.
  - `url: string`: The URL to redirect to after the login flow is complete.
  - `urlQuery: object`: The urlQuery to set for the page the user is redirected to after login.
- `redirect: boolean`: If set to `false` the user session will be cleared, but the page will not be reloaded.


#### Examples

###### Redirect to the `logged-out` page in the app after logout:
```yaml
id: Logout
type: Button
events:
  onClick:
    - id: logout
      type: Logout
      params:
        callbackUrl:
          pageId: logged-out
```



---

## File: `users/auth-providers.yaml`

# Authentication Providers

**Section:** User Authentication

Providers are used to configure the identity providers that will be used to authenticate users. To add user authentication to your app, at least one provider must be configured. More than one provider can be configured to allow users to sign in using their choice of identity provider.

## OAuth Providers

Auth.js supports a large number of OAuth identity providers. During the OAuth flow, a user is redirected to a webpage hosted by the provider, where they usually authenticate using their credentials if not already signed in. They are then redirected back to the Lowdefy application, and the Lowdefy application interacts with the providers's API to verify the login and get the user details like name and email address.

## Email Provider

Auth.js supports email login, where a link with a token is sent to the user's email address and the user can click on the link to log in (often called "magic links"). To use email authentication an Adapter must be configured, since the verification tokens need to be stored in a database.

## Credentials Provider

Auth.js provides a credentials provider, which can be used to sign in using any other credentials, such as username and password or Web3. Lowdefy does not provide any credential providers, but a credentials provider can be written as a [plugin](/plugins-dev).



---

## File: `users/auth-configuration.yaml`

# Auth Configuration

**Section:** User Authentication


---
**Nunjucks Template:**
```yaml
The `auth` section of the Lowdefy configuration is used to configure the user authentication settings.

The `_secret` operator is evaluated over the entire section.

## User Fields

The `auth.userFields` section of the auth config is used to configure which data fields from the provider are mapped to the `user` data object. NextAuth provides three data objects from which data can read, namely `account`, `profile` and `user`. The content of these objects depends on the provider that was used.

See [User Object](/user-object) and [Next-Auth JWT Callback](https://next-auth.js.org/configuration/callbacks#jwt-callback) for more details.

## Theme

The `auth.theme` section maps to the [NextAuth theme options](https://next-auth.js.org/configuration/options#theme).

The options are:
- `colorScheme: enum`: Sets the color scheme of the Next-Auth auth pages. Options are `"auto"`, `"dark"` and `"light"`. The default is `"auto"`.
- `brandColor: string`: A hex color code of the color to use as accent color on the Next-Auth auth pages.
- `logo: string`: The absolute URL of an image to be used as logo on the auth pages.
- `buttonText: string`: A hex color code of the color to use for button text.

## Auth Pages

The `auth.authPages` section can be used to override the auth pages provided by NextAuth. The values should link to pages inside the Lowdefy app.

See [here](https://next-auth.js.org/configuration/pages) for more details.

The options are:
- `signIn: string`
- `signOut: string`
- `error: string`
- `verifyRequest: string`: Used for check email message.
- `newUser: string`: New users will be directed here on first sign in (leave the property out if not of interest)

###### Configure a custom sign-in page
```yaml
lowdefy: {{ version }}

auth:
  authPages:
    signIn: /login
```

## Session

The `auth.session` config maps to the [NextAuth session](https://next-auth.js.org/configuration/options#session) config option. It can be used to set the maximum session length using the `auth.session.maxAge` option.

###### Set a maximum session length of twelve hours
```yaml
lowdefy: {{ version }}

auth:
  session:
    maxAge: 43200 # 12 hours in seconds
```

## Debug

If the server log level is set to `debug`, the Next-Auth debug mode will be enabled. The `auth.debug` property can be set to false to disable authentication debug output.

## Cookies

The  `auth.advanced.cookies` section can be used to overwrite the NextAuth cookie options. This is an advanced option and using it is not recommended as you may break authentication or introduce security flaws into your application. See [here](https://next-auth.js.org/configuration/options#cookies) for more details.
```
---


---

## File: `users/reference/next-auth-providers.yaml`

# Next Auth Providers

**Section:** User Authentication


---
**Nunjucks Template:**
```yaml
All Next-Auth preconfigured OAuth providers can used in a Lowdefy app. The provider properties are mapped through directly, so the Next-Auth documentation can be used as reference. They usually only need a few configuration properties to be used. Since these properties include secrets, the [`_secret`](/_secret) operator should be used to configure these properties.

For most OAuth providers, a callback URL must be configured with the provider for security reasons. This URL is the URL to which the user will be redirected to complete the login flow. This URL should be set to `<app-domain>/api/auth/callback/<providerId>` where the `providerId` is the Lowdefy providerId.

> This is not the same as the callback URL specified in the Login action, which is where the user is redirected by the Lowdefy app once login is complete.

The providers that can be used are:

- [FortyTwoProvider](https://next-auth.js.org/providers/42-school)
- [AppleProvider](https://next-auth.js.org/providers/apple)
- [AtlassianProvider](https://next-auth.js.org/providers/atlassian)
- [Auth0Provider](https://next-auth.js.org/providers/auth0)
- [AuthentikProvider](https://next-auth.js.org/providers/authentik)
- [AzureADB2CProvider](https://next-auth.js.org/providers/azure-ad-b2c)
- [BattleNetProvider](https://next-auth.js.org/providers/azure-ad)
- [BattleNetProvider](https://next-auth.js.org/providers/battle.net)
- [BoxProvider](https://next-auth.js.org/providers/box)
- [BoxyHQSAMLProvider](https://next-auth.js.org/providers/boxyhq-saml)
- [BungieProvider](https://next-auth.js.org/providers/bungie)
- [CognitoProvider](https://next-auth.js.org/providers/cognito)
- [CoinbaseProvider](https://next-auth.js.org/providers/coinbase)
- [DiscordProvider](https://next-auth.js.org/providers/discord)
- [DropboxProvider](https://next-auth.js.org/providers/dropbox)
- [EVEOnlineProvider](https://next-auth.js.org/providers/eveonline)
- [FacebookProvider](https://next-auth.js.org/providers/facebook)
- [FaceItProvider](https://next-auth.js.org/providers/faceit)
- [FourSquareProvider](https://next-auth.js.org/providers/foursquare)
- [FreshbooksProvider](https://next-auth.js.org/providers/freshbooks)
- [FusionAuthProvider](https://next-auth.js.org/providers/fusionauth)
- [GitHubProvider](https://next-auth.js.org/providers/github)
- [GitlabProvider](https://next-auth.js.org/providers/gitlab)
- [GoogleProvider](https://next-auth.js.org/providers/google)
- [HubspotProvider](https://next-auth.js.org/providers/hubspot)
- [InstagramProvider](https://next-auth.js.org/providers/instagram)
- [KakaoProvider](https://next-auth.js.org/providers/kakao)
- [KeycloakProvider](https://next-auth.js.org/providers/keycloak)
- [LineProvider](https://next-auth.js.org/providers/line)
- [LinkedInProvider](https://next-auth.js.org/providers/linkedin)
- [MailchimpProvider](https://next-auth.js.org/providers/mailchimp)
- [MailRuProvider](https://next-auth.js.org/providers/mailru)
- [MediumProvider](https://next-auth.js.org/providers/medium)
- [NaverProvider](https://next-auth.js.org/providers/naver)
- [NetlifyProvider](https://next-auth.js.org/providers/netlify)
- [OktaProvider](https://next-auth.js.org/providers/okta)
- [OneLoginProvider](https://next-auth.js.org/providers/onelogin)
- [OssoProvider](https://next-auth.js.org/providers/osso)
- [OsuProvider](https://next-auth.js.org/providers/osu)
- [PassageProvider](https://authjs.dev/reference/core/providers_passage)
- [PatreonProvider](https://next-auth.js.org/providers/patreon)
- [PinterestProvider](https://next-auth.js.org/providers/pinterest)
- [PipedriveProvider](https://next-auth.js.org/providers/pipedrive)
- [RedditProvider](https://next-auth.js.org/providers/reddit)
- [SalesforceProvider](https://next-auth.js.org/providers/salesforce)
- [SlackProvider](https://next-auth.js.org/providers/slack)
- [SpotifyProvider](https://next-auth.js.org/providers/spotify)
- [StravaProvider](https://next-auth.js.org/providers/strava)
- [TodoistProvider](https://next-auth.js.org/providers/todoist)
- [TraktProvider](https://next-auth.js.org/providers/trakt)
- [TwitchProvider](https://next-auth.js.org/providers/twitch)
- [TwitterProvider](https://next-auth.js.org/providers/twitter)
- [UnitedEffects](https://next-auth.js.org/providers/united-effects)
- [VkProvider](https://next-auth.js.org/providers/vk)
- [WikimediaProvider](https://next-auth.js.org/providers/wikimedia)
- [WordpressProvider](https://next-auth.js.org/providers/wordpress)
- [WorkOSProvider](https://next-auth.js.org/providers/workos)
- [YandexProvider](https://next-auth.js.org/providers/yandex)
- [ZitadelProvider](https://next-auth.js.org/providers/zitadel)
- [ZohoProvider](https://next-auth.js.org/providers/zoho)
- [ZoomProvider](https://next-auth.js.org/providers/zoom)

#### Examples

###### Auth0 configuration:

```yaml
lowdefy: {{ version }}
auth:
  providers:
    - id: auth0
      type: Auth0Provider
      properties:
        clientId:
          _secret: AUTH0_CLIENT_ID
        clientSecret:
          _secret: AUTH0_CLIENT_SECRET
        issuer:
          _secret: AUTH0_ISSUER
```

In Auth0, the callback URL should be configured to `https://example.com/api/auth/callback/auth0` for production and `http://localhost:3000/api/auth/callback/auth0` for development.

###### GitHub configuration:

```yaml
lowdefy: {{ version }}
auth:
  providers:
    - id: github
      type: GitHubProvider
      properties:
        clientId:
          _secret: GITHUB_CLIENT_ID
        clientSecret:
          _secret: GITHUB_CLIENT_SECRET
```
```
---


---

## File: `users/reference/OpenIDConnectProvider.yaml`

# OpenIDConnectProvider

**Section:** User Authentication


---
**Nunjucks Template:**
```yaml
The OpenIDConnectProvider can be used to authenticate with a OpenID Connect compliant identity provider that is not already included as a default Next-Auth provider, without the need to develop a custom provider plugin.

#### Properties

###### object
  - `wellKnown: string`
  - `authorization: string | object`: The default is `{ params: { scope: 'openid email profile' } }`.
  - `token: string | object`
  - `userinfo: string | object`
  - `version: string`
  - `checks: string | string[]`: The default is `['pkce', 'state']`
  - `clientId: string`
  - `clientSecret: string`
  - `idToken: boolean`: The default is `true`.
  - `region: string`
  - `issuer: string`
  - `allowDangerousEmailAccountLinking: boolean`
  - `style: object`

###### See the [Next-Auth OAuth provider options](https://next-auth.js.org/configuration/providers/oauth#options) for more details on provider properties.

#### Examples

###### Simple configuration.

Usually only the `wellKnown`, `clientId` and `clientSecret` properties need to be configured:

```yaml
lowdefy: {{ version }}
providers:
  - id: my_provider
    type: OpenIDConnectProvider
    properties:
      wellKnown:
        _secret: OPENID_CONNECT_WELLKNOWN
      clientId:
        _secret: OPENID_CONNECT_CLIENT_ID
      clientSecret:
        _secret: OPENID_CONNECT_CLIENT_SECRET
```

where `LOWDEFY_SECRET_OPENID_CONNECT_WELLKNOWN` usually has the format `https://my-provider.com/.well-known/openid-configuration`
```
---


---

## File: `users/reference/MongoDBAdapter.yaml`

# MongoDBAdapter

**Section:** User Authentication


---
**Nunjucks Template:**
```yaml
The MongoDBAdapter can be used to connect Next-Auth to a MongoDB database. It uses the [Next-Auth adapter-mongodb](https://next-auth.js.org/adapters/mongodb) package. It uses the same `databaseUri` and client options configuration as the `MongoDBCollection` connection. The collection names used by the adapter can be configured using the `options.collections` property. The default values are `users`, `accounts`, `sessions` and `verification_tokens`.


#### Properties

###### object
  - `databaseUri: string`: Required - Connection uri string for the MongoDb deployment. Should be stored using the _secret operator.
  - `mongoDBClientOptions: object`: See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/interfaces/mongoclientoptions.html) for more information.
  - `options: object`:
    - `collections: object`: Set names of MongoDB collections used.
    - `databaseName`: Set the MongoDB database name. This is optional if the database name is specified in the `databaseUri`.

#### Examples

###### Minimum configuration.

```yaml
lowdefy: {{ version }}
auth:
  adapter:
    id: mdb_adapter
    type: MongoDBAdapter
    properties:
      databaseUri:
        _secret: MONGODB_URI
```

###### Full configuration.

```yaml
lowdefy: {{ version }}
auth:
  adapter:
    id: mdb_adapter
    type: MongoDBAdapter
    properties:
      databaseUri:
        _secret: MONGODB_URI
      # Optional MongoDB client options, only set these if necessary
      mongoDBClientOptions:
        connectTimeoutMS: 2000
      options:
        databaseName: my-database # Optional
        # Optionally configure the collection names used
        collections:
          Users: my_users
          Accounts: my_accounts
          Sessions: my_sessions
          VerificationTokens: my_verification_tokens
```
```
---


---

## File: `users/reference/Auth0LogoutCallback.yaml`

# Auth0LogoutCallback

**Section:** User Authentication


---
**Nunjucks Template:**
```yaml
The Auth0LogoutCallback can be used to log the user out from Auth0 when logging out of the Lowdefy app. The callback takes a `returnToPageId` property, which is the pageId the user will be directed to after logout from Auth0 is complete. The URL which the user will be directed to needs to be configured with Auth0 as an allowed logout URL.

To trigger the Auth0 logout, the `Logout` action `callbackUrl.url` param should be set to `AUTH0_LOGOUT`.

#### Properties

###### object
- `issuer: string`: Auth0 issuer URL. This should be the same that was used for the `Auth0Provider`.
- `clientId: string`: Auth0 client ID. This should be the same that was used for the `Auth0Provider`.
- `returnToPagedId: string`: The pageId in the Lowdefy application to which the user should be redirected affter logging out from Auth0.

#### Examples

###### Configuring Auth0LogoutCallback.

```yaml
lowdefy: {{ version }}
providers:
  - id: auth0
    type: Auth0Provider
    properties:
      clientId:
        _secret: AUTH0_CLIENT_ID
      clientSecret:
        _secret: AUTH0_CLIENT_SECRET
      issuer:
        _secret: AUTH0_ISSUER
callbacks:
  - id: auth0_logout
    type: Auth0LogoutCallback
    properties:
      clientId:
        _secret: AUTH0_CLIENT_ID
      issuer:
        _secret: AUTH0_ISSUER
      returnToPagedId: logged-out
```

The Auth0 allowed logout URLS should be set to `https://my-app.com/logged-out` for production and `http://localhost:3000/logged-out` for development.

###### Logging out.
```yaml
id: logout_button
type: Button
events:
  onClick:
    - id: logout
      type: Logout
      params:
        callbackUrl:
          url: AUTH0_LOGOUT
```
```
---


---

## File: `blocks/all_icons.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

- AiFillAlert
- AiFillApi
- AiFillBell
- AiFillCamera
- AiFillCheckCircle
- AiOutlineCloseCircle
- AiOutlineException
- AiOutlineExclamation
- AiOutlineExperiment
- AiOutlineForm
- AiOutlineHome

```
---

## File: `blocks/list/TimelineList.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# TODO: Fix schema to add to docs

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: TimelineList
    category: list
    schema: ../plugins/blocks/blocks-antd/src/blocks/TimelineList/schema.json
    filePath: blocks/TimelineList/TimelineList.yaml
    description_content: |
      The TimelineList block renders a content area for all items in the array. All list blocks create a array in state at their block `id`. The list content areas are rendered for each index in the array. See the [List Concept](/lists) page for a detailed description on how to work with lists.

      The timeline nodes can be customized based on the array data.
    areas:
      - content
    init_state_values:
      shipment_events:
        - type: Order Placed
          icon: AiTwoToneShoppingCart
          color: '#2f54eb'
          orderNumber: 2112
          timestamp:
            _date: '2021-02-10T20:30:00.000Z'
          item:
            code: ax2m-83kl9-ck
            title: Useless Glue
        - type: Shipped
          icon: AiTwoToneGift
          color: '#fa8c16'
          orderNumber: 2112
          timestamp:
            _date: '2021-02-11T08:33:00.000Z'
        - type: Cleared Customs
          icon: AiTwoToneFileDone
          color: '#13c2c2'
          orderNumber: 2112
          timestamp:
            _date: '2021-02-11T16:12:00.000Z'
        - type: Delivered
          icon: AiTwoToneCheckCircle
          color: '#52c41a'
          orderNumber: 2112
          timestamp:
            _date: '2021-02-11T16:12:00.000Z'

    methods:
      - name: pushItem
        onClick:
          - id: pushItem
            type: CallMethod
            params:
              blockId: block_id
              method: pushItem
      - name: unshiftItem
        onClick:
          - id: unshiftItem
            type: CallMethod
            params:
              blockId: block_id
              method: unshiftItem
      - name: removeItem at index 1
        onClick:
          - id: removeItem
            type: CallMethod
            params:
              blockId: block_id
              method: removeItem
              args:
                - 1
      - name: for index 1 moveItemDown
        onClick:
          - id: moveItemDown
            type: CallMethod
            params:
              blockId: block_id
              method: moveItemDown
              args:
                - 1
      - name: for index 1 moveItemUp
        onClick:
          - id: moveItemUp
            type: CallMethod
            params:
              blockId: block_id
              method: moveItemUp
              args:
                - 1
    examples:
      - title: Shipment Event Log
        block:
          id: shipment_events
          type: TimelineList
          blocks:
            - id: todo_input
              type: TextInput
              layout:
                grow: 1
              properties:
                label:
                  disabled: true
                placeholder: Write something todo...
        extra:
          id: ex_state
          type: MarkdownWithCode
          style:
            paddingTop: 16
          properties:
            content:
              _nunjucks:
                template: |
                  ###### Shipment Events State Value:
                  ```yaml
                  {{ value | safe }}
                  ```
                on:
                  value:
                    _yaml.stringify:
                      on:
                        shipment_events:
                          _state: shipment_events
                      options:
                        sortKeys: false

```
---

## File: `blocks/list/List.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: List
    category: list
    schema: ../plugins/blocks/blocks-basic/src/blocks/List/schema.json
    filePath: blocks/list/List.yaml
    description_content: |
      The List block renders a content area for all items in the array. All list blocks create a array in state at their block `id`. The list content areas are rendered for each index in the array. See the [List Concept](/lists) page for a detailed description on how to work with lists.
    areas:
      - content
    init_state_values:
      todos:
        - Bake a 🧁
        - Eat a🍦
        - Phone a 🦖
    methods:
      - name: pushItem
        onClick:
          - id: pushItem
            type: CallMethod
            params:
              blockId: block_id
              method: pushItem
      - name: unshiftItem
        onClick:
          - id: unshiftItem
            type: CallMethod
            params:
              blockId: block_id
              method: unshiftItem
      - name: removeItem at index 1
        onClick:
          - id: removeItem
            type: CallMethod
            params:
              blockId: block_id
              method: removeItem
              args:
                - 1
      - name: for index 1 moveItemDown
        onClick:
          - id: moveItemDown
            type: CallMethod
            params:
              blockId: block_id
              method: moveItemDown
              args:
                - 1
      - name: for index 1 moveItemUp
        onClick:
          - id: moveItemUp
            type: CallMethod
            params:
              blockId: block_id
              method: moveItemUp
              args:
                - 1
    examples:
      - title: Todo List
        block:
          id: todo_app
          type: Box
          layout:
            contentGutter: 16
          blocks:
            - id: todo_input
              type: TextInput
              layout:
                grow: 1
              properties:
                label:
                  disabled: true
                placeholder: Write something todo...
            - id: add_item
              type: Button
              layout:
                shrink: 1
              properties:
                title: Add item
                icon: AiOutlinePlus
              events:
                onClick:
                  - id: add
                    type: SetState
                    params:
                      todos:
                        _array.concat:
                          - [_state: todo_input]
                          - _state: todos
                      todo_input: null
            - id: todos
              type: List
              layout:
                contentGutter: 16
              blocks:
                - id: todos.$
                  type: TitleInput
                  layout:
                    grow: 1
                  properties:
                    level: 4
                - id: remove_item
                  type: Icon
                  layout:
                    shrink: 1
                  properties:
                    name: AiOutlineMinusCircle
                    size: 18
                  events:
                    onClick:
                      - id: remove
                        type: CallMethod
                        messages:
                          loading: Removing Item...
                          success: Item Removed.
                        params:
                          blockId: todos
                          method: removeItem
                          args:
                            - _index: 0

        extra:
          id: ex_state
          type: MarkdownWithCode
          style:
            paddingTop: 16
          properties:
            content:
              _nunjucks:
                template: |
                  ###### Todos State Value:
                  ```yaml
                  {{ value | safe }}
                  ```
                on:
                  value:
                    _yaml.stringify:
                      on:
                        todos:
                          _state: todos
                      options:
                        sortKeys: false

```
---

## File: `blocks/list/ControlledList.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: ControlledList
    category: list
    schema: ../plugins/blocks/blocks-antd/src/blocks/ControlledList/schema.json
    filePath: blocks/list/ControlledList.yaml
    description_content: |
      The ControlledList block renders a content area for all items in the array into the list card and provides easy UI elements to add or remove items in the list. All list blocks create a array in state at their block `id`. The list content areas are rendered for each index in the array. See the [List Concept](/lists) page for a detailed description on how to work with lists.
    areas:
      - content
    methods:
      - name: pushItem
        onClick:
          - id: pushItem
            type: CallMethod
            params:
              blockId: block_id
              method: pushItem
      - name: unshiftItem
        onClick:
          - id: unshiftItem
            type: CallMethod
            params:
              blockId: block_id
              method: unshiftItem
      - name: removeItem at index 1
        onClick:
          - id: removeItem
            type: CallMethod
            params:
              blockId: block_id
              method: removeItem
              args:
                - 1
      - name: for index 1 moveItemDown
        onClick:
          - id: moveItemDown
            type: CallMethod
            params:
              blockId: block_id
              method: moveItemDown
              args:
                - 1
      - name: for index 1 moveItemUp
        onClick:
          - id: moveItemUp
            type: CallMethod
            params:
              blockId: block_id
              method: moveItemUp
              args:
                - 1
    init_state_values:
      todos:
        - Add the noodles.
        - Let it cook for a minute.
        - Add some 🌶.
    examples:
      - title: Todo List
        block:
          id: todos
          type: ControlledList
          blocks:
            - id: todos.$
              type: TitleInput
              properties:
                level: 4
        extra:
          id: ex_state
          type: MarkdownWithCode
          style:
            paddingTop: 16
          properties:
            content:
              _nunjucks:
                template: |
                  ###### Todos State Value:
                  ```yaml
                  {{ value | safe }}
                  ```
                on:
                  value:
                    _yaml.stringify:
                      on:
                        todos:
                          _state: todos
                      options:
                        sortKeys: false
      - title: List of Contacts
        block:
          id: contacts
          type: ControlledList
          blocks:
            - id: contacts.$.first_name
              type: TextInput
              layout:
                span: 12
              required: true
              properties:
                title: First Name
                label:
                  span: 10
                  align: right
            - id: contacts.$.last_name
              type: TextInput
              layout:
                span: 12
              required: true
              properties:
                title: Last Name
                label:
                  span: 10
                  align: right

            - id: contacts.$.date_of_birth
              type: DateSelector
              layout:
                span: 12
              required: true
              properties:
                title: Date of Birth
                label:
                  span: 10
                  align: right
            - id: contacts.$.email
              type: TextInput
              layout:
                span: 12
              required: true
              properties:
                title: Email address
                label:
                  span: 10
                  align: right
            - id: contacts.$.phone_number
              type: TextInput
              layout:
                span: 12
              properties:
                title: Phone number
                label:
                  span: 10
                  align: right
            - id: contacts.$.preference
              type: ButtonSelector
              layout:
                span: 12
              properties:
                title: Preference
                label:
                  span: 10
                  align: right
                options:
                  - Phone
                  - Email
        extra:
          id: ex_state
          type: MarkdownWithCode
          style:
            paddingTop: 16
          properties:
            content:
              _nunjucks:
                template: |
                  ###### Contacts State Value:
                  ```yaml
                  {{ value | safe }}
                  ```
                on:
                  value:
                    _yaml.stringify:
                      on:
                        contacts:
                          _state: contacts
                      options:
                        sortKeys: false

```
---

## File: `blocks/input/WeekSelector.yaml`

## Description

The `WeekSelector` block allows a user to select a week. The value is a date object, with day and time values of midnight on the first monday of the week GMT.

> Other date type blocks are `DateRangeSelector`, `DateSelector`, `DateTimeSelector` and `MonthSelector`.


---

## File: `blocks/input/TreeSelector.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: TreeSelector
    value_type: any
    category: input
    schema: ../plugins/blocks/blocks-antd/src/blocks/TreeSelector/schema.json
    filePath: blocks/input/TreeSelector.yaml
    init_state_values:
      __type_block.properties.options: object[]
      __object_arr_block.properties.options:
        - label: Node 1
          value: '1'
          children:
            - label: Node 1.1
              value: '1.1'
        - label: Node 2
          value: '2'
          children:
            - label: Node 2.1
              value: '2.1'

    description_content: |
      The `TreeSelector` block allows a user to display, collapse and select a single node from a hierarchical list in a tree structure.

      The options for the selector can be provided as an array of label-value pairs, where the label is a string, and the value can be of any type, including objects like dates and arrays.

      The value in state is an array of values with the selected node value first followed by any parent node values.

    examples:
      - title: Tree list of type and category with connecting line and single select.
        block:
          id: tree_list_type_category
          type: TreeSelector
          properties:
            showLine: true
            options:
              - label: Type
                value: type
                children:
                  - label: One
                    value: 1
                  - label: Two
                    value: 2
                  - label: Three
                    value: 3
              - label: Category
                value: category
                children:
                  - label: One
                    value: 1
                  - label: Two
                    value: 2
                  - label: Three
                    value: 3

```
---

## File: `blocks/input/TitleInput.yaml`

## Description

The `TitleInput` block can display a title, yet allow the user to click a edit icon and change the title. This is useful when the UI renders an existing document with a title, which a user must be able to edit.


---

## File: `blocks/input/TextInput.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: TextInput
    value_type: string
    category: input
    schema: ../plugins/blocks/blocks-antd/src/blocks/TextInput/schema.json
    filePath: blocks/input/TextInput.yaml
    description_content: |
      The `TextInput` block is a single line text input.

    examples:
      - title: Required text input
        block:
          id: required_example
          type: TextInput
          required: true
          properties:
            title: Required text input
      - title: Placeholder
        block:
          id: placeholder_example
          type: TextInput
          properties:
            placeholder: Placeholder
      - title: Prefix and suffix text
        block:
          id: prefix_suffix_example
          type: TextInput
          properties:
            label:
              extra: Prefix and suffix text
            prefix: The cat
            placeholder: chased
            suffix: the rat
      - title: User name
        block:
          id: username
          type: TextInput
          properties:
            title: First Name
            suffixIcon: AiOutlineUser
            placeholder: Your name
            label:
              span: 6
      - title: Field Type
        block:
          id: field_type_example
          type: TextInput
          properties:
            type: password
            label:
              span: 6

```
---

## File: `blocks/input/TextArea.yaml`

## Description

The `TextArea` block is a text input that has multiple rows of input. It can be set to a fixed number of rows, or it can expand automatically as the user inputs more text.


---

## File: `blocks/input/Switch.yaml`

## Description

The `Switch` block is an on/off input. It has a boolean value (true/false).


---

## File: `blocks/input/Selector.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Selector
    value_type: any
    category: input
    schema: ../plugins/blocks/blocks-antd/src/blocks/Selector/schema.json
    filePath: blocks/input/Selector.yaml
    init_state_values:
      __type_block.properties.options: object[]
      __object_arr_block.properties.options:
        - label: First
          value: '1'
        - label: Second
          value: '2'

    description_content: |
      The `Selector` block is a drop down selector that allows a user to select a single value from a set of options.

      The options for the selector can be provides as either an array of primitive values (Strings, numbers, booleans or dates), or as an array of label-value pairs, where the label is a string, and the value can be of any type, including objects like dates and arrays.

      > Other selector blocks are `ButtonSelector`, `CheckboxSelector`, `MultipleSelector` and `RadioSelector`.

    examples:
      - title: Listing options from database search
        block:
          id: example_selector
          type: Selector
          requests:
            - id: example_search
              type: MongoDBAggregation
              connectionId: companies
              payload:
                search_input:
                  _state: search_input
              properties:
                pipeline:
                  - $search:
                      compound:
                        should:
                          - wildcard:
                              query:
                                _string.concat:
                                  - '*'
                                  - payload: search_input
                                  - '*'
                              path: # field names to search in the companies collection
                                - _id
                                - company_name
                              allowAnalyzedField: true
                  - $addFields:
                      score:
                        $meta: searchScore
                  - $sort:
                      score: -1
                  - $limit: 50
                  - $project: # selector options value, label pairs
                      _id: 0
                      value: $_id
                      label:
                        $concat:
                          - $_id
                          - ' - '
                          - $ifNull:
                              - $company_name
                              - ''
          properties:
            placeholder: Search
            options:
              _if_none: # search request results will be used as options
                - _request: example_search
                - []
            label:
              disabled: true
          events:
            onSearch: # selector onSearch actions
              debounce:
                ms: 500
              try:
                - id: set_state
                  type: SetState
                  params:
                    search_input:
                      _event: value
                - id: perform_search
                  type: Request
                  params: example_search

```
---

## File: `blocks/input/S3UploadPhoto.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: S3UploadPhoto
    value_type: object
    category: input
    schema: ../plugins/plugins/plugin-aws/src/blocks/S3UploadPhoto/schema.json
    filePath: blocks/input/S3UploadPhoto.yaml
    description_content: |
      The `S3UploadPhoto` block allows a user to to upload a photo to AWS S3.

      The `s3PostPolicyRequestId` property is required, and should be the `id` of a [`AwsS3PresignedPostPolicy`](/AWSS3) request. This request is called by the block when the user uploads a file, to create a policy that allows a file to be uploaded to AWS S3.

      The block has an object value in state, with a `file` key, which has an object corresponding to the last uploaded file, and a `fileList` array with objects for each the files.

      For the examples to work, a `AwsS3Bucket` connection is required. For example:
      ```yaml
        connections:
        - id: files
          type: AwsS3Bucket
          properties:
            accessKeyId:
              _secret: FILES_S3_ACCESS_KEY_ID
            secretAccessKey:
              _secret: FILES_S3_SECRET_ACCESS_KEY
            region: af-south-1
            bucket:
              _secret: FILES_S3_BUCKET
            write: true
      ````

      > The examples on this page is not setup with a [`AwsS3Bucket`](/AWSS3) connection, and thus will throw.

    examples:
      - title: Basic S3UploadPhoto Example
        block:
          id: attach_files
          type: S3UploadPhoto
          properties:
            s3PostPolicyRequestId: upload_file
          requests:
            - id: upload_file
              type: AwsS3PresignedPostPolicy
              connectionId: files
              payload:
                filename:
                  _event: file.name
              properties:
                key:
                  _nunjucks:
                    template: '{{ now | date("YYYYMMDD_HHmmssS") }}_{{ filename }}'
                    on:
                      now:
                        _date: now
                      filename:
                        _payload: filename

```
---

## File: `blocks/input/S3UploadDragger.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http:www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: S3UploadDragger
    value_type: object
    category: input
    schema: ../plugins/plugins/plugin-aws/src/blocks/S3UploadDragger/schema.json
    filePath: blocks/input/S3UploadDragger.yaml
    description_content: |
      The `S3UploadDragger` block allows a user to to upload a file to AWS S3.

      The `s3PostPolicyRequestId` property is required, and should be the `id` of a [`AwsS3PresignedPostPolicy`](/AWSS3) request. This request is called by the block when the user uploads a file, to create a policy that allows a file to be uploaded to AWS S3.

      The block has an object value in state, with a `file` key, which has an object corresponding to the last uploaded file, and a `fileList` array with objects for each the files.

      It provides a draggable content area for file upload, with a default text. It also exposes an `onPaste` event that can be used to handle pasted files.

      For the examples to work, a `AwsS3Bucket` connection is required. For example:
      ```yaml
        connections:
        - id: files
          type: AwsS3Bucket
          properties:
            accessKeyId:
              _secret: FILES_S3_ACCESS_KEY_ID
            secretAccessKey:
              _secret: FILES_S3_SECRET_ACCESS_KEY
            region: af-south-1
            bucket:
              _secret: FILES_S3_BUCKET
            write: true

      > The examples on this page is not setup with a [`AwsS3Bucket`](/AWSS3) connection, and thus will throw.

      ````
    init_state_values:
      block_id:
        file:
          key: 'example.pdf'
          type: 'application/pdf'
          name: example.pdf
        fileList:
          - key: 'example.pdf'
            type: 'application/pdf'
            name: example.pdf
          - key: 'example_two.pdf'
            type: 'application/pdf'
            name: example_two.pdf
    # methods:
    #   - name: uploadFromPaste
    #     onPaste:
    #       - id: uploadFromPaste
    #         type: CallMethod
    #         params:
    #           blockId: block_id
    #           method: uploadFromPaste
    examples:
      - title: Basic S3UploadDragger Example
        block:
          id: attach_files
          type: S3UploadDragger
          properties:
            s3PostPolicyRequestId: upload
          requests:
            - id: upload
              type: AwsS3PresignedPostPolicy
              connectionId: files
              payload:
                filename:
                  _event: file.name
                content_type:
                  _event: file.type
              properties:
                fields:
                  Content-Type:
                    _payload: content_type
                key:
                  _nunjucks:
                    template: '{{ now | date("YYYYMMDD_HHmmssS") }}_{{ filename }}'
                    on:
                      now:
                        _date: now
                      filename:
                        _payload: filename
      - title: S3UploadDragger Example with onPaste event
        block:
          id: on_file_paste
          type: Box
          events:
            onPaste:
              - id: upload
                type: CallMethod
                params:
                  blockId: attach_files
                  method: uploadFromPaste
                  args:
                    - _event: true
          blocks:
            - id: text_input
              type: TextArea
            - id: attach_files
              type: S3UploadDragger
              properties:
                s3PostPolicyRequestId: upload_file
              requests:
                - id: upload_file
                  type: AwsS3PresignedPostPolicy
                  connectionId: files
                  payload:
                    filename:
                      _event: file.name
                    content_type:
                      _event: file.type
                  properties:
                    fields:
                      Content-Type:
                        _payload: content_type
                    key:
                      _nunjucks:
                        template: '{{ now | date("YYYYMMDD_HHmmssS") }}_{{ filename }}'
                        on:
                          now:
                            _date: now
                          filename:
                            _payload: filename

```
---

## File: `blocks/input/S3UploadButton.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: S3UploadButton
    value_type: object
    category: input
    schema: ../plugins/plugins/plugin-aws/src/blocks/S3UploadButton/schema.json
    filePath: blocks/input/S3UploadButton.yaml
    description_content: |
      The `S3UploadButton` block allows a user to to upload a file to AWS S3.

      The `s3PostPolicyRequestId` property is required, and should be the `id` of a [`AwsS3PresignedPostPolicy`](/AWSS3) request. This request is called by the block when the user uploads a file, to create a policy that allows a file to be uploaded to AWS S3.

      The block has an object value in state, with a `file` key, which has an object corresponding to the last uploaded file, and a `fileList` array with objects for each the files.

      For the examples to work, a `AwsS3Bucket` connection is required. For example:
      ```yaml
        connections:
        - id: files
          type: AwsS3Bucket
          properties:
            accessKeyId:
              _secret: FILES_S3_ACCESS_KEY_ID
            secretAccessKey:
              _secret: FILES_S3_SECRET_ACCESS_KEY
            region: af-south-1
            bucket:
              _secret: FILES_S3_BUCKET
            write: true
      ````

      > The examples on this page is not setup with a [`AwsS3Bucket`](/AWSS3) connection, and thus will throw.

    examples:
      - title: Basic S3UploadButton Example
        block:
          id: attach_files
          type: S3UploadButton
          properties:
            s3PostPolicyRequestId: upload_file
          requests:
            - id: upload_file
              type: AwsS3PresignedPostPolicy
              connectionId: files
              payload:
                filename:
                  _event: file.name
              properties:
                key:
                  _nunjucks:
                    template: '{{ now | date("YYYYMMDD_HHmmssS") }}_{{ filename }}'
                    on:
                      now:
                        _date: now
                      filename:
                        _payload: filename

```
---

## File: `blocks/input/RatingSlider.yaml`

## Description

The `RatingSlider` block allows a user to choose a numerical value on a slider input. It is typically used for scores or ratings. It has the option to have a "Not Applicable" checkbox, which leaves the value as null.


---

## File: `blocks/input/RadioSelector.yaml`

## Description

The `RadioSelector` block is a set of radio buttons that allow a user to select a single value from a set of options.

The options for the selector can be provides as either an array of primitive values (Strings, numbers, booleans or dates), or as an array of label-value pairs, where the label is a string, and the value can be of any type, including objects like dates and arrays.

> Other selector blocks are `ButtonSelector`, `CheckboxSelector`, `MultipleSelector` and `Selector`.


---

## File: `blocks/input/PhoneNumberInput.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: PhoneNumberInput
    value_type: object
    category: input
    schema: ../plugins/blocks/blocks-antd/src/blocks/PhoneNumberInput/schema.json
    filePath: blocks/input/PhoneNumberInput.yaml
    description_content: |
      The `PhoneNumberInput` block is a region dial code selector with a single line text input.
    examples:
      - title: Simple phone number input
        block:
          id: default
          type: PhoneNumberInput
      - title: Phone number input with specified regions
        block:
          id: allowed_regions
          type: PhoneNumberInput
          properties:
            allowedRegions:
              - 'ZA'
              - 'UA'
      - title: Phone number input with default region and flags disabled
        block:
          id: default_region
          type: PhoneNumberInput
          properties:
            defaultRegion: 'US'
            showFlags: false

```
---

## File: `blocks/input/PasswordInput.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: PasswordInput
    value_type: string
    category: input
    schema: ../plugins/blocks/blocks-antd/src/blocks/PasswordInput/schema.json
    filePath: blocks/input/PasswordInput.yaml
    description_content: |
      The `PasswordInput` block is a single line password input.

    examples:
      - title: Required password input
        block:
          id: required_example
          type: PasswordInput
          required: true
          properties:
            title: Required password input
      - title: Placeholder
        block:
          id: placeholder_example
          type: PasswordInput
          properties:
            placeholder: Placeholder
      - title: Password
        block:
          id: password
          type: PasswordInput
          properties:
            title: Password
            placeholder: Your password
            label:
              span: 6

```
---

## File: `blocks/input/ParagraphInput.yaml`

## Description

The `ParagraphInput` block can display a paragraph, yet allow the user to click a edit icon and change the paragraph content. This is useful when the UI renders an existing document with a paragraph, which a user must be able to edit.


---

## File: `blocks/input/Pagination.yaml`

## Description

The `Pagination` controls user input for pagination purposes.

> This block does not paginate requests, it only manage pagination parameters which can be used to control pagination requests.


---

## File: `blocks/input/NumberInput.yaml`

## Description

The `NumberInput` allows a user to input a number.


---

## File: `blocks/input/MultipleSelector.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: MultipleSelector
    value_type: any[]
    category: input
    schema: ../plugins/blocks/blocks-antd/src/blocks/MultipleSelector/schema.json
    filePath: blocks/input/MultipleSelector.yaml
    init_state_values:
      __type_block.properties.options: object[]
      __object_arr_block.properties.options:
        - label: First
          value: '1'
        - label: Second
          value: '2'

    description_content: |
      The `MultipleSelector` block is a drop down selector that allows a user to select multiple values from a set of options.

      The options for the selector can be provides as either an array of primitive values (Strings, numbers, booleans or dates), or as an array of label-value pairs, where the label is a string, and the value can be of any type, including objects like dates and arrays.

      > Other selector blocks are `ButtonSelector`, `CheckboxSelector`, `RadioSelector` and `Selector`.

    examples:
      - title: Basic MultipleSelector Usage
        block:
          id: basic_selector
          type: MultipleSelector
          properties:
            title: Select options
            options:
              - Option A
              - Option B
              - Option C
      - title: MultipleSelector with label value options
        block:
          id: label_value_selector
          type: MultipleSelector
          properties:
            title: Select options
            options:
              - label: Option 1
                value: 1
              - label: Option 2
                value: 2
              - label: Option 3
                value: 3
      - title: MultipleSelector with html label value options
        block:
          id: label_value_selector
          type: MultipleSelector
          properties:
            title: Select options
            options:
              - label: |
                  <div style="font-weight: bold;">Max Verstappen</div>
                  <div style="font-size: 0.7em;">Red Bull Racing</div>
                value: 1
              - label: |
                  <div style="font-weight: bold;">Logan Sargeant</div>
                  <div style="font-size: 0.7em;">Williams</div>
                value: 2
              - label: |
                  <div style="font-weight: bold;">Daniel Ricciardo</div>
                  <div style="font-size: 0.7em;">AlphaTauri</div>
                value: 3
      - title: MultipleSelector that renders Tags for selected values
        block:
          id: label_value_selector
          type: MultipleSelector
          properties:
            title: Select options
            renderTags: true
            options:
              - label: |
                  <div style="font-weight: bold;">Max Verstappen</div>
                  <div style="font-size: 0.7em;">Red Bull Racing</div>
                value: 1
                tag:
                  color: red
                  title: Max
              - label: |
                  <div style="font-weight: bold;">Logan Sargeant</div>
                  <div style="font-size: 0.7em;">Williams</div>
                value: 2
                tag:
                  color: blue
                  title: Logan
              - label: |
                  <div style="font-weight: bold;">Daniel Ricciardo</div>
                  <div style="font-size: 0.7em;">AlphaTauri</div>
                value: 3
                tag:
                  color: magenta
                  title: Daniel
      - title: Listing options from database search
        block:
          id: example_selector
          type: MultipleSelector
          requests:
            - id: example_search
              type: MongoDBAggregation
              connectionId: companies
              payload:
                search_input:
                  _state: search_input
              properties:
                pipeline:
                  - $search:
                      compound:
                        should:
                          - wildcard:
                              query:
                                _string.concat:
                                  - '*'
                                  - _payload: search_input
                                  - '*'
                              path: # field names to search in the companies collection
                                - _id
                                - company_name
                              allowAnalyzedField: true
                  - $addFields:
                      score:
                        $meta: searchScore
                  - $sort:
                      score: -1
                  - $limit: 50
                  - $project:
                      _id: 0
                      value: $_id
                      label:
                        $concat:
                          - $_id
                          - ' - '
                          - $ifNull:
                              - $company_name
                              - ''
          properties:
            placeholder: Search
            options: # search request results will be used as options
              _array.concat:
                - _if_none:
                    - _state: example_options
                    - []
                - _if_none:
                    - _request: example_search
                    - []
            label:
              disabled: true
          events:
            onChange: # selector onChange actions - triggered when the value of the selector changes
              - id: set_state
                type: SetState
                params:
                  example_options:
                    _mql.aggregate:
                      on:
                        _array.concat:
                          - _state: example_options
                          - _request: example_search
                      pipeline:
                        - $match:
                            value:
                              $in:
                                _state: example_selector
            onSearch: # selector onSearch actions - triggered when the user types in the search input
              debounce:
                ms: 500
              try:
                - id: set_state
                  type: SetState
                  params:
                    search_input:
                      _event: value
                - id: perform_search
                  type: Request
                  params: example_search

```
---

## File: `blocks/input/MonthSelector.yaml`

## Description

The `MonthSelector` block allows a user to select a month. The value is a date object, with day and time values of midnight on the first day of the month GMT.

> Other date type blocks are `DateRangeSelector`, `DateSelector`, `DateTimeSelector` and `WeekSelector`.


---

## File: `blocks/input/DateTimeSelector.yaml`

## Description

The `DateTimeSelector` block allows a user to select a date and a time from a calender.

By default, the time selected by the user is converted to GMT time, based on the timezone of the user. The selector will also display the selected time in the correct timezone for that user. If the `selectGMT` property is set to true, the value of the selector will be the time selected by the user as GMT time, and not in the timezone of the user.

> Other date type blocks are `DateRangeSelector`, `DateTimeSelector`, `MonthSelector` and `WeekSelector`.


---

## File: `blocks/input/DateSelector.yaml`

## Description

The `DateSelector` block allows a user to select a date from a calender.

> Other date type blocks are `DateRangeSelector`, `DateTimeSelector`, `MonthSelector` and `WeekSelector`.


---

## File: `blocks/input/DateRangeSelector.yaml`

## Description

The `DateRangeSelector` block allows the user to choose a start date and an end date for a date range. The selected range is saved as an array with two date elements, the start and end dates.

> Other date type blocks are `DateSelector`, `DateTimeSelector`, `MonthSelector` and `WeekSelector`.


---

## File: `blocks/input/ColorSelector.yaml`

## Description

A color selector component.


---

## File: `blocks/input/CheckboxSwitch.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: CheckboxSwitch
    value_type: any[]
    category: input
    schema: ../plugins/blocks/blocks-antd/src/blocks/CheckboxSwitch/schema.json
    filePath: blocks/input/CheckboxSwitch.yaml
    description_content: |
      The `CheckboxSwitch` block allows a user to select a boolean value between (true/false).

      > A similar switch block is `Switch`. Alternatively the `CheckboxSelector` can be used to list multiple options.
    examples:
      - title: Checkbox only
        block:
          id: checkbox_example
          type: CheckboxSwitch
          properties:
            label:
              disabled: true
      - title: Description only
        block:
          id: description_example
          type: CheckboxSwitch
          properties:
            description: Option
      - title: Description and label
        block:
          id: description_label_example
          type: CheckboxSwitch
          properties:
            description: Option
            label:
              title: Label
      - title: Agree to terms and conditions
        block:
          id: terms_example
          type: CheckboxSwitch
          properties:
            description: I agree to the terms and conditions and privacy policy as found on the website.... Thoroughly I agree to the terms and conditions and privacy policy as found on the website....
            label:
              disabled: true

```
---

## File: `blocks/input/CheckboxSelector.yaml`

## Description

The `CheckboxSelector` block allows a user to select multiple values from a set of options.

The options for the selector can be provides as either an array of primitive values (strings, numbers, booleans, or dates), or as an array of label-value pairs, where the label is a string, and the value can be of any type, including objects like dates and arrays.

> Other selector blocks are `ButtonSelector`, `MultipleSelector`, `RadioSelector` and `Selector`.


---

## File: `blocks/input/ButtonSelector.yaml`

## Description

The `ButtonSelector` block allows a user to select a single value from a set of options. The user cannot deselect an option once they have selected an input.

The options for the selector can be provides as either an array of primitive values (strings, numbers, booleans or dates), or as an array of label-value pairs, where the label is a string, and the value can be of any type, including objects like dates and arrays.

> Other selector blocks are `CheckboxSelector`, `MultipleSelector`, `RadioSelector` and `Selector`.


---

## File: `blocks/input/AutoComplete.yaml`

## Description

The AutoComplete block is a text input that has a list of suggestions for the user. These suggestions are filtered as the user fills in the input. The user is also allowed to fill in an input not part of that list.

>If you need the user to select only from a list of options (and be able to select the top match for the given input by simply hitting Enter), use a block like the `Selector` block instead.


---

## File: `blocks/display/Title.yaml`

## Description

A title component. Corresponds to html h1, h2, h3 and h4 elements.


---

## File: `blocks/display/Tag.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Tag
    category: display
    schema: ../plugins/blocks/blocks-antd/src/blocks/Tag/schema.json
    filePath: blocks/display/Tag.yaml
    description_content: |
      A block to render a Tag component.

      Besides hex color values, the following color preset values are available:
      - `success`
      - `processing`
      - `error`
      - `warning`
      - `default`
      - `blue`
      - `cyan`
      - `geekblue`
      - `gold`
      - `green`
      - `lime`
      - `magenta`
      - `orange`
      - `purple`
      - `red`
      - `volcano`

    examples:
      - title: Basic Tag
        block:
          id: basic_example
          type: Tag
          properties:
            title: A tag with title
      - title: Preset color tags and icons
        block:
          id: error_tag
          type: Tag
          properties:
            title: Error
            color: error
            icon: AiOutlineCloseCircle

```
---

## File: `blocks/display/Statistic.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Statistic
    category: display
    schema: ../plugins/blocks/blocks-antd/src/blocks/Statistic/schema.json
    filePath: blocks/display/Statistic.yaml
    init_state_values:
      __type_block.properties.value: number
      __number_block.properties.value: 33.3
    description_content: |
      A statistic block renders indicator numbers.

    examples:
      - title: Basic statistic
        block:
          id: basic_example
          type: Statistic
          properties:
            value: 99.5
            prefixIcon: AiOutlineAlert

```
---

## File: `blocks/display/SkeletonParagraph.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: SkeletonParagraph
    category: display
    schema: ../plugins/blocks/blocks-loaders/src/blocks/SkeletonParagraph/schema.json
    filePath: blocks/display/SkeletonParagraph.yaml
    description_content: |
      The `SkeletonParagraph` block can be used as a loading skeleton for a `Paragraph` block.

    examples:
      - title: Basic skeleton paragraph
        block:
          id: basic_skeleton_paragraph_example
          type: SkeletonParagraph
          properties:
            lines: 5
            width: 100

```
---

## File: `blocks/display/SkeletonInput.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: SkeletonInput
    category: display
    schema: ../plugins/blocks/blocks-loaders/src/blocks/SkeletonInput/schema.json
    filePath: blocks/display/SkeletonInput.yaml
    description_content: |
      The `SkeletonInput` block can be used as a loading skeleton for `Input` blocks.

    examples:
      - title: Basic skeleton input
        block:
          id: basic_skeleton_input_example
          type: SkeletonInput
          properties:
            inputHeight: 100
            labelHeight: 50
            labelWidth: 50
            size: large
            width: 100

```
---

## File: `blocks/display/SkeletonButton.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: SkeletonButton
    category: display
    schema: ../plugins/blocks/blocks-loaders/src/blocks/SkeletonButton/schema.json
    filePath: blocks/display/SkeletonButton.yaml
    description_content: |
      The `SkeletonButton` block can be used as a loading skeleton for a `Button` block.

    examples:
      - title: Basic skeleton button
        block:
          id: basic_skeleton_example
          type: SkeletonButton
          properties:
            size: small
            width: 100

```
---

## File: `blocks/display/SkeletonAvatar.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: SkeletonAvatar
    category: display
    schema: ../plugins/blocks/blocks-loaders/src/blocks/SkeletonAvatar/schema.json
    filePath: blocks/display/SkeletonAvatar.yaml
    description_content: |
      The `SkeletonAvatar` block can be used as a loading skeleton for an `Avatar` block.

    examples:
      - title: Basic skeleton avatar
        block:
          id: basic_skeleton_avatar_example
          type: SkeletonAvatar
          properties:
            shape: square
            size: large

```
---

## File: `blocks/display/Skeleton.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Skeleton
    category: display
    schema: ../plugins/blocks/blocks-loaders/src/blocks/Skeleton/schema.json
    filePath: blocks/display/Skeleton.yaml
    description_content: |
      The `Skeleton` block can be used as a regular block or as a loading skeleton for another block.

    examples:
      - title: Basic skeleton
        block:
          id: basic_skeleton_example
          type: Skeleton
          properties:
            height: 100
            width: 100
      - title: Loading skeleton for a card
        block:
          id: loading_skeleton_card_example
          type: Card
          loading: true
          skeleton:
            type: Card
            blocks:
              - type: Skeleton
                properties:
                  height: 100

```
---

## File: `blocks/display/S3Download.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: S3Download
    value_type: object
    category: display
    schema: ../plugins/plugins/plugin-aws/src/blocks/S3Download/schema.json
    filePath: blocks/display/S3Download.yaml
    description_content: |
      The `S3Download` block allows a user to download a files from AWS S3.

      The `s3GetPolicyRequestId` property is required, and should be the `id` of a [`AwsS3PresignedGetPolicy`](/AWSS3) request. This request is called by the block when the user downloads a file, to create a policy that allows a file to be downloaded from AWS S3.

      If using files were uploaded using a S3Upload block, the `fileList` can be mapped to the `S3Download` block to allow the user to download the files, given the correct `AwsS3PresignedGetPolicy` is in defined.

      For the examples to work, a `AwsS3Bucket` connection is required. For example:
      ```yaml
        connections:
        - id: files
          type: AwsS3Bucket
          properties:
            accessKeyId:
              _secret: FILES_S3_ACCESS_KEY_ID
            secretAccessKey:
              _secret: FILES_S3_SECRET_ACCESS_KEY
            region: af-south-1
            bucket:
              _secret: FILES_S3_BUCKET
            write: true
      ````

      > The examples on this page are not setup with a [`AwsS3Bucket`](/AWSS3) connection, and thus will throw.
    init_property_values:
      fileList:
        - key: 'example.pdf'
          type: 'application/pdf'
          name: example_document.pdf
        - key: 'example.jpg'
          type: 'image/jpeg'
          name: example_image.jpg
    examples:
      - title: Basic S3Download Example
        block:
          id: download_files
          type: S3Download
          properties:
            s3GetPolicyRequestId: download_file
            fileList:
              - key: 'example.pdf'
                type: 'application/pdf'
                name: example_document.pdf
              - key: 'example.jpg'
                type: 'image/jpeg'
                name: example_image.jpg
          requests:
            - id: download_file
              type: AwsS3PresignedGetObject
              connectionId: files
              payload:
                key:
                  _event: file.key
                type:
                  _event: file.type
              properties:
                key:
                  _payload: key
                responseContentType:
                  _payload: type

```
---

## File: `blocks/display/Progress.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Progress
    category: display
    schema: ../plugins/blocks/blocks-antd/src/blocks/Progress/schema.json
    filePath: blocks/display/Progress.yaml
    init_property_values:
      percent: 30
    description_content: |
      Display the current progress as a percentage of completion.

    examples:
      - title: Line progress
        block:
          id: line_example
          type: Progress
          properties:
            type: line
            percent: 60
            strokeColor: '#fcb900'
            status: active
      - title: Circle progress
        block:
          id: circle_example
          type: Progress
          properties:
            type: circle
            percent: 60
            strokeColor: '#52c41a'
      - title: Dashboard progress
        block:
          id: dashboard_example
          type: Progress
          properties:
            type: dashboard
            percent: 60
            strokeColor: '#1890ff'

```
---

## File: `blocks/display/Paragraph.yaml`

## Description

A paragraph text component.


---

## File: `blocks/display/Notification.yaml`

## Description

Display a popup notification on the page.

> To display a notification, invoke the open method.

## Methods

### open


---

## File: `blocks/display/MobileMenu.yaml`

## Description

A menu designed for mobile devices. Renders a button that opens a Drawer with the menu inside. This menu is used by default in `PageHeaderMenu` and `PageSiderMenu` on mobile devices.


---

## File: `blocks/display/Message.yaml`

## Description

Display a popup message on the page.

> To display a message, invoke the open method.

## Methods

### open


---

## File: `blocks/display/Menu.yaml`

## Description

A menu block used to display page links.


---

## File: `blocks/display/MarkdownWithCode.yaml`

## Description

Render markdown content with code highlighting support. Currently, the following languages are supported:
- HTML: `html`
- Java: `java`
- Javascript: `javascript`, `js`, `jsx`
- JSON: `json`
- Markdown: `markdown`
- Nunjucks: `nunjucks`
- Python: `python`, `py`,
- Typescript: `typescript`, `ts`,
- XML: `xml`
- YAML: `yaml`

> For more details on markdown syntax see: [Markdown cheat sheet](https://guides.github.com/features/mastering-markdown/).


---

## File: `blocks/display/Markdown.yaml`

## Description

Render markdown text content.

> For more details on markdown syntax see: [Markdown cheat sheet](https://guides.github.com/features/mastering-markdown/).


---

## File: `blocks/display/Img.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Img
    category: display
    schema: ../plugins/blocks/blocks-basic/src/blocks/Img/schema.json
    filePath: blocks/display/Img.yaml
    init_property_values:
      src: 'https://docs.lowdefy.com/logo-light-theme.png'
    description_content: |
      A block to render a HTML [`<img/>`](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img) element.
    examples:
      - title: Basic Img
        block:
          id: basic_example
          type: Img
          properties:
            src: https://docs.lowdefy.com/logo-light-theme.png
      - title: srcset Img
        block:
          id: srcset_example
          type: Img
          properties:
            src: https://docs.lowdefy.com/logo-light-theme.png
            srcSet: https://docs.lowdefy.com/logo-square-light-theme.png 40w, https://docs.lowdefy.com/logo-light-theme.png 577w
            sizes: '(max-width: 576px) 40px, 577px'

```
---

## File: `blocks/display/Icon.yaml`

## Description

A Icon component. Render Ant Design and other icons


---

## File: `blocks/display/Html.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Html
    category: display
    schema: ../plugins/blocks/blocks-basic/src/blocks/Html/schema.json
    filePath: blocks/display/Html.yaml
    init_property_values:
      html: <a href="https://lowdefy.com">Lowdefy Website</a>
    description_content: |
      A block to render HTML.

      > The Html block sanitizes HTML using [DOMPurify's](https://github.com/cure53/DOMPurify) default configuration. This comes with some security considerations, please consider [DOMPurify's Security Goals and Threat Model](https://github.com/cure53/DOMPurify/wiki/Security-Goals-&-Threat-Model) for more details regarding the security impact of using the Html block. In short, it is strongly advised to never render any user input Html content, only render hardcoded or trusted HTML content.

    examples:
      - title: Basic DangerousHtml
        block:
          id: basic_example
          type: Html
          properties:
            html: |
              <div style="background: #123456; padding: 10px;"><h1 style="color: white;">A simple white title box</h1></div>
      - title: DangerousHtml with iframes sanitized
        block:
          id: sanitized_iframes_example
          type: Html
          properties:
            html: |
              The iframe was removed: <iframe style="max-width: 512px;" width="100%" src="https://www.youtube.com/embed/7N7GWdlQJlU" frameborder="0"  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>      - title: DangerousHtml with iframes enabled
      - title: DangerousHtml basic sanitization
        block:
          id: sanitized_example
          type: Html
          properties:
            html: |
              <div style="color: red; border: 2px dashed blue; padding: 10px;"><script>alert("hello world")</script><img src=x onerror=alert("img") />A little bit of bad html sanitized.</div>

```
---

## File: `blocks/display/EChart.yaml`

## Description

[Apache ECharts](https://echarts.apache.org/) is a feature rich javascript charting library.

This implementation is a minimal wrapper for the [echarts-for-react](https://www.npmjs.com/package/echarts-for-react) package. This means you write normal EChart config to create charts.

See the [Apache ECharts docs](https://echarts.apache.org/en/api.html#echarts) for the chart settings API. See the [ECharts theme builder](https://echarts.apache.org/en/theme-builder.html) to create beautiful custom themes.

> View more [Apache EChart examples](https://echarts.apache.org/examples/en/index.html).


---

## File: `blocks/display/DocSearch.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: DocSearch
    category: display
    schema: ../plugins/blocks/blocks-algolia/src/blocks/DocSearch/schema.json
    filePath: blocks/display/DocSearch.yaml
    description_content:
      _nunjucks:
        on:
          version:
            _ref: version.yaml
        template: |
          This block renders a [Algolia DocSearch](https://docsearch.algolia.com/) search box.

          To use the block, the `apiKey`, `appId` and `indexName` properties need to be configured.

          The DocSearch CSS files and preconnect optimisation also need to be added to the HTML head of your app using `appendHead` as follows:

          ```yaml
          lowdefy: {{ version }}
          app:
            html:
              appendHead: |
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@3" />
                <link rel="preconnect" href="https://YOUR_APP_ID-dsn.algolia.net" crossorigin />
          ```
    examples:
      - title: Standard Usage
        block:
          id: standard_usage
          type: DocSearch
          properties:
            apiKey: YOUR_API_KEY
            appId: YOUR_APP_ID
            indexName: YOUR_INDEX_NAME

```
---

## File: `blocks/display/Divider.yaml`

## Description

A divider line. Can be used horizontally or vertically.


---

## File: `blocks/display/DangerousMarkdown.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: DangerousMarkdown
    category: display
    schema: ../plugins/blocks/blocks-markdown/src/blocks/DangerousMarkdown/schema.json
    filePath: blocks/display/DangerousMarkdown.yaml
    init_property_values:
      content: |
        ## Some Html content:

        <div style="background: #123456; padding: 10px;"><h4 style="color: white;">A simple white title box</h4></div>

    description_content: |
      Render markdown content which can include HTML elements. If the markdown content does not need to render HTML, use the [Markdown](/Markdown) or [MarkdownWithCode](/MarkdownWithCode) blocks instead. Specify what HTML element to allow or remove by changing the default modifying the [DOMPurify's options](https://github.com/cure53/DOMPurify#can-i-configure-dompurify).

      > The DangerousMarkdown block sanitizes the markdown content using [DOMPurify's](https://github.com/cure53/DOMPurify) before converting the markdown to HTML. DangerousMarkdown provides the ability to customize the sanitization options. This comes with some security considerations, please consider [DOMPurify's Security Goals and Threat Model](https://github.com/cure53/DOMPurify/wiki/Security-Goals-&-Threat-Model) for more details regarding the security impact of using the DangerousMarkdown block.
      >
      > In short, it is strongly advised to never render any user input DangerousMarkdown content, only render hardcoded or trusted markdown and HTML content.

    examples:
      - title: DangerousMarkdown headings
        block:
          id: iframes_example
          type: DangerousMarkdown
          properties:
            DOMPurifyOptions":
              ADD_TAGS":
                - iframe
            content: |
              # Markdown with an iframe:
              <iframe width="560" height="315" src="https://www.youtube.com/embed/pkCJpDleMtI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>

```
---

## File: `blocks/display/DangerousHtml.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: DangerousHtml
    category: display
    schema: ../plugins/blocks/blocks-basic/src/blocks/DangerousHtml/schema.json
    filePath: blocks/display/DangerousHtml.yaml
    init_property_values:
      html: <a href="https://lowdefy.com">Lowdefy Website</a>
    description_content: |
      A block to render HTML with the ability to customize the [DOMPurify's options](https://github.com/cure53/DOMPurify#can-i-configure-dompurify).

      > The DangerousHtml block sanitizes HTML using [DOMPurify's](https://github.com/cure53/DOMPurify) with the ability to customize the sanitization options. This comes with some security considerations, please consider [DOMPurify's Security Goals and Threat Model](https://github.com/cure53/DOMPurify/wiki/Security-Goals-&-Threat-Model) for more details regarding the security impact of using the DangerousHtml block.
      >
      > In short, it is strongly advised to never render any user input DangerousHtml content, only render hardcoded or trusted HTML content.

    examples:
      - title: Basic DangerousHtml
        block:
          id: basic_example
          type: DangerousHtml
          properties:
            html: |
              <div style="background: #123456; padding: 10px;"><h1 style="color: white;">A simple white title box</h1></div>
      - title: DangerousHtml with iframes sanitized
        block:
          id: sanitized_iframes_example
          type: DangerousHtml
          properties:
            html: |
              The iframe was removed: <iframe width="560" height="315" src="https://www.youtube.com/embed/pkCJpDleMtI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>      - title: DangerousHtml with iframes enabled
      - title: DangerousHtml with iframes not sanitized
        block:
          id: iframes_example
          type: DangerousHtml
          properties:
            DOMPurifyOptions:
              ADD_TAGS:
                - iframe
            html: |
              The iframe was not removed: <iframe width="560" height="315" src="https://www.youtube.com/embed/pkCJpDleMtI" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
      - title: DangerousHtml basic sanitization
        block:
          id: sanitized_example
          type: DangerousHtml
          properties:
            html: |
              <div style="color: red; border: 2px dashed blue; padding: 10px;"><script>alert("hello world")</script><img src=x onerror=alert("img") />A little bit of bad html sanitized.</div>

```
---

## File: `blocks/display/Button.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Button
    category: display
    schema: ../plugins/blocks/blocks-antd/src/blocks/Button/schema.json
    filePath: blocks/display/Button.yaml
    description_content: |
      Button block.

    examples:
      - title: Block and ghost button with icon
        block:
          id: ghost_example
          type: Button
          properties:
            title: Get started
            block: true
            ghost: true
            icon: AiOutlineRocket
      - title: Round and type danger
        block:
          id: danger_example
          type: Button
          properties:
            title: Delete Forever
            shape: round
            type: danger
            icon: AiOutlineWarning

```
---

## File: `blocks/display/Breadcrumb.yaml`

## Description

A breadcrumb displays the current location within a hierarchy. It allows going back to states higher up in the hierarchy with provided links.


---

## File: `blocks/display/Avatar.yaml`

## Description

Avatars can be used to represent people or objects. It supports images, Icons, or letters.


---

## File: `blocks/display/Anchor.yaml`

## Description

Anchor link block. Creates a clickable icon and/ or text.

> When changing the relationship (`rel`) property of the linked URL, make sure you understand the security implications. Read more about link types [here](https://developer.mozilla.org/en-US/docs/Web/HTML/Link_types).


---

## File: `blocks/display/AgGrid.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/generic_block.yaml.njk
  vars:
    block_type: AgGrid
    category: display
    pageTitle: AgGrid
    filePath: blocks/display/AgGrid.yaml
    schema: ../plugins/blocks/blocks-aggrid/src/blocks/AgGridAlpine/schema.json
    description_content: |
      This is a Lowdefy blocks wrapper for for [Ag-Grid](https://www.ag-grid.com/), a feature rich javascript grid and table library.
      The implementation of these blocks is a minimal wrapper for the [@ag-grid-community/core](https://www.npmjs.com/package/@ag-grid-community/core) package. This means you write normal Ag-Grid config to create tables.

      Available ag-grid theme specific block types:
      - [`AgGridAlpine`](https://www.ag-grid.com/example?theme=ag-theme-alpine)
      - [`AgGridAlpineDark`](https://www.ag-grid.com/example?theme=ag-theme-alpine-dark)
      - [`AgGridBalham`](https://www.ag-grid.com/example?theme=ag-theme-balham)
      - [`AgGridBalhamDark`](https://www.ag-grid.com/example?theme=ag-theme-balham-dark)
      - [`AgGridMaterial`](https://www.ag-grid.com/example?theme=ag-theme-material)

      See the [Ag-Grid docs](https://www.ag-grid.com/documentation/react/getting-started/) for the table settings API.
      Here are a couple of basic properties.

      ### Properties
      - `height: number`: Specify table height explicitly, in pixel.
      - `rowData: array`: The list of data to display on the table.
      - `defaultColDef: columnProperties`: Column properties which get applied to all columns. See all [column properties](https://www.ag-grid.com/javascript-data-grid/column-properties/)
      - `columnDefs: columnProperties[]`: A list of properties for each column.
        - `field: string`: The field of the row object to get the cell's data from. Deep references into a row object is supported via dot notation, i.e 'address.firstLine'.
        - `headerName: string`: The name to render in the column header. If not specified and field is specified, the field name will be used as the header name.
        - `filter: boolean`: Filter component to use for this column. Set to true to use the default filter.
        - `sortable: boolean`: Set to true to allow sorting on this column. Default: false.
        - `resizable: boolean`: Set to true to allow this column should be resized. Default: false.
        - `width: number`: Initial width in pixels for the cell.
        - `cellStyle: cssObject`: An object of css values returning an object of css values for a particular cell.
        - `cellRenderer: function`: Provide your own cell Renderer function (using the `_function` operator) for this column's cells.
        - `valueFormatter: function`: A function (using the `_function` operator) or expression to format a value, should return a string. Not used for CSV export or copy to clipboard, only for UI cell rendering.
      ### Events
      - `onCellClick`: Trigger event when a cell is clicked and pass the following to `_event`:
        - `cell: object`: Cell data object.
        - `colId: string`: Column id of the clicked cell.
        - `index: number`: Data index of the clicked row as per provided data array.
        - `row: object`: Row data object.
        - `rowIndex: number`: List index of the clicked row, changes with data sorting or filtering.
        - `selected: object[]`: List of selected row objects.
      - `onFilterChanged`: Trigger event when the filter changes and pass the following to `_event`:
        - `rows: object[]`: List of row objects matched by the filter.
        - `filter: object`: An object of objects where each key is the row being filtered.
      - `onRowClick`: Trigger event when a row is clicked and pass the following to `_event`:
        - `index: number`: Data index of the clicked row as per provided data array.
        - `row: object`: Row data object.
        - `rowIndex: number`: List index of the clicked row, changes with data sorting or filtering.
        - `selected: object[]`: List of selected row objects.
      - `onRowSelected`: Trigger event when a row is selected and pass the following to `_event`:
        - `index: number`: Data index of the clicked row as per provided data array.
        - `row: object`: Row data object.
        - `rowIndex: number`: List index of the clicked row, changes with data sorting or filtering.
        - `selected: object[]`: List of selected row objects.
      - `onSelectionChanged`: Triggered when the selected rows are changed and pass the following to `_event`:
        - `selected: object[]`: List of selected row objects.
      - `onSortChanged`: Trigger event when the sort changes and pass the following to `_event`:
        - `rows: object[]`: List of row objects matched by the filter.
        - `sort: object[]`: List of rows which are being sorted.
      ### Methods
      - `exportDataAsCsv`: When called, table data will be downloaded in csv format.
      - `sizeColumnsToFit`: When called, size table column widths to fit all columns to table width.
      - `autoSize`: When called, auto size columns. The following can be passed as the first argument of `args`.
            - `skipHeader: boolean`: Do not consider header content width when auto-sizing columns.
            - `columnIds: string[]`: List of `colId`s for which to calculate auto-size when called.
      - `setFilterModel`: When called, apply filter model to table. See https://www.ag-grid.com/javascript-data-grid/filter-api/ for model details.
      - `setQuickFilter`: When called, pass a quick filter text into the grid for filtering. See https://www.ag-grid.com/javascript-data-grid/filter-quick/ for details.
    examples:
      - title: Basic example
        block:
          id: my_table
          type: AgGridAlpine
          properties:
            rowData:
              - title: One
                year: 2010
                viewerReviews: 30
              - title: Two
                year: 2011
                viewerReviews: 20
            defaultColDef:
              sortable: true
              resizable: true
              filter: true
            columnDefs:
              - headerName: Title
                field: title
                width: 350
              - headerName: Year
                field: year
                width: 100
              - headerName: Viewer Reviews
                field: viewerReviews
                width: 160
      - title: 'Format dates with cellRenderer'
        block:
          id: my_table
          type: AgGridAlpine
          properties:
            rowData:
              - title: One
                year: 2010
                date:
                  _date: 2010-03-14
              - title: Two
                year: 2011
                date:
                  _date: 2011-04-01
            defaultColDef:
              sortable: true
              resizable: true
              filter: true
            columnDefs:
              - headerName: Title
                field: title
                width: 200
              - headerName: Year
                field: year
                width: 100
              - headerName: Date
                field: date
                width: 160
                cellRenderer:
                  _function:
                    __moment.format:
                      on:
                        __args: 0.data.date
                      format: 'D MMM YYYY'
      - title: 'Format currency with valueFormatter'
        block:
          id: my_table
          type: AgGridAlpine
          properties:
            rowData:
              - title: One
                year: 2010
                total: 300.21
              - title: Two
                year: 2011
                total: 1230.9495
            defaultColDef:
              sortable: true
              resizable: true
              filter: true
            columnDefs:
              - headerName: Title
                field: title
                width: 200
              - headerName: Year
                field: year
                width: 100
              - headerName: Total
                field: total
                width: 160
                valueFormatter:
                  _function:
                    __intl.numberFormat:
                      on:
                        __args: 0.value
                      options:
                        style: 'currency'
                        currency: 'EUR'
      - title: 'onRowClick'
        block:
          id: my_table
          type: AgGridAlpine
          properties:
            rowData:
              - title: One
                year: 2010
                viewerReviews: 30
              - title: Two
                year: 2011
                viewerReviews: 20
            defaultColDef:
              sortable: true
              resizable: true
              filter: true
            columnDefs:
              - headerName: Title
                field: title
                width: 350
              - headerName: Year
                field: year
                width: 100
              - headerName: Viewer Reviews
                field: viewerReviews
                width: 160
          events:
            onRowClick:
              - id: set_selected
                type: SetState
                params:
                  selected_row: # Update 'selected' in state with the event data.
                    _event: true
        extra:
          id: selection
          type: MarkdownWithCode
          properties:
            content:
              _nunjucks:
                template: |
                  ```yaml
                    {{ selection | safe | indent(2) }}
                  ```
                on:
                  selection:
                    _yaml.stringify:
                      - _state: selected_row
      - title: 'onCellClick'
        block:
          id: my_table
          type: AgGridAlpine
          properties:
            rowData:
              - title: One
                year: 2010
                viewerReviews: 30
              - title: Two
                year: 2011
                viewerReviews: 20
            defaultColDef:
              sortable: true
              resizable: true
              filter: true
            columnDefs:
              - headerName: Title
                field: title
                width: 350
              - headerName: Year
                field: year
                width: 100
              - headerName: Viewer Reviews
                field: viewerReviews
                width: 160
          events:
            onCellClick:
              - id: set_selected
                type: SetState
                params:
                  selected_cell: # Update 'selected_cell' in state with the event cell data.
                    _event: true
        extra:
          id: selection
          type: MarkdownWithCode
          properties:
            content:
              _nunjucks:
                template: |
                  ```yaml
                    {{ selection | safe | indent(2) }}
                  ```
                on:
                  selection:
                    _yaml.stringify:
                      - _state: selected_cell
      - title: 'Using rowId to preserve selection'
        description: |
          This example shows a table switching between two sets of data. Some rows are common between the data sets and the data rows have a unique identifier field `uniqueId` which we can use as the `rowId` field to ensure selection is preserved when switching the data sets. If no `rowId` is set and the row data does not contain an `id` or `_id` field, and the row data JSON stringified is used as the row id. This still works but may slightly impact performance.
        block:
          id: my_table
          type: AgGridAlpine
          properties:
            height: 200
            rowId: uniqueId
            rowData:
              _state: table_data
            columnDefs:
              - headerName: Unique ID
                field: uniqueId
                checkboxSelection: true
              - headerName: Title
                field: title
              - headerName: Year
                field: year
        extra:
          id: table_data_box
          type: Box
          events:
            onMount:
              - id: init_value
                type: SetState
                params:
                  table_data:
                    - title: One
                      year: 2010
                      uniqueId: 2010-1
                    - title: Two
                      year: 2011
                      uniqueId: 2011-1
          blocks:
            - id: table_data
              type: ButtonSelector
              properties:
                label:
                  disabled: true
                options:
                  - label: Data Set 1
                    value:
                      - title: One
                        year: 2010
                        uniqueId: 2010-1
                      - title: Two
                        year: 2011
                        uniqueId: 2011-1
                  - label: Data Set 2
                    value:
                      - title: Three
                        year: 2011
                        uniqueId: 2011-2
                      - title: One
                        year: 2010
                        uniqueId: 2010-1
            - id: table_data_display
              type: MarkdownWithCode
              properties:
                content:
                  _nunjucks:
                    template: |
                      ```yaml
                        {{ table_data | safe | indent(2) }}
                      ```
                    on:
                      table_data:
                        _yaml.stringify:
                          - _state: table_data
      - title: 'Server-side filter and sort'
        description: |
          This example shows how you can filter your table data server-side by making use of AgGrid's built in filter and sort functionality and calling the `onFilterChanged` and `onSortChanged` events. In this example we use dummy data, but you would pass in `_request: table_request` to `properties.rowData`.
        block:
          id: my_table
          type: AgGridAlpine
          properties:
            rowData:
              ## We use dummy data for demo purposes. We would usually read the table data from the request
              # _request: table_request
              - title: One
                year: 2010
                viewerReviews: 30
              - title: Two
                year: 2011
                viewerReviews: 20
            defaultColDef:
              sortable: true
              resizable: true
              filter: true
              ## Simplify the table filter
              filterParams:
                suppressAndOrCondition: true
                filterOptions:
                  - contains
            columnDefs:
              - headerName: Title
                field: title
                width: 350
              - headerName: Year
                field: year
                width: 100
              - headerName: Viewer Reviews
                field: viewerReviews
                width: 160
          events:
            onSortChanged:
              - id: set_table_sort
                type: SetState
                params:
                  table.sort:
                    _event: sort
              - id: refetch
                type: Request
                messages:
                  error: false
                params: table_request
            onFilterChanged:
              - id: set_table_filter
                type: SetState
                params:
                  table.filter:
                    _event: filter
              - id: refetch
                type: Request
                messages:
                  error: false
                params: table_request

        extra:
          id: example_config
          type: MarkdownWithCode
          properties:
            content:
              _nunjucks:
                template: |
                  onSortChanged response (only `sort`, not `rows`):
                  ```yaml
                  {{ sort | safe }}
                  ```
                  onFilterChanged response filter (only `filter`, not `rows`):
                  ```yaml
                  {{ filter | safe }}
                  ```
                  Table request:
                  ```yaml
                  id: table_request
                  type: MongoDBAggregation
                  connectionId: table_connection
                  payload:
                    table:
                      _state: table
                  properties:
                    pipeline:
                      - $match:
                          $expr:
                            $and:
                              _if:
                                test:
                                  _eq:
                                    - _if_none:
                                        - _payload: table.filter
                                        - null
                                    - null
                                then:
                                  - true ## If a filter is not applied to the table.
                                else:
                                  _array.map:
                                    - _object.entries:
                                        _payload: table.filter
                                    - _function:
                                        $regexMatch:
                                          input:
                                            __string.concat:
                                              - '$'
                                              - __args: '0.0'
                                          regex:
                                            __args: '0.1.filter'
                                          options: 'i'
                      - $sort:
                          _if:
                            test:
                              _eq:
                                - _array.length:
                                    _if_none:
                                      - _payload: table.sort
                                      - []
                                - 0
                            then:
                              year: 1 ## If a sort is not applied to the table, default to this.
                            else:
                              _object.fromEntries:
                                _array.map:
                                  - _array.sort:
                                      - _if_none:
                                          - _payload: table.sort
                                          - []
                                      - _function:
                                          __subtract:
                                            - __args: 0.sortIndex
                                            - __args: 1.sortIndex
                                  - _function:
                                      - __args: 0.colId
                                      - __if:
                                          test:
                                            __eq:
                                              - __args: 0.sort
                                              - 'asc'
                                          then: 1
                                          else: -1
                  ```

                on:
                  sort:
                    _yaml.stringify:
                      - _state: table.sort
                  filter:
                    _yaml.stringify:
                      - _state: table.filter

```
---

## File: `blocks/container/Tooltip.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Tooltip
    category: container
    schema: ../plugins/blocks/blocks-antd/src/blocks/Tooltip/schema.json
    description_content: |
      A simple text popup tip. Can be used to display extra information about its children blocks.
    init_state_values:
      block.properties.title: Tooltip title
    areas:
      - content
    examples:
      - title: Button tooltip
        block:
          id: button_ex
          type: Tooltip
          properties:
            title: Explains what happens when this button is clicked.
          blocks:
            - id: btn
              type: Button
              properties:
                title: Button

```
---

## File: `blocks/container/Tabs.yaml`

## Description

Tabs to easily switch between different views.
The key of each tabs is the area keys of the container and there is an `extra` content area.

## Methods

### setActiveKey


---

## File: `blocks/container/Spinner.yaml`

## Description

A loading spinner. Can be used as a display block, or as container wrapping another block, with the `spinning` property set in `state`.


---

## File: `blocks/container/Span.yaml`

## Description

A Span is a container that places sub-blocks into a html `<span>`.
The Span has a single area, `content`.


---

## File: `blocks/container/Sider.yaml`

## Description

The `Sider` block provides a page container for a [sider](https://4x.ant.design/components/layout/) area with content.


---

## File: `blocks/container/Result.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Result
    category: container
    schema: ../plugins/blocks/blocks-antd/src/blocks/Result/schema.json
    filePath: blocks/container/Result.yaml
    description_content: |
      Used to provide feedback the results of a task or error.
    areas:
      - content
      - extra
    examples:
      - title: 500 Error
        block:
          id: error_example
          type: Result
          properties:
            status: 500
            title: An error occurred

```
---

## File: `blocks/container/Popover.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Popover
    category: container
    schema: ../plugins/blocks/blocks-antd/src/blocks/Popover/schema.json
    description_content: |
      A popover container. Can be used to display extra information or options inside the popover.
    init_state_values:
      block.properties.title: Popover title
    areas:
      - content
      - popover
    examples:
      - title: Popover menu
        block:
          id: button_ex
          type: Popover
          properties:
            title: Explains what happens.
          blocks:
            - id: settings
              type: Button
              properties:
                title: Settings
                icon: AiOutlineSetting
                block: true
          areas:
            popover:
              blocks:
                - id: profile
                  type: Button
                  properties:
                    title: Profile
                - id: admin
                  type: Button
                  properties:
                    title: Admin
                - id: logout
                  type: Button
                  properties:
                    title: Logout

```
---

## File: `blocks/container/PageSiderMenu.yaml`

## Description

The Page Sider Menu block provides a structured layout for a page with a header, sider including menu, content and footer area.


---

## File: `blocks/container/PageHeaderMenu.yaml`

## Description

The Page Header Menu block provides a structured layout for a page with a header containing a menu, content and footer area.


---

## File: `blocks/container/Modal.yaml`

## Description

A popup container, presenting the user with a modal dialog.
The Modal has a `content` and a `footer` content area. The default `footer` area is the `Ok` and `Cancel` buttons; defining a `footer` area overwrites these buttons.

> To open the modal, invoke a modal method.

## Methods

### toggleOpen

### setOpen


---

## File: `blocks/container/Layout.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Layout
    category: container
    schema: ../plugins/blocks/blocks-antd/src/blocks/Layout/schema.json
    filePath: blocks/container/Layout.yaml
    description_content: |
      The `Layout` block provides a page container for a [layout](https://4x.ant.design/components/layout/) area with content. It can be used as a wrapper, in which `Header`, `Sider`, `Content,` `Footer` or `Layout` itself can be nested.

    areas:
      - content

    examples:
      - title: Layout, Header-Content-Footer
        block:
          id: layout_example
          type: Layout
          style:
            textAlign: center
          blocks:
            - id: header
              type: Header
              blocks:
                - id: Title
                  type: Title
                  properties:
                    content: Header
                  style:
                    backgroundColor: red
            - id: content
              type: Content
              blocks:
                - id: Title
                  type: Title
                  style:
                    backgroundColor: green
                  properties:
                    content: Content
            - id: footer
              type: Footer
              blocks:
                - id: Title
                  type: Title
                  style:
                    backgroundColor: blue
                  properties:
                    content: Footer

```
---

## File: `blocks/container/Label.yaml`

## Description

A container that provides a label for a input block. Most input block use Label by default.


---

## File: `blocks/container/Header.yaml`

## Description

The `Header` block provides a page container for a [header](https://4x.ant.design/components/layout/) area with content.


---

## File: `blocks/container/GoogleMapsScript.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/generic_block.yaml.njk
  vars:
    block_type: GoogleMapsScript
    category: container
    pageTitle: GoogleMapsScript
    filePath: blocks/container/GoogleMapsScript.yaml
    schema: ../plugins/blocks/blocks-google-maps/src/blocks/GoogleMapsScript/GoogleMapsScript.json
    description_content: |
      This is a Lowdefy blocks wrapper for the [Google Maps API](https://developers.google.com/maps/documentation/javascript/overview). It is used to specify the api key and libraries to be used for the [`GoogleMaps`](./GoogleMaps) and [`GoogleMapsHeatmap`](./GoogleMapsHeatmap) blocks, and wraps these blocks as a parent container. Only one `GoogleMapsScript` blocks should be used on a page.v

      ### Properties

      - `apiKey: string`: Your Google Maps API key.
      - `libraries: array`: List of [Google libraries](https://developers.google.com/maps/documentation/javascript/libraries).

    examples:
      - title: Simple Script
        block:
          id: google_maps_script
          type: GoogleMapsScript
          properties:
            apiKey:
              _build.env: GOOGLE_MAPS_API_KEY
          blocks: []

      - title: Script with libraries
        block:
          id: google_maps_script
          type: GoogleMapsScript
          properties:
            libraries:
              - visualization
            apiKey:
              _build.env: GOOGLE_MAPS_API_KEY

```
---

## File: `blocks/container/GoogleMapsHeatmap.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/generic_block.yaml.njk
  vars:
    block_type: GoogleMapsHeatmap
    category: container
    pageTitle: GoogleMapsHeatmap
    filePath: blocks/container/GoogleMapsHeatmap.yaml
    schema: ../plugins/blocks/blocks-google-maps/src/blocks/GoogleMapsHeatmap/GoogleMapsHeatmap.json
    description_content: |
      This is a Lowdefy block which implements [Heatmap](https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions) from the [Google Maps API](https://developers.google.com/maps/documentation/javascript/overview).

      In order to use this block, it must be wrapped in a [`GoogleMapsScript`](./GoogleMapsScript) block with the visualization library specified.

      ### Properties

      - `apiKey: string`: Your Google Maps API key.
      - `libraries: array`: List of [Google libraries](https://developers.google.com/maps/documentation/javascript/libraries).
      - `map: mapOptions`: All [map options](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions).
        - `center: { lat: number, lng: number }`: A coordinate position object by which to center the map.
        - `zoom: number`: Map zoom level.
        - `options: mapOptions`: All other [map options](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions).
      - `heatmap: heatmapOptions`: Add a heatmap layer, see more [heatmap options](https://developers.google.com/maps/documentation/javascript/reference/visualization#HeatmapLayerOptions). This will automatically load the `visualization` library, which must be added to the list of libraries in the `libraries` property of the `GoogleMapsScript` block.
        - `data: { lat: number, lng: number, weight: number } []`: A list of heatmap data points.
      - `style: cssObject`: A style object applied to the map element.
      - `infoWindow: infoWindowOptions`: All infoWindow options, see [infoWindow options](https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindowOptions).
        - `position: { lat: number, lng: number }`: Position of infoWindow on map.
        - `visible: boolean`: When visible is true, blocks inside infoWindow content area will be rendered.

      ### Events

      - `onBoundsChanged`: Trigger onBoundsChanged actions when the bounds of the map are changed, returns `_event`
      object:
        - `bounds`:
          - `east`: latitudinal coordinate
          - `north`: longitudinal coordinate
          - `south`: longitudinal coordinate
          - `west`: latitudinal coordinate
        - `center`:
          - `lat`: latitudinal coordinate
          - `lng`: longitudinal coordinate
        - `zoom`: zoom level
      - `onCenterChanged`: Trigger onCenterChanged actions when the center of the map is changed, returns `_event`
      object:
        - `bounds`:
          - `east`: latitudinal coordinate
          - `north`: longitudinal coordinate
          - `south`: longitudinal coordinate
          - `west`: latitudinal coordinate
        - `center`:
          - `lat`: latitudinal coordinate
          - `lng`: longitudinal coordinate
        - `zoom`: zoom level
      - `onClick`: Trigger onClick actions when the map is clicked, returns `_event` object:
        - `domEvent`: event object
        - `latLng`:
          - `lat`: latitudinal coordinate
          - `lng`: longitudinal coordinate
        - `pixel`:
          - `x`: x position on map block
          - `y`: y position on map block
      - `onClusterClick`: Trigger onClusterClick actions when a cluster is clicked, returns `_event`
      - `onMarkerClick`: Trigger onMarkerClick actions when a marker is clicked, returns `_event`
      object:
        - `domEvent`: event object
        - `latLng`:
          - `lat`: latitudinal coordinate
          - `lng`: longitudinal coordinate
        - `pixel`:
          - `x`: x position on map block
          - `y`: y position on map block
      - `onZoomChanged`: Trigger onZoomChanged actions when the zoom on the map is changed. returns `_event`
      object:
        - `bounds`:
          - `east`: latitudinal coordinate
          - `north`: longitudinal coordinate
          - `south`: longitudinal coordinate
          - `west`: latitudinal coordinate
        - `center`:
          - `lat`: latitudinal coordinate
          - `lng`: longitudinal coordinate
        - `zoom`: zoom level

      ### Methods

      - `fitBounds`: Fit map to given bounds.
        - `bounds: { lat: number, lng: number } []`: A list of the coordinate positions of the boundary points.
        - `zoom: number`: Map zoom level.
      - `getBounds`: Returns the bounds of the map.
      - `getCenter`: Returns the center of the map.
      - `getZoom`: Returns the zoom of the map.

    examples:
      - title: Add a heatmap
        block:
          id: google_maps_script
          type: GoogleMapsScript
          properties:
            libraries:
              - visualization
            apiKey:
              _build.env: GOOGLE_MAPS_API_KEY
          blocks:
            - id: google_maps
              type: GoogleMapsHeatmap
              properties:
                map:
                  disableDefaultUI: true
                heatmap:
                  data:
                    - lat: 34.091158
                      lng: -118.2795188
                      weight: 1
                    - lat: 34.0771192
                      lng: -118.2587199
                      weight: 2
                    - lat: 34.083527
                      lng: -118.370157
                      weight: 1
                    - lat: 34.0951843
                      lng: -118.283107
                      weight: 2
                    - lat: 34.1033401
                      lng: -118.2875469
                      weight: 4
                    - lat: 34.035798
                      lng: -118.251288
                      weight: 2
                    - lat: 34.0776068
                      lng: -118.2646526
                      weight: 3
                    - lat: 34.0919263
                      lng: -118.2820544
                      weight: 3
                    - lat: 34.0568525
                      lng: -118.3646369
                      weight: 3
                    - lat: 34.0285781
                      lng: -118.4115541
                      weight: 0
                    - lat: 34.017339
                      lng: -118.278469
                      weight: 0
                    - lat: 34.0764288
                      lng: -118.3661624
                      weight: 4
                    - lat: 33.9925942
                      lng: -118.4232475
                      weight: 4
                    - lat: 34.0764345
                      lng: -118.3730332
                      weight: 3
                    - lat: 34.093981
                      lng: -118.327638
                      weight: 0
                    - lat: 34.056385
                      lng: -118.2508724
                      weight: 1
                    - lat: 34.107701
                      lng: -118.2667943
                      weight: 4
                    - lat: 34.0450139
                      lng: -118.2388682
                      weight: 4
                    - lat: 34.1031997
                      lng: -118.2586152
                      weight: 1
                    - lat: 34.0828183
                      lng: -118.3241586
                      weight: 1
                  options:
                    radius: 20
                    opacity: 1

```
---

## File: `blocks/container/GoogleMaps.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/generic_block.yaml.njk
  vars:
    block_type: GoogleMaps
    category: container
    pageTitle: GoogleMaps
    filePath: blocks/container/GoogleMaps.yaml
    schema: ../plugins/blocks/blocks-google-maps/src/blocks/GoogleMaps/GoogleMaps.json
    description_content: |
      This is a Lowdefy block which implements the following from the [Google Maps API](https://developers.google.com/maps/documentation/javascript/overview):
        - [Map](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions)
        - [Markers](https://developers.google.com/maps/documentation/javascript/reference/marker#MarkerOptions)
        - [Marker Clusterers](https://developers.google.com/maps/documentation/javascript/marker-clustering)

      In order to use this block, it must be wrapped in a [`GoogleMapsScript`](./GoogleMapsScript) block.

      ### Properties

      - `apiKey: string`: Your Google Maps API key.
      - `libraries: array`: List of [Google libraries](https://developers.google.com/maps/documentation/javascript/libraries).
      - `map: mapOptions`: All [map options](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions).
        - `center: { lat: number, lng: number }`: A coordinate position object by which to center the map.
        - `zoom: number`: Map zoom level.
        - `options: mapOptions`: All other [map options](https://developers.google.com/maps/documentation/javascript/reference/map#MapOptions).
      - `style: cssObject`: A style object applied to the map element.
      - `markers: markerOptions[]`: A list of Markers with marker options, see more [Javascript API Markers](https://developers.google.com/maps/documentation/javascript/markers).
        - `position: { lat: number, lng: number }`: Position of marker on map.
        - `label: string`: Label displayed on marker.
      - `markerClusterers: markerClustererOptions[]`: A list of MarkerClusterers with marker clusterer options.
        - `markers: markerOptions[]`: A list of Markers with marker options, see more [Javascript API Markers](https://developers.google.com/maps/documentation/javascript/markers).
          - `position: { lat: number, lng: number }`: Position of marker on map.
          - `label: string`: Label displayed on marker.
        - `options: markerClustererOptions`: All other [marker clusterer options](https://react-google-maps-api-docs.netlify.app/#markerclusterer).
      - `infoWindow: infoWindowOptions`: All infoWindow options, see [infoWindow options](https://developers.google.com/maps/documentation/javascript/reference/info-window#InfoWindowOptions).
        - `position: { lat: number, lng: number }`: Position of infoWindow on map.
        - `visible: boolean`: When visible is true, blocks inside infoWindow content area will be rendered.

      ### Events

      - `onBoundsChanged`: Trigger onBoundsChanged actions when the bounds of the map are changed, returns `_event`
      object:
        - `bounds`:
          - `east`: latitudinal coordinate
          - `north`: longitudinal coordinate
          - `south`: longitudinal coordinate
          - `west`: latitudinal coordinate
        - `center`:
          - `lat`: latitudinal coordinate
          - `lng`: longitudinal coordinate
        - `zoom`: zoom level
      - `onCenterChanged`: Trigger onCenterChanged actions when the center of the map is changed, returns `_event`
      object:
        - `bounds`:
          - `east`: latitudinal coordinate
          - `north`: longitudinal coordinate
          - `south`: longitudinal coordinate
          - `west`: latitudinal coordinate
        - `center`:
          - `lat`: latitudinal coordinate
          - `lng`: longitudinal coordinate
        - `zoom`: zoom level
      - `onClick`: Trigger onClick actions when the map is clicked, returns `_event` object:
        - `domEvent`: event object
        - `latLng`:
          - `lat`: latitudinal coordinate
          - `lng`: longitudinal coordinate
        - `pixel`:
          - `x`: x position on map block
          - `y`: y position on map block
      - `onClusterClick`: Trigger onClusterClick actions when a cluster is clicked, returns `_event`
      - `onMarkerClick`: Trigger onMarkerClick actions when a marker is clicked, returns `_event`
      object:
        - `domEvent`: event object
        - `latLng`:
          - `lat`: latitudinal coordinate
          - `lng`: longitudinal coordinate
        - `pixel`:
          - `x`: x position on map block
          - `y`: y position on map block
      - `onZoomChanged`: Trigger onZoomChanged actions when the zoom on the map is changed. returns `_event`
      object:
        - `bounds`:
          - `east`: latitudinal coordinate
          - `north`: longitudinal coordinate
          - `south`: longitudinal coordinate
          - `west`: latitudinal coordinate
        - `center`:
          - `lat`: latitudinal coordinate
          - `lng`: longitudinal coordinate
        - `zoom`: zoom level

      ### Methods

      - `fitBounds`: Fit map to given bounds.
        - `bounds: { lat: number, lng: number } []`: A list of the coordinate positions of the boundary points.
        - `zoom: number`: Map zoom level.
      - `getBounds`: Returns the bounds of the map.
      - `getCenter`: Returns the center of the map.
      - `getZoom`: Returns the zoom of the map.

    examples:
      - title: Add markers
        block:
          id: google_maps_script
          type: GoogleMapsScript
          properties:
            apiKey:
              _build.env: GOOGLE_MAPS_API_KEY
          blocks:
            - id: google_maps
              type: GoogleMaps
              properties:
                map:
                  options:
                    panControl: true
                    zoomControl: true
                    fullscreenControl: true
                  zoom: 14
                  center:
                    lat: -25.344
                    lng: 131.036
                markers:
                  - position:
                      lat: -25.344
                      lng: 131.036
                    label: One
                  - position:
                      lat: -25.348
                      lng: 131.038
                    label: Two

      - title: Add markers with onClick event
        block:
          id: google_maps_script
          type: GoogleMapsScript
          properties:
            apiKey:
              _build.env: GOOGLE_MAPS_API_KEY
          blocks:
            - id: google_maps
              type: GoogleMaps
              properties:
                map:
                  options:
                    panControl: true
                    zoomControl: true
                    fullscreenControl: true
                  center:
                    lat: -25.344
                    lng: 131.036
                  zoom: 5
                markers:
                  _state: markers_list
              events:
                onClick:
                  - id: markers_list
                    type: SetState
                    params:
                      markers_list:
                        _array.concat:
                          - - position:
                                _event: latLng
                              label: Hi
                          - _if_none:
                              - _state: markers_list
                              - []

```
---

## File: `blocks/container/Footer.yaml`

## Description

The `Footer` block provides a page container for a [footer](https://4x.ant.design/components/layout/) area with content.


---

## File: `blocks/container/Drawer.yaml`

## Description

A panel which slides in from the edge of the screen.
The Drawer has a single area, `content`.

> To open the drawer, invoke a drawer method.

## Methods

### toggleOpen

### setOpen


---

## File: `blocks/container/Descriptions.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Descriptions
    category: container
    schema: ../plugins/blocks/blocks-antd/src/blocks/Descriptions/schema.json
    filePath: blocks/container/Descriptions.yaml
    init_state_values:
      __type_block.properties.column: number
      __type_block.properties.items: object[]
      __object_arr_block.properties.items:
        - label: Item One
          value: 1
        - label: Item Two
          value: 2
        - label: Item Three
          value: 3
        - label: Item Four
          value: 4
          span: 3

    description_content: |
      Display multiple read-only fields in groups. Commonly used to display a detailed set of data.

    examples:
      - title: Object data example
        block:
          id: object_example
          type: Descriptions
          properties:
            bordered: true
            items:
              Location: South Africa
              Temperature: 22
              Date: 2021-02-02
    areas:
      - extra

```
---

## File: `blocks/container/Content.yaml`

## Description

The `Content` block provides a page container for a [content](https://4x.ant.design/components/layout/) area.


---

## File: `blocks/container/ConfirmModal.yaml`

## Description

A popup container, presenting the user with a modal confirmation dialog.
The ConfirmModal has a single area, `content`.

> To open the confirm modal, invoke the open method.

## Methods

### open


---

## File: `blocks/container/Comment.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Comment
    category: container
    schema: ../plugins/blocks/blocks-antd/src/blocks/Comment/schema.json
    filePath: blocks/container/Comment.yaml
    init_state_values:
      __type_block.properties.avatar: object
    description_content: |
      A Comment renders a comment list item. It can be used as both a `display` or `container` category block.
    areas:
      - content
      - actions
      - author
      - title
    examples:
      - title: Comment
        block:
          id: comment_ex
          type: Comment
          properties:
            author: The Dude
            content: Yeah, well, you know, that’s just, like, your opinion, man.
            datetime: 18 January, 1998
            avatar:
              color: '#402B18'
              content: TD
              shape: square

```
---

## File: `blocks/container/Collapse.yaml`

## Description

A container with collapsible panels. The area keys are user defined, and should be listed under the `panels` property. Each panel also has a 'extra' content area, the key of which can be defined in the `panels.$.extraKey` property.


---

## File: `blocks/container/Carousel.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/blocks/template.yaml.njk
  vars:
    block_type: Carousel
    category: container
    schema: ../plugins/blocks/blocks-antd/src/blocks/Carousel/schema.json
    filePath: blocks/container/Carousel.yaml
    description_content: |
      Carousel to navigate through different slides consisting of blocks.
      The key of each slide is the area keys of the container.
      ### Methods

        - `goTo`: Set the current slide to a specific slide.
          - `slide: string`: The key of the chosen slide.
          - `dontAnimate: boolean`: If true, the transition happens without animation.
        - `next`: Set the next slide as the current slide.
        - `prev`: Set the previous slide as the current slide.
    init_state_values:
      block.properties.slides:
        - key: slide1
        - key: slide2
        - key: slide3
    user_defined_areas: true
    areas:
      - slide1
      - slide2
      - slide3
    examples:
      - title: Carousel
        block:
          id: basic_carousel
          type: Carousel
          properties:
            draggable: true
            slidesToShow: 1
            slides:
              - key: slide_one
              - key: slide_two
              - key: slide_three
          areas:
            slide_one:
              blocks:
                - id: side_1
                  type: Card
                  blocks:
                    - id: title_side_1
                      type: Title
                      properties:
                        content: Slide 1
            slide_two:
              blocks:
                - id: side_2
                  type: Card
                  blocks:
                    - id: title_side_2
                      type: Title
                      properties:
                        content: Slide 2
            slide_three:
              blocks:
                - id: side_3
                  type: Card
                  blocks:
                    - id: title_side_3
                      type: Title
                      properties:
                        content: Slide 3
      - title: Responsive Carousel
        block:
          id: responsive_carousel
          type: Carousel
          properties:
            autoplay: true
            draggable: true
            slidesToShow: 3
            slides:
              - key: slide_one
              - key: slide_two
              - key: slide_three
              - key: slide_four
            responsive:
              - breakpoint: 1024
                settings:
                  slidesToShow: 2
                  slidesToScroll: 2
                  infinite: true
                  dots: true
              - breakpoint: 600
                settings:
                  slidesToShow: 1
                  slidesToScroll: 1
          areas:
            slide_one:
              blocks:
                - id: side_1
                  type: Card
                  blocks:
                    - id: title_side_1
                      type: Title
                      properties:
                        content: Slide 1
            slide_two:
              blocks:
                - id: side_2
                  type: Card
                  blocks:
                    - id: title_side_2
                      type: Title
                      properties:
                        content: Slide 2
            slide_three:
              blocks:
                - id: side_3
                  type: Card
                  blocks:
                    - id: title_side_3
                      type: Title
                      properties:
                        content: Slide 3
            slide_four:
              blocks:
                - id: side_4
                  type: Card
                  blocks:
                    - id: title_side_4
                      type: Title
                      properties:
                        content: Slide 4

```
---

## File: `blocks/container/Card.yaml`

## Description

A Card container places blocks on a white background with a card border.
The Card has `content`, `title` and `extra` areas. The `title` area replaces `properties.title` if defined.


---

## File: `blocks/container/Box.yaml`

## Description

A Box is a container that places sub-blocks into a html `<div>`.
The Box has a single area, `content`.


---

## File: `blocks/container/Badge.yaml`

## Description

Small numerical value or status descriptor for UI elements. Badge is used as a container block, describing its content block.


---

## File: `blocks/container/Alert.yaml`

## Description

Alert is used to render user feedback messages in a Alert styled frame.


---

## File: `blocks/container/Affix.yaml`

## Description

An Affix block makes it's content stick to the viewport.
The Affix has a single area, `content`.


---

## File: `connections/Stripe.yaml`

# Stripe

**Section:** Connections

## Connections

Connection types:
  - Stripe

### Stripe

[Stripe](https://stripe.com/) is a popular payment provider which allows you to accept payments, send payouts, and manage your business online.
The `Stripe` connector uses the official [Node.js client from Stripe](https://github.com/stripe/stripe-node).
In order to use the `Stripe` connection, you first need to create a [Stripe](https://stripe.com/) account and setup an API key.

> Secrets like API keys should be stored using the [`_secret`](operators/secret.md) operator.

#### Properties
- `secretKey: string`: __Required__ - Stripe [secret key](https://stripe.com/docs/keys).
- `apiVersion: string`: Stripe API version to use. Defaults to the account-wide version.
- `timeout: number`: Timeout for requests to the Stripe API.
- `maxNetworkRetries: number`: Maximum number of times failed requests are repeated before throwing an error.
- `telemetry: boolean`: Whether to send telemetry data to Stripe (this is forwarded to the Stripe client library. Lowdefy does not receive any telemetry data from your Stripe connection.)

#### Examples

###### Simple connection:
```yaml
connections:
  - id: stripe
    type: Stripe
    properties:
      secretKey:
        _secret: STRIPE_SECRET_KEY
```
Environment variables:
```
LOWDEFY_SECRET_STRIPE_SECRET_KEY = sk_test_KyvNyie...
```

###### Using an older API version:
```yaml
connections:
  - id: stripe
    type: Stripe
    properties:
      secretKey:
        _secret: STRIPE_SECRET_KEY
      apiVersion: 2017-12-14
```
Environment variables:
```
LOWDEFY_SECRET_STRIPE_SECRET_KEY = sk_test_KyvNyie...
```

## Requests

Request types:
  - StripeRequest

### StripeRequest

The `StripeRequest` request allows calls to all modules supported by the [Stripe API client](https://stripe.com/docs/api?lang=node) by nesting the resource and method calls:
```yaml
resource:
  method:
    - parameter1
    - parameter2
```

#### Properties
- `{{ apiResource }}: object`: A Stripe API resource, eg. `customers`.
  - `{{ method }}: array | null`: A resource method, eg. `create`. The arguments array will be passed on to the client method.

The Stripe client exposes all resources as objects, with the API methods being available as function properties on those resource objects.
In Lowdefy, you may access these properties by nesting them.

### Examples

###### List the 30 most recent customers
```yaml
requests:
  - id: list_customers
    type: StripeRequest
    connectionId: stripe
    properties:
      customers:
        list:
          limit: 30
```

###### Create a payment intent
```yaml
requests:
  - id: create_payment_intent
    type: StripeRequest
    connectionId: stripe
    properties:
      paymentIntents:
        create:
          - amount: 2000
            currency: eur
            payment_method_types: [ card ]
```

###### Retrieve a checkout session by ID
```yaml
requests:
  - id: retrieve_checkout_session
    type: StripeRequest
    connectionId: stripe
    properties:
      checkout:
        sessions:
          retrieve:
            - cs_test_onpT2icY2lrSU0IgDGXEhhcOHcWeJS5BpLcQGMx0uI9TZHLMBdzvWpvx
```



---

## File: `connections/SendGridMail.yaml`

# SendGrid Email

**Section:** Connections

[SendGrid](https://sendgrid.com/) is a popular email API provider which allows you to easily setup a email service. The `SendGridMail` connection can be used to connect to an existing SendGrid API account.

The `SendGridMail` connector uses the [@sendgrid/mail](https://github.com/@sendgrid/mail) library.

In order to use the `SendGridMail` connector, you first need to create a [SendGrid](https://sendgrid.com/) account and setup an API key.

> Secrets like API keys should be stored using the [`_secret`](operators/secret.md) operator.

In order to send from your custom domain your will need to [authenticate your domain](https://app.sendgrid.com/settings/sender_auth) through SendGrid. See the [SendGrid Docs](https://sendgrid.com/docs) for help on getting started with SendGrid.

## Connections

Connection types:
  - SendGridMail

## Requests

Request types:
  - SendGridMailSend

### Types

- `email: string | object`:  SendGrid accepts emails as either a `string` or an `object`.
  - `string`: Can be in the following format; `someone@example.org` or `Some One <someone@example.org>`.
  - `object`: With `name' and `email` properties, for example: `{"name": "Some One", "email": "someone@example.org"}`.

### SendGridMail

#### Properties

- `apiKey: string`: __Required__ - SendGrid API key.
- `from: email`: __Required__ - Email address to send email from.
- `mailSettings: object`: SendGrid mail settings. See [SendGrid API-Reference](https://sendgrid.com/docs/api-reference/)
  - `sandboxMode: object`: SendGrid mail sandbox mode settings.
    - `enable: boolean`: Sandbox mode enabled when `true`.
- `templateId: string`: SendGrid email template ID to render email when sending.

### SendGridMailSend

#### Properties

##### object
A `mail description`:
- `to: email | email[]`: __Required__ - Email address or addresses to send to.
- `cc: email | email[]`: Email address to cc in communication.
- `bcc: email | email[]`: Email address to bcc in communication.
- `replyTo: email | email[]`: Email address to reply to.
- `subject: string`: Email subject.
- `text: string`: Email message in plain text format.
- `html: string`: Email message in html format.
- `dynamicTemplateData: object`: SendGrid template data to render into email template.
- `sendAt: integer`: A unix timestamp allowing you to specify when you want your email to be delivered. You can't schedule more than 72 hours in advance.
- `attachments: object[]`: List of email attachments to include with email. See [SendGrid API-Reference](https://d2w67tjf43xwdp.cloudfront.net/Classroom/Build/Add_Content/attachments.html]).
  - `content: string`: __Required__ - Base 64 encoded attachment content.
  - `filename: string`: __Required__ - Name of the attachment file.
  - `type: string`: The mime type of the content you are attaching. For example, `text/plain` or `text/html`.

##### array
An array of `mail description` objects can also be provided.

### Examples

###### Send a reminder email
```yaml
connections:
  - id: my_sendgrid
    type: SendGridMail
    properties:
      apiKey:
        _secret: SENDGRID_API_KEY
      from: reminders@example.org
# ...
requests:
  - id: send_reminder
    type: SendGridMailSend
    connectionId: my_sendgrid
    properties:
      to: Harry Potter <harry@example.org>
      subject: Reminder for Mr. Potter to water the 🌱
      text: |
        Hi Harry

        Please remember to water the magic plants today :)

        Thank you
# ...
```



---

## File: `connections/SQLite.yaml`

# SQLite

**Section:** Connections

The [Knex](/Knex) connection can be used to connect to a [SQLite](https://www.sqlite.org) database.


## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - Should be `sqlite3` or `sqlite` to connect to SQLite.
- `connection: object`:
  - `filename: string`:  __Required__ - The path to the SQLite file (relative to the project root).
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.


#### Examples

##### Specify filename:
```yaml
connections:
  - id: sqlite
    type: Knex
    properties:
      client: sqlite
      connection:
        filename: ./mydb.sqlite
```

###### Different connections in deployment and production environments:
```yaml
connections:
  - id: knex
    type: Knex
    properties:
      client:
        _secret: KNEX_CLIENT
      connection:
        _json.parse:
          _secret: KNEX_CONNECTION
```
Environment variables in development:
```
LOWDEFY_SECRET_KNEX_CLIENT = sqlite
LOWDEFY_SECRET_KNEX_CONNECTION = {"filename": "./mydb.sqlite"}
```
Environment variables in production:
```
LOWDEFY_SECRET_KNEX_CLIENT = postgres
LOWDEFY_SECRET_KNEX_CONNECTION = {"user": "dbuser", "host": "database.server.com", "database": "mydb", "password": "secretpassword"}
```


[object Object]


---

## File: `connections/Redis.yaml`

# Redis

**Section:** Connections

[`Redis`](http://redis.io/) is an open-source, in-memory key-value data structure store. Redis offers a set of versatile in-memory data structures (strings, hashes, lists, sets, sorted sets with range queries, bitmaps, hyperloglogs, geospatial indexes, and streams) that allow the creation of many custom applications. Key use cases for Redis include database, caching, session management and message broker.

Lowdefy integrates with Redis using the one of the recommended [Node.js clients (node-redis)](https://github.com/redis/node-redis).


## Connections

Connection types:
  - Redis

### Redis

#### Properties
- `connection: object | string `: __Required__ - Connection object or string to pass to the [`redis client`](https://github.com/redis/node-redis) redis client.

The connection object accepts will be passed to the redis client verbatim, so check out the [configuration instructions](https://github.com/redis/node-redis/blob/master/docs/client-configuration.md).

#### Examples

###### Redis with connection object:
```yaml
connections:
  - id: redis
    type: Redis
    properties:
      connection:
        username:
          _secret: REDIS_USERNAME
        password:
          _secret: REDIS_PASSWORD
        database:
          _secret: REDIS_DATABASE
        socket:
          host:
            _secret: REDIS_HOST
          port:
            _secret: REDIS_PORT
```
Environment variables:
```
LOWDEFY_SECRET_REDIS_USERNAME = user
LOWDEFY_SECRET_REDIS_PASSWORD = password
LOWDEFY_SECRET_REDIS_DATABASE = 4
LOWDEFY_SECRET_REDIS_HOST = redis.server.com
LOWDEFY_SECRET_REDIS_PORT = 5000
```

###### Redis with connection string:
```yaml
connections:
  - id: redis
    type: Redis
    properties:
      connection:
        _secret: REDIS_CONNECTION_STRING
```
Environment variables:
```
LOWDEFY_SECRET_REDIS_CONNECTION_STRING = redis://user:password@redis:server.com:5000/4'
```


## Requests

Request types:
  - Redis

### Redis

#### Properties

- `command: string`: **Required** - Redis command to be executed, accepts all of the [out-of-the-box Redis commands](https://redis.io/commands).
- `parameters: array`: An array of parameters to be passed to the redis command.
- `modifiers: object`: The redis modififers to be passed to the redis command.

#### Examples

###### Setting a key-value pair in redis:

```yaml
id: redisRequest
type: Redis
connectionId: redis
properties:
  command: set
  parameters:
    - key
    - value
```

###### Getting a value from redis:

```yaml
id: redisRequest
type: Redis
connectionId: redis
properties:
  command: get
  parameters:
    - key
```

###### Setting a key-value pair only if key does not exist:

````yaml
id: redisRequest
type: Redis
connectionId: redis
properties:
  command: set
  parameters:
    - key
    - value
  modififers:
    nx: true
```



---

## File: `connections/PostgreSQL.yaml`

# PostgreSQL

**Section:** Connections

The [Knex](/Knex) connection can be used to connect to a [PostgreSQL](https://www.postgresql.org) database.


## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - The database client to use. To connect to PostgreSQL, use one of:
  - `postgres`
  - `pg` (alias of `postgres`)
  - `postgresql` (alias of `postgres`)
- `connection: object | string`: __Required__ - Connection string or object to pass to the [`pg`](https://www.npmjs.com/package/pg) database client.
- `searchPath: string`:  Set PostgreSQL search path.
- `version: string`:  Set database version.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### Connection Object:
```yaml
connections:
  - id: postgres
    type: Knex
    properties:
      client: postgres
      connection:
        user:
          _secret: PG_USER
        host:
          _secret: PG_HOST
        database:
          _secret: PG_DB
        password:
          _secret: PG_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_PG_HOST = database.server.com
LOWDEFY_SECRET_PG_DB = db
LOWDEFY_SECRET_PG_USER = user
LOWDEFY_SECRET_PG_PASSWORD = password
```

###### Secret connection string, with version and searchPath:
```yaml
connections:
  - id: postgres
    type: Knex
    properties:
      client: postgres
      connection:
        _secret: PG_CONNECTION_STRING
      version: '7.2'
      searchPath:
        - knex
        - public
```
Environment variables:
```
LOWDEFY_SECRET_PG_CONNECTION_STRING = postgresql://user:password@database.server.com:5432/db
```


[object Object]


---

## File: `connections/OracleDB.yaml`

# Oracle Database

**Section:** Connections

The [Knex](/Knex) connection can be used to connect to a [Oracle Database](https://www.oracle.com/database/).


## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - Should be `oracledb` to connect to Oracle Database.
- `connection: object | string `: __Required__ - Connection object or string to pass to the [`oracledb`](https://www.npmjs.com/package/oracledb) database client.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### Connection Object:
```yaml
connections:
  - id: oracledb
    type: Knex
    properties:
      client: oracledb
      connection:
        user:
          _secret: ORACLEDB_USER
        password:
          _secret:
        connectString:
          _secret: ORACLEDB_CONNECT_STRING
```
Environment variables:
```
LOWDEFY_SECRET_ORACLEDB_USER = user
LOWDEFY_SECRET_ORACLEDB_PASSWORD = password
LOWDEFY_SECRET_ORACLEDB_CONNECT_STRING = database.server.com/db
```


[object Object]


---

## File: `connections/MySQL.yaml`

# MySQL

**Section:** Connections

The [Knex](/Knex) connection can be used to connect to a [MySQL](https://www.mysql.com) database.


## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - Should be `mysql` to connect to MySQL.
- `connection: object | string `: __Required__ - Connection object or string to pass to the [`mysql`](https://www.npmjs.com/package/mysql) database client.
- `version: string`:  Set database version.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### Connection Object:
```yaml
connections:
  - id: mysql
    type: Knex
    properties:
      client: mysql
      connection:
        host:
          _secret: MYSQL_HOST
        user:
          _secret: MYSQL_USER
        database:
          _secret: MYSQL_DB
        password:
          _secret: MYSQL_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_MYSQL_HOST = database.server.com
LOWDEFY_SECRET_MYSQL_DB = db
LOWDEFY_SECRET_MYSQL_USER = user
LOWDEFY_SECRET_MYSQL_PASSWORD = password
```

###### Connection string:
```yaml
connections:
  - id: mysql
    type: Knex
    properties:
      client: mysql
      connection:
        _secret: MYSQL_CONNECTION_STRING
```
Environment variables:
```
LOWDEFY_SECRET_MYSQL_CONNECTION_STRING = mysql://user:password@database.server.com/db
```


[object Object]


---

## File: `connections/MongoDB.yaml`

# MongoDB

**Section:** Connections

MongoDB is a NoSQL database that stores JSON-like documents. These documents are stored in collections, which are like database tables. The fields inside these document can differ from document to document, but generally they are all more or less the same. However documents with different schemas can be stored in the same collection.

##### ObjectIds

MongoDB uses the _id field as the id for a document. This has to be unique for every document in the collection. If no _id is provided when the document is created, a MongoDB [ObjectId](https://docs.mongodb.com/manual/reference/method/ObjectId/) is created for that document. This id includes a timestamp, a random element and an incrementing counter, to ensure it is unique even if multiple ids are created at the same time.

The _id is often represented as:

```js
{
  _id: ObjectId("507f1f77bcf86cd799439011")
}
```

To be able to transmit these ids over JSON network connections, and to use them in Lowdefy apps, Lowdefy serializes these ids as (in YAML):
```yaml
_id:
  _oid: 507f1f77bcf86cd799439011
```

Ids specified in this way will be treated as ObjectIds by MongoDB requests and mutations.


## Connections

Connection types:
  - MongoDBCollection

### MongoDBCollection

The `MongoDBCollection` connection sets up a connection to a MongoDB deployment. A [connection URI](https://docs.mongodb.com/manual/reference/connection-string/index.html) with authentication credentials (username and password) is required. The URI can be in the standard or dns seedlist (srv) formats. Connections are defined on a collection level, since this allows for read/write access control on a per collection level. Access control can also be managed using the roles in the database.

>Since the connection URI contains authentication secrets, it should be stored using the [`_secret`](operators/secret.md) operator.

When using MongoDBUpdateOne and MongoDBDeleteOne requests, take note that the responses differ if the connection has a log collection.

#### Properties
- `databaseUri: string`: __Required__ - Connection uri string for the MongoDb deployment. Should be stored using the [_secret](operators/secret.md) operator.
- `databaseName: string`: Default: Database specified in connection string - The name of the database in the MongoDB deployment.
- `collection: string`: __Required__ - The name of the MongoDB collection.
- `read: boolean`: Default: `true` - Allow read operations like find on the collection.
- `write: boolean`: Default: `false` - Allow write operations like update on the collection.
- `options: object`: See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/interfaces/mongoclientoptions.html) for more information.

#### Examples

###### MongoDB collection with reads and writes:
```yaml
connections:
  - id: my_collection
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: my_collection_name
      write: true
```
###### MongoDB collection with reads, writes and a log collection:
```yaml
connections:
  - id: my_collection
    type: MongoDBCollection
    properties:
      databaseUri:
        _secret: MONGODB_URI
      collection: my_collection_name
      write: true
      changeLog:
        collection: log_collection_name
        meta:
          user:
            _user: true
```
Environment variables:
```
LOWDEFY_SECRET_MONGODB_URI = mongodb+srv://username:password@server.example.com/database
```

## Requests

Request types:
  - MongoDBAggregation
  - MongoDBBulkWrite
  - MongoDBDeleteMany
  - MongoDBDeleteOne
  - MongoDBFind
  - MongoDBFindOne
  - MongoDBInsertMany
  - MongoDBInsertOne
  - MongoDBUpdateMany
  - MongoDBUpdateOne


### MongoDBAggregation

The `MongoDBAggregation` request executes an [aggregation pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/) in the collection specified in the connectionId. It returns the array of documents returned by the aggregation. Aggregation pipelines are MongoDB's data processing and aggregation framework. They are based on a series of stages, each of which apply a transformation to the data passed through them, like sorting, grouping or calculating additional fields.

>Cursors are not supported. The request will return the whole body of the response as an array.

#### Properties
- `pipeline: object[]`: __Required__ - Array containing all the aggregation framework commands for the execution.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#aggregate) for more information. Supported settings are:
  - `allowDiskUse: boolean`: Default: `false` - Allow disk use on the MongoDB server to store temporary results for the aggregation.
  - `authdb: string`: Specifies the authentication information to be used.
  - `batchSize: number`: The number of documents to return per batch.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `bypassDocumentValidation: boolean`: Default: `false` - Allow driver to bypass schema validation in MongoDB 3.2 or higher.
  - `checkKeys: boolean`: The serializer will check if keys are valid.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string`: Add a [comment](https://docs.mongodb.com/manual/reference/operator/query/comment/index.html) to the aggregation. These comments are visible in the MongoDB profile log, making them easier to interpret.
  - `dbName: string`: The database name.
  - `explain: boolean`: Specifies to return the information on the processing of the pipeline.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `hint: string | object`: Add an index selection hint to an aggregation command.
  - `ignoreUndefined: boolean`: Default: `true` - Serialize will not emit undefined fields.
  - `let: object`: Specifies an object with a list of variables. This allows you to improve command readability by separating the variables from the query text.
  - `maxAwaitTimeMS: number`: The maximum amount of time for the server to wait on new documents to satisfy a tailable cursor query.
  - `maxTimeMS: number`: Specifies a cumulative time limit in milliseconds for processing operations on the cursor.
  - `noResponse: boolean`: Admin command option.
  - `readConcern: object`: Specifies the level of isolation for read operations.
  - `readPreference: string | object`: The read preference.
  - `retryWrites: boolean`: Should retry failed writes.
  - `serializeFunctions: boolean`: Default: `false` - Serialize the javascript functions.
  - `willRetryWrites: boolean`: Option whether to retry writes.
  - `writeConcern: object`: An object that expresses the write concern to use with the $out or $merge stage.

#### Examples

###### Calculate average score by region:
```yaml
requests:
  - id: avg_spend_by_region
    type:  MongoDBAggregation
    connectionId: my_mongodb_collection_id
    properties:
      pipeline:
        - $group:
            _id: $region
            score:
              $avg: $score
        - $project:
            _id: 0
            region: $_id
            score: 1
        - $sort:
            score: 1
```

### MongoDBBulkWrite

The `MongoDBBulkWrite` request executes [bulkWrite operations](https://www.mongodb.com/docs/manual/reference/method/db.collection.bulkWrite/#write-operations) in the collection specified in the connectionId.

#### Properties
- `operations: object[]`: __Required__ - Array containing all the bulkWrite operations for the execution.
  - `insertOne: object`:
    - `document: object`: The document to be inserted.
  - `deleteOne: object`:
    - `filter: object`: __Required__ - The filter used to select the document to delete.
    - `collation: object`: Specify collation settings for update operation.
  - `deleteMany: object`:
    - `filter: object`: __Required__ - The filter used to select the documents to delete.
    - `collation: object`: Specify collation settings for update operation.
  - `updateOne: object`:
    - `filter: object`: __Required__ - The filter used to select the document to update.
    - `update: object | object[]`: __Required__ - The update operations to be applied to the document.
    - `upsert: object`: Insert document if no match is found.
    - `arrayFilters: string[]`: Array filters for the [`$[<identifier>]`](https://docs.mongodb.com/manual/reference/operator/update/positional-filtered/) array update operator.
    - `collation: object`: Specify collation settings for update operation.
    - `hint: object | string`: 'An optional hint for query optimization.'
  - `updateMany: object`:
    - `filter: object`: __Required__ - The filter used to select the documents to update.
    - `update: object | object[]`: __Required__ - The update operations to be applied to the documents.
    - `upsert: object`: Insert document if no match is found.
    - `arrayFilters: string[]`: Array filters for the [`$[<identifier>]`](https://docs.mongodb.com/manual/reference/operator/update/positional-filtered/) array update operator.
    - `collation: object`: Specify collation settings for update operation.
    - `hint: object | string`: An optional hint for query optimization.
  - `replaceOne: object`:
    - `filter: object`: __Required__ - The filter used to select the document to replace.
    - `replacement: object`: __Required__ - The document to be inserted.
    - `upsert: object`: Insert document if no match is found.
    - `collation: object`: Specify collation settings for update operation.
    - `hint: object | string`: An optional hint for query optimization.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#aggregate) for more information. Supported settings are:
  - `ordered: boolean`: Default: `true` - A boolean specifying whether the mongod instance should perform an ordered or unordered operation execution.
  - `writeConcern: object`: An object that expresses the write concern to use.

#### Examples

###### Update pizzas:

```yaml
requests:
  - id: update_pizzas
    type: MongoDBBulkWrite
    connectionId: my_mongodb_collection_id
    properties:
      operations:
        - insertOne:
            document:
              _id: 3
              type: "beef"
              size: "medium"
              price: 6
        - insertOne:
            document:
              _id: 4
              type: "sausage"
              size: "large"
              price: 10
        - updateOne:
            filter:
              type: "cheese"
              update:
                $set:
                  price: 8
        - deleteOne:
            filter:
              type: "pepperoni"
        - replaceOne:
            filter:
              type: "vegan"
            replacement:
              type: "tofu"
              size: "small"
              price: 4
```

### MongoDBDeleteMany

The `MongoDBDeleteMany` request deletes multiple documents in the collection specified in the connectionId. It requires a filter, which is written in the query syntax, to select a documents to delete.

#### Properties
- `filter: object`: __Required__ - The filter used to select the document to update.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#deletemany) for more information. Supported settings are:
  - `authdb: string`: Specifies the authentication information to be used.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `checkKeys: boolean`: Default: `false` - If true, will throw if bson documents start with $ or include a . in any key value.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string`: A user-provided comment to attach to this command.
  - `dbName: string`: The database name.
  - `explain: boolean`: Specifies the verbosity mode for the explain output.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `hint: string | object`: An optional hint for query optimization.
  - `ignoreUndefined: boolean`: Default: `false` - Specify if the BSON serializer should ignore undefined fields.
  - `let: object`: Map of parameter names and values that can be accessed using `$$var` (requires MongoDB 5.0).
  - `maxTimeMS: number`: Specifies a cumulative time limit in milliseconds for processing operations on the cursor.
  - `noResponse: boolean`: Admin command option.
  - `ordered: boolean`: If true, when an insert fails, don't execute the remaining writes. If false, continue with remaining inserts when one fails.
  - `readConcern: object`: Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported).
  - `readPreference: string | object`: The read preference.
  - `retryWrites: boolean`: Should retry failed writes.
  - `serializeFunctions: boolean`: Default: `false` - Serialize the javascript functions.
  - `willRetryWrites: boolean`: Option whether to retry writes.
  - `writeConcern: object`: An object that expresses the write concern.

#### Examples

###### Delete all documents older than a specific date:
```yaml
requests:
  - id: delete_old_documents
    type:  MongoDBDeleteMany
    connectionId: my_mongodb_collection_id
    properties:
      filter:
        created_date:
          $lt:
            _date: 2020-01-01
```

### MongoDBDeleteOne

The `MongoDBDeleteOne` request deletes a single document in the collection specified in the connectionId. It requires a filter, which is written in the query syntax, to select a document to delete. It will delete the first document that matches the filter.
> MongoDBDeleteOne response differs when the connection has a log collection. When a log collection is set on the connection, a findOneAndDelete operation is performed compared to the standard deleteOne operation.

#### Properties
- `filter: object`: __Required__ - The filter used to select the document to update.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#deleteone) for more information. Supported settings are:
  - `authdb: string`: Specifies the authentication information to be used.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `checkKeys: boolean`: Default: `false` - If true, will throw if bson documents start with $ or include a . in any key value.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string`: A user-provided comment to attach to this command.
  - `dbName: string`: The database name.
  - `explain: boolean`: Specifies the verbosity mode for the explain output.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `hint: string | object`: An optional hint for query optimization.
  - `ignoreUndefined: boolean`: Default: `false` - Specify if the BSON serializer should ignore undefined fields.
  - `let: object`: Map of parameter names and values that can be accessed using `$$var` (requires MongoDB 5.0).
  - `maxTimeMS: number`: Specifies a cumulative time limit in milliseconds for processing operations on the cursor.
  - `noResponse: boolean`: Admin command option.
  - `ordered: boolean`: If true, when an insert fails, don't execute the remaining writes. If false, continue with remaining inserts when one fails.
  - `readConcern: object`: Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported).
  - `readPreference: string | object`: The read preference.
  - `retryWrites: boolean`: Should retry failed writes.
  - `serializeFunctions: boolean`: Default: `false` - Serialize the javascript functions.
  - `willRetryWrites: boolean`: Option whether to retry writes.
  - `writeConcern: object`: An object that expresses the write concern.

#### Examples

###### Delete a document by _id:
```yaml
requests:
  - id: delete_selected_document
    type:  MongoDBDeleteOne
    connectionId: my_mongodb_collection_id
    payload:
      selected_id
        _state: selected_id
    properties:
      filter:
        _id:
          _payload: selected_id
```

### MongoDBFind

The `MongoDBFind` request executes a MongoDB [query](https://docs.mongodb.com/manual/tutorial/query-documents/) on the collection specified in the connectionId. It returns the array of documents returned by the query.

>Cursors are not supported. The request will return the whole body of the response as an array.

#### Properties
- `query: object`: __Required__ - A MongoDB query object.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#find) for more information. Supported settings are:
  - `allowDiskUse: boolean`: Allows disk use for blocking sort operations exceeding 100MB memory. (MongoDB 3.2 or higher)
  - `allowPartialResults: boolean`: For queries against a sharded collection, allows the command (or subsequent getMore commands) to return partial results, rather than an error, if one or more queried shards are available.
  - `authdb: string`: Specifies the authentication information to be used.
  - `awaitData: boolean`: Specify if the cursor is a tailable-await cursor. Requires `tailable` to be true.
  - `batchSize: number`: Set the batchSize for the getMoreCommand when iterating over the query results.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `checkKeys: boolean`: The serializer will check if keys are valid.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string | object`: Add a [comment](https://docs.mongodb.com/manual/reference/operator/query/comment/index.html) to the query. These comments are visible in the MongoDB profile log, making them easier to interpret.
  - `dbName: string`: The database name.
  - `explain: boolean`: Specifies the verbosity mode for the explain output.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `hint: string | object`: Tell the query to use specific indexes in the query. Object of indexes to use, `{'_id':1}`.
  - `ignoreUndefined: boolean`: Default: `true` - Serialize will not emit undefined fields.
  - `let: object`: Map of parameter names and values that can be accessed using `$$var` (requires MongoDB 5.0).
  - `limit: number`: Sets the limit of documents returned in the query.
  - `max: object`: The exclusive upper bound for a specific index.
  - `maxAwaitTimeMS: number`: The maximum amount of time for the server to wait on new documents to satisfy a tailable cursor query. Requires `tailable` and `awaitData` to be true.
  - `maxTimeMS: number`: Number of milliseconds to wait before aborting the command.
  - `min: object`: The inclusive lower bound for a specific index.
  - `noCursorTimeout: boolean`: The server normally times out idle cursors after an inactivity period (10 minutes) to prevent excess memory use. Set this option to prevent that.
  - `noResponse: boolean`: Admin command option.
  - `projection: object`: The fields to return in the query. Object of fields to either include or exclude (one of, not both), `{'a':1, 'b': 1}` or `{'a': 0, 'b': 0}`.
  - `readConcern: object`: Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported).
  - `readPreference: string | object`: The preferred read preference.
  - `retryWrites: boolean`: Should retry failed writes.
  - `returnKey: boolean`: If true, returns only the index keys in the resulting documents.
  - `serializeFunctions: boolean`: Default: `false` - Serialize the javascript functions.
  - `showRecordId: boolean`: Determine whether to return the record identifier for each document. If true, adds a field $recordId to the returned documents.
  - `singleBatch: boolean`: Default: `false` - Determines whether to close the cursor after the first batch.
  - `skip: number`: Set to skip N documents ahead in your query (useful for pagination).
  - `sort: array | object`: Set to sort the documents coming back from the query.
  - `tailable: boolean`: Specify if the cursor is tailable.
  - `timeout: boolean`: Specify if the cursor can timeout.
  - `willRetryWrites: boolean`: Option whether to retry writes.
  - `writeConcern: object`: An object that expresses the write concern.

#### Examples

###### Find top ten scores above 90:
```yaml
requests:
  - id: scores_top_ten_scores_above_90
    type:  MongoDBFind
    connectionId: my_mongodb_collection_id
    properties:
      query:
        score:
          $gt: 90
      options:
        sort:
          - - score
            - -1
        limit: 10
        projection:
          score: 1
          name: 1
```

### MongoDBFindOne

The `MongoDBFindOne` request executes a MongoDB [query](https://docs.mongodb.com/manual/tutorial/query-documents/) on the collection specified in the connectionId. It returns the first document that matches the specified query.

>Cursors are not supported. The request will return the whole body of the response as an array.

#### Properties
- `query: object`: __Required__ - A MongoDB query object.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#findone) for more information. Supported settings are:
  - `allowDiskUse: boolean`: Allows disk use for blocking sort operations exceeding 100MB memory. (MongoDB 3.2 or higher)
  - `allowPartialResults: boolean`: For queries against a sharded collection, allows the command (or subsequent getMore commands) to return partial results, rather than an error, if one or more queried shards are available.
  - `authdb: string`: Specifies the authentication information to be used.
  - `awaitData: boolean`: Specify if the cursor is a tailable-await cursor. Requires `tailable` to be true.
  - `batchSize: number`: Set the batchSize for the getMoreCommand when iterating over the query results.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `checkKeys: boolean`: The serializer will check if keys are valid.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string | object`: Add a [comment](https://docs.mongodb.com/manual/reference/operator/query/comment/index.html) to the query. These comments are visible in the MongoDB profile log, making them easier to interpret.
  - `dbName: string`: The database name.
  - `explain: boolean`: Specifies the verbosity mode for the explain output.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `hint: string | object`: Tell the query to use specific indexes in the query. Object of indexes to use, `{'_id':1}`.
  - `ignoreUndefined: boolean`: Default: `true` - Serialize will not emit undefined fields.
  - `let: object`: Map of parameter names and values that can be accessed using `$$var` (requires MongoDB 5.0).
  - `limit: number`: Sets the limit of documents returned in the query.
  - `max: object`: The exclusive upper bound for a specific index.
  - `maxAwaitTimeMS: number`: The maximum amount of time for the server to wait on new documents to satisfy a tailable cursor query. Requires `tailable` and `awaitData` to be true.
  - `maxTimeMS: number`: Number of milliseconds to wait before aborting the command.
  - `min: object`: The inclusive lower bound for a specific index.
  - `noCursorTimeout: boolean`: The server normally times out idle cursors after an inactivity period (10 minutes) to prevent excess memory use. Set this option to prevent that.
  - `noResponse: boolean`: Admin command option.
  - `projection: object`: The fields to return in the query. Object of fields to either include or exclude (one of, not both), `{'a':1, 'b': 1}` or `{'a': 0, 'b': 0}`.
  - `readConcern: object`: Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported).
  - `readPreference: string | object`: The preferred read preference.
  - `retryWrites: boolean`: Should retry failed writes.
  - `returnKey: boolean`: If true, returns only the index keys in the resulting documents.
  - `serializeFunctions: boolean`: Default: `false` - Serialize the javascript functions.
  - `showRecordId: boolean`: Determine whether to return the record identifier for each document. If true, adds a field $recordId to the returned documents.
  - `singleBatch: boolean`: Default: `false` - Determines whether to close the cursor after the first batch.
  - `skip: number`: Set to skip N documents ahead in your query (useful for pagination).
  - `sort: array | object`: Set to sort the documents coming back from the query.
  - `tailable: boolean`: Specify if the cursor is tailable.
  - `timeout: boolean`: Specify if the cursor can timeout.
  - `willRetryWrites: boolean`: Option whether to retry writes.
  - `writeConcern: object`: An object that expresses the write concern.

#### Examples

###### Find a document by id:
```yaml
requests:
  - id: find_by_id
    type:  MongoDBFindOne
    connectionId: my_mongodb_collection_id
    payload:
      _id:
        _input: _id
    properties:
      query:
        _id:
          _payload: _id
```

### MongoDBInsertMany

The `MongoDBInsertMany` request inserts an array of documents into the collection specified in the connectionId. If a `_id` field is not specified on a document, a MongoDB `ObjectID` will be generated.

#### Properties
- `docs: object[]`: __Required__ - The array of documents to be inserted.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#insertmany) for more information. Supported settings are:
  - `authdb: string`: Specifies the authentication information to be used.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `bypassDocumentValidation: boolean`: Default: `false` - Allow driver to bypass schema validation in MongoDB 3.2 or higher
  - `checkKeys: boolean`: Default: `true` - If true, will throw if bson documents start with $ or include a . in any key value.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string | object`: Add a [comment](https://docs.mongodb.com/manual/reference/operator/query/comment/index.html) to the query. These comments are visible in the MongoDB profile log, making them easier to interpret.
  - `dbName: string`: The database name.
  - `explain: object`: Specifies the verbosity mode for the explain output.
  - `forcesServerObjectId: boolean`: Default: `false` - Force server to assign _id values instead of driver.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `ignoreUndefined: boolean`: Default: `false` - Specify if the BSON serializer should ignore undefined fields.
  - `maxTimeMS: number`: Number of milliseconds to wait before aborting the command.
  - `noResponse: boolean`: Admin command option.
  - `ordered: boolean`: If true, when an insert fails, don't execute the remaining writes. If false, continue with remaining inserts when one fails.
  - `readConcern: object`: Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported).
  - `readPreference: object`: The preferred read preference.
  - `retryWrites: boolean`: Should retry failed writes.
  - `serializeFunctions: boolean`: Default: `false` - Serialize the javascript functions.
  - `willRetryWrites: boolean`: Option whether to retry writes.
  - `writeConcern: object`: An object that expresses the write concern.

#### Examples

###### Insert a set of documents:
```yaml
requests:
  - id: insert_documents
    type:  MongoDBInsertMany
    connectionId: my_mongodb_collection_id
    properties:
      docs:
        - _id: 1
          value: 4
        - _id: 2
          value: 1
        - _id: 3
          value: 7

```

### MongoDBInsertOne

The `MongoDBInsertOne` request inserts a document into the collection specified in the connectionId. If a `_id` field is not specified, a MongoDB `ObjectID` will be generated.

#### Properties
- `doc: object`: __Required__ - The document to be inserted.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#insertone) for more information. Supported settings are:
  - `authdb: string`: Specifies the authentication information to be used.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `bypassDocumentValidation: boolean`: Default: `false` - Allow driver to bypass schema validation in MongoDB 3.2 or higher
  - `checkKeys: boolean`: Default: `true` - If true, will throw if bson documents start with $ or include a . in any key value.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string | object`: Add a [comment](https://docs.mongodb.com/manual/reference/operator/query/comment/index.html) to the query. These comments are visible in the MongoDB profile log, making them easier to interpret.
  - `dbName: string`: The database name.
  - `explain: object`: Specifies the verbosity mode for the explain output.
  - `forcesServerObjectId: boolean`: Default: `false` - Force server to assign _id values instead of driver.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `ignoreUndefined: boolean`: Default: `false` - Specify if the BSON serializer should ignore undefined fields.
  - `maxTimeMS: number`: Number of milliseconds to wait before aborting the command.
  - `noResponse: boolean`: Admin command option.
  - `readConcern: object`: Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported).
  - `readPreference: object`: The preferred read preference.
  - `retryWrites: boolean`: Should retry failed writes.
  - `serializeFunctions: boolean`: Default: `false` - Serialize the javascript functions.
  - `willRetryWrites: boolean`: Option whether to retry writes.
  - `writeConcern: object`: An object that expresses the write concern.

#### Examples

###### Insert a document:
```yaml
requests:
  - id: insert_new_comment
    type:  MongoDBInsertOne
    connectionId: my_mongodb_collection_id
    payload:
      comment:
        _state: comment_input
    properties:
      doc:
        comment:
          _payload: comment
        user_id:
          _user: id
        timestamp:
          _date: now
```

### MongoDBUpdateMany

The `MongoDBUpdateMany` request updates multiple documents that match a certain criteria in the collection specified in the connectionId. It requires a filter, which is written in the query syntax, to select the documents to update.

#### Properties
- `filter: object`: __Required__ - The filter used to select the document to update.
- `update: object | object[]`: __Required__ - The update operations to be applied to the document.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/3.3/api/Collection.html#updateOne) for more information. Supported settings are:
  - `arrayFilters: string[]`: Array filters for the [`$[<identifier>]`](https://docs.mongodb.com/manual/reference/operator/update/positional-filtered/) array update operator.
  - `bypassDocumentValidation: boolean`: Default: `false` - Allow driver to bypass schema validation in MongoDB 3.2 or higher.
  - `checkKeys: boolean`: Default: `false` - If true, will throw if bson documents start with $ or include a . in any key value.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `forceServerObjectId: boolean`: Force server to assign _id values instead of driver.
  - `hint: object`: An optional hint for query optimization.
  - `ignoreUndefined: boolean`: Default: `false` - Specify if the BSON serializer should ignore undefined fields.
  - `j: boolean`: Specify a journal write concern.
  - `upsert: boolean`: Default: `false` - Insert document if no match is found.
  - `w: number | string`: The write concern.
  - `wtimeout: number`: The write concern timeout.

#### Examples

###### Set a list of documents as resolved:
```yaml
requests:
  - id: set_resolved
    type:  MongoDBUpdateMany
    connectionId: my_mongodb_collection_id
    payload:
      selected_issues_list:
        _state: selected_issues_list
    properties:
      # Select all documents where the _id is in selected_issues_list in state
      filter:
        _id:
          $in:
            _payload: selected_issues_list
      update:
        $set:
          resolved: true
```

###### Mark all documents with score less than 6 as urgent:
```yaml
requests:
  - id: set_resolved
    type:  MongoDBUpdateMany
    properties:
      filter:
        score:
          $lt: 6
      update:
        $set:
          status: urgent
```

### MongoDBUpdateOne

The `MongoDBUpdateOne` request updates a single document in the collection specified in the connectionId. It requires a filter, which is written in the query syntax, to select a document to update. It will update the first document that matches the filter. If the `upsert` option is set to true, it will insert a new document if no document is found to update.
> MongoDBUpdateOne response differs when the connection has a log collection. When a log collection is set on the connection, a findOneAndUpdate operation is performed compared to the standard updateOne operation.

#### Properties
- `filter: object`: __Required__ - The filter used to select the document to update.
- `update: object | object[]`: __Required__ - The update operations to be applied to the document.
- `options: object`: Optional settings. See the [driver documentation](https://mongodb.github.io/node-mongodb-native/4.0/classes/collection.html#updateone) for more information. Supported settings are:
  - `arrayFilters: object[]`: _Array_ - Array filters for the [`$[<identifier>]`](https://docs.mongodb.com/manual/reference/operator/update/positional-filtered/) array update operator.
  - `authdb: string`: Specifies the authentication information to be used.
  - `bsonRegExp: boolean`: Return the BSON regular expressions as BSONRegExp instances.
  - `bypassDocumentValidation: boolean`: Default: `false` - Allow driver to bypass schema validation in MongoDB 3.2 or higher.
  - `checkKeys: boolean`: Default: `false` - If true, will throw if bson documents start with $ or include a . in any key value.
  - `collation: object`: Specify collation (MongoDB 3.4 or higher) settings for update operation.
  - `comment: string | object`: A user-provided comment to attach to this command.
  - `dbName: string`: The database name.
  - `explain: object`: Specifies the verbosity mode for the explain output.
  - `fullResponse: boolean`: Return the full server response for the command.
  - `hint: string | object`: An optional hint for query optimization.
  - `ignoreUndefined: boolean`: Default: `false` - Specify if the BSON serializer should ignore undefined fields.
  - `let: object`: Map of parameter names and values that can be accessed using `$$var` (requires MongoDB 5.0).
  - `maxTimeMS: number`: Number of milliseconds to wait before aborting the command.
  - `noResponse: boolean`: Admin command option.
  - `readConcern: object`: Specify a read concern and level for the collection. (only MongoDB 3.2 or higher supported).
  - `readPreference: object`: The preferred read preference.
  - `retryWrites: boolean`: Should retry failed writes.
  - `serializeFunctions: boolean`: Default: `false` - Serialize the javascript functions.
  - `upsert: boolean`: Default: `false` - Insert document if no match is found.
  - `willRetryWrites: boolean`: Option whether to retry writes.
  - `writeConcern: object`: An object that expresses the write concern.

#### Examples

###### Update a document:
```yaml
requests:
  - id: update
    type:  MongoDBUpdateOne
    connectionId: my_mongodb_collection_id
    payload:
      _id:
        _state: _id
    properties:
      filter:
        _id:
          _payload: _id
      update:
        $set:
          _state: true
```

Like a comment:
```yaml
requests:
  - id: like_comment
    type:  MongoDBUpdateOne
    connectionId: my_mongodb_collection_id
    payload:
      comment_id:
        _state: comment._id
    properties:
      filter:
        _id:
          _payload: comment_id
      update:
        $inc:
          likes: 1
        $push:
          liked_by:
            _user.id:
        $set:
          last_liked:
            _date: now
```



---

## File: `connections/MariaDB.yaml`

# MariaDB

**Section:** Connections

The [Knex](/Knex) connection can be used to connect to a [MariaDB](https://www.mysql.com) database. To connect to a MariaDB database, use the `mysql` client.


## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - Use the `mysql` client to connect to MariaDB.
- `connection: object | string `: __Required__ - Connection object or string to pass to the [`mysql`](https://www.npmjs.com/package/mysql) database client.
- `version: string`:  Set database version.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### Connection object:
```yaml
connections:
  - id: mariadb
    type: Knex
    properties:
      client: mysql
      connection:
        host:
          _secret: MARIADB_HOST
        database:
          _secret: MARIADB_DB
        user:
          _secret: MARIADB_USER
        password:
          _secret: MARIADB_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_MARIADB_HOST = database.server.com
LOWDEFY_SECRET_MARIADB_DB = db
LOWDEFY_SECRET_MARIADB_USER = user
LOWDEFY_SECRET_MARIADB_PASSWORD = password
```


[object Object]


---

## File: `connections/MSSQL.yaml`

# Microsoft SQL Server

**Section:** Connections

The [Knex](/Knex) connection can be used to connect to [Microsoft SQL Server](https://www.microsoft.com/en-us/sql-server/sql-server-2019).


## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - Should be `mssql` to connect to Microsoft SQL Server.
- `connection: object | string `: __Required__ - Connection object or string to pass to the [`mssql`](https://www.npmjs.com/package/mssql) database client.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### Connection object:
```yaml
connections:
  - id: mssql
    type: Knex
    properties:
      client: mssql
      connection:
        host:
          _secret: MSSQL_HOST
        database:
          _secret: MSSQL_DB
        user:
          _secret: MSSQL_USER
        password:
          _secret: MSSQL_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_MSSQL_HOST = database.server.com
LOWDEFY_SECRET_MSSQL_DB = db
LOWDEFY_SECRET_MSSQL_USER = user
LOWDEFY_SECRET_MSSQL_PASSWORD = password
```

###### Secret connection string:
```yaml
connections:
  - id: mssql
    type: Knex
    properties:
      client: mssql
      connection:
        _secret: MSSQL_CONNECTION_STRING
```
Environment variables:
```
LOWDEFY_SECRET_MSSQL_CONNECTION_STRING = mssql://user:password@database.server.com:1433/db
```


[object Object]


---

## File: `connections/Knex.yaml`

# Knex

**Section:** Connections

[`Knex.js`](http://knexjs.org) is a SQL query builder that can be used to connect to [PostgreSQL](/PostgreSQL), [MS SQL Server](/MSSQL), [MySQL](/MySQL), [MariaDB](/MariaDB), [SQLite](/SQLite), [Oracle](/Oracle), and [Amazon Redshift](/AmazonRedshift) databases.

The Knex connection can be used to execute raw SQL queries using the `KnexRaw` requests, or the Knex query builder can be used with the `KnexBuilder` request.

For more details on specific databases, see the database documentation:


## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - The database client to use. One of:
  - `mssql`
  - `mysql`
  - `oracledb`
  - `postgres`
  - `pg` (alias of `postgres`)
  - `postgresql` (alias of `postgres`)
  - `redshift`
  - `sqlite3`
  - `sqlite` (alias of `sqlite3`)
- `connection: object | string`: __Required__ - Connection string or object to pass to the database client. See the specific client documentation for more details.
- `searchPath: string`:  Set PostgreSQL search path.
- `version: string`:  Set database version.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### MySQL with connection object:
```yaml
connections:
  - id: mysql
    type: Knex
    properties:
      client: mysql
      connection:
        host:
          _secret: MYSQL_HOST
        user:
          _secret: MYSQL_USER
        database:
          _secret: MYSQL_DB
        password:
          _secret: MYSQL_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_MYSQL_HOST = database.server.com
LOWDEFY_SECRET_MYSQL_DB = db
LOWDEFY_SECRET_MYSQL_USER = user
LOWDEFY_SECRET_MYSQL_PASSWORD = password
```

###### PostgreSQL with secret connection string:
```yaml
connections:
  - id: postgres
    type: Knex
    properties:
      client: postgres
      connection:
        _secret: PG_CONNECTION_STRING
```
Environment variables:
```
LOWDEFY_SECRET_PG_CONNECTION_STRING = postgresql://user:password@database.server.com:5432/db
```


[object Object]


---

## File: `connections/GoogleSheet.yaml`

# Google Sheets

**Section:** Connections

## Connections

Connection types:
  - GoogleSheet

### GoogleSheet

The `GoogleSheet` connection offers the flexibility to connect to Google Sheets using either an API key or a service account. While an API key is suitable for read-only access to public sheets, most applications will benefit more from using a service account, which offers broader capabilities. For detailed instructions on creating a service account, you can refer to the [Google Sheets API Quickstart Guide](https://developers.google.com/sheets/api/quickstart/js) and the [Google Workspace Guide on Creating a Project](https://developers.google.com/workspace/guides/create-project).

This connection refers to the entire document as the `spreadsheet`, and the individual sheets in the document as `sheets`. The spreadsheet is identified by it's `spreadsheetId`, and sheets can either be identified by their `sheetId` or their `index` (position in the document starting from 0).

When a sheet is accessed in a browser the url either looks like:
`https://docs.google.com/spreadsheets/d/{spreadsheetId}/edit#gid={sheetId}`

The `GoogleSheet` connection works with sheets as a row based data store. Each row is a data record, and a header row needs to be present to define the column names. This header needs to be created in the Google Sheets web interface. Types can be specified for any of the columns in the sheet. If a type is not specified, the value will be read as a string. The `json` type will stringify a object as JSON before saving it, and parse it again when reading.

#### Properties
- `apiKey: string`: API key for your google project.
- `client_email: string`: The email address of your service account.
- `private_key: string`: The private key for your service account. Base64 encode the string if you have issues with the newline characters in the string.
- `sheetId: string`: The ID of the worksheet. Can be found in the URL as the "gid" parameter. One of `sheetId` or `sheetIndex` is required.
- `sheetIndex: number`: The position of the worksheet as they appear in the Google sheets UI. Starts from 0. One of `sheetId` or `sheetIndex` is required.
- `spreadsheetId: string`: __Required__ - The document ID from the URL of the spreadsheet.
- `columnTypes: object`: An object that defines the data types for each column. Each key should be the column name, and the value should be one of: `string`, `number`, `boolean`, `date`, or `json`.
- `read: boolean`: Default: `true` - Allow read operations like find on the sheet.
- `write: boolean`: Default: `false` - Allow write operations like update on the sheet.

#### Examples

###### Read only access to first sheet in a public spreadsheet:
```yaml
connections:
  - id: public_sheet
    type: GoogleSheet
    properties:
      apiKey:
        _secret: GOOGLE_SHEETS_API_KEY
      sheetIndex: 0
      spreadsheetId: ubQsWYNGRUq0gFB1sAp2r9oYE19lZ8yGA1T6y0yBoLPW
```

###### Access with a service account, with defined types:
```yaml
connections:
  - id: my_sheet
    type: GoogleSheet
    properties:
      client_email:
        _secret: GOOGLE_SHEETS_CLIENT_EMAIL
      private_key:
        _base64.decode:
          _secret: GOOGLE_SHEETS_PRIVATE_KEY
      sheetId: '1199545345'
      spreadsheetId: ubQsWYNGRUq0gFB1sAp2r9oYE19lZ8yGA1T6y0yBoLPW
      columnTypes:
        name: string
        age: number
        birthday: date
        subscribed: boolean
        address: json
```

## Requests

Request types:
  - GoogleSheetAppendMany
  - GoogleSheetAppendOne
  - GoogleSheetDeleteOne
  - GoogleSheetGetMany
  - GoogleSheetGetOne
  - GoogleSheetUpdateMany
  - GoogleSheetUpdateOne

### GoogleSheetAppendMany

The `GoogleSheetAppendMany` request inserts an array of documents as rows in a Google Sheet.

#### Properties
- `rows: object[]`: __Required__ - The rows to insert into the sheet. An an array of objects where keys are the column names and values are the values to insert.
- `options: object`: Optional settings. Supported settings are:
  - `raw: boolean`: Store raw values instead of converting as if typed into the sheets UI.

#### Examples

###### Insert a list of rows.
```yaml
requests:
  - id: append_rows
    type:  GoogleSheetAppendMany
    connectionId: google_sheets
    properties:
      rows:
        - name: D.Va
          role: Tank
        - name: Tracer
          role: Damage
        - name: Genji
          role: Damage
        - name: Reinhart
          role: Tank
        - name: Mercy
          role: Support
```

### GoogleSheetAppendOne

The `GoogleSheetAppendOne` request inserts a documents as a row in a Google Sheet.

#### Properties
- `row: object`: __Required__ - The row to insert into the sheet. An object where keys are the column names and values are the values to insert.
- `options: object`: Optional settings. Supported settings are:
  - `raw: boolean`: Store raw values instead of converting as if typed into the sheets UI.

#### Examples

###### Insert a single row:
```yaml
requests:
  - id: insert_dva
    type:  GoogleSheetAppendOne
    connectionId: google_sheets
    properties:
      row:
        name: D.Va
        role: Tank
        real_name: Hana Song
        age: 19
```

### GoogleSheetDeleteOne

The `GoogleSheetDeleteOne` request deletes a row from a Google Sheet. It deletes the first row matched by the filter, written as a MongoDB query expression.

#### Properties
- `filter: object`: __Required__ - A MongoDB query expression to filter the data. The first row matched by the filter will be deleted.
- `options: object`: Optional settings. Supported settings are:
  - `limit: number`: The maximum number of rows to fetch.
  - `skip: number`: The number of rows to skip from the top of the sheet.

#### Examples

###### Delete the row where name is "Hanzo".
```yaml
requests:
  - id: delete_hanzo
    type:  GoogleSheetDeleteOne
    connectionId: google_sheets
    properties:
      filter:
        name:
          $eq: Hanzo
```

### GoogleSheetGetMany

The `GoogleSheetGetMany` request fetches a number of rows from the spreadsheet. The `limit` and `skip` options can be used to control which documents are read from the spreadsheet. The filter or pipeline options can then be used to filter or transform the fetched data.

#### Properties
- `filter: object`: A MongoDB query expression to filter the data.
- `pipeline: object[]`: A MongoDB aggregation pipeline to transform the data.
- `options: object`: Optional settings. Supported settings are:
  - `limit: number`: The maximum number of rows to fetch.
  - `skip: number`: The number of rows to skip from the top of the sheet.

#### Examples

###### Get the first 10 rows.
```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetGetMany
    connectionId: google_sheets
    properties:
      options:
        limit: 10
```

###### Pagination using limit and skip.
```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetGetMany
    connectionId: google_sheets
    payload:
      page_size:
        _state: page_size
      page_number:
        _state: page_number
    properties:
      options:
        skip:
          _product:
            - _payload: page_size
            - _subtract:
                - _payload: page_number
                - 1
        limit:
          _payload: page_size
```

###### Get all records where age is greater than 25.
```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetGetMany
    connectionId: google_sheets
    properties:
      filter:
        age:
          $gt: 25
```

###### Use an aggregation pipeline to aggregate data.
```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetGetMany
    connectionId: google_sheets
    properties:
      pipeline:
        - $group:
            _id: $region
            score:
              $avg: $score
        - $project:
            _id: 0
            region: $_id
            score: 1
        - $sort:
            score: 1
```

### GoogleSheetGetOne

The `GoogleSheetGetOne` request fetches a single rows from the spreadsheet. The `limit` and `skip` options can be used to control which documents are read from the spreadsheet. The filter option can then be used to filter or select which row is returned.

#### Properties
- `filter: object`: A MongoDB query expression to filter the data.
- `options: object`: Optional settings. Supported settings are:
  - `limit: number`: The maximum number of rows to fetch.
  - `skip: number`: The number of rows to skip from the top of the sheet.

#### Examples

###### Get row where name is "Zarya".
```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetGetOne
    connectionId: google_sheets
    properties:
      filter:
        name:
          $eq: Zarya
```

### GoogleSheetUpdateMany

The `GoogleSheetUpdateMany` request updates all the rows matched by the filter.

#### Properties
- `filter: object`: A MongoDB query expression to filter the data. . All rows matched by the filter will be updated.
- `update: object`: The update to apply to the row. An object where keys are the column names and values are the updated values.
- `options: object`: Optional settings. Supported settings are:
  - `limit: number`: The maximum number of rows to fetch.
  - `raw: boolean`: Store raw values instead of converting as if typed into the sheets UI.
  - `skip: number`: The number of rows to skip from the top of the sheet.

#### Examples

###### Update all rows where age is less than 18.
```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetUpdateMany
    connectionId: google_sheets
    properties:
      filter:
        age:
          $lt: 18
      update:
        minor: true
```
### GoogleSheetUpdateOne

The `GoogleSheetUpdateOne` request updates the first row matched by the filter.

#### Properties
- `filter: object`: A MongoDB query expression to filter the data. . The first row matched by the filter will be updated.
- `update: object`: The update to apply to the row. An object where keys are the column names and values are the updated values.
- `options: object`: Optional settings. Supported settings are:
  - `limit: number`: The maximum number of rows to fetch.
  - `raw: boolean`: Store raw values instead of converting as if typed into the sheets UI.
  - `skip: number`: The number of rows to skip from the top of the sheet.
  - `upsert: boolean`: Insert the row if no rows are matched by the filter.

#### Examples

###### Update the row for "Doomfist"
```yaml
requests:
  - id: get_10_rows
    type:  GoogleSheetUpdateOne
    connectionId: google_sheets
    properties:
      filter:
        name:
          $eq: Doomfist
      update:
        overpowered: true
```



---

## File: `connections/Elasticsearch.yaml`

# Elasticsearch

**Section:** Connections

## Connections

Connection types:
  - Elasticsearch

### Elasticsearch

[`Elasticsearch`](https://www.elastic.co/elasticsearch/) is a distributed, RESTful search and analytics engine capable of addressing a growing number of use cases. As the heart of the Elastic Stack, it centrally stores your data for lightning fast search, fine‑tuned relevancy, and powerful analytics that scale with ease.

The Elasticsearch connection can be used to search for documents in your Elasticsearch cluster. Lowdefy integrates with Elasticsearch using the official [Node.js client from Elastic Co.](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/introduction.html), and provides direct access to the full query DSL supported by Elasticsearch.

#### Properties
- `node: string|string[]`: __Required__ - Elasticsearch node(s) to connect to.
- `index: string`: The default index to query. You can also provide a per-request index to override this setting.
- `auth: BasicAuth|CloudAuth`: The authentication data as an object, containing either basic auth credentials (as `username` and `password`), an API key (as `apiKey`), or Elastic Cloud credentials.
- `maxRetries: number`: Max number of retries for each request.
- `requestTimeout: number`: Max request timeout in milliseconds for each request.

The connection accepts many more advanced configuration options. They will be passed to the Elasticsearch client verbatim, so check out the [configuration instructions](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/basic-config.html) provided by Elastic.

#### Examples

###### Authenticated connection with reads and writes:
```yaml
connections:
  - id: elasticsearch
    type: Elasticsearch
    properties:
      write: true
      node:
        _secret: ELASTICSEARCH_HOST
      auth:
        username:
          _secret: ELASTICSEARCH_USER
        password:
          _secret: ELASTICSEARCH_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_ELASTICSEARCH_HOST = http://localhost:9200
LOWDEFY_SECRET_ELASTICSEARCH_USER = es
LOWDEFY_SECRET_ELASTICSEARCH_PASSWORD = password
```

###### Unauthenticated connection with default index:
```yaml
connections:
  - id: elasticsearch
    type: Elasticsearch
    properties:
      write: true
      node:
        _secret: ELASTICSEARCH_HOST
      index:
        _secret: ELASTICSEARCH_INDEX
```
Environment variables:
```
LOWDEFY_SECRET_ELASTICSEARCH_HOST = http://localhost:9200
LOWDEFY_SECRET_ELASTICSEARCH_INDEX = articles
```

## Requests

Request types:
  - ElasticsearchDelete
  - ElasticsearchDeleteByQuery
  - ElasticsearchIndex
  - ElasticsearchSearch
  - ElasticsearchUpdate
  - ElasticsearchUpdateByQuery

### ElasticsearchDelete

The `ElasticsearchDelete` request removes a JSON document from the specified index.

#### Properties
- `id: string|number`: __Required__ - Unique identifier for the document to be deleted.
- `if_seq_no: number` Only perform the operation if the document has this sequence number. See [Optimistic concurrency control](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#optimistic-concurrency-control-index).
- `if_primary_term: number` Only perform the operation if the document has this primary term. See [Optimistic concurrency control](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#optimistic-concurrency-control-index).
- `refresh: string|boolean` If `true`, Elasticsearch refreshes the affected shards to make this operation visible to search, if `wait_for` then wait for a refresh to make this operation visible to search, if `false` do nothing with refreshes. Valid values: `true`, `false`, `wait_for`. Default: `false`.
- `routing: string` Custom value used to route operations to a specific shard.
- `timeout: string` Period to [wait for active shards](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#index-wait-for-active-shards). Defaults to 1m (one minute).
- `version: integer` Explicit version number for concurrency control. The specified version must match the current version of the document for the request to succeed.
- `version_type` Specific version type: `external`, `external_gte`.
- `wait_for_active_shards: string` The number of shard copies that must be active before proceeding with the operation. Set to `all` or any positive integer up to the total number of shards in the index (`number_of_replicas+1`). Default: `1`, the primary shard.
  See [Active Shards](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#index-wait-for-active-shards).

#### Examples

###### Delete a document:
```yaml
requests:
  - id: delete_document
    type:  ElasticsearchDelete
    payload:
      selected_id:
        _state: selected_id
    properties:
      id:
        _payload: selected_id
```

### ElasticsearchDeleteByQuery

The `ElasticsearchDeleteByQuery` request deletes documents that match the specified query.

#### Properties
- `body: object` The Elasticsearch query body, expressed in the [JSON Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html).
  - `query: object`: The Elasticsearch query.
- `_source: string|string[]|boolean`: True or false to return the `_source` field or not, or a list of fields to return.
- `_source_excludes: string|string[]`: A list of fields to exclude from the returned `_source` field.
- `_source_includes: string|string[]`: A list of fields to extract and return from the `_source` field.
- `allow_no_indices: boolean`: Whether to ignore if a wildcard indices expression resolves into no concrete indices. (This includes _all string or when no indices have been specified).
- `max_docs: number` Maximum number of documents to process. Defaults to all documents.
- `refresh: string|boolean` If `true`, Elasticsearch refreshes the affected shards to make this operation visible to search, if `wait_for` then wait for a refresh to make this operation visible to search, if `false` do nothing with refreshes. Valid values: `true`, `false`, `wait_for`. Default: `false`.
- `requests_per_second: number` The throttle for this request in sub-requests per second. Defaults to -1 (no throttle).
- `analyzer: string`: The analyzer to use for the query string
- `default_operator: string`: The default operator for query string query (AND or OR).
- `df: string`: The field to use as default where no field prefix is given in the query string.
- `from: number`: Starting offset.
- `size: number`: Number of hits to return.
- `index: string|string[]`: A comma-separated list of index names to search; use _all or empty string to perform the operation on all indices.
- `lenient: boolean`: Specify whether format-based query failures (such as providing text to a numeric field) should be ignored.
- `scroll: string`: Specify how long a consistent view of the index should be maintained for scrolled search.
- `sort: string|string[]`: A comma-separated list of <field>:<direction> pairs.

The request accepts many more advanced configuration options. They will be passed to the Elasticsearch client verbatim, so check out the [available options](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-delete-by-query.html#docs-delete-by-query-api-query-params) provided by Elastic.

#### Examples

###### Delete all comments by a user:
```yaml
requests:
  - id: delete_multiple
    type:  ElasticsearchUpdate
    payload:
      selected_user:
        _state: selected_user
    properties:
      body:
        query:
          term:
            user.id:
              _payload: selected_user
```

### ElasticsearchIndex

The `ElasticsearchIndex` request adds a JSON document to the specified data stream or index and makes it searchable. If the target is an index and the document already exists, the request updates the document and increments its version.

#### Properties
- `body: object` The Elasticsearch request body contains the JSON source for the document data.
- `if_seq_no: number` Only perform the operation if the document has this sequence number. See [Optimistic concurrency control](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#optimistic-concurrency-control-index).
- `if_primary_term: number` Only perform the operation if the document has this primary term. See [Optimistic concurrency control](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#optimistic-concurrency-control-index).
- `op_type: 'create'|'index'` Set to `create` to only index the document if it does not already exist (_put if absent_). If a document with the specified `_id` already exists, the indexing operation will fail. Same as using the `<index>/_create` endpoint. Valid values: `index`, `create`. If document id is specified, it defaults to `index`. Otherwise, it defaults to `create`.
- `pipeline: string` ID of the pipeline to use to preprocess incoming documents.
- `refresh: string|boolean` If `true`, Elasticsearch refreshes the affected shards to make this operation visible to search, if `wait_for` then wait for a refresh to make this operation visible to search, if `false` do nothing with refreshes. Valid values: `true`, `false`, `wait_for`. Default: `false`.
- `routing: string` Custom value used to route operations to a specific shard.
- `timeout: string` Period the request waits for the following operations:
    - [Automatic index creation](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#index-creation)
    - [Dynamic mapping](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/dynamic-mapping.html) updates
    - [Waiting for active shards](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#index-wait-for-active-shards)
  Defaults to `1m` (one minute). This guarantees Elasticsearch waits for at least the timeout before failing. The actual wait time could be longer, particularly when multiple waits occur.
- `version: integer` Explicit version number for concurrency control. The specified version must match the current version of the document for the request to succeed.
- `version_type` Specific version type: `external`, `external_gte`.
- `wait_for_active_shards: string` The number of shard copies that must be active before proceeding with the operation. Set to `all` or any positive integer up to the total number of shards in the index (`number_of_replicas+1`). Default: `1`, the primary shard.
  See [Active Shards](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#index-wait-for-active-shards).
- `require_alias: boolean` If `true`, the destination must be an [index alias](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/alias.html). Defaults to `false`.

#### Examples

###### Index a new document.
```yaml
requests:
  - id: insert_new_comment
    type:  Elasticsearch
    connectionId: elasticsearch
    payload:
      comment:
        _state: comment_input
    properties:
      body:
        comment:
          _payload: comment
        user_id:
          _user: id
        timestamp:
          _date: now
```

### ElasticsearchSearch

The `ElasticsearchSearch` request searches the Elasticsearch index.

#### Properties
- `body: object` The Elasticsearch query body, expressed in the [JSON Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html).
  - `query: object`: The Elasticsearch query.
  - `aggs: object`: The [aggregations](https://www.elastic.co/guide/en/elasticsearch/reference/current/search-aggregations.html) to request from the server.
- `_source: string|string[]|boolean`: True or false to return the _source field or not, or a list of fields to return.
- `_source_excludes: string|string[]`: A list of fields to exclude from the returned _source field.
- `_source_includes: string|string[]`: A list of fields to extract and return from the _source field.
- `allow_no_indices: boolean`: Whether to ignore if a wildcard indices expression resolves into no concrete indices. (This includes _all string or when no indices have been specified).
- `allow_partial_search_results: boolean`: Indicate if an error should be returned if there is a partial search failure or timeout.
- `analyzer: string`: The analyzer to use for the query string
- `default_operator: string`: The default operator for query string query (AND or OR).
- `df: string`: The field to use as default where no field prefix is given in the query string.
- `from: number`: Starting offset.
- `size: number`: Number of hits to return.
- `index: string|string[]`: A comma-separated list of index names to search; use _all or empty string to perform the operation on all indices.
- `lenient: boolean`: Specify whether format-based query failures (such as providing text to a numeric field) should be ignored.
- `scroll: string`: Specify how long a consistent view of the index should be maintained for scrolled search.
- `sort: string|string[]`: A comma-separated list of <field>:<direction> pairs.

The request accepts many more advanced configuration options. They will be passed to the Elasticsearch client verbatim, so check out the [available options](https://www.elastic.co/guide/en/elasticsearch/client/javascript-api/current/api-reference.html#_search) provided by Elastic.

#### Examples

###### Fetch the first 10 matching documents.
```yaml
requests:
  - id: fetch_docs
    type:  Elasticsearch
    connectionId: elasticsearch
    properties:
      size: 10
      body:
        query:
          match_all: {}
```

###### Find a document with ID 42.
```yaml
requests:
  - id: fetch_docs
    type:  Elasticsearch
    connectionId: elasticsearch
    properties:
      size: 1
      body:
        query:
          term:
            _id: 42
```

###### Fetch articles between yesterday and today, aggregate by author.
```yaml
requests:
  - id: fetch_docs
    type:  Elasticsearch
    connectionId: elasticsearch
    properties:
      size: 1
      type: article
      body:
        query:
          range:
            timestamp:
              gte: now-1d/d
              lt: now/d
        aggs:
          author_aggregation:
            terms:
              field: author
```

### ElasticsearchUpdate

The `ElasticsearchUpdate` request updates a document using a script or partial document.

#### Properties
- `id: string|number` Unique identifier for the document to be updated.
- `body: object` The Elasticsearch request body contains either a [script](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/modules-scripting-using.html) or a `doc` property with fields to update.
- `if_seq_no: number` Only perform the operation if the document has this sequence number. See [Optimistic concurrency control](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#optimistic-concurrency-control-index).
- `if_primary_term: number` Only perform the operation if the document has this primary term. See [Optimistic concurrency control](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#optimistic-concurrency-control-index).
- `require_alias: boolean` If `true`, the destination must be an [index alias](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/alias.html). Defaults to `false`.
- `refresh: string|boolean` If `true`, Elasticsearch refreshes the affected shards to make this operation visible to search, if `wait_for` then wait for a refresh to make this operation visible to search, if `false` do nothing with refreshes. Valid values: `true`, `false`, `wait_for`. Default: `false`.
- `retry_on_conflict: boolean` Specify how many times should the operation be retried when a conflict occurs. Default: `0`.
- `routing: string` Custom value used to route operations to a specific shard.
- `_source: string[]|boolean` Set to `false` to disable source retrieval (default: `true`). You can also specify a comma-separated list of the fields you want to retrieve.
- `_source_excludes: string[]` Specify the source fields you want to exclude.
- `_source_includes: string[]` Specify the source fields you want to include.
- `timeout: string` Period the request waits for the following operations:
    - [Dynamic mapping](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/dynamic-mapping.html) updates
    - [Waiting for active shards](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#index-wait-for-active-shards)
  Defaults to `1m` (one minute). This guarantees Elasticsearch waits for at least the timeout before failing. The actual wait time could be longer, particularly when multiple waits occur.
- `wait_for_active_shards: string` The number of shard copies that must be active before proceeding with the operation. Set to `all` or any positive integer up to the total number of shards in the index (`number_of_replicas+1`). Default: `1`, the primary shard.
  See [Active Shards](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-index_.html#index-wait-for-active-shards).

#### Examples

###### Update a document:
```yaml
requests:
  - id: update
    type:  ElasticsearchUpdate
    payload:
      id:
        _state: _id
      name:
        _state: name
    properties:
      id:
        _payload: id
      body:
        doc:
          _payload: name
```

###### Increase the like counter using a script:
```yaml
requests:
  - id: increase_like_counter
    type:  ElasticsearchUpdate
    payload:
      id:
        _state: _id
    properties:
      id:
        _payload: id
      body:
        script:
          source: |
            ctx._source.likes++
```

### ElasticsearchUpdateByQuery

The `ElasticsearchUpdateByQuery` request updates documents that match the specified query. If no query is specified, performs an update on every document in the data stream or index without modifying the source, which is useful for picking up mapping changes.

#### Properties
- `body: object` The Elasticsearch query body, expressed in the [JSON Query DSL](https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl.html).
  - `query: object`: The Elasticsearch query.
  - `script: object` A [script](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/modules-scripting-using.html) to update documents.
- `_source: string|string[]|boolean`: True or false to return the `_source` field or not, or a list of fields to return.
- `_source_excludes: string|string[]`: A list of fields to exclude from the returned `_source` field.
- `_source_includes: string|string[]`: A list of fields to extract and return from the `_source` field.
- `allow_no_indices: boolean`: Whether to ignore if a wildcard indices expression resolves into no concrete indices. (This includes _all string or when no indices have been specified).
- `max_docs: number` Maximum number of documents to process. Defaults to all documents.
- `refresh: string|boolean` If `true`, Elasticsearch refreshes the affected shards to make this operation visible to search, if `wait_for` then wait for a refresh to make this operation visible to search, if `false` do nothing with refreshes. Valid values: `true`, `false`, `wait_for`. Default: `false`.
- `requests_per_second: number` The throttle for this request in sub-requests per second. Defaults to -1 (no throttle).
- `analyzer: string`: The analyzer to use for the query string
- `default_operator: string`: The default operator for query string query (AND or OR).
- `df: string`: The field to use as default where no field prefix is given in the query string.
- `from: number`: Starting offset.
- `size: number`: Number of hits to return.
- `index: string|string[]`: A comma-separated list of index names to search; use _all or empty string to perform the operation on all indices.
- `lenient: boolean`: Specify whether format-based query failures (such as providing text to a numeric field) should be ignored.
- `scroll: string`: Specify how long a consistent view of the index should be maintained for scrolled search.
- `sort: string|string[]`: A comma-separated list of <field>:<direction> pairs.

The request accepts many more advanced configuration options. They will be passed to the Elasticsearch client verbatim, so check out the [available options](https://www.elastic.co/guide/en/elasticsearch/reference/7.x/docs-update-by-query.html#docs-update-by-query-api-query-params) provided by Elastic.

#### Examples

###### Update all red cars:
```yaml
requests:
  - id: update_red_cars
    type:  ElasticsearchUpdateByQuery
    properties:
      body:
        query:
          term:
            color:
              value: red
        script:
          source: 'ctx._source.out_of_stock=true'
```



---

## File: `connections/AxiosHttp.yaml`

# AxiosHttp

**Section:** Connections


---
**Nunjucks Template:**
```yaml
The `AxiosHttp` connection is used to connect to APIs and web servers using HTTP or HTTPS.

It uses the [axios](https://github.com/axios/axios) library.

The same properties can be set on both connections and requests. The properties will be merged, with the request properties overwriting connection properties. This allows properties like authentication headers and the baseURL to be set on the connection, with request specific properties like the request.

>Secrets like authentication headers and API keys should be stored using the [`_secret`](_secret) operator.

## Connections

Connection types:
  - AxiosHttp

## Requests

Request types:
  - AxiosHttp

### AxiosHttp

#### Properties

- `url: string`: The server URL that will be used for the request.
- `method: enum`: Default: `'get'` - The request method to be used when making the request. Options are:
  - `'get'`
  - `'delete'`
  - `'head'`
  - `'options'`
  - `'post'`
  - `'put'`
  - `'patch'`
- `baseURL: string`: `baseURL` will be prepended to `url` unless `url` is absolute. It can be convenient to set `baseURL` for an axios connection to pass relative URLs to requests or mutations using that connection.
- `headers: object`: An object with custom headers to be sent sent with the request. The object keys should be header names, and the values should be the string header values.
- `params: object`: An object with URL parameters to be sent with the request.
- `data: string | object | array`: The data to be sent as the request body. Only applicable for request methods `'put'`, `'post'`, and `'patch'`. Can be an object, array or a string in the format `'Country=Brasil&City=Belo Horizonte'`.
- `auth: object`: Indicates that HTTP Basic authorization should be used, and supplies credentials. This will set an `Authorization` header, overwriting any existing `Authorization` custom headers you have set using `headers`. Only HTTP Basic auth is configurable through this parameter, for Bearer tokens and such, use `Authorization` custom headers instead. The `auth` object should have the following fields:
  - `username: string`
  - `password: string`
- `httpAgentOptions: object`: Options to pass to the Node.js [`http.Agent`](https://nodejs.org/api/http.html#http_class_http_agent) class.
- `httpsAgentOptions: object`: Options to pass to the Node.js [`https.Agent`](https://nodejs.org/api/http.html#http_class_http_agent) class.
- `maxContentLength: number`: Defines the max size of the http response content allowed in bytes.
- `maxRedirects: number`: Defines the maximum number of redirects to follow. If set to 0, no redirects will be followed.
- `proxy: object`: Defines the hostname and port of the proxy server. The `proxy` object should have the following fields:
  - `host: string`: Host IP address (eg. `'127.0.0.1'`).
  - `port: number`: Port number.
  - `auth: object`: Object with username and password.
- `responseType: enum`: Default: `'json'` - The type of data that the server will respond with. Options are:
  - `'document'`
  - `'json'`
  - `'text'`
- `responseEncoding: string`: Default: `'utf8'` - Indicates encoding to use for decoding responses.
- `timeout: number`: Default: `0` (no timeout) - The number of milliseconds before the request times out. If the request takes longer than `timeout`, the request will be aborted. Set to `0` for no timeout.
- `transformRequest: function`: A function to transform the request data before it is sent. Receives `data` and `headers` as arguments and should return the data to be sent.
- `transformResponse: function`: A function to transform the received data. Receives `data` as an argument and should return the transformed data.
- `validateStatus: function`: A function to validate whether the response should complete successfully given a status code. Receives `status` as an argument and should `true` if the status code is valid.


#### Examples

Properties for a AxiosHttp can be set on either the connection, the request, or both. However, both a connection and request need to be defined.

###### A basic full example requesting data from https://jsonplaceholder.typicode.com

```yaml
lowdefy: {{ version }}
name: Lowdefy starter
connections:
  - id: my_api
    type: AxiosHttp
    properties:
      baseURL: https://jsonplaceholder.typicode.com
pages:
  - id: welcome
    type: PageHeaderMenu
    requests:
      - id: get_posts
        type: AxiosHttp
        connectionId: my_api
        properties:
          url: /posts
    events:
      onInit:
        - id: fetch_get_posts
          type: Request
          params: get_posts
    blocks:
      - id: rest_data
        type: Markdown
        properties:
          content:
            _string.concat:
              - |
                ```yaml
              - _yaml.stringify:
                  - _request: get_posts
              - |
                ```
```

###### Using the connection to set baseURL and authorization, and handle specific requests as requests.
```yaml
connections:
  - id: app_api
    type: AxiosHttp
    properties:
      baseURL: app.com/api
      auth:
        username: api_user
        password:
          _secret: API_PASSWORD
# ...
requests:
  - id: get_orders
    type: AxiosHttp
    connectionId: app_api
    properties:
      url: /orders
  - id: update_order
    type: AxiosHttp
    connectionId: app_api
    payload:
      order_id:
        _state: order_id
      data:
        _state: true
    properties:
      url:
        _nunjucks:
          template: /orders/{{ order_id }}
          on:
            order_id:
              _payload: order_id
      method: post
      data:
        _payload: data
```


###### Setting properties on only the connection:
```yaml
connections:
  - id: get_count
    type: AxiosHttp
    properties:
      url: myapp.com/api/count
      headers:
        X-Api-Key:
          _secret: API_KEY
# ...
requests:
  - id: get_count
    type: AxiosHttp
    connectionId: get_count
```

###### Setting properties on only the request, and using a generic connection:
```yaml
connections:
  - id: axios
    type: AxiosHttp
# ...
requests:
  - id: get_api_1
    type: AxiosHttp
    connectionId: axios
    properties:
      url: app1.com/api/things
  - id: post_to_api_2
    type: AxiosHttp
    connectionId: axios
    payload:
      data:
        _state: true
    properties:
      url: api.otherapp.org/other/thing
      method: post
      data:
        _payload: data
```
```
---


---

## File: `connections/AmazonRedshift.yaml`

# Amazon Redshift

**Section:** Connections

The [Knex](/Knex) connection can be used to connect to a [Amazon Redshift](https://aws.amazon.com/redshift) database.


## Connections

Connection types:
  - Knex

### Knex

#### Properties
- `client: enum`: __Required__ - Should be `redshift` to connect to Amazon Redshift.
- `connection: object | string`: __Required__ - Connection string or object to pass to the [`pg`](https://www.npmjs.com/package/pg) database client.
- `useNullAsDefault: boolean`: If true, undefined keys are replaced with NULL instead of DEFAULT.

#### Examples

###### Connection object:
```yaml
connections:
  - id: redshift
    type: Knex
    properties:
      client: redshift
      connection:
        host:
          _secret: REDSHIFT_HOST
        database:
          _secret: REDSHIFT_DB
        user:
          _secret: REDSHIFT_USER
        password:
          _secret: REDSHIFT_PASSWORD
```
Environment variables:
```
LOWDEFY_SECRET_REDSHIFT_HOST = examplecluster.XXXXXXXXXXXX.us-west-2.redshift.amazonaws.com
LOWDEFY_SECRET_REDSHIFT_REDSHIFT_DB = db
LOWDEFY_SECRET_REDSHIFT_USER = user
LOWDEFY_SECRET_REDSHIFT_PASSWORD = password
```


[object Object]


---

## File: `connections/AWSS3.yaml`

# Amazon S3

**Section:** Connections

AWS S3 is a file or data storage solution, provided by Amazon Web Services. S3 does not work like a traditional file system, data is stored as objects in a collection of objects called a bucket.
Objects can be read from S3 and stored in S3 using web requests. These objects can be public or private. You can read more [here](https://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html).

Lowdefy integrates with AWS S3 using presigned links. These are links that are authorized to give access to private objects, or that allow you to create new objects, and that expire after a certain amount of time. This allows you to upload or download directly from S3 from the browser.

A guide to creating and connecting to an S3 bucket is given at the bottom of this page.

## Connections

Connection types:
  - AwsS3Bucket

### AwsS3Bucket

The `AwsS3Bucket` connection is used to connect to a AWS S3 bucket. AWS S3 is the file storage solution provided by Amazon Web services.

#### Properties
- `accessKeyId: string`: __Required__ - AWS IAM access key id with s3 access.
- `secretAccessKey: string`: __Required__ - AWS IAM secret access key with s3 access.
- `region: string`: __Required__ - AWS region bucket is located in.
- `bucket: string`: __Required__ - S3 bucket name.
- `read: boolean`: Default: `true` - Allow reads from the bucket.
- `write: boolean`: Default: `false` - Allow writes to the bucket.

#### Examples

###### Read and writes on a bucket:
```yaml
connections:
  - id: my_bucket
    type: AwsS3Bucket
    properties:
      accessKeyId:
        _secret: S3_ACCESS_KEY_ID
      secretAccessKey:
        _secret: S3_SECRET_ACCESS_KEY
      region: eu-west-1
      bucket: my-bucket-name
      write: true
```
Environment variables:
```
LOWDEFY_SECRET_S3_ACCESS_KEY_ID = AKIAIOSFODNN7EXAMPLE
LOWDEFY_SECRET_S3_SECRET_ACCESS_KEY = wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

## Requests

Request types:
  - AwsS3PresignedGetObject
  - AwsS3PresignedPostPolicy

### AwsS3PresignedGetObject

The `AwsS3PresignedGetObject` request is used to get a download link for an object in AWS S3. The link provided by this request can be opened using the `Link` action.

#### Properties
- `versionId: string`: VersionId used to reference a specific version of the object.
- `expires: number`: Number of seconds for which the policy should be valid.
- `key: string`: __Required__ - Key (or filename) under which object will be stored. If another file is saved with the same key, that file will be overwritten, so a random string in this field is probably needed.
- `responseContentType: string`: Sets the Content-Type header of the response.
- `responseContentDisposition: string`: Sets the Content-Disposition header of the response.

#### Examples

###### Download a pdf and open in a new tab:
```yaml
requests:
  - id: my_file_link
    type: AwsS3PresignedGetObject
    connectionId: my_bucket_connection
    properties:
      key: pdf-filename-as4dacd.pdf
      responseContentType: application/pdf

        ...
        blocks:
          - id: getFileButton
            type: Button
            events:
              onClick:
                - id: open_file
                  type: Link
                  params:
                    url:
                      _request: my_file_link
                    newTab: true
```

### AwsS3PresignedPostPolicy

The `AwsS3PresignedPostPolicy` request is used to create a policy that allows a file to be uploaded to AWS S3. This is used by a block like the `S3Uploadbutton` to upload a file.

#### Properties
- `acl: enum`: Access control lists used to grant read and write access.
  - private
  - public-read
  - public-read-write
  - aws-exec-read
  - authenticated-read
  - bucket-owner-read
  - bucket-owner-full-control
- `conditions: object[] | string[][]`: Conditions to be enforced on the request. An array of objects, or condition arrays. See [here](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTConstructPolicy.html).
- `expires: number`: Number of seconds for which the policy should be valid.
- `key: string`: __Required__ - Key (or filename) under which object will be stored. If another file is saved with the same key, that file will be overwritten, so a random string in this field is probably needed.
- `fields: object`: Fields to be included in the form. Useful for adding metadata to the object such as `Content-Type`. See [S3 POST policy](https://docs.aws.amazon.com/AmazonS3/latest/API/sigv4-HTTPPOSTConstructPolicy.html).

#### Examples

###### Upload a file with user filename and random id:
```yaml
- id: my_post_policy
  type: AwsS3PresignedPostPolicy
  connectionId: my_bucket_connection
  payload:
    filename:
      _args: filename
    uid:
      _args: uid
  properties:
    key:
      _nunjucks:
        template: uploads/{{filename}}-{{uid}}
        on:
          filename:
            _payload: filename
          uid:
            _payload: uid
```

## Creating a bucket

###### Step 1 - Create an AWS account

Go to the [AWS homepage](https://aws.amazon.com/) and create an account if you don't already have one. you can find more information [here](https://aws.amazon.com/premiumsupport/knowledge-center/create-and-activate-aws-account/).

###### Step 2 - Create an S3 bucket

1. Once logged in, search for S3 in the search box.
2. Click 'Create Bucket'
3. Choose a name and AWS region for your bucket
4. Continue creating the bucket with any extra settings is needed.
5. Make sure the 'Block all public access' box is ticked if you don't want to allow public access.
6. Click 'Create Bucket'

###### Step 3 - Set the CORS settings for your bucket

CORS, or Cross-Origin Resource Sharing is a security feature that is used to restrict web applications from accessing resources from different origins, or domain names. To allow your Lowdefy app to access the contents of the bucket, you need to add a CORS rule on the bucket that authorizes your app

1. Click on you bucket.
2. Click on the 'Permissions' tab.
3. Click on the 'CORS Configuration' tab.
4. Paste this configuration and save (Fill in your own Lowdefy domain name).

```json
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET", "PUT", "POST", "DELETE", "HEAD"
        ],
        "AllowedOrigins": [
            "https://YOUR_LOWDEFY_DOMAIN_HERE"
        ],
        "ExposeHeaders": []
    }
]
```

###### Step 4 - Create an IAM user

IAM is the AWS identity and access management system. This can be used to give very granular access permissions. We will create a programmatic user that has the rights to read and write objects in the Bucket.

1. In the 'Services' dropdown in the header, search for 'IAM'.
2. Click on 'Users' in the menu on the left.
3. Click 'Add User'
4. Choose a descriptive name for the user.
5. Choose programmatic access and click next.
6. Choose 'Attach existing policies directly'.
7. Choose 'Create Policy'.
8. Choose the JSON tab and paste the following (Fill in your own bucket name):
```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "ListObjectsInBucket",
            "Effect": "Allow",
            "Action": ["s3:ListBucket"],
            "Resource": ["arn:aws:s3:::YOUR_BUCKET_NAME_HERE"]
        },
        {
            "Sid": "AllObjectActions",
            "Effect": "Allow",
            "Action": "s3:*Object",
            "Resource": ["arn:aws:s3:::YOUR_BUCKET_NAME_HERE/*"]
        }
    ]
}
```

9. Choose review policy and save.
10. In your previous tab, refresh and search for the policy you just created. Attach it to the user.
11. Click next, review and create the user.
12. Set the access key id and secret access key in your Lowdefy secrets store.



---

## File: `actions/Wait.yaml`

# Wait

## Description

The `Wait` waits for the set number of milliseconds before returning.

## Types

```
(params: {
  ms: integer,
}): void
```

## Parameters

###### object
  - `ms: integer`: __Required__ - The number of milliseconds to wait.

## Examples

###### Wait for 500 milliseconds:
```yaml
- id: wait
  type: Wait
  params:
    ms: 500
```


---

## File: `actions/Validate.yaml`

# Validate

## Description

The `Validate` action is used to validate a users input, usually before information is inserted into a database using a request.
It is used in conjunction with the `required` and `validate` fields on input blocks. If the validation fails, the `Validate` action will fail, and this will stop the execution of actions that are defined after it.

The first time a `Validate` action is called, validation errors and warnings are shown to the user. The `Reset` action resets the validation status and the page `state`. The `ResetValidation` action resets only the validation status.

The `Validate` action `blockIds` or `regex` params are used to limit which blocks are validated. Only the matched blocks will be validated, and validation results are shown for only those matched blocks.

## Types

```
(void): void
(blockId: string): void
(blockIds: string[]): void
(blockIds: string[]): void
(params: {
  blockId?: string|string[],
  regex?: string|string[],
}): void
```

## Parameters

###### void
The `Validate` action validates all blocks on the page if called without params.

###### string
A blockId of the block to validate.

###### string[]
An array of blockIds of the blocks to validate.

###### object
  - `blockId?: string|string[]`: A blockId or an array of the blockIds of the blocks to validate.
  - `regex?: string|string[]`: A regex string pattern or an array of regex string patterns to match the blockIds to validate.

## Examples

###### Validate all inputs on the page:
```yaml
- id: validate_all
  type: Validate
```

###### Validate a single input:
```yaml
- id: validate_my_input
  type: Validate
  params: my_input
```

###### Validate a list of inputs:
```yaml
- id: validate_input_a_and_b
  type: Validate
  params:
    - my_input_a
    - my_input_b
```

###### Validate all inputs matching a regex pattern:
```yaml
- id: validate_foo
  type: Validate
  params:
    regex: ^foo\.
```

###### Validate all inputs matching a list of regex patterns:
```yaml
- id: validate_foo_and_price
  type: Validate
  params:
    regex:
      - ^foo\.
      - ^.*price.*$
```

###### Validate all inputs matching a list of regex patterns and a blockId:
```yaml
- id: validate_foo_price_and_my_input
  type: Validate
  params:
    blockId: my_input
    regex:
      - ^foo\.
      - ^.*price.*$
```


---

## File: `actions/UpdateSession.yaml`

# UpdateSession

## Description

The `UpdateSession` action is used to update the user session. If a adapter is used, any new user data in the database will be added to the user object.

## Types

```
(void): void
```

## Parameters

The `UpdateSession` action does not take any parameters.

## Examples

###### Update session after user updates their profile:
```yaml
id: update_profile
type: Button
events:
  onClick:
    - id: update_profile_in_db
      type: Request
      params: update_user
    - id: update_session
      type: UpdateSession
```


---

## File: `actions/Throw.yaml`

# Throw

## Description

The `Throw` action is used throw an error to the user and log to the console. If `throw: true`, the `Throw`
action will throw an error, and this will stop the execution of actions that are defined after it. If the action does not thrown, the `Throw` action will do nothing and the actions defined after it will be executed.

## Types

```
(params: {
  throw?: boolean,
  message?: string,
  metaData?: any
}): void
```

## Parameters

- `throw: boolean`: Throws an error and stops the action chain when `true` or continues the action chain when `false` or undefined.
- `message: string`: The error message to show to the user and log to the console if `throw: true`. This message can be overridden by setting the action's `messages.error`.
- `metaData: any`: Data to log to the console if `throw: true`.

## Examples

###### Throw with custom message:
```yaml
- id: foo_throw
  type: Throw
  params:
    throw:
      _eq:
        - _state: lukes_father
        - Darth Vader
    message: Nooooooooooooooooo
```

###### Throw with metaData:
```yaml
- id: foo_throw
  type: Throw
  params:
    throw:
      _eq:
        - _state: lukes_father
        - Darth Vader
    message: Nooooooooooooooooo
    metaData:
      realisation: Luke kissed his sister
```
###### Override custom message:
```yaml
- id: foo_throw
  type: Throw
  messages:
    error: Meh.
  params:
    throw:
      _eq:
        - _state: lukes_father
        - Darth Vader
    message: Nooooooooooooooooo
```
###### Fail silently:
```yaml
- id: foo_throw
  type: Throw
  messages:
    error: false
  params:
    throw:
      _eq:
        - _state: lukes_father
        - Darth Vader
    message: Nooooooooooooooooo
```


---

## File: `actions/SetState.yaml`

# SetState

## Description

The `SetState` action sets values in `state`. It takes an object as parameters, and sets each of those values to the `state` object.
This is useful if you want to initialize `state`, set a flag after an action has executed (eg. to disable a button), or to set the result
of a request to state.

## Types

```
(toSet: object): void
```

## Parameters

###### object
Object with key value pairs to set in `state`.

## Examples

###### Set a single value to state:
```yaml
- id: single_value
  type: SetState
  params:
    message: Hello
```

###### Set multiple values to state:
```yaml
- id: multiple_values
  type: SetState
  params:
    firstName: Monica
    lastName: Geller
    address:
      street: 90 Bedford St
      city: New York
      zipCode: '10014'
      country: US
    friends:
      - Ross Geller
      - Rachel Green
      - Chandler Bing
      - Phoebe Buffay
      - Joey Tribbiani
```

###### Using dot notation:
```yaml
- id: dot_notation
  type: SetState
  params:
    firstName: Monica
    lastName: Geller
    address.street: 90 Bedford St
    address.city: New York
    address.zipCode: '10014'
    address.country: US
    friends.0: Ross Geller
    friends.1: Rachel Green
    friends.2: Chandler Bing
    friends.3: Phoebe Buffay
    friends.5: Joey Tribbiani
```

###### Initialize state with the value of a request:
```yaml
- id: initialize
  type: SetState
  params:
    _request: getUser
```


---

## File: `actions/SetGlobal.yaml`

# SetGlobal

## Description

The `SetGlobal` action sets values to the `global` object. It takes an object as parameters, and sets each of those values to the `global` object.
This is useful if you need to set a value that needs to be available across multiple pages in the app, like the id of a currently selected
object. `SetGlobal` works just like `SetState`, except it sets to the `global` object and not `state`.

## Types

```
(toSet: object): void
```

## Parameters

###### object
Object with key value pairs to set in `global`.

## Examples

###### Set a single value to global:
```yaml
- id: set_selected_company
  type: SetGlobal
  params:
    selected_selected_company:
      _state: company.id
```

###### Set multiple values to state:
```yaml
- id: multiple_values
  type: SetGlobal
  params:
    firstName: Monica
    lastName: Geller
    address:
      street: 90 Bedford St
      city: New York
      zipCode: '10014'
      country: US
    friends:
      - Ross Geller
      - Rachel Green
      - Chandler Bing
      - Phoebe Buffay
      - Joey Tribbiani
```

###### Using dot notation:
```yaml
- id: dot_notation
  type: SetGlobal
  params:
    firstName: Monica
    lastName: Geller
    address.street: 90 Bedford St
    address.city: New York
    address.zipCode: '10014'
    address.country: US
    friends.0: Ross Geller
    friends.1: Rachel Green
    friends.2: Chandler Bing
    friends.3: Phoebe Buffay
    friends.5: Joey Tribbiani
```


---

## File: `actions/SetFocus.yaml`

# SetFocus

## Description

This action implements the [HTMLElement.focus()](https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/focus) method.

The `SetFocus` action sets focus on the specified HTML element, provided it can receive focus. It takes an id of the HTML element as a parameter.
By default, when focusing an element, the browser will scroll it into view and may provide visible indication of the focus, typically by displaying a "focus ring" around the element.

Note that for blocks like `TextInput`, the id of the HTML input element is not equal to the block id, since the block includes other HTML elements like the label, extra text and icons. You can inspect the HTML elements in the browser to find the correct element id.

## Types

```
(params: string): void
```

## Parameters

###### string
String that is the ID of the HTML element to focus.

## Examples

###### Set a TextInput block in focus when another TextInput's value changes:
```yaml
- id: text_input_1
  type: TextInput
  events:
    onChange:
      - id: set_focus
        type: SetFocus
        # Note that the params is an HTML element ID, and not a Block ID.
        params: text_input_2_input 
- id: text_input_2
  type: TextInput
```


---

## File: `actions/ScrollTo.yaml`

# ScrollTo

## Description

The `ScrollTo` action is used to scroll the users browser. It is often used to scroll back to the top
of a long form after resetting the form, or to scroll the user to the top of a page after linking to a new page.

The `ScrollTo` action has two modes - scrolling to a block and scrolling to x and y coordinates on a page.

> When scrolling to a block, `ScrollTo` implements [`Element.scrollIntoView()`](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView), while
when scrolling to coordinates, it implements [`Window.scrollTo()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo).

## Types

```
(params: {
  top?: number,
  left?: number,
  behavior?: enum
}): void

(params: {
  blockId: string,
  options: {
    behavior?: enum,
    block? enum,
    inline?: enum
  }
}): void
```

## Parameters

######  Scroll to coordinates
- `top: number`: Specifies the number of pixels along the Y axis to scroll the window.
- `left: number`: Specifies the number of pixels along the X axis to scroll the window.
- `behavior: enum`: Defines the transition animation. One of `auto` or `smooth`.

######  Scroll to a block
- `blockId: string`: __Required__ - The blockId of a block to scroll to.
- `options: object`: _Object_
  - `behavior: enum`: Defines the transition animation. One of `auto` or `smooth`. Defaults to `auto`.
  - `block: enum`: Defines vertical alignment. One of `start`, `center`, `end`, or `nearest`. Defaults to `start`.
  - `inline: enum`: Defines horizontal alignment. One of `start`, `center`, `end`, or `nearest`. Defaults to `nearest`.

## Examples

######  Scroll to a block:
```yaml
- id: scroll_to_block
  type: ScrollTo
  params:
    blockId: my_block
```

######  Scroll to the top of the page:
```yaml
- id: scroll_to_top
  type: ScrollTo
  params:
    top: 0
```

######  Scroll to the top of the page after linking from a previous page:
```yaml
- id: link_button
  type: Button
  events:
    onClick:
      - id: link_
        type: Link
        params:
          pageId: next_page
      - id: scroll_to_top
        type: ScrollTo
        params:
          top: 0
```

######  Scroll to the centre of a block:
```yaml
- id: scroll_to_block
  type: ScrollTo
  params:
    blockId: my_block
    options:
      block: center
      inline: center
```


---

## File: `actions/ResetValidation.yaml`

# ResetValidation

## Description

The `ResetValidation` action is used to reset validation flags on input fields.

By default when a page is opened, no validation flags are set on any input fields. When the `Validate` is called, a validation flag is set on input fields matching the validation params. To reset the validation flags, use the `ResetValidation` action.

The `ResetValidation` action `blockIds` or `regex` params are used to limit which blocks validation errors and warnings should be reset.

## Types

```
(void): void
(blockId: string): void
(blockIds: string[]): void
(params: {
  blockId?: string|string[],
  regex?: string|string[],
}): void
```

## Parameters

###### void
The `ResetValidation` action lowers validation flags on all blocks on the page if called without params.

###### string
A blockId of the block for which to lower validation flags.

###### string[]
An array of blockIds of the blocks for which to lower validation flags.

###### object
  - `blockId?: string|string[]`: A blockId or an array of the blockIds of the blocks for which to lower validation flags
  - `regex?: string|string[]`: A regex string pattern or an array of regex string patterns to match the blockIds for which to lower validation flags.

## Examples

###### Lower validation flags for all inputs on the page:
```yaml
- id: reset_all
  type: ResetValidation
```

###### Lower validation flags for a single input:
```yaml
- id: reset_my_input
  type: ResetValidation
  params: my_input
```

###### Lower validation flags for a list of inputs:
```yaml
- id: reset_input_a_and_b
  type: ResetValidation
  params:
    - my_input_a
    - my_input_b
```

###### Lower validation flags for all inputs matching a regex pattern:
```yaml
- id: reset_foo
  type: ResetValidation
  params:
    regex: ^foo\.
```

###### Lower validation flags for all inputs matching a list of regex patterns:
```yaml
- id: reset_foo_and_price
  type: ResetValidation
  params:
    regex:
      - ^foo\.
      - ^.*price.*$
```

###### Lower validation flags for all inputs matching a list of regex patterns and a blockId:
```yaml
- id: reset_foo_price_and_my_input
  type: ResetValidation
  params:
    blockId: my_input
    regex:
      - ^foo\.
      - ^.*price.*$
```


---

## File: `actions/Reset.yaml`

# Reset

## Description

The `Reset` actions resets a page to the state it was in just after the `onInit` event was executed. This clears the user's inputs.

>  The `Reset` action resets the state to the state after the `onInit` event was executed, and the `onMount` events are not executed after the reset happens. This might cause unexpected behavior if you used an `onInitAsync`, `onMount` or `onMountAsync` event to initialize the state.

## Types

```
(void): void
```

## Parameters

The `Reset` action does not take any parameters.

## Examples

###### A reset button:
```yaml
- id: reset_button
  type: Button
  properties:
    title: Reset
  events:
    onClick:
      - id: reset
        type: Reset
```


---

## File: `actions/Request.yaml`

# Request

## Description

The `Request` action calls a request, or if used during an `onInit` event, calls those requests while a page loads.
`Request` can be used to call all requests on a page, a list of requests, or a single request. The `Request` action is synchronous, actions defined after
it will only run once all the called requests have returned.

To call requests that load data, the `onInitAsync`, `onMount` and `onMountAsync` events can be used. These will execute the actions while the page begins to render. If the `onInit` event is used, the page will only start rendering after the actions have completed.

`Request` can be called without any parameters to call all requests in the page. It can also be called with a list of requestIds or a single requestId to call.

## Types

```
(options: {all: boolean}): void
(requestId: string): void
(requestIds: string[]): void
```

## Parameters

###### object
- `all: boolean`: All requests in the page are called if `all` is set to true.

###### string
A requestId of the request to call.

###### string[]
An array of requestIds of the requests to call.

## Examples

###### Call a single request:
```yaml
- id: call_one_request
  type: Request
  params: my_request_id
```

###### Call a list of requests:
```yaml
- id: call_many_requests
  type: Request
  params:
    - my_request_id_1
    - my_request_id_2
    - my_request_id_3
```
###### Call all requests:

```yaml
- id: call_all
  type: Request
  params:
    all: true
```


---

## File: `actions/PdfMake.yaml`

# PdfMake

## Description

The `PdfMake` action is used to generate and download a PDF file from a set of defined content using the [pdfMake](https://github.com/bpampuch/pdfmake) open-source library.

## Types

```
(params: {
  docDefinition: object,
  tableLayouts?: object,
  filename: string,
  fonts?: object,
}): void
```

## Parameters

###### object
  - `docDefinition: object`: __Required__ - The document definition object which includes styling, columns, tables etc.
  - `tableLayouts: object`: The table layouts for the generated PDF file.
  - `filename: string`: __Required__ - The name for the generated PDF file.
  - `fonts: object`: The fonts for the generated PDF file.
###### See the [pdfMake docs](https://pdfmake.github.io/docs) for more info on these properties.

## Examples

###### Generate a PDF (simple example):
```yaml
- id: generate_pdf_button
  type: Button
  properties:
    title: Download PDF
    icon: AiOutlineDownload
  events:
    onClick:
      - id: make_pdf
        type: PdfMake
        params:
          filename:
            my_file_name.pdf
          docDefinition:
            pageMargins: 50
            defaultStyle:
              fontSize: 10
            content:
              - text: This pdf has been generated with Lowdefy and pdfMake.
                bold: true
```

###### Generate a PDF (detailed example):
```yaml
- id: pdf_generate_button
  type: Button
  style:
    textAlign: center
  properties:
    title: Generate & Download PDF
    icon: AiOutlineDownload
    color: '#6293F8'
  events:
    onMount:
      - id: init_data
        type: SetState
        params:
          invoice:
            id: '0030135'
            account_id: 'A-11344'
            inv_date:
              _date: now
            subtotal: 397.034
            discount: -19.8517
            vat: 59.5551
            total: 436.7374
            balance: 413.2330
            customer:
              name: Service Center
              phone: +123-456-7890
              vat_nmr: 12-333-4567
              address: |
                123 Main St.
                Anytown
                CA
                US
                9999
            services:
              - name: Hosting and Maintannce
                qty: 1
                price: 235.90
                code: X12-33C
              - name: Developer Hours
                qty: 16
                price: 60.345
                code: X12-39A
              - name: Designer Hours
                qty: 4
                price: 40.122
                code: X12-21A
              - name: Project Management
                qty: 2
                price: 60.667
                code: X12-49A
    onClick:
      - id: generate_pdf
        type: PdfMake
        params:
          _ref: inv_template.yaml
```

###### `/inv_template.yaml`
```yaml
filename:
  _nunjucks:
    on:
      _state: invoice
    template: 'INV-{{ id }}-{{ inv_date | date("DD-MM-YYYY") }}.pdf'
docDefinition:
  pageMargins: [50, 25, 50, 70]
  defaultStyle:
    fontSize: 10
  footer:
    _function:
      - columns:
          - qr:
              _string.concat:
                - _location: origin
                - /invoice?id="
                - _state: invoice.id
                - '"'
            margin: [50, 0, 0, 0]
            fit: '64'
          - alignment: 'right'
            fontSize: 7
            margin: [0, 0, 50, 0]
            text:
              __nunjucks:
                template: 'Page {{ page }} of {{ total }}'
                on:
                  page:
                    __args: 0
                  total:
                    __args: 1
  content:
    - columns:
        - width: 'auto'
          margin: [0, 20, 0, 0]
          stack:
            - fontSize: 9
              text: |

            - fontSize: 7
              text: |
                Example Services Ltd.
                112 Street Name
                City, State 12345
                Country
                001-AB

                +00-1234-5566
                info@example.com

                Vat Number: 444 5555 0000

        - width: '*'
          text: ' '
        - width: 110
          stack:
            - margin: [0, 5, 0, 0]
              alignment: right
              fontSize: 7
              text: |
                Example Services Ltd.
                Reg Number: 2001/22224/09

    - margin: [0, 20, 0, 20]
      text: Customer Invoice
      bold: true
      alignment: center
      fontSize: 14
    - columns:
        - width: 150
          bold: true
          text: |
            INVOICE NUMBER:
            DATE ISSUED:
            ACCOUNT NUMBER:
        - width: '*'
          text:
            _nunjucks:
              template: |
                {{ id }}
                {{ inv_date | date("YYYY/MM/DD") }}
                {{ account_id }}
              on:
                _state: invoice
        - width: 150
          bold: true
          text: |
            CUSTOMER:
            ADDRESS:
        - width: '*'
          text:
            _nunjucks:
              template: |
                {{ customer.name }}
                {{ customer.address }}
              on:
                _state: invoice

    - layout: 'lightHorizontalLines'
      margin: [0, 10, 0, 0]
      table:
        widths: [70, '*', 70, 70, 70]
        headerRows: 1
        body:
          _json.parse:
            _nunjucks:
              on:
                services:
                  _state: invoice.services
              template: |
                [
                  [
                    { "text": "ITEM CODE", "bold": true },
                    { "text": "SERVICE", "bold": true },
                    { "text": "UNIT PRICE", "bold": true, "alignment": "right"  },
                    { "text": "QTY", "bold": true, "alignment": "right"  },
                    { "text": "COST", "bold": true, "alignment": "right" }
                  ],
                  {% for item in services %}
                  [
                    "{{ loop.index }}: {{ item.code }}",
                    "{{ item.name | safe }}",
                    { "text": "{{ ( item.price / item.qty ).toFixed(2) }}", "alignment": "right"},
                    { "text": "{{ item.qty }}", "alignment": "right"},
                    { "text": "{{ item.price.toFixed(2) }}", "alignment": "right"}
                    {% if loop.last %} ] {% else %} ], {% endif %}
                  {% endfor %}
                ]
    - layout: 'headerLineOnly'
      margin: [0, -5, 0, 0]
      table:
        widths: ['*', 70, 70, 70]
        headerRows: 1
        body:
          - - ''
            - ''
            - ''
            - ''
          - - ''
            - alignment: right
              text: 'Subtotal:'
            - ''
            - alignment: right
              text:
                _number.toFixed:
                  - _state: invoice.subtotal
                  - 2
          - - ''
            - alignment: right
              text: 'Discount (5%):'
            - ''
            - alignment: right
              text:
                _number.toFixed:
                  - _state: invoice.discount
                  - 2
          - - ''
            - alignment: right
              text: 'VAT (15%):'
            - ''
            - alignment: right
              text:
                _number.toFixed:
                  - _state: invoice.vat
                  - 2
          - - ''
            - alignment: right
              text: 'Total:'
            - ''
            - alignment: right
              text:
                _number.toFixed:
                  - _state: invoice.total
                  - 2
    - layout: 'headerLineOnly'
      margin: [0, -5, 0, 0]
      table:
        widths: ['*', 70, 70, 70]
        headerRows: 1
        body:
          - - ''
            - ''
            - ''
            - ''
          - - ''
            - alignment: right
              bold: true
              text: 'BALANCE DUE:'
            - ''
            - alignment: right
              bold: true
              text:
                _number.toFixed:
                  - _state: invoice.balance
                  - 2
```


---

## File: `actions/Logout.yaml`

# Logout

## Description

When the `Logout` action is called, the user data and authorization cookies are cleared by the app.

The `callbackUrl` parameters of the Logout action specify where the user is redirected after logout is complete. If `callbackUrl` parameters not set, the user will return to the page from which the action was called.

## Types

```
(params: {
  callbackUrl?: {
    home?: boolean
    pageId?: string
    url?: string
    urlQuery?: object
  }
  redirect?: boolean,
}): void
```

## Parameters

###### object
- `callbackUrl: object`:
  - `home: boolean`: Redirect to the home page after the login flow is complete.
  - `pageId: string`: The pageId of the page to redirect to after the login flow is complete.
  - `url: string`: The URL to redirect to after the login flow is complete.
  - `urlQuery: object`: The urlQuery to set for the page the user is redirected to after login.
- `redirect: boolean`: If set to `false` the user session will be cleared, but the page will not be reloaded.

## Examples

###### A logout button:
```yaml
- id: logout_button
  type: Logout
  properties:
    title: Logout
  events:
    onClick:
      - id: logout
        type: Logout
```

###### Redirect to the `logged-out` page in the app after logout:
```yaml
- id: logout_button
  type: Logout
  properties:
    title: Logout
  events:
    onClick:
      - id: logout
        type: Logout
        params:
          callbackUrl:
            pageId: logged-out
```


---

## File: `actions/Login.yaml`

# Login

## Description

The `Login` action is used to start the user login flow. If only one provider is configured, or the `Login` action is called with a `providerId`, the `Login` action requests the Provider's authorization URL from the Lowdefy server, and redirects the user to this URL. Otherwise, the action redirects the user to a page where the user can choose which provider to use to sign in.

The authorization url usually hosts a page where the user can input their credentials. After the user has logged in successfully, the user is redirected to the `api/auth/callback/[provider_id]` route in the Lowdefy app, where the rest of the authorization code flow is completed.

The `callbackUrl` parameters of the Login action specify where the user is redirected after login is complete. If `callbackUrl` parameters not set, the user will return to the page from which the action was called.

## Types

```
(params: {
  authUrl?: {
    urlQuery?: object,
  }
  callbackUrl?: {
    home?: boolean
    pageId?: string
    url?: string
    urlQuery?: object
  }
  providerId?: string,
}): void
```

## Parameters

###### object
- `authUrl: object`:
  - `urlQuery: object`: Query parameters to set for the authorization URL.
- `callbackUrl: object`:
  - `home: boolean`: Redirect to the home page after the login flow is complete.
  - `pageId: string`: The pageId of the page to redirect to after the login flow is complete.
  - `url: string`: The URL to redirect to after the login flow is complete.
  - `urlQuery: object`: The urlQuery to set for the page the user is redirected to after login.
- `providerId: string`: The ID of the provider that should be used for login. If not set and only one provider is configured the configured provider will be used. Else the user will be redirected to a sign in page where they can choose a provider.

## Examples

###### Login and return to the same page:
```yaml
- id: login
  type: Login
```

###### Login with the google provider:
```yaml
- id: login_with_google
  type: Login
  params:
    providerId: google
```

###### Login, with pageId and urlQuery:
```yaml
- id: login
  type: Login
  params:
    callbackUrl:
      pageId: page1
      urlQuery:
        url1: value
```

###### Only login if user is not logged in:
```yaml
- id: login
  type: Login
  skip:
    _ne:
      - _user: sub
      - null
```

###### Request the signup page from the provider:
```yaml
- id: Signup
  type: Button
  events:
    onClick:
      - id: login
        type: Login
        params:
          authUrl:
            urlQuery:
              screen_hint: signup
```


---

## File: `actions/Link.yaml`

# Link

## Description

The `Link` action is used to link a user to another page. An input can be passed to the next page using either the
`urlQuery`, which is visible to the user, but persists if the browser is refreshed, or by using the `input` object, which is not
visible to the user.

## Types

```
(pageId: string): void
(params: {
  back?: boolean,
  home?: boolean,
  input?: object,
  newTab?:boolean,
  pageId?: string,
  url?: string,
  urlQuery? object
}): void
```

## Parameters

###### string
The pageId of a page in the app to link to.

###### object
- `back: boolean`: Go to the previous page if true (has the same effect as using the browser back button).
- `home: boolean`: Link to the home page. This is either the configured public or authenticated homepage, or the first page in the default menu visible to the user.
- `input: object`: Object to set as the input for the linked page.
- `newTab: boolean`: Open the link in a new tab.
- `pageId: string`: The pageId of a page in the app to link to.
- `url: string`: Link to an external url.
- `urlQuery: object`: Object to set as the urlQuery for the linked page.

## Examples

###### Shorthand, only specify pageId as string:
```yaml
- id: shorthand
  type: Link
  params: my_page_id
```

###### Specify pageId:
```yaml
- id: link_page_id
  type: Link
  params:
    pageId: myPageId
```

###### Link to home page:
```yaml
- id: link_home
  type: Link
  params:
    home: true
```

###### Link to an external url:
```yaml
- id: link_url
  type: Link
  params:
    url: www.lowdefy.com
```

###### Open a link in a new tab:
```yaml
- id: link_new_tab
  type: Link
  params:
    pageId: my_page_id
    newTab: true
```

###### Set the urlQuery of the page that is linked to:
```yaml
- id: link_url_query
  type: Link
  params:
    pageId: my_page_id
    urlQuery:
      id:
        _state: id
```

###### Set the input of the page that is linked to:
```yaml
- id: link_input
  type: Link
  params:
    pageId: my_page_id
    input:
      id:
        _args: row.id
```

###### Go to the previous page:
```yaml
- id: link_back
  type: Link
  params:
    back: true
```


---

## File: `actions/GeolocationCurrentPosition.yaml`

# GeolocationCurrentPosition

## Description

The `GeolocationCurrentPosition` action is used to get the current position of the device.

## Types

```
(params: {
  enableHighAccuracy?: boolean,
  maximumAge?: number,
  timeout?: number,
}) : object
```

## Parameters

###### object
  - `enableHighAccuracy: boolean`: Indicates that the most accurate possible position should be returned. Defaults to false.
  - `maximumAge: number`: The maximum age in milliseconds of a possible cached position that is acceptable to return. The default is 0.
  - `timeout: number`: The maximum length of time in milliseconds the device is allowed to take to return a position. The default is infinity.

## Examples

###### Get geolocation with specified params:
```yaml
- id: get_geolocation
  type: GeolocationCurrentPosition
  params:
    enableHighAccuracy: true
    timeout: 5000
    maximumAge: 0
- id: set_data
  type: SetState
  params:
    geolocation:
      _actions: get_geolocation.response
```


---

## File: `actions/Fetch.yaml`

# Fetch

## Description

The `Fetch` implements the [fetch web API](https://developer.mozilla.org/en-US/docs/Web/API/fetch) and can be used to make HTTP requests directly from the web client.

## Types

```
(params: {
  url: string,
  options: object,
  responseFunction: string
}): string | object
```

## Parameters

###### object
- `url: string`: __Required__ - The URL of the resource you want to fetch..
- `options: object`: The options object of the `fetch` global function. These include, but are not limited to:
  - `method: string`: The request method, e.g., `"GET"`, `"POST"`. The default is `"GET"`.
  - `headers: object`: An object with headers to add to the request.
  - `body: string`: The request body. Use the [`_json.stringify`](/_json) operator to create a JSON body.
- `responseFunction: enum`: If the `responseFunction` is specified, that function will be executed on the returned Response object. If specified this is equavalent to `await fetch(url, options).json()`. Should be one of of `'json'`, `'text'`, `'blob'`, `'arrayBuffer'`, or `'formData'`.

## Examples

######  Call a JSON API endpoint:
```yaml
- id: fetch
  type: Fetch
  params:
    url: https://example.com/api/products
    options:
      method: GET
    responseFunction: json
```

######  Make a post request:
```yaml
- id: fetch
  type: Fetch
  params:
    url: https://example.com/api/products/abc
    options:
      method: POST
      headers:
        Content-Type: application/json
      body:
        _json.stringify:
          - _state: product
    responseFunction: json
```


---

## File: `actions/DownloadCsv.yaml`

# DownloadCsv

## Description

The `DownloadCsv` action is used to generate and download a CSV file from a set of data.

## Types

```
(params: {
  filename: string,
  data: any[],
  fields: string[]
}): void
```

## Parameters

###### object
  - `filename: string`: __Required__ - The name for the generated CSV file.
  - `data: any[]`: __Required__ - The set of data used to generate the CSV file.
  - `fields: string[]`: __Required__ - The field definitions the set of data will be mapped to in the generated CSV file.

## Examples

###### Generate a CSV using an array of data:
```yaml
- id: generate_csv
  type: Button
  properties:
    size: large
    title: Generate a CSV
    color: '#1890ff'
  events:
    onClick:
      - id: generate_csv
        type: DownloadCsv
        params:
          filename: profiles.csv
          data:
            - Username: booker12 # an array of data, usually a request
              Identifier: 9012
              FirstName: Rachel
              LastName: Booker
            - Username: grey07
              Identifier: 2070
              FirstName: Laura
              LastName: Grey
            - Username: johnson81
              Identifier: 4081
              FirstName: Craig
              LastName: Johnson
            - Username: jenkins46
              Identifier: 9346
              FirstName: Mary
              LastName: Jenkins
            - Username: smith79
              Identifier: 5079
              FirstName: Jamie
              LastName: Smith
          fields:
            - Username # an array of field definitions
            - Identifier
            - FirstName
            - LastName
```

###### Generate a CSV using a request:
```yaml
- id: generate_csv
  type: Button
  properties:
    size: large
    title: Generate a CSV
    color: '#1890ff'
  events:
    onClick:
      - id: fetch_data
        type: Request
        params:
          - get_data
      - id: generate_csv
        type: DownloadCsv
        params:
          filename: profiles.csv
          data:
            _request: get_data # an array of data, from a request
          fields:
            - Username # an array of field definitions
            - Identifier
            - FirstName
            - LastName
```


---

## File: `actions/DisplayMessage.yaml`

# DisplayMessage

## Description

The `DisplayMessage` action is used to display a message to a user.

## Types

```
(params: {
  status?: enum,
  duration?: number,
  content?: string,
}): void
```

## Parameters

###### object
  - `status: enum`: DisplayMessage status type. Defaults to `success`. One of:
    - `success`
    - `error`
    - `info`
    - `warning`
    - `loading`.
  - `duration: number`: Time in seconds before message disappears. The default is 5.
  - `content: string`: The content of the message.

## Examples

###### Display a success message:
```yaml
- id: success_message
  type: DisplayMessage
  params:
    content: Success
```

###### Display an info message that remains visible for 10 seconds:
```yaml
- id: info_message
  type: DisplayMessage
  params:
    content: Something happened
    status: info
    duration: 10
```

###### Display an error message that never disappears:
```yaml
- id: error_message
  type: DisplayMessage
  params:
    content: Something bad happened
    status: error
    duration: 0
```


---

## File: `actions/CopyToClipboard.yaml`

# CopyToClipboard

## Description

The `CopyToClipboard` action is used to copy content to the clipboard. It implements the [`navigator.clipboard.writeText`](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/writeText) web API.

## Types

```
(params: {
  copy: string
}): void
```

## Parameters

###### object
  - `copy: string`: __Required__ - Text to be copied to the clipboard.

## Examples

###### Copy text button:
```yaml
- id: copy_button
  type: Button
  properties:
    title: Copy Text
  events:
    onClick:
      - id: copy
        type: CopyToClipboard
        params:
          copy: Lorem ipsum dolor sit amet
        messages:
          success: Copied!
```


---

## File: `actions/CallMethod.yaml`

# CallMethod

## Description

The `CallMethod` action is used to call a method defined by another block.

## Types

```
(params: {
  blockId: string,
  method: string,
  args?: any[]
}): void
```

## Parameters

###### object
  - `blockId: string`: __Required__ - The id of the block.
  - `method: string`: __Required__ - The name of the method that should be called.
  - `args: any[]`: The array of positional arguments with which the method should be called.

## Examples

###### Open a modal:
```yaml
- id: toggle_modal
  type: CallMethod
  params:
    blockId: my_modal
    method: toggleOpen
```

###### Display a message with args:
```yaml
- id: display_message
  type: CallMethod
  params:
    blockId: my_message
    method: open
    args:
      - content: Hello
        duration: 4
```


---

## File: `operators/_yaml.yaml`

# _yaml

## Description

The `_yaml` parses and writes YAML strings.

## Methods

### parse

The `_yaml.parse` method parses a YAML string into an object.

```
```
({on: string, options?: object}): object
([on: string, options?: object]): object
```
```

**Arguments:**
###### object
  - `on: string`: String to parse.
  - `options?: object`: Optional settings. See the [YAML.parse: method here](https://eemeli.org/yaml/#parse-options) for supported settings.

**Examples:**
###### Parse a YAML string:
```yaml
_yaml.parse:
  on: |
    key: Value
    boolean: true
    array:
      - 1
      - 2
```
or:
```yaml
_yaml.parse:
  - |
    key: Value
    boolean: true
    array:
      - 1
      - 2
```
Returns:
```
key: Value
boolean: true
array:
  - 1
  - 2
```

### stringify

The `_yaml.stringify` method creates a YAML string from an object.

```
```
({on: any, options?: object}): string
([on: any, options?: object]): string
```
```

**Arguments:**
###### object
  - `on: any`: The object to stringify.
  - `options?: object`: Optional settings. See the [YAML.stringify: method here](https://eemeli.org/yaml/#tostring-options) for supported settings.

**Examples:**
###### Stringify an object as YAML:
```yaml
_yaml.stringify:
  on:
    key: Value
    boolean: true
    array:
      - 1
      - 2
```
or:
```yaml
_yaml.stringify:
  - key: Value
    boolean: true
    array:
      - 1
      - 2
```
Returns (as a string):
```text
key: Value
boolean: true
array:
  - 1
  - 2
```


---

## File: `operators/_var.yaml`

# _var

## Description

The `_var` operator gets a value from the `vars` object, specified by a [`_ref`](/ref) operator when referencing a file.

> The `_var` operator is a build time operator: it is evaluated when the app configuration is being built. This means it is not evaluated dynamically as the app is running, and can be used anywhere in the configuration as long as the resulting configuration files are valid YAML.

## Types

```
(key: string): any
(arguments: {
  key: string,
  default?: any,
}): any
```

## Arguments

###### string
If the `_var` operator is called with a string argument, the value of the key in the `vars` object is returned. If the value is not found, `null` is returned. Dot notation is supported.

###### object
  - `key: string`: The value of the key in the `vars` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation is supported.
  - `default: any`: A value to return if the `key` is not found in `vars`. By default, `null` is returned if a value is not found.

## Examples

###### Using a standardized input label template:
```yaml
blocks:
  - id: name
    type: TextInput
    properties:
      label:
        _ref:
          path: label.yaml
          vars:
            title: Name
            description: Your name and surname.
            descriptionTextColor: '#546358'
  - id: age
    type: NumberInput
    properties:
      label:
        _ref:
          path: label.yaml
          vars:
            title: Age
            description: Your age.
```
```yaml
# label.yaml
title:
  _var: title
extra:
  _var: description
span: 8
colon: false
extraStyle:
  color:
    _var:
      key: descriptionTextColor
      default: '#333333'
```
Returns:
```yaml
blocks:
  - id: name
    type: TextInput
    properties:
      label:
        title: Name
        extra: Your name and surname.
        span: 8
        colon: false
        extraStyle:
          color: '#546358'
  - id: age
    type: NumberInput
    properties:
      label:
        title: Age
        extra: Your age.
        span: 8
        colon: false
        extraStyle:
          color: '#333333'
```


---

## File: `operators/_uuid.yaml`

# _uuid

## Description

The `_uuid` operator creates [UUIDs](https://en.wikipedia.org/wiki/Universally_unique_identifier). A UUID is a random identifier that is, for all practical purposes, unique. It looks like:

```
123e4567-e89b-12d3-a456-426614174000
```

## Types

```
(void): string
```

## Arguments

###### default:
`_uuid: true`, `_uuid: null` or `_uuid: undefined` returns a version 4 UUID.

## Examples

###### Generate a v4 uuid:
```yaml
_uuid: null
```
Returns: A version 4 UUID.

## Methods

### v1

Create a version 1 (timestamp) UUID.

```
```
(void): string
```
```

**Arguments:**
The `_uuid.v1` method does not take any arguments.

**Examples:**
###### Generate a version 1 UUID:
```yaml
_uuid.v1: null
```
Returns: A version 1 UUID.

### v3

Create a version 3 (namespace w/ MD5) UUID.

```
```
({name: string | string[], namespace: string | string[]}): string
([name: string | string[], namespace: string | string[]]): string
```
```

**Arguments:**
###### object:
If the `_uuid` operator is called with arguments, it can be one of the following:
  - `name: string | string[]`: A string or an array.
  - `namespace: string | string[]`: A string or an Array[16] - Namespace UUID.

**Examples:**
###### Generate a version 3 UUID:
```yaml
_uuid.v3:
  name: hello
  namespace: world
```
Returns: A version 3 UUID.

### v4

Create a version 4 (random) UUID.

```
```
(void): string
```
```

**Arguments:**
The `_uuid.v4` method does not take any arguments.

**Examples:**
###### Generate a version 4 UUID:
```yaml
_uuid.v4: null
```
Returns: A version 4 UUID.

### v5

Create a version 5 (namespace w/ SHA-1) UUID.

```
```
({name: string | string[], namespace: string | string[]}): string
([name: string | string[], namespace: string | string[]]): string
```
```

**Arguments:**
###### object:
If the `_uuid` operator is called with arguments, it can be one of the following:
  - `name: string | string[]`: A string or an array.
  - `namespace: string | string[]`: A string or an Array[16] - Namespace UUID.

**Examples:**
###### Generate a version 5 UUID:
```yaml
_uuid.v5:
  name: hello
  namespace: world
```
Returns: A version 5 UUID.


---

## File: `operators/_user.yaml`

# _user

## Description

The `_user` operator gets a value from the [`user`](/user-object) object. The `user` object contains the data in the user idToken if OpenID Connect authentication is configured and a user is logged in.

## Types

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

## Arguments

###### string
If the `_user` operator is called with a string argument, the value of the key in the `user` object is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean
If the `_user` operator is called with boolean argument `true`, the entire `user` object is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `user` object is returned. One of `all` or `key` are required.
  - `key: string`: The value of the key in the `user` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `user`. By default, `null` is returned if a value is not found.

## Examples

###### Get the value of `name` from `user`:
```yaml
_user: name
```
```yaml
_user:
  key: name
```
Returns: The value of `name` in `user`.

###### Get the entire `user` object:
```yaml
_user: true
```
```yaml
_user:
  all: true
```
Returns: The entire `user` object.

###### Dot notation:
Assuming user:
```yaml
sub: abc123
name: User Name
my_object:
  subfield: 'Value'
```
then:
```yaml
_user: my_object.subfield
```
```yaml
_user:
  key: my_object.subfield
```
Returns: `"Value"`.

###### Return a default value if the value is not found:
```yaml
_user:
  key: might_not_exist
  default: Default value
```
Returns: The value of `might_not_exist`, or `"Default value"`.

###### Block list indices:
Assuming `user`:
```yaml
sub: abc123
name: User Name
my_array:
  - value: 0
  - value: 1
  - value: 2
```
then:
```yaml
_user: my_array.$.value
```
Returns: `0` when used from the first block (0th index) in a list.


---

## File: `operators/_url_query.yaml`

# _url_query

## Description

The `_url_query` operator gets a value from the [`urlQuery`](/page-and-app-state) object. The `urlQuery` is a data object that is set as the [`https://en.wikipedia.org/wiki/Query_string`] of the app URL. It can be set when linking to a new page using the [`Link`](/link) action, and can be used to set data like a `id` when switching to a new page. Unlike `input`, the `urlQuery` is visible to the user, and can be modified by the user.

> __DO NOT__ set any private or personal information to `urlQuery`; all data set to `urlQuery` are accessible publicly. Setting a `id` that can be guessed, like an incremental `id`, can lead to security issues, since users can easily guess and access data for other `ids`.

If the page is reloaded, the `urlQuery` is not lost. By using `urlQuery`, you can make links containing data that can be shared by users. By default, `_url_query` accesses the `url_query` object from the [page](/page-and-app-state) the operator is used in.

`urlQuery` objects are serialized to JSON, allowing nested objects or arrays to be specified.

## Types

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

## Arguments

###### string
If the `_url_query` operator is called with a string argument, the value of the key in the `urlQuery` object is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean
If the `_url_query` operator is called with boolean argument `true`, the entire `urlQuery` object is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `urlQuery` object is returned. One of `all` or `key` are required.
  - `key: string`: The value of the key in the `urlQuery` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `urlQuery`. By default, `null` is returned if a value is not found.

## Examples

###### Get the value of `my_key` from `urlQuery`:
```yaml
_url_query: my_key
```
```yaml
_url_query:
  key: my_key
```
Returns: The value of `my_key` in `urlQuery`.

###### Get the entire `urlQuery` object:
```yaml
_url_query: true
```
```yaml
_url_query:
  all: true
```
Returns: The entire `urlQuery` object.

###### Dot notation:
Assuming urlQuery:
```yaml
my_object:
  subfield: 'Value'
```
then:
```yaml
_url_query: my_object.subfield
```
```yaml
_url_query:
  key: my_object.subfield
```
Returns: `"Value"`.

###### Return a default value if the value is not found:
```yaml
_url_query:
  key: might_not_exist
  default: Default value
```
Returns: The value of `might_not_exist`, or `"Default value"`.

###### Block list indices:
Assuming `urlQuery`:
```yaml
my_array:
  - value: 0
  - value: 1
  - value: 2
```
then:
```yaml
_url_query: my_array.$.value
```
Returns: `0` when used from the first block (0th index) in a list.


---

## File: `operators/_uri.yaml`

# _uri

## Description

The `_uri` operator [encodes and decodes](https://en.wikipedia.org/wiki/Percent-encoding) Uniform Resource Identifiers (URI). It encodes characters that are not in the limited US-ASCII characters legal within a URI.

## Methods

### decode

The `_uri.decode` method decodes a string that has been uri-encoded. It uses [`decodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).

```
```
(value: string): string
```
```

**Arguments:**
###### string
The string to decode.

**Examples:**
###### Decode a base64 string:
```yaml
_uri.decode: http%3A%2F%2Fusername%3Apassword%40www.example.com%3A80%2Fpath%2Fto%2Ffile.php%3Ffoo%3D316%26bar%3Dthis%2Bhas%2Bspaces%23anchor
```
Returns: `"http://username:password@www.example.com:80/path/to/file.php?foo=316&bar=this+has+spaces#anchor"`.

### encode

The `_uri.encode` uri-encodes a string. It uses [`encodeURIComponent`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).

```
```
(value: string): string
```
```

**Arguments:**
###### string
The string to encode.

**Examples:**
###### Encode a string as base64:
```yaml
_uri.encode: http://username:password@www.example.com:80/path/to/file.php?foo=316&bar=this+has+spaces#anchor
```
Returns: `"http%3A%2F%2Fusername%3Apassword%40www.example.com%3A80%2Fpath%2Fto%2Ffile.php%3Ffoo%3D316%26bar%3Dthis%2Bhas%2Bspaces%23anchor"`.


---

## File: `operators/_type.yaml`

# _type

## Description

The `_type` operator performs a type test on an object, and returns true if the object is of the specified type.

The regex operator has shorthand argument definitions that can be used on web client.

## Types

```
(type: enum): boolean
(arguments: {
  type: string,
  on?: any,
  key?: string
}): boolean
```

## Arguments

###### object
  - `type: enum`: __Required__ - The type to test. Can be one of:
    - `string`
    - `array`
    - `date`
    - `object`
    - `boolean`
    - `number`
    - `integer`
    - `null`
    - `undefined`
    - `none` (`null` or `undefined`)
    - `primitive` (`undefined`, `null`, `string`, `number`, `boolean`, or `date`)
  - `on: any`: The value to test. One of `on` or `key` must be specified unless the operator is used in an input block.
  - `key: string`: The key of a value in `state` to test. One of `on` or `key` must be specified unless the operator is used in an input block.

###### string
The type to test. The string shorthand can only be used in an input block, and the tested value will be the block's value.

## Examples

###### Check if a value is a number:
```yaml
_type:
  type: number
  on:
    _state: input
```
Returns: `true` if a number.

###### Using the key of the value in `state`:
```yaml
_type:
  type: number
  key: input
```
Returns: `true` if a number.

###### Using the value of the block in which the operator is evaluated:
```yaml
id: input
type: TextInput
validate:
  - message: This field id required.
    status: error
    pass:
      _not:
        _type: none
```
Returns: `true` if the input is none.

###### Test if an id in the `urlQuery` is undefined or null:
```yaml
_type:
  type: none
  on:
    _url_query: id
```
Returns: `true` if the id is none,


---

## File: `operators/_switch.yaml`

# _switch

## Description

The `_switch` operator evaluates an array of conditions and returns the `then` argument of the first item for which the `if` argument evaluates to `true`. If no condition evaluates to `true`, the value of the `default` argument is returned.

## Types

```
(arguments: {branches: {if: boolean, then: any}[], default: any}): any
```

## Arguments

###### object
  - `branches:`
      `if: boolean`: The boolean result of a test.
      `then: any`: The value to return if the test is `true`.
  - `default: any`: The value to return if all the `if` tests are `false`.

## Examples

###### Return a value based on a series of conditions:
```yaml
_switch:
  branches:
    - if:
        _eq:
          - x
          - y
      then: A
    - if:
        _eq:
          - x
          - z
      then: B
  default: C
```
Returns: `"C"` since both of the `if` tests are `false`.


---

## File: `operators/_sum.yaml`

# _sum

## Description

The `_sum` operator takes the sum of the values given as input. If a value is not a number, the value is skipped.

## Types

```
(values: any[]): number
```

## Arguments

#### array
An array of values to add.

## Examples

###### Two numbers:
```yaml
_sum:
  - 3
  - 4
```
Returns: `7`

###### Array of numbers:
```yaml
_sum:
  - 1
  - 2
  - 3
  - 4
```
Returns: `10`

###### Non-numbers are skipped:
```yaml
_sum:
  - 1
  - null
  - 3
  - "four"
  - 5
```
Returns: `9`


---

## File: `operators/_subtract.yaml`

# _subtract

## Description

The `_subtract` operator takes an array of two numbers as input and returns the second number subtracted from the first.

## Types

```
([minuend: number, subtrahend: number]): number
```

## Arguments

###### array
An array of two numbers.

## Examples

###### Subtract a number:
```yaml
_subtract:
  - 12
  - 4
```
Returns: `8`


---

## File: `operators/_string.yaml`

# _string

## Description

The `_string` operator can be used to run javascript [`String`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String) methods.

## Methods

### charAt

The `_string.charAt` method returns a string consisting of [the single UTF-16 code (character) unit located at the specified offset](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/charAt) into the string.

```
```
(arguments: {on: string, index: number}): string
(arguments: [on: string, index: number]): string
```
```

### concat

The `_string.concat` method [concatenates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/concat) strings.

```
```
(strings: string[]): string
```
```

### endsWith

The `_string.endsWith` method determines whether a string [ends with the characters of a specified string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith), returning `true` or `false` as appropriate.

```
```
(arguments: {
  on: string,
  searchString: string,
  length?: number
}): boolean
(arguments: [
  on: string,
  searchString: string,
  length?: number
]): boolean
```
```

### includes

The `_string.includes` method determines whether [one string may be found within another string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/includes), returning `true` or `false` as appropriate.

```
```
(arguments: {
  on: string,
  searchString: string,
  position?: number
}): boolean
(arguments: [
  on: string,
  searchString: string,
  position?: number
]): boolean
```
```

### indexOf

The `_string.indexOf` method returns the index within string of the [first occurrence of the specified value](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/indexOf), starting the search at `fromIndex`. Returns `-1` if the value is not found.

```
```
(arguments: {
  on: string,
  searchValue: string,
  fromIndex?: number
}): number
(arguments: [
  on: string,
  searchValue: string,
  fromIndex?: number
]): number
```
```

### length

The `_string.length` method returns the [length](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/length) of a string.

```
```
(string: string): number
```
```

### lastIndexOf

The `_string.lastIndexOf` method returns the index within string of the [last  occurrence of the specified value](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/lastIndexOf), searching backwards from `fromIndex`. Returns `-1` if the value is not found.

```
```
(arguments: {
  on: string,
  searchValue: string,
  fromIndex?: number
}): number
(arguments: [
  on: string,
  searchValue: string,
  fromIndex?: number
]): number
```
```

### match

The `_string.match` method returns the [result of matching a string against a regular expression](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/match).

```
```
(arguments: {
  on: string,
  regex: string,
  regexFlags?: string
}): string[]
```
```

### normalize

The `_string.normalize` method returns the [Unicode Normalization Form](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/normalize) of the string.

```
```
(arguments: {on: string, form?: enum}): string
(arguments: [on: string, form?: enum]): string
```
```

### padEnd

The `_string.padEnd` method [pads the string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd) with a given string (repeated, if needed) so that the resulting string reaches a given length. The padding is applied from the end of the string.

```
```
(arguments: {
  on: string,
  targetLength: number,
  padString?: string
}): string
(arguments: [
  on: string,
  targetLength: number,
  padString?: string
]): string
```
```

### padStart

The `_string.padStart` method [pads the string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/padEnd) with a given string (repeated, if needed) so that the resulting string reaches a given length. The padding is applied from the start of the string.

```
```
(arguments: {
  on: string,
  targetLength: number,
  padString?: string
}): string
(arguments: [
  on: string,
  targetLength: number,
  padString?: string
]): string
```
```

### repeat

The `_string.repeat` method returns a string which contains [the specified number of copies of the string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/repeat) on which it was called, concatenated together.

```
```
(arguments: {on: string, count: number}): string
(arguments: [on: string, count: number]): string
```
```

### replace

The `_string.replace` method returns a string with [some or all matches of a pattern replaced by a replacement](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/replace).

```
```
(arguments: {
  on: string,
  regex: string,
  newSubstr: string,
  regexFlags?: string
}): string
```
```

### search

The `_string.search` method executes a [search for a match between a regular expression and a string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/search). It returns the index of the first match between the regular expression and the given string, or `-1` if no match was found.

```
```
(arguments: {
  on: string,
  regex: string,
  regexFlags?: string
}): number
```
```

### slice

The `_string.slice` method [extracts a section](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/slice) of a string.

```
```
(arguments: {
  on: string,
  start: number,
  end?: number
}): string
(arguments: [
  on: string,
  start: number,
  end?: number
]): string
```
```

### split

The `_string.split` method [divides a string into an array of substrings](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/split), splitting on the provided separator.

```
```
(arguments: {on: string, separator?: string}): string[]
(arguments: [on: string, separator?: string]): string[]
```
```

### startsWith

The `_string.startsWith` method determines whether a string [starts with the characters of a specified string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/endsWith), returning `true` or `false` as appropriate.

```
```
(arguments: {
  on: string,
  searchString: string,
  position?: number
}): boolean
(arguments: [
  on: string,
  searchString: string,
  position?: number
]): boolean
```
```

### substring

The `_string.startsWith` method returns [the part of the string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/substring) between the `start` and `end` indexes, or to the end of the string.

```
```
(arguments: {
  on: string,
  start: number,
  end?: number
}): string
(arguments: [
  on: string,
  start: number,
  end?: number
]): string
```
```

### toLowerCase

The `_string.toLowerCase` method converts the string to [lower case](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toLowerCase).

```
```
(string: string): string
```
```

### toUpperCase

The `_string.toUpperCase` method converts the string to [upper case](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/toUpperCase).

```
```
(string: string): string
```
```

### trim

The `_string.trim` method [removes whitespace from both ends](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/Trim) of a string.

```
```
(string: string): string
```
```

### trimEnd

The `_string.trimEnd` method [removes whitespace from the end](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trimEnd) of a string.

```
```
(string: string): string
```
```

### trimStart

The `_string.trimStart` method [removes whitespace from the start](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/trimStart) of a string.

```
```
(string: string): string
```
```


---

## File: `operators/_state.yaml`

# _state

## Description

The `_state` operator gets a value from the [`state`](/page-and-app-state) object. The `state` is a data object specific to the page it is in. The value of `input` blocks are available in `state`, with their `blockId` as key. By default, `_state` accesses the `state` object from the [page](/page-and-app-state) the operator is used in.

## Types

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

## Arguments

###### string
If the `_state` operator is called with a string argument, the value of the key in the `state` object is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean
If the `_state` operator is called with boolean argument `true`, the entire `state` object is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `state` object is returned. One of `all` or `key` are required.
  - `key: string`: The value of the key in the `state` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `state`. By default, `null` is returned if a value is not found.

## Examples

###### Get the value of `my_key` from `state`:
```yaml
_state: my_key
```
```yaml
_state:
  key: my_key
```
Returns: The value of `my_key` in `state`.

###### Get the entire `state` object:
```yaml
_state: true
```
```yaml
_state:
  all: true
```
Returns: The entire `state` object.

###### Dot notation:
Assuming state:
```yaml
my_object:
  subfield: 'Value'
```
then:
```yaml
_state: my_object.subfield
```
```yaml
_state:
  key: my_object.subfield
```
Returns: `"Value"`.

###### Return a default value if the value is not found:
```yaml
_state:
  key: might_not_exist
  default: Default value
```
Returns: The value of `might_not_exist`, or `"Default value"`.

###### Block list indices:
Assuming `state`:
```yaml
my_array:
  - value: 0
  - value: 1
  - value: 2
```
then:
```yaml
_state: my_array.$.value
```
Returns: `0` when used from the first block (0th index) in a list.


---

## File: `operators/_secret.yaml`

# _secret

## Description

The `_secret` operator gets a value from the [`secret`](/context-and-secret) object. The `secrets` is a data object that contains sensitive information like passwords or API keys. The `_secret` operator can only be used in `connections` and `requests`. Secrets are read from environment variables on the server that start with `LOWDEFY_SECRET_`, (i.e. `LOWDEFY_SECRET_SECRET_NAME`). The name of the secret is the part after `LOWDEFY_SECRET_`. Since environment variables can only be strings, secrets can be JSON encoded, and parsed using the [`_json.parse`](/_json) method.

## Types

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any
}): any
```

## Arguments

###### string
If the `_secret` operator is called with a string argument, the value of the key in the `secrets` object is returned. If the value is not found, `null` is returned.

###### boolean
If the `_secret` operator is called with boolean argument `true`, the entire `secrets` object is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `secrets` object is returned. One of `all` or `key` are required.
  - `key: string`: The value of the key in the `secrets` object is returned. If the value is not found, `null`, or the specified default value is returned. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `secrets`. By default, `null` is returned if a value is not found.

## Examples

###### Get the value of `MY_SECRET` from `secrets`:
```yaml
_secret: MY_SECRET
```
```yaml
_secret:
  key: MY_SECRET
```
Returns: The value of `MY_SECRET` in `secrets`.

###### Get the entire `secret` object:
```yaml
_secret: true
```
```yaml
_secret:
  all: true
```
Returns: The entire `secrets` object.

###### Return a default value if the value is not found:
```yaml
_secret:
  key: MY_SECRET
  default: Not so secret
```
Returns: The value of `MY_SECRET`, or `"Not so secret"`.


---

## File: `operators/_request_details.yaml`

# _request_details

## Description

The `_request_details` operator returns detailed information of a request. If the request has not yet been called, the returned value is `null`.

The response includes the following fields:

- `blockId: string`: The id of the block from which the request was initiated.
- `loading: boolean`: When `true`, the request is awaiting a response.
- `payload: object`: The payload sent with the request.
- `requestId: string`: The id of the request.
- `response: object`: The response returned by the request. `null` while `loading` is true.
- `responseTime: number`: The time taken to get the response in milliseconds.

## Types

```
(requestId: string): any
```

## Arguments

###### string
The id of the request.

## Examples

###### Using a request id:
```yaml
_request_details: my_request
```
Returns: The details of the specified request.


---

## File: `operators/_request.yaml`

# _request

## Description

The `_request` operator returns the response value of a request. If the request has not yet been called, or is still executing, the returned value is `null`. Dot notation and [block list indexes](/lists) are supported. For more detailed information about a request, the [_request_details](/_request_details) operator can be used.

## Types

```
(requestId: string): any
```

## Arguments

###### string
The id of the request.

## Examples

###### Using a request response:
```yaml
_request: my_request
```
Returns: The response returned by the request.

###### Using dot notation to get the data object from the response:
```yaml
_request: my_request.data
```
###### Using dot notation to get the first element of an array response:
```yaml
_request: array_request.0
```
###### Using dot notation and block list indexes to get the name field from the element corresponding to the block index of an array response:
```yaml
_request: array_request.$.name
```


---

## File: `operators/_regex.yaml`

# _regex

## Description

The `_regex` operator performs a regex test on a string, and returns `true` if there is a match.

The regex operator has shorthand argument definitions that can be used on web client.

## Types

```
(pattern: string): boolean
(arguments: {
  pattern: string,
  on?: string,
  key?: string,
  flags?: string
}): boolean
```

## Arguments

###### object
  - `pattern: string`: __Required__ - The regular expression pattern to test.
  - `on: string`: The string to test the value on. One of `on` or `key` must be specified unless the operator is used in an input block.
  - `key: string`: The key of a value in `state` to test. One of `on` or `key` must be specified unless the operator is used in an input block.
  - `flags: string`: The regex flags to use. The default value is `"gm"`.

###### string
The regular expression pattern to test. The string shorthand can only be used in an input block, and the tested value will be the block's value.

## Examples

###### Check if a username is valid (Alphanumeric string that may include _ and – having a length of 3 to 16 characters):
```yaml
_regex:
  pattern: ^[a-z0-9_-]{3,16}$
  on:
    _state: username_input
```
Returns: `true` if matched else `false`.

###### Using the key of the value in `state`:
```yaml
_regex:
  pattern: ^[a-z0-9_-]{3,16}$
  key: username_input
```
Returns: `true` if matched else `false`.

###### Using the value of the block in which the operator is evaluated:
```yaml
id: username_input
type: TextInput
validate:
  - message: Invalid username.
    status: error
    pass:
      _regex: ^[a-z0-9_-]{3,16}$
```
Returns: `true` if matched else `false`.

###### Case insensitive match:
```yaml
_regex:
  pattern: ^[a-z0-9_-]{3,16}$
  on:
    _state: username_input
  flags: 'gmi'
```
Returns: `true` if matched else `false`.


---

## File: `operators/_ref.yaml`

```yaml
# Copyright 2020-2024 Lowdefy, Inc

# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at

#     http://www.apache.org/licenses/LICENSE-2.0

# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

_ref:
  path: templates/operators.yaml.njk
  transformer: templates/operatorsMethodTransformer.js
  vars:
    pageId: _ref
    pageTitle: _ref
    filePath: operators/_ref.yaml
    env: Build Only
    types: |
      ```
      (path: string): any
      (arguments: {
        path?: string,
        key?: string,
        resolver?: string,
        transformer?: string,
        vars?: object,
      }): any
      ```
    description: |
      The `_ref` operator can be used to reference a configuration file, in order to split the Lowdefy configuration into multiple files. More information on references and the Lowdefy configuration schema can be found [here](/lowdefy-schema).

      > The `_ref` operator is a build time operator: it is evaluated when the app configuration is being built. This means it is not evaluated dynamically as the app is running, and can be used anywhere in the configuration as long as the resulting configuration files are valid YAML.

      The `_ref` operator requires a file path to the file to be referenced, relative to the root directory of the project.

      If this file is a YAML or JSON file, and has file extension `.yaml`, `.yml`, or `.json`, the file is parsed as YAML/JSON, and the parsed result is included in the configuration.

      If this file is a Nunjucks template file, with file extension `.njk`, the file is parsed as a Nunjucks template, using any variables provided in the `vars` argument. If the file extension is `.yaml.njk`, `.yml.njk` or `.json.njk`, the template output is also parsed as YAML/JSON.

      If the file is not parsed (for example has an extension like `.txt`, `.md`, or `.html`), the file contents are included in the configuration as a string.

      If the referenced file is a YAML or JSON file, the `key` argument can be used to reference a specific key inside that file, instead of the whole file.

      ###### Variables

      Variables defined in the `vars` argument can be accessed in the referenced file using the [`_var`](/_var), and as template variables in Nunjucks files.

      ###### Resolver

      A resolver is a JavaScript function that overwrites the default way configuration files are read from the filesystem. It does not need to read from the filesystem, it could generate a value to return programmatically, or it could fetch the configuration using HTTP (from Github for example). The `resolver` argument should be the file path (relative to the root of the project) to a JavaScript file that exports a resolver function.

      The resolver function receives the `path`, `vars`, and a `context` object as arguments. If a resolver function is specified, the `path` argument to the `_ref` operator is optional, and does not need to correspond to a path to a file. If `path` ends with `.yaml`, `.yml`, `.json`, `.njk`, `.yaml.njk`, `.yml.njk`, or `.json.njk`, the returned result will be parsed as YAML/JSON/Nunjucks template.

      A default `_ref` resolver can be specified in the `lowdefy.yaml` `cli` section (as `refResolver`), or as a command-line option when running the CLI (as `--ref-resolver`). This resolver will then be used for all references in the app, unless another resolver is specified.

      ###### Transformer

      A transformer is a JavaScript function that receives the result of the `_ref` operator, and its `vars` as arguments. The value returned by this function will be included in the configuration as the final result of the `_ref` operator. The `transformer` argument should be the file path (relative to the root of the project) to a JavaScript file that exports a transformer function.

      ###### CommonJS and ES Modules

      Both [CommonJS](https://nodejs.org/api/modules.html) and [ES Modules](https://nodejs.org/api/esm.html) are supported for in resolver and transformer functions. By default the functions are imported as CommonJs modules, and the function should be exported as a default export (`module.exports = transformer`). Files can also use the `.cjs` file extension to indicate they are CommonJs modules.

      To use ES Modules, either use files with `.mjs` file extension, or add a `package.json` in the project directory file with `"type": "module"` set. When using ES Modules, the functions should also be a default export (`export default transformer;`)

    arguments: |
      ###### string
      The file path to the referenced file, from the root of the project directory.

      ###### object
        - `path: string`:  The file path to the referenced file, from the root of the project directory. If no `resolver` is specified, `path` is required.
        - `key: string`: Only include the content at the specified key, instead of the entire file content. Dot notation is supported. This can only be used with YAML or JSON files.
        - `resolver: string`: The file path to a JavaScript file, from the root of the project directory, that exports a resolver function.
        - `transformer: string`: The file path to a JavaScript file, from the root of the project directory, that exports a transformer function.
        - `vars: object`: An object to be used as variables for the `_var` operator in the referenced file, and as template variables in Nunjucks template files.

    examples:
      _nunjucks:
        on:
          version:
            _ref: version.yaml
        template: |
          ###### Reference pages:
          ```yaml
          # lowdefy.yaml
          lowdefy: {{ version }}
          pages:
            - _ref: pages/page1.yaml
            - _ref: pages/page2.yaml
          ```
          ```yaml
          # pages/page1.yaml
          id: page1
          type: PageHeaderMenu
          blocks:
            # ...
          ```
          ```yaml
          # pages/page2.yaml
          id: page2
          type: PageHeaderMenu
          blocks:
            # ...
          ```
          Returns:
          ```
          lowdefy: {{ version }}
          pages:
            - id: page1
              type: PageHeaderMenu
              blocks:
                # ...
            - id: page2
              type: PageHeaderMenu
              blocks:
                # ...
          ```

          ###### Using a standardized input label template:
          ```yaml
          blocks:
            - id: name
              type: TextInput
              properties:
                label:
                  _ref:
                    path: label.yaml
                    vars:
                      title: Name
                      description: Your name and surname.
            - id: age
              type: NumberInput
              properties:
                label:
                  _ref:
                    path: label.yaml
                    vars:
                      title: Age
                      description: Your age.
          ```
          ```yaml
          # label.yaml
          title:
            _var: title
          extra:
            _var: description
          span: 8
          colon: false
          extraStyle:
            color: '#546358'
          ```
          Returns:
          ```yaml
          blocks:
            - id: name
              type: TextInput
              properties:
                label:
                  title: Name
                  extra: Your name and surname.
                  span: 8
                  colon: false
                  extraStyle:
                    color: '#546358'
            - id: age
              type: NumberInput
              properties:
                label:
                  title: Age
                  extra: Your age.
                  span: 8
                  colon: false
                  extraStyle:
                    color: '#546358'
          ```

          ###### Use key:
          ```yaml
          # lowdefy.yaml
          lowdefy: {{ version }}
          version:
            _ref:
              path: package.json
              field: version
          ```
          ```json
          // package.json
          {
            "version": "1.0.0"
          }
          ```
          Returns:
          ```
          lowdefy: {{ version }}
          version: 1.0.0
          ```

          ###### Local or shared resolver:

          This resolver function will first look for the configuration file in the current working directory, but if the file is not found it will be read from an adjacent "shared" directory. This pattern can be used to build apps that mostly use a shared configuration, with a few components that are customised per app.

          ```js
          // resolvers/useLocalOrSharedConfig.js
          const fs = require('fs');
          const path = require('path');
          const { promisify } = require('util');

          const readFilePromise = promisify(fs.readFile);

          async function useLocalOrSharedConfig(refPath, vars, context) {
            let fileContent
            try {
              fileContent =  await readFilePromise(path.resolve(refPath), 'utf8');
              return fileContent;
            } catch (error) {
              if (error.code === 'ENOENT') {
                fileContent = readFilePromise(path.resolve('../shared', refPath), 'utf8');
                return fileContent;
              }
              throw error;
            }


          }

          module.exports = useLocalOrSharedConfig;
          ```

          ```yaml
          // lowdefy.yaml
          lowdefy: {{ version }}

          cli:
            refResolver: resolvers/useLocalOrSharedConfig.js

          pages:
            - _ref: pages/local-page.yaml
            - _ref: pages/shared-page.yaml
          ```

          ###### This transformer adds a standard footer to each page:

          ```js
          //  transformers/addFooter.js

          function addFooter(page, vars) {
            const footer = {
              // ...
            };
            page.areas.footer = footer;
            return page;
          }
          module.exports = addFooter;
          ```
          ```yaml
          // lowdefy.yaml
          lowdefy: {{ version }}

          pages:
            - _ref:
                path: pages/page1.yaml
                transformer: transformers/addFooter.js
          ```
          ###### Using ES Modules with `.mjs` file extension:

          ```js
          // resolvers/useLocalOrSharedConfig.mjs
          import fs from 'fs';
          import path from 'path';
          import { promisify } from 'util';

          const readFilePromise = promisify(fs.readFile);

          async function useLocalOrSharedConfig(refPath, vars, context) {
            let fileContent
            try {
              fileContent =  await readFilePromise(path.resolve(refPath), 'utf8');
              return fileContent;
            } catch (error) {
              if (error.code === 'ENOENT') {
                fileContent = readFilePromise(path.resolve('../shared', refPath), 'utf8');
                return fileContent;
              }
              throw error;
            }


          }

          export default useLocalOrSharedConfig;
          ```

```
---

## File: `operators/_random.yaml`

# _random

## Description

The `_random` operator returns a random string or number. The types it accepts are `string`, `integer`, or `float`.

## Types

```
(type: string): string | number
(arguments: {
  type: string,
  length?: number,
  max?: number,
  min?: number
}): string | number
```

## Arguments

###### string
The type to generate. One of `string`, `integer`, or `float`.

###### object
  - `type: string`: __Required__ - The type to generate. One of `string`, `integer`, or `float`.
  - `length: string`: The length of the string to generate if type is `string`. Default is `8`.
  - `max: number`: The maximum possible number if type is one of `integer` or `float`. Default is `100` if `integer` or `1` if `float`.
  - `min: number`: The minimum possible number if type is one of `integer` or `float`. Default is `0`.

## Examples

###### Random string:
```yaml
_random: string
```
Returns: Random string of length 8.

```yaml
_random:
  type: string
```
Returns: Random string of length 8.

###### Random integer:
```yaml
_random: integer
```
Returns: Random integer between 0 and 100 inclusive.

```yaml
_random:
  type: integer
```
Returns: Random integer between 0 and 100 inclusive.

###### Random float:
```yaml
_random: float
```
Returns: Random float between 0 and 1 inclusive.

```yaml
_random:
  type: float
```
Returns: Random float between 0 and 1 inclusive.

###### Random string of length 12:
```yaml
_random:
  type: string
  length: 12
```
Returns: Random string of length 12.

###### Random integer between 1 and 6 (Dice roll):
```yaml
_random:
  type: integer
  min: 1
  max: 6
```
Returns: Random integer between 1 and 6 inclusive.

###### Random float between 34.2 and 42.89:
```yaml
_random:
  type: float
  min: 34.2
  max: 42.89
```
Returns: Random float between 34.2 and 42.89 inclusive.


---

## File: `operators/_product.yaml`

# _product

## Description

The `_product` operator takes the product of the values given as input. If a value is not a number, the value is skipped.

## Types

```
(values: any[]): number
```

## Arguments

###### array
An array of values to multiply.

## Examples

###### Two numbers:
```yaml
_product:
  - 3
  - 4
```
Returns: `12`

###### Array of numbers:
```yaml
_product:
  - 1
  - 2
  - 3
  - 4
```
Returns: `24`

###### Non-numbers are skipped:
```yaml
_product:
  - 1
  - null
  - 3
  - "four"
  - 5
```
Returns: `15`


---

## File: `operators/_or.yaml`

# _or

## Description

The `_or` operator performs a logical `or` over an array of inputs, using javascript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.

It returns true if any of the values in the array are truthy (not `false`, `0`, `null`, `undefined`, or the empty string `""`). If all the values are falsy, it returns `false`.

## Types

```
(values: any[]): boolean
```

## Arguments

###### array
An array of values over which to perform a logical or.

## Examples

###### `true` and `false` values:
```yaml
_or:
  - true
  - false
```
Returns: `true`

###### Array of `true` and `false` values:
```yaml
_or:
  - true
  - false
  - false
  - false
```
Returns: `true`

###### Falsy values values:
```yaml
_or:
  - null
  - 0
  - ''
```
Returns: `false`

###### Truthy values:
```yaml
_or:
  - false
  - "Hello"
```
Returns: `true`

```yaml
_or:
  - false
  - 99
```
Returns: `true`

```yaml
_or:
  - false
  - [1,2,3]
```
Returns: `true`


---

## File: `operators/_operator.yaml`

# _operator

## Description

The `_operator` operator evaluates an operator with the given params. This is useful if the operator needs to be chosen dynamically. The `_operator` cannot evaluate itself.

## Types

```
(arguments: {operator: string, params: any): any
```

## Arguments

###### object
  - `operator: string`: The name of the operator to evaluate.
  - `params: any`: The params to give to the operator.

## Examples

###### Get a value from `urlQuery` if specified, else use the value in `state`:
```yaml
_operator:
  operator:
    _if:
      test:
        _eq:
          - _state: location_selector
          - url_query
      then: _url_query
      else: _state
  params:
    key: field_to_get
```
Returns: Value from `urlQuery` if `location_selector == url_query`, else the value from `state`.


---

## File: `operators/_object.yaml`

# _object

## Description

The `_object` operator can be used to run javascript [`Object`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object) methods.

## Methods

### assign

The `_object.assign` method copies the values of one ore more source objects to a target objects. The first object in the arguments array is the target object, and the rest are source objects. Keys in the target object are overwritten. The result of `_object.assign` can be seen as a "shallow-merge" of all the objects in the array, with the values in later objects taken preferentially.

```
```
(objs: obj[]): object
```
```

**Arguments:**
###### array
An array of objects.

**Examples:**
###### Merge three objects:
```yaml
_object.assign:
  - firstName: Rachel
    lastName: Green
    series: Friends
  - firstName: Monica
    lastName: Geller
    address:
      street: 90 Bedford St
      city: New York
      zipCode: '10014'
      country: US
  - friends:
      - Ross Geller
      - Rachel Green
      - Chandler Bing
      - Phoebe Buffay
      - Joey Tribbiani
```
Returns:
```yaml
firstName: Monica
lastName: Geller
series: Friends
address:
  street: 90 Bedford St
  city: New York
  zipCode: '10014'
  country: US
friends:
  - Ross Geller
  - Rachel Green
  - Chandler Bing
  - Phoebe Buffay
  - Joey Tribbiani
```

### defineProperty

The `_object.defineProperty` method defines a new property directly on an object, or modifies an existing property on an object, and returns the object. The first object in the arguments array, or the `on` parameter, is the target object to which the property will be applied. The second argument, or the `key` parameter, is the property name or key which will be applied to the target object. The third and last object argument, or the `descriptor` parameter, has serval options to consider, however, for the most common application set the `value` object key to the value that should be applied to the target object key. See [Object.defineProperty](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/defineProperty) for a more detailed description.

> The `_object.defineProperty` method is handy when the `key` to set is variable.

```
```
(arguments: {
  on: object,
  key: string,
  descriptor: {
    value: any,
    configurable?: boolean,
    enumerable?: boolean,
    writable?: boolean
  }
}): any
(arguments: [
  on: object,
  key: string,
  descriptor: {
    value: any,
    configurable?: boolean,
    enumerable?: boolean,
    writable?: boolean
  }
]): any
```
```

**Examples:**
###### Set a value to a object key:
```yaml
_object.defineProperty:
  on:
    firstName: Rachel
    series: Friends
  key: lastName
  descriptor:
    value: Green
```
Returns:
```yaml
firstName: Rachel
lastName: Green
series: Friends
```

### entries

The `_object.entries` method returns an array with an array of key-values pairs of all the fields in an object.

```
```
(obj: object): any[]
```
```

**Arguments:**
###### object
The object to get entries from.

**Examples:**
###### Get the entries of an object:
```yaml
_object.entries:
  firstName: Monica
  lastName: Geller
```
Returns:
```yaml
- - firstName
  - Monica
- - lastName
  - Geller
```

### fromEntries

The `_object.fromEntries` method creates an object from an array of key-value pairs.

```
```
(array: any[][]): object
```
```

**Arguments:**
###### array
The array of key-value pairs.

**Examples:**
###### Get the entries of an object:
```yaml
_object.fromEntries:
  - - firstName
    - Monica
  - - lastName
    - Geller
```
Returns:
```yaml
firstName: Monica
lastName: Geller
```

### keys

The `_object.keys` method returns an array with the objects keys.

```
```
(obj: object): string[]
```
```

**Arguments:**
###### object
The object to get keys from.

**Examples:**
###### Get the keys of an object:
```yaml
_object.keys:
  firstName: Monica
  lastName: Geller
  address:
    street: 90 Bedford St
    city: New York
    zipCode: '10014'
    country: US
  friends:
    - Ross Geller
    - Rachel Green
    - Chandler Bing
    - Phoebe Buffay
    - Joey Tribbiani
```
Returns:
```yaml
- firstName
- lastName
- address
- friends
```

### values

The `_object.values` method returns an array with the values of all the fields in an object.

```
```
(obj: object): any[]
```
```

**Arguments:**
###### object
The object to get values from.

**Examples:**
###### Get the values of an object:
```yaml
_object.values:
  firstName: Monica
  lastName: Geller
  address:
    street: 90 Bedford St
    city: New York
    zipCode: '10014'
    country: US
  friends:
    - Ross Geller
    - Rachel Green
    - Chandler Bing
    - Phoebe Buffay
    - Joey Tribbiani
```
Returns:
```yaml
- Monica
- Geller
- street: 90 Bedford St
  city: New York
  zipCode: '10014'
  country: US
- - Ross Geller
  - Rachel Green
  - Chandler Bing
  - Phoebe Buffay
  - Joey Tribbiani
```


---

## File: `operators/_nunjucks.yaml`

# _nunjucks

## Description

The `_nunjucks` hydrates a [Nunjucks](https://mozilla.github.io/nunjucks/) template.

If called with a string argument, the template variables are the values in `state`. Otherwise template variables can be specified using the `on` argument.

## Types

```
(template: string): string
(arguments: {template: string, on: object}): string
```

## Arguments

###### string
The template to hydrate. The template variables used are the values in state

###### object
  - `template: string`: The template to hydrate.
  - `on: object`: The template variables to use when hydrating the template.

## Examples

###### Populate a template from values in `state`:
```yaml
_nunjucks: Hello {{ name }}
```
Returns: `"Hello Steven"` if the value of name in state is `"Steven"`.

###### Populate a markdown template with different values:
Assuming `get_items` returns:
```yaml
- name: Coca Cola
  description: The original.
- name: Pepsi
  description: The same but different.
```

```yaml
_nunjucks:
  template: |
    ### {{ title }}

    {% for item in item_list %}
    - {{ item.name }}: {{ item.description }}
    {% endfor %}
  on:
    title: Soft drinks
    items:
      _request: get_items
```
Returns:
```markdown
### Soft drinks

- Coca Cola: The original.
- Pepsi: The same but different.
```

###### Make use of the _nunjucks date filter:

```yaml
_nunjucks:
  template: {{ date | date('D MMM YYYY') }}
  on:
    date:
      _date: 2022-08-01
```

Returns:  `"1 Aug 2022"`

The `_nunjucks` date filter formats dates using the [moment.js](/https://momentjs.com/docs/#/displaying/format/) library.

###### Use the _nunjucks unique filter:

```yaml
_nunjucks:
  template: |
    <div>
      {% set uniqueArray = array | unique %}
      {% for item in uniqueArray %}
        <p>{{ item }}</p>
      {% endfor %}
    </div>
  on:
    array:
      - South Africa
      - New Zealand
      - Australia
      - South Africa
      - Pakistan
      - India
      - India
```
Returns:
```html
<div>
  <p>South Africa</p>
  <p>New Zealand</p>
  <p>Australia</p>
  <p>Pakistan</p>
  <p>India</p>
</div>
```

###### Make use of the _nunjucks urlQuery filter:

```yaml
_nunjucks:
  template: {{ url | urlQuery(params) | safe }}
  on:
    url: www.lowdefy.com
    params:
      id: 1234
      type: example
```

Returns: `"www.lowdefy.com?id=1234&type=example"`


---

## File: `operators/_number.yaml`

# _number

## Description

The `_number` operator can be used to run javascript [`Number`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number) methods.

## Methods

### EPSILON

The `_number.EPSILON` property represents the smallest interval between two representable numbers.. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/EPSILON) for more details and examples.

```
```
(void): number
```
```

### MAX_SAFE_INTEGER

The `_number.MAX_SAFE_INTEGER` property represents the maximum safe integer in JavaScript (2^53 - 1). [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_SAFE_INTEGER) for more details and examples.

```
```
(void): number
```
```

### MAX_VALUE

The `_number.MAX_VALUE` property represents the largest positive representable number. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MAX_VALUE) for more details and examples.

```
```
(void): number
```
```

### MIN_SAFE_INTEGER

The `_number.MIN_SAFE_INTEGER` property represents the minimum safe integer in JavaScript (-(2^53 - 1)). [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_SAFE_INTEGER) for more details and examples.

```
```
(void): number
```
```

### MIN_VALUE

The `_number.MIN_VALUE` property represents the smallest positive representable number — that is, the positive number closest to zero (without actually being zero). [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/MIN_VALUE) for more details and examples.

```
```
(void): number
```
```

### NaN

The `_number.NaN` property represents the special "Not a Number" value. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/NaN) for more details and examples.

```
```
(void): number
```
```

### NEGATIVE_INFINITY

The `_number.NEGATIVE_INFINITY` property represents negative infinity. Returned on overflow. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/NEGATIVE_INFINITY) for more details and examples.

```
```
(void): number
```
```

### POSITIVE_INFINITY

The `_number.POSITIVE_INFINITY` property represents positive infinity. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/POSITIVE_INFINITY) for more details and examples.

```
```
(void): number
```
```

### isFinite

The `_number.isFinite` method is used to determine whether the passed value is a finite number. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isFinite) for more details and examples.

```
```
(void): number
```
```

### isInteger

The `_number.isInteger` method is used to determine whether the passed value is an integer. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger) for more details and examples.

```
```
(void): number
```
```

### isNaN

The `_number.isNaN` method is used to determine whether the passed value is NaN. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN) for more details and examples.

```
```
(void): number
```
```

### isSafeInteger

The `_number.isSafeInteger` method is used to determine whether the passed value is a safe integer (number between -(2^53 - 1) and 2^53 - 1). [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger) for more details and examples.

```
```
(void): number
```
```

### parseFloat

The `_number.parseFloat` method parses an argument and returns a floating point number. If a number cannot be parsed from the argument, it returns NaN. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseFloat) for more details and examples.

```
```
(void): number
```
```

### parseInt

The `_number.parseInt` method parses a string argument and returns an integer of the specified radix or base. If a number cannot be parsed from the argument, it returns NaN. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/parseInt) for more details and examples.

```
```
(void): number
```
```

### toExponential

The `_number.toExponential` method returns a string representing the Number object in exponential notation. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toExponential) for more details and examples.

```
```
(void): number
```
```

### toFixed

The `_number.toFixed` method formats a number using fixed-point notation. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toFixed) for more details and examples.

```
```
(void): number
```
```

### toLocaleString

The `_number.toLocaleString` method returns a string with a language-sensitive representation of this number. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString) for more details and examples.

```
```
(void): number
```
```

### toPrecision

The `_number.toPrecision` method returns a string representing the Number object to the specified precision. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toPrecision) for more details and examples.

```
```
(void): number
```
```

### toString

The `_number.toString` method returns a string representing the specified Number object. [See MDN](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/toString) for more details and examples.

```
```
(void): number
```
```


---

## File: `operators/_not.yaml`

# _not

## Description

The `_not` operator returns the logical negation of the input. If the value is not a boolean, it will be converted to a boolean using javascript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.

## Types

```
(value: any): boolean
```

## Arguments

###### any

## Examples

###### Not `true` is `false`:
```yaml
_not: true
```
Returns: `false`

###### Return `true` for a falsy value:
```yaml
_not: null
```
Returns: `true`

###### Return `false` for a truthy value:
```yaml
_not: 100
```
Returns: `false`


---

## File: `operators/_ne.yaml`

# _ne

## Description

The `_ne` operator tests if two values are not equal. It takes an array of two values to test.

> The `_ne` won't do a deep comparison.

## Types

```
([value1: any, value2: any]): boolean
```

## Arguments

###### array
An array of two values to compare.

## Examples

###### Two non-equal strings:

```yaml
_ne:
  - "Hello"
  - "Hello you"
```
Returns: `true`

###### Two equal strings:

```yaml
_ne:
  - "Hello"
  - "Hello"
```
Returns: `false`

###### Two numbers:
```yaml
_ne:
  - _sum:
      - 3
      - 4
  - 8
```
Returns: `true`

###### Arrays are not compared deeply:
```yaml
_ne:
  - [1,2,3]
  - [1,2,3]
```
Returns: `true`

###### Values from "getter" operators are copies and not equal:
```yaml
_ne:
  - _state: my_object
  - _state: my_object
```
Returns: `true`


---

## File: `operators/_mql.yaml`

# _mql

## Description

The `_mql` operator uses the [`mingo`](https://www.npmjs.com/package/mingo) package to evaluate MongoDB query language statements as an operator.

## Methods

### aggregate

The `_mql.aggregate` method runs a MongoDB aggregation pipeline on an input array.

```
```
({on: object[], pipeline: object[]}): object[]
([on: object[], pipeline: object[]]): object[]
```
```

**Arguments:**
###### object
  - `on: object[]`: The data array on which to run the pipeline. It should be an array of objects.
  - `pipeline: object[]`: A MongoDB aggregation pipeline definition.

**Examples:**
###### Transform request results:
```yaml
_mql.aggregate:
  pipeline:
    - $match:
        age:
          $gte: 18
    - $addFields:
        averageScore:
          $avg:
            - $score1
            - $score2
  on:
    _request: my_request
```

### expr

The `_mql.expr` method evaluates a MongoDB aggregation pipeline operator expression. This is any statement that could be written in a `$project` stage.

```
```
({on: object, expr: any}): any
([on: object, expr: any]): any
```
```

**Arguments:**
###### object
  - `on: object`: An object to take as input for the expression.
  - `expr: object`: A MongoDB aggregation expression.

**Examples:**
###### Calculate an average of three inputs:
```yaml
_mql.expr:
  expr:
    $avg:
      - $input1
      - $input2
      - $input3
  on:
    _state: true
```

### test

The `_mql.test` method tests if a object matches a MongoDB filter/query expression.

```
```
({on: object, test: object}): boolean
([on: object, test: object]): boolean
```
```

**Arguments:**
###### object
  - `on: object`: The object to be tested.
  - `test: object`: A MongoDB filter/query expression.

**Examples:**
###### Test if a number input is greater than 100:
```yaml
_mql.test:
  test:
    number_input:
      $gte: 18
  on:
    number_input:
      _state: number_input
```


---

## File: `operators/_moment.yaml`

# _moment

## Description

The `_moment` operator converts date objects to strings, using a specified format.

## Methods

### format

The `_moment.format` formats dates using the [moment.js](https://momentjs.com/docs/#/displaying/format/) library.

```
```
(arguments: {
  on: date | string,
  locale?: string,
  format?: string
})
```
```

**Arguments:**
###### object
  - `on: date | string`: The date to format.
  - `locale: string`: A string with a locale name.
  - `format: string`: A date [format string](https://momentjs.com/docs/#/displaying/format/).

**Examples:**
###### Format a date:
```yaml
_moment.format:
  on:
    _date: 2019-06-04
  format: 'd MMM YYYY'
```
Returns: `"4 Jun 2019"`.

### humanizeDuration

The `_moment.humanizeDuration` formats durations in milliseconds using the [moment.js](https://momentjs.com/docs/#/durations/humanize/)

```
```
(arguments: {
  on: number,
  locale?: string,
  thresholds?: string,
  withSuffix?: boolean
})
```
```

**Arguments:**
###### object
  - `on: number`: The duration in milliseconds to format.
  - `locale: string`: A string with a locale name.
  - `thresholds: object`: Thresholds define when a unit is considered a minute, an hour and so on. For example, by default more than 45 seconds is considered a minute, more than 22 hours is considered a day and so on. See [here](https://momentjs.com/docs/#/customization/relative-time-threshold/)
  - `withSuffix: boolean`: By default, the return string is describing a duration `a month` (suffix-less). If you want an oriented duration `in a month`, `a month ago` (with suffix), pass in true.

**Examples:**
###### Format a date:
```yaml
_moment.humanizeDuration:
  on: 245923000
  withSuffix: true
```
Returns: `"in 3 days"`.


---

## File: `operators/_menu.yaml`

# _menu

## Description

The `_menu` operator can be used to access `menu` objects defined in the [`menus`](/lowdefy-schema) section of the Lowdefy configuration.

## Types

```
(menuId: string): object
(menuIndex: number): object
(all: boolean): object[]
(arguments: {
  value?: string,
  index?: number
  all?: boolean,
}): object | object[]
```

## Arguments

###### string
The `menuId` of the `menu` to return.

###### number
The index of the `menu` to return.

###### boolean
If the `_menu` operator is called with boolean argument `true`, the entire `menus` object is returned.

###### object
  - `value: string`: The `menuId` of the `menu` to return.
  - `index: number`: The index of the `menu` to return.
  - `all: boolean`: If the `_menu` operator is called with boolean argument `true`, the entire `menus` object is returned.

## Examples

###### Get the `menus` object:
```yaml
_menu: true
```
```yaml
_menu:
  all: true
```
Returns: An array of `menu` objects.

###### Get a `menu` by `id`:
```yaml
_menu: default
```
```yaml
_menu:
  value: default
```
Returns: A `menu` object.

###### Get a `menu` by `index`:
```yaml
_menu: 0
```
```yaml
_menu:
  value: 0
```
Returns: A `menu` object.


---

## File: `operators/_media.yaml`

# _media

## Description

The `_media` operator gets a value from the [`media`](/page-and-app-state) object. It can only be used on the web-client (Not in `requests` or `connections`). `media` is a data object that contains information about the current screen size of a users browser window. It contains the following data:


- `width: number`: The width of the window in pixels.
- `height: number`: The height of the window in pixels.
- `size: enum`: One of `xs`, `sm`, `md`, `lg`, `xl`, `xxl`. The sizes are determined by comparing the window width to the following breakpoints (in pixels):
  - `xs`: `width < 576px`
  - `sm`: `576px <= width < 768px`
  - `md`: `768px <= width < 992px`
  - `lg`: `992px <= width < 1200px`
  - `xl`: `1200px <= width < 1600px`
  - `xxl`: `1600px <= width`

## Types

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

## Arguments

###### string
If the `_media` operator is called with a string argument, the value of the key in the `media` object is returned. If the value is not found, `null` is returned.

###### boolean
If the `_media` operator is called with boolean argument `true`, the entire `media` object is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `media` object is returned. One of `all` or `key` are required.
  - `key: string`: The value of the key in the `media` object is returned. If the value is not found, `null`, or the specified default value is returned. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `media`. By default, `null` is returned if a value is not found.

## Examples

###### Get the value of `size` from `media`:
```yaml
_media: size
```
```yaml
_media:
  key: size
```
Returns: The value of `size`.

###### Get the entire `media` object:
```yaml
_media: true
```
```yaml
_media:
  all: true
```
Returns: The entire `media` object.

###### Return a default value if the value is not found:
```yaml
_media:
  key: does_not_exist
  default: Not there
```
Returns: `"Not there"`.


---

## File: `operators/_math.yaml`

# _math

## Description

The `_math` operator can be used to run javascript [`Math`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math) methods.

The `_math` operator can take arguments in the following forms:

###### No Arguments
```text
(void): number
```

Some methods like `_math.PI` take no arguments:
```yaml
_math.PI: null
```
Returns: `pi`

###### Single argument
```text
(x: number): number
```

Some methods like `_math.round` take a single argument:
```yaml
_math.round: 3.14
```
Returns: `3`

###### Named arguments
```text
({x: number, y: number}): number
([x: number, y: number]): number
```

Some methods like `_math.pow` take an object with named arguments:
```yaml
_math.pow:
  base: 2
  exponent: 3
```
Returns: `8`

These methods also accept their arguments as an array:
```yaml
_math.pow:
  - 2
  - 3
```
Returns: `8`

###### Array arguments
```text
(values: number[]): number
```

Some methods like `_math.max` take an array of values as arguments:
```
_math.max:
  - 42
  - 99
  - 0
```
Returns: `99`

## Methods

### abs

The `_math.abs` method returns the [absolute value](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/abs) of a number.

```
```
(x: number): number
```
```

### acos

The `_math.acos` method returns the [arccosine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/acos) (in radians) of a number.

```
```
(x: number): number
```
```

### acosh

The `_math.acosh` method returns the [hyperbolic arc-cosine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/acosh) of a number.

```
```
(x: number): number
```
```

### asin

The `_math.asin` method returns the [arcsine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/asin) (in radians) of a number.

```
```
(x: number): number
```
```

### atan

The `_math.atan` method returns the [arctangent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan) (in radians) of a number.

```
```
(x: number): number
```
```

### atan2

The `_math.atan2` method returns the [angle in the plane (in radians) between the positive x-axis and the ray from (0,0) to the point (x,y)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atan2).

```
```
({x: number, y: number}): number
([x: number, y: number]): number
```
```

### atanh

The `_math.atanh` method returns the [hyperbolic arctangent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/atanh) of a number.

```
```
(x: number): number
```
```

### cbrt

The `_math.cbrt` method returns the returns the [cube root](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cbrt) of a number.

```
```
(x: number): number
```
```

### ceil

The `_math.ceil` method [rounds a number up](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/ceil) to the next largest integer.

```
```
(x: number): number
```
```

### clz32

The `_math.clz32` method returns the [number of leading zero bits in the 32-bit binary representation of a number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/clz32).

```
```
(x: number): number
```
```

### cos

The `_math.cos` method returns the [cosine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cos) of the specified angle, which must be specified in radians

```
```
(x: number): number
```
```

### cosh

The `_math.cosh` method returns the [hyperbolic cosine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/cosh) of a number.

```
```
(x: number): number
```
```

### exp

The `_math.exp` method returns [`e` (Euler's number) to the power `x`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/exp).

```
```
(x: number): number
```
```

### expm1

The `_math.expm1` method returns [`e` (Euler's number) to the power `x` minus `1`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/expm1).

```
```
(x: number): number
```
```

### floor

The `_math.floor` method returns the [largest integer less than or equal to a given number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/floor).

```
```
(x: number): number
```
```

### fround

The `_math.fround` method returns the [nearest 32-bit single precision float representation of a number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/fround).

```
```
(x: number): number
```
```

### hypot

The `_math.hypot` method returns the [square root of the sum of squares of its arguments](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/hypot).

```
```
(values: number[]): number
```
```

### imul

The `_math.imul` method returns the [result of the C-like 32-bit multiplication of the two parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/imul).

```
```
({a: number, b: number}): number
([a: number, b: number]): number
```
```

### log

The `_math.log` method returns the [natural logarithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log) (base `e`) of a number.

```
```
(x: number): number
```
```

### log10

The `_math.log10` method returns the [base `10` logarithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log10) of a number.

```
```
(x: number): number
```
```

### log1p

The `_math.log1p` method returns the [natural logarithm (base e) of `1 + a number`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log1p).

```
```
(x: number): number
```
```

### log2

The `_math.log2` method returns the [base `2` logarithm](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/log2) of a number.

```
```
(x: number): number
```
```

### max

The `_math.max` method returns the [largest of the numbers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max) given as input parameters.

```
```
(values: number[]): number
```
```

### min

The `_math.min` method returns the [smallest of the numbers](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/max) given as input parameters.

```
```
(values: number[]): number
```
```

### pow

The `_math.pow` method returns the [`base` to the `exponent` power](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/pow).

```
```
({base: number, exponent: number}): number
([base: number, exponent: number]): number
```
```

### random

The `_math.random` method returns a floating-point, [pseudo-random number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random) in the range `0` to less than `1`.

```
```
(void): number
```
```

### round

The `_math.round` method returns the value of a number [rounded to the nearest integer](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/round).

```
```
(x: number): number
```
```

### sign

The `_math.sign` method returns either a [positive or negative 1 (`+/- 1`)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sign), indicating the sign of a number passed into the argument.

```
```
(x: number): number
```
```

### sin

The `_math.sin` method returns the [sine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sin) of a number.

```
```
(x: number): number
```
```

### sinh

The `_math.sinh` method returns the [hyperbolic sine](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sinh) of a number.

```
```
(x: number): number
```
```

### sqrt

The `_math.sqrt` method returns the [square root](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/sqrt) of a number.

```
```
(x: number): number
```
```

### tan

The `_math.tan` method returns the [tangent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/tan) of a number.

```
```
(x: number): number
```
```

### trunc

The `_math.trunc` method returns the [integer part](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/trunc) of a number by removing any fractional digits.

```
```
(x: number): number
```
```

### E

The `_math.E` method returns [Euler's number](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/E), the base of natural logarithms, `e`, which is approximately 2.718.

```
```
(void): number
```
```

### LN10

The `_math.LN10` method returns the [natural logarithm of `10`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/LN10), which is approximately 2.302.

```
```
(void): number
```
```

### LN2

The `_math.LN2` method returns the [natural logarithm of `2`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/LN2), which is approximately 0.693.

```
```
(void): number
```
```

### LOG10E

The `_math.LOG10E` method returns the [base `10` logarithm of `e`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/LOG10E), which is approximately 0.434.

```
```
(void): number
```
```

### LOG2E

The `_math.LOG2E` method returns the [base `2` logarithm of `e`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/LOG2E), which is approximately 1.442.

```
```
(void): number
```
```

### PI

The `_math.PI` method returns the constant [`pi`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/PI), the ratio of the circumference of a circle to its diameter, which is approximately 3.14159.

```
```
(void): number
```
```

### SQRT1_2

The `_math.SQRT1_2` method returns the [square root of `1/2`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/SQRT1_2), which is approximately 0.707.

```
```
(void): number
```
```

### SQRT2

The `_math.SQRT2` method returns the [square root of `2`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/SQRT2), which is approximately 1.414.

```
```
(void): number
```
```


---

## File: `operators/_lte.yaml`

# _lte

## Description

The `_lte` operator tests if the first value is less than or equal to the second equal. It takes an array of two values to test.

> The `_lte` operator tests using the javascript less than or equal to operator. You can find a description of the algorithm used to compare two values [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than).

## Types

```
([value1: any, value2: any]): boolean
```

## Arguments

###### array
An array of two values to compare.

## Examples

###### Two numbers:
```yaml
_lte:
  - 4
  - 3
```
Returns: `false`

```yaml
_lte:
  - 1
  - 1
```
Returns: `true`

```yaml
_lte:
  - _sum:
      - 3
      - 4
  - 8
```
Returns: `true`

###### Two strings:
```yaml
_lte:
  - "a"
  - "b"
```
Returns: `true`


---

## File: `operators/_lt.yaml`

# _lt

## Description

The `_lt` operator tests if the first value is less than the second equal. It takes an array of two values to test.

> The `_lt` operator tests using the javascript less than operator. You can find a description of the algorithm used to compare two values [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than).

## Types

```
([value1: any, value2: any]): boolean
```

## Arguments

###### array
An array of two values to compare.

## Examples

###### Two numbers:
```yaml
_lt:
  - 4
  - 3
```
Returns: `false`

```yaml
_lt:
  - 1
  - 1
```
Returns: `false`

```yaml
_lt:
  - _sum:
      - 3
      - 4
  - 8
```
Returns: `true`

#### Two strings:
```yaml
_lt:
  - "a"
  - "b"
```
Returns: `true`


---

## File: `operators/_log.yaml`

# _log

## Description

The `_log` operator logs it input to the console, and returns the value it received. Since it returns the value it received, it can be used to debug without affecting the rest of the configuration.

## Types

```
(value: any): any
```

## Arguments

###### any

## Examples

###### Log the results of a request to the console:
```yaml
_log:
  _request: my_request
```
Returns: The value of the request


---

## File: `operators/_location.yaml`

# _location

## Description

The `_location` operator gets a value from the browser [Location](https://developer.mozilla.org/en-US/docs/Web/API/Location) interface. The Location interface represents the location (URL) of the window object it is linked to, thus can return the URL elements of the current window. It can only be used on the web-client (Not in `requests` or `connections`).

The following location properties are available.
- `basePath: string`: The application base path setting.
- `hash: string`: A string containing a '#' followed by the fragment identifier of the URL.
- `host: string`: A string containing the host, that is the hostname, a `:`, and the port of the URL.
- `hostname: string`: The domain of the URL.
- `homePageId: string`: The home page id.
- `href: string`: The entire URL string.
- `origin: string`: The canonical form of the origin of the specific location.
- `pageId: string`: The current page id.
- `pathname: string`: A string containing an initial `/`` followed by the path of the URL, not including the query string or fragment.
- `port: string`: The port number of the URL
- `protocol: string`: The protocol scheme of the URL, mostly `http:` or `https:`.
- `search: string`: A string containing a '?' followed by the parameters or "querystring" of the URL.

## Types

```
(key: string): any
```

## Arguments

###### string
If called with a string argument, the value of the key in the `location` object is returned. If the value is defined, `null` is returned.

## Examples

###### Get the `origin` from `location`:
```yaml
_location: origin
```
Returns: The current `window.location.origin`, in this case 'https://docs.lowdefy.com'.

###### Get the `pathname` from `location`:
```yaml
_location: pathname
```
Returns: The current `window.location.pathname`, in this case '/_location'.


---

## File: `operators/_json.yaml`

# _json

## Description

The `_json` parses and writes JSON strings.

## Methods

### parse

The `_json.parse` method parses a JSON string into an object.

```
```
(value: string): any
```
```

**Arguments:**
###### string
The string to parse.

**Examples:**
###### Parse a JSON string:
```yaml
_json.parse: '{"key": "Value", "boolean": true, "array": [1, 2]}'
```
Returns:
```
key: Value
boolean: true
array:
  - 1
  - 2
```

### stringify

The `_json.stringify` method creates a JSON string from an object.

```
```
({on: any, options?: object}): string
([on: any, options?: object]): string
```
```

**Arguments:**
###### object
  - `on: any`: The object to stringify.
  - `options: object`: Optional settings.
    - `stable: boolean`: If set to true, equal objects will be stringified to the same string. Object keys are sorted.
    - `space: number | string`: Used to insert whitespace to increase legibility. If a number, it is the number of space character to use. If a string, the string is used as whitespace. The default is `2`.

**Examples:**
###### Stringify an object as JSON:
```yaml
_json.stringify:
  on:
    key: Value
    boolean: true
    array:
      - 1
      - 2
```
```yaml
_json.stringify:
  - key: Value
    boolean: true
    array:
      - 1
      - 2
```
Returns (as a string):
```text
'{
  "key": "Value",
  "boolean": true,
  "array": [
    1,
    2
  ]
}'
```
###### Stable option:
```yaml
_json.stringify:
  on:
    key: Value
    boolean: true
    array:
      - 1
      - 2
  options:
    stable: true
```
Returns (as a string):
```text
'{
  "array": [
    1,
    2
  ],
  "boolean": true,
  "key": "Value"
}''
```
###### Space option:
```yaml
_json.stringify:
  on:
    key: Value
    boolean: true
    array:
      - 1
      - 2
  options:
    space: 0
```
Returns `'{"key":"Value","boolean":true,"array":[1,2]}'`


---

## File: `operators/_js.yaml`

# _js

## Description

The `_js` operator enables the use of custom JavaScript logic within Lowdefy configuration where operators are evaluated. The purpose of this operator is to facilitate quick implementation of fast, synchronous functions. Like other operators, these functions are evaluated during page render, thus slow functions can impact app performance.
For more advanced logic, or when the use of external dependencies is necessary, instead develop a [custom plugin](/plugins-introduction).

#### Using Lowdefy operators in JavaScript
Certain Lowdefy operators can be used inside of the JavaScript function block. These operators are available as functions and will take their standard arguments.

###### Client JavaScript function prototype:
_Function parameters passed to the operator method._
```js
function ({ actions, event, input, location, lowdefyGlobal, request, state, urlQuery, user }) {
  // Your JavaScript code here
};
```

The function arguments available to the JavaScript function are:
  - `actions: function`: Implements the [_actions](/_actions) operator.
  - `event: function`: Implements the [_event](/_event) operator.
  - `input: function`: Implements the [_input](/_input) operator.
  - `location: function`: Implements the [_location](/_location) operator.
  - `lowdefyGlobal: function`: Implements the [_global](/_global) operator.
  - `request: function`: Implements the [_request](/_request) operator.
  - `state: function`: Implements the [_state](/_state) operator.
  - `urlQuery: function`: Implements the [_url_query](/_url_query) operator.
  - `user: function`: Implements the [_user](/_user) operator.

###### Server JavaScript function prototype:
_Function parameters passed to the operator method._
```js
function ({ payload, secrets, user }) {
  // Your JavaScript code here
};
```

The function arguments available to the JavaScript function are
  - `payload: function`: Implements the [_payload](/_payload) operator.
  - `secrets: function`: Implements the [_secret](/_secret) operator.
  - `user: function`: Implements the [_user](/_user) operator.

## Types

```
(function: string): any
```

## Arguments

###### string
The JavaScript function body, including the function return statement, excluding the function prototype.

## Examples

###### Perform a calculation:
```js
_js: |
  let x = state('input_1');
  let y = state('input_2');
  return x + y;
```

###### Create custom logic based on data from a request:
```js
_js: |
  const products = request('get_products').data?.products ?? [];
  const laptopsWithRatingGreaterThan4 = products.filter(product =>
      product.category === "laptops" && product.rating > 4
  );
  if (laptopsWithRatingGreaterThan4.length > 3) {
      return true;
  }
  return false;
```

###### Chain array methods on request data:
```js 
_js: |
  const products = request('get_products').data?.products ?? [];
  const totalPriceOfPhones = products
      .filter(product => product.category === "smartphones")
      .reduce((acc, product) => acc + product.price, 0);
  return totalPriceOfPhones;
```


---

## File: `operators/_intl.yaml`

# _intl

## Description

The `_intl` operator converts date objects to strings, using a specified format.

## Methods

### dateTimeFormat

The `_intl.dateTimeFormat` provides language-sensitive date and time formatting, based on [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat). If no locale is provide, the users default locale will be used.

```
```
(arguments: {
  on: date,
  locale?: string,
  options?: object
})
```
```

**Arguments:**
###### object
  - `on: date`: The date object to format.
  - `locale: string`: A string with a BCP 47 language tag, or an array of such strings.
  - `options: object`: [`Intl.DateTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/DateTimeFormat/DateTimeFormat) options.

**Examples:**
###### Format a date:
```yaml
_intl.dateTimeFormat:
  on:
    _date: 2019-06-13
  locale: en
  options:
    weekday: long
    year: numeric
    month: long
    day: numeric
```
Returns: `"Thursday, June 13, 2019"`.

### listFormat

The `_intl.listFormat` provides language-sensitive list formatting, based on [`Intl.ListFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat). If no locale is provide, the users default locale will be used.

```
```
(arguments: {
  on: any[],
  locale?: string,
  options?: object
})
```
```

**Arguments:**
###### object
  - `on: any[]`: The array to format.
  - `locale: string`: A string with a BCP 47 language tag, or an array of such strings.
  - `options: object`: [`Intl.ListFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/ListFormat/ListFormat) options.

**Examples:**
###### Format a list:
```yaml
_intl.listFormat:
  on:
    - Motorcycle
    - Bus
    - Car
  locale: fr
```
Returns: `"Motorcycle, Bus et Car"`.

### numberFormat

The `_intl.numberFormat` provides language-sensitive number formatting, based on [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat). If no locale is provide, the users default locale will be used.

```
```
(arguments: {
  on: number,
  locale?: string,
  options?: object
})
```
```

**Arguments:**
###### object
  - `on: number`: The number to format.
  - `locale: string`: A string with a BCP 47 language tag, or an array of such strings.
  - `options: object`: [`Intl.NumberFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat) options.

**Examples:**
###### Format a number:
```yaml
_intl.numberFormat:
  on: 13182375813.47422
  locale: de
```
Returns: `"13.182.375.813,474"`.

### relativeTimeFormat

The `_intl.relativeTimeFormat` provides language-sensitive relative time  formatting, based on [`Intl.RelativeTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat). If no locale is provide, the users default locale will be used.

```
```
(arguments: {
  on: any,
  locale?: string,
  unit: enum,
  options?: object
})
```
```

**Arguments:**
###### object
  - `on: number`: The number to format.
  - `locale: string`: A string with a BCP 47 language tag, or an array of such strings.
  - `unit: enum`: Unit to use in the relative time internationalized message. Possible values are: `year`, `quarter`, `month`, `week`, `day`, `hour`, `minute`, `second`. Plural forms are also permitted.
  - `options: object`: [`Intl.RelativeTimeFormat`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/RelativeTimeFormat/RelativeTimeFormat) options.

**Examples:**
###### Format a number:
```yaml
_intl.relativeTimeFormat:
  on: 4
  unit: 'days'
  locale: fr
```
Returns: `"dans 4 jours"`.


---

## File: `operators/_input.yaml`

# _input

## Description

The `_input` operator gets a value from the [`input`](/page-and-app-state) object. The `input` is a data object that can be set when linking to a new page using the [`Link`](/link) action, and can be used to set data like a `id` when switching to a new page. Unlike `urlQuery`, the `input` is not visible, and cannot be changed by the user, but if the page is reloaded, the `input` is lost.

## Types

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

## Arguments

###### string
If the `_input` operator is called with a string argument, the value of the key in the `input` object is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean
If the `_input` operator is called with boolean argument `true`, the entire `input` object is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `input` object is returned. One of `all` or `key` are required.
  - `key: string`: The value of the key in the `input` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `input`. By default, `null` is returned if a value is not found.

## Examples

###### Get the value of `my_key` from `input`:
```yaml
_input: my_key
```
```yaml
_input:
  key: my_key
```
Returns: The value of `my_key` in `input`.

###### Get the entire `input` object:
```yaml
_input: true
```
```yaml
_input:
  all: true
```
Returns: The entire `input` object.

###### Dot notation:
Assuming input:
```yaml
my_object:
  subfield: 'Value'
```
then:
```yaml
_input: my_object.subfield
```
```yaml
_input:
  key: my_object.subfield
```
Returns: `"Value"`.

###### Return a default value if the value is not found:
```yaml
_input:
  key: might_not_exist
  default: Default value
```
Returns: The value of `might_not_exist`, or `"Default value"`.

###### Block list indices:
Assuming `input`:
```yaml
my_array:
  - value: 0
  - value: 1
  - value: 2
```
then:
```yaml
_input: my_array.$.value
```
Returns: `0` when used from the first block (0th index) in a list.


---

## File: `operators/_index.yaml`

# _index

## Description

The `_index` operator gets a value from the `list indices` array of a block. The `list indices` array is an array of the indices of all [`list`](/lists) block areas which the block is a part of.

## Types

```
(key: string): any
(key: integer): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string | integer,
  default?: any
}): any
```

## Arguments

###### integer
If the `_index` operator is called with a integer argument, the value at that index in the `indices` array is returned. If the value is not found, `null` is returned..

###### string
If the `_args` operator is called with a string argument, the value at that index in the `indices` array is returned. If the value is not found, `null` is returned.

###### boolean
If the `_index` operator is called with boolean argument `true`, the entire `indices` array is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `indices` array is returned. One of `all` or `key` are required.
  - `key: string | integer`: The value of the index in the `indices` array is returned. If the value is not found, `null`, or the specified default value is returned. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `arguments`. By default, `null` is returned if a value is not found.

## Examples

###### Get a index:

Assuming the block is in the fourth content area of a `list` block.
```yaml
_index: 0
```
Returns: `3`

###### Get all indices:

Assuming two nested list blocks, with the block in the fourth content area of the first `list` block, and the first content area of the nested `list` block.
```yaml
_index: true
```
Returns: `[3, 0]`


---

## File: `operators/_if_none.yaml`

# _if_none

## Description

The `_if_none` operator replaces the input value with an alternative if the value is of a "none-type" like `null` or `undefined`.

## Types

```
([value: any, replacement: any]): any
```

## Arguments

###### array
- First value: The value to test.
- Second value: The replacement.

## Examples

###### The value is not replaced if it is not of a none-type:
```yaml
_if_none:
  - Value
  - Replacement
```
Returns: `Value`

###### The value is replaced if it is of a none-type:
```yaml
_if_none:
  - null
  - "Replacement"
```
Returns: `"Replacement"`

```yaml
_if_none:
  - _state: does_not_exist # Value in state that does not exist
  - "Replacement"
```
Returns: `"Replacement"`

 ```yaml
_if_none:
  - _request: still_loading # _request returns null if the request is loading
  - []
```
Returns: `[]`


---

## File: `operators/_if.yaml`

# _if

## Description

The `_if` operator returns the `then` argument if it's `test` argument is `true`, and it's `else` argument if it is `false`. Generally other operators are used to evaluate the `test` argument.

## Types

```
(arguments: {test: boolean, then: any, else: any}): any
```

## Arguments

###### object
  - `test: boolean`: The boolean result of a test.
  - `then: any`: The value to return if the test is `true`.
  - `else: any`: The value to return if the test is `false`.

## Examples

###### Return a value based on a user input:
```yaml
_if:
  test:
    _eq:
      - _state: text_input
      - The password
  then: The user entered the password
  else: Access denied
```
Returns: `"The user entered the password"` if the text input's value is `"The password"`, else `"Access denied"`


---

## File: `operators/_hash.yaml`

# _hash

## Description

The `_hash` operator generates hashes using various algorithms.

## Methods

### md5

The `_hash.md5` method generates the [MD5](https://en.wikipedia.org/wiki/MD5) hash of the input value.

```
```
(value: string): string
```
```

**Arguments:**
###### string
The string to hash.

**Examples:**
###### Hash a string:
```yaml
_hash.md5: Hello World!
```
Returns: `"ed076287532e86365e841e92bfc50d8c"`.

### sha1

The `_hash.sha1` method generates the [SHA1](https://en.wikipedia.org/wiki/SHA1) hash of the input value.

```
```
(value: string): string
```
```

**Arguments:**
###### string
The string to hash.

**Examples:**
###### Hash a string:
```yaml
_hash.sha1: Hello World!
```
Returns: `"2ef7bde608ce5404e97d5f042f95f89f1c232871"`.

### sha256

The `_hash.sha256` method generates the [SHA256](https://en.wikipedia.org/wiki/SHA256) hash of the input value.

```
```
(value: string): string
```
```

**Arguments:**
###### string
The string to hash.

**Examples:**
###### Hash a string:
```yaml
_hash.sha256: Hello World!
```
Returns: `"7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"`.

### sha512

The `_hash.sha512` method generates the [SHA512](https://en.wikipedia.org/wiki/SHA512) hash of the input value.

```
```
(value: string): string
```
```

**Arguments:**
###### string
The string to hash.

**Examples:**
###### Hash a string:
```yaml
_hash.sha512: Hello World!
```
Returns: `"861844d6704e8573fec34d967e20bcfef3d424cf48be04e6dc08f2bd58c729743371015ead891cc3cf1c9d34b49264b510751b1ff9e537937bc46b5d6ff4ecc8"`.

### ripemd160

The `_hash.ripemd160` method generates the [RIPEMD-160](https://en.wikipedia.org/wiki/RIPEMD160) hash of the input value.

```
```
(value: string): string
```
```

**Arguments:**
###### string
The string to hash.

**Examples:**
###### Hash a string:
```yaml
_hash.ripemd160: Hello World!
```
Returns: `"8476ee4631b9b30ac2754b0ee0c47e161d3f724c"`.


---

## File: `operators/_gte.yaml`

# _gte

## Description

The `_gte` operator tests if the first value is greater than or equal to the second equal. It takes an array of two values to test.

> The `_gte` operator tests using the javascript greater than or equal operator. You can find a description of the algorithm used to compare two values [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than).

## Types

```
([value1: any, value2: any]): boolean
```

## Arguments

###### array
An array of two values to compare.

## Examples

###### Two numbers:
```yaml
_gte:
  - 4
  - 3
```
Returns: `true`

```yaml
_gte:
  - 1
  - 1
```
Returns: `true`

```yaml
_gte:
  - _sum:
      - 3
      - 4
  - 8
```
Returns: `false`

###### Two strings:
```yaml
_gte:
  - "a"
  - "b"
```
Returns: `false`


---

## File: `operators/_gt.yaml`

# _gt

## Description

The `_gt` operator tests if the first value is greater than the second equal. It takes an array of two values to test.

> The `_gt` operator tests using the javascript greater than operator. You can find a description of the algorithm used to compare two values [here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Less_than).

## Types

```
([value1: any, value2: any]): boolean
```

## Arguments

###### array
An array of two values to compare.

## Examples

###### Two numbers:
```yaml
_gt:
  - 4
  - 3
```
Returns: `true`

```yaml
_gt:
  - 1
  - 1
```
Returns: `false`

```yaml
_gt:
  - _sum:
      - 3
      - 4
  - 8
```
Returns: `false`

###### Two strings:
```yaml
_gt:
  - "a"
  - "b"
```
Returns: `false`


---

## File: `operators/_global.yaml`

# _global

## Description

The `_global` operator gets a value from the [`global`](/page-and-app-state) object. The `global` object is a shared data object that can be accessed from any page in the app.

## Types

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

## Arguments

###### string
If the `_global` operator is called with a string argument, the value of the key in the `global` object is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean
If the `_global` operator is called with boolean argument `true`, the entire `global` object is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `global` object is returned. One of `all` or `key` are required.
  - `key: string`: The value of the key in the `global` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `global`. By default, `null` is returned if a value is not found.

## Examples

###### Get the value of `my_key` from `global`:
```yaml
_global: my_key
```
```yaml
_global:
  key: my_key
```
Returns: The value of `my_key` in `global`.

###### Get the entire `global` object:
```yaml
_global: true
```
```yaml
_global:
  all: true
```
Returns: The entire `global` object.

###### Dot notation:
Assuming global:
```yaml
my_object:
  subfield: 'Value'
```
then:
```yaml
_global: my_object.subfield
```
```yaml
_global:
  key: my_object.subfield
```
Returns: `"Value"`.

###### Return a default value if the value is not found:
```yaml
_global:
  key: might_not_exist
  default: Default value
```
Returns: The value of `might_not_exist`, or `"Default value"`.

###### Block list indices:
Assuming `global`:
```yaml
my_array:
  - value: 0
  - value: 1
  - value: 2
```
then:
```yaml
_global: my_array.$.value
```
Returns: `0` when used from the first block (0th index) in a list.


---

## File: `operators/_get.yaml`

# _get

## Description

The `_get` operator gets a value from the object or array specified in `from`. If the `key` is not found, the provided `default`, or `null` if not specified, are returned.

## Types

```
(arguments: {
  from: any[] | object,
  key: string | integer,
  default?: any,
}): any
```

## Arguments

###### object
  - `from: any[] | object`: __Required__ - The object to get the value from.
  - `key: string`: __Required__ - The value of the key or array index to get from the `from` object or array. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported.
  - `default: any`: A value to return if the `key` is not found in `from`. By default, `null` is returned if a value is not found.

## Examples

###### Get the value of a key from an object:
```yaml
_get:
  from:
    name: George
    age: 22
  key: name
```
Returns: `"George"`.

###### Use _get to as a switch statement to choose an Icon name:
```yaml
_get:
  key:
    _state: status
  from:
    new: AiTwoTonePlusCircle
    escalated: AiOutlineExclamationCircle
    investigation_started: AiTwoToneTool
    client_contacted: AiTwoToneSound
    awaiting_confirmation: AiOutlineLike
    closed: AiOutlineStop
```
Returns: The icon corresponding to the status in state.

###### Get from an array (arrays are `0` indexed):
```yaml
_get:
  from:
    - id: 1
      name: Joe
    - id: 2
      Name: Dave
  key: 0.name
```
Returns: `1`.

###### Dot notation:
```yaml
_get:
  from:
    my_object:
      subfield: 'Value'
  key: my_object.subfield
```
Returns: `"Value"`.

###### Return a default value if the value is not found:
```yaml
_get:
  from:
    value1: 1
  key: value2
  default: 99
```
Returns: `99`.

###### Block list indices:
Assuming `state`:
```yaml
 _get:
  from:
    my_array:
      - value: 0
      - value: 1
      - value: 2
  key: my_array.$.value
```
Returns: `0` when used from the first block (0th index) in a list.


---

## File: `operators/_function.yaml`

# _function

## Description

The `_function` operator returns a function that evaluates the given operator definition when called. The resulting function can then be used by other operators like `_array.map`, or by blocks (for example as a formatter function).

To use a operator in a function definition, the operator name should start with a double underscore, `__`, instead of a single underscore. Operators that start with a single underscore will be evaluated when the function is created, and those that start with a double underscore are evaluated when the function is executed.

The arguments passed to the function when it is executed can be accessed with the [`_args`](/_args) operator.

## Types

```
(definition: any): function
```

## Arguments

###### any

The function definition. To use operators here, the operator names should start with a double underscore.

## Examples

###### Map over an array:

```yaml
_array.map:
  on:
    - firstName: Ted
      lastName: Mosby
    - firstName: Robin
      lastName: Scherbatsky
    - firstName: Marshall
      lastName: Eriksen
    - firstName: Lily
      lastName: Aldrin
    - firstName: Barney
      lastName: Stinson
  callback:
    _function:
      __string.concat:
        - __args: 0.firstName
        - ' '
        - __args: 0.lastName
```
Returns:
```yaml
- Ted Mosby
- Robin Scherbatsky
- Marshall Eriksen
- Lily Aldrin
- Barney Stinson
```


---

## File: `operators/_event.yaml`

# _event

## Description

The `_event` operator gets a value from the `event` object. The `event` object is a data object provided to an [`action`](/events-and-actions) by an [`event`](/events-and-actions). This object is also available to a [`request or connection`](/connections-and-requests) called by the [`Request`](/Request) action.

## Types

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any
}): any
```

## Arguments

###### string
If the `_event` operator is called with a string argument, the value of the key in the `event` object is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean
If the `_event` operator is called with boolean argument `true`, the entire `event` object is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `event` object is returned. One of `all` or `key` are required.
  - `key: string`: The value of the key in the `event` object is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `event`. By default, `null` is returned if a value is not found.

## Examples

###### Get the value of `my_key` from `event`:
```yaml
_event: my_key
```
```yaml
_event:
  key: my_key
```
Returns: The value of `my_key` in `event`.

###### Get the entire `event` object:
```yaml
_event: true
```
```yaml
_event:
  all: true
```
Returns: The entire `event` object.

###### Dot notation:
Assuming args:
```yaml
my_object:
  subfield: 'Value'
```
then:
```yaml
_event: my_object.subfield
```
```yaml
_event:
  key: my_object.subfield
```
Returns: `"Value"`.

###### Return a default value if the value is not found:
```yaml
_event:
  key: might_not_exist
  default: Default value
```
Returns: The value of `might_not_exist`, or `"Default value"`.

###### Block list indices:
Assuming `event`:
```yaml
my_array:
  - value: 0
  - value: 1
  - value: 2
```
then:
```yaml
_event: my_array.$.value
```
Returns: `0` when used from the first block (0th index) in a list.


---

## File: `operators/_eq.yaml`

# _eq

## Description

The `_eq` operator tests if two values are equal. It takes an array of two values to test.

> The `_eq` operator tests for strict equality, and won't do a deep comparison.

## Types

```
([value1: any, value2: any]): boolean
```

## Arguments

###### array
An array of two values to compare.

## Examples

###### Two strings:
```yaml
_eq:
  - "Hello"
  - "Hello"
```
Returns: `true`

###### Two numbers:
```yaml
_eq:
  - _sum:
      - 3
      - 4
  - 8
```
Returns: `false`

###### Arrays are not compared deeply:
```yaml
_eq:
  - [1,2,3]
  - [1,2,3]
```
Returns: `false`

###### Values from "getter" operators are copies and not equal:
```yaml
_eq:
  - _state: my_object
  - _state: my_object
```
Returns: `false`


---

## File: `operators/_divide.yaml`

# _divide

## Description

The `_divide` operator divides two numbers. It takes an array of two numbers as input and returns the first number divided by the second. Dividing by zero will throw an error.

## Types

```
([numerator: number, denominator: number]): number
```

## Arguments

###### array
An array of two numbers.

## Examples

###### Divide two numbers:
```yaml
_divide:
  - 12
  - 4
```
Returns: `3`

###### Cannot divide by zero:
```yaml
_divide:
  - 1
  - 0
```
Returns: `null` and throws a operator error.


---

## File: `operators/_diff.yaml`

# _diff

## Methods

### deep

The `_diff.deep` method compares two objects and returns an object that describes the structural differences between the two objects.

```
```
(arguments: {lhs: any, rhs: any}): object[]
([lhs: any, rhs: any]): object[]
```
```

**Arguments:**
###### string
The string to decode.

**Examples:**
###### Compare two objects using named args:
```yaml
_diff.deep:
  lhs:
    deleted: To be deleted
    edited: Edit me
    array: [1]
  rhs:
    new: New value
    edited: Edited
    array: [1, 2]
```

  ```yaml
_diff.deep:
  - deleted: To be deleted
    edited: Edit me
    array: [1]
  - new: New value
    edited: Edited
    array: [1, 2]
```
Both return:
```yaml
- kind: D
  path: [deleted]
  lhs: To be deleted
- kind: E
  path: [edited]
  lhs: Edit me
  rhs: Edited
- kind: A
  path: ['array']
  index: 1
  item:
    kind: N
    rhs: 2
- kind: N
  path: [new]
  rhs: New value
```


---

## File: `operators/_date.yaml`

# _date

## Description

The `_date` operator returns a date object representing a single moment in time. It can take a string in [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) format, or a number that is the number of milliseconds since 1 January 1970 UTC (the [UNIX epoch](https://en.wikipedia.org/wiki/Unix_time)).

## Types

```
(dateString: string): date
(unixTimestamp: number): date
```

## Arguments

###### string
An string in ISO 8601 format representing a date and time.

###### number
The number of milliseconds since 1 January 1970 UTC.

## Examples

###### Timestamp:
```yaml
_date: 1611837509802
```
Returns: Thu Jan 28 2021 12:38:29 GMT+0000

###### ISO 8601 string, only date:
```yaml
_date: 2021-01-28
```
Returns: Thu Jan 28 2021 00:00:00 GMT+0000

###### ISO 8601 string, date and time:
```yaml
_date: 2021-01-28T12:36:03.957Z
```
Returns: Thu Jan 28 2021 12:38:29 GMT+0000

## Methods

### getDate

The `_date.getDate` method returns the [day of the month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDate) of a date.

```
```
(value: date): number
```
```

### getDay

The `_date.getDay` method returns the [day of the week](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getDay) of a date.

```
```
(value: date): number
```
```

### getFullYear

The `_date.getFullYear` method returns the [year](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getFullYear) of a date.

```
```
(value: date): number
```
```

### getHours

The `_date.getHours` method returns the [hour](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getHours) of a date.

```
```
(value: date): number
```
```

### getMilliseconds

The `_date.getMilliseconds` method returns the [milliseconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getMilliseconds) of a date.

```
```
(value: date): number
```
```

### getMinutes

The `_date.getMinutes` method returns the [minutes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getMinutes) of a date.

```
```
(value: date): number
```
```

### getMonth

The `_date.getMonth` method returns the [month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getMonth) of a date.

```
```
(value: date): number
```
```

### getSeconds

The `_date.getSeconds` method returns the [seconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getSeconds) of a date.

```
```
(value: date): number
```
```

### getTime

The `_date.getTime` method returns the number of [milliseconds since the epoch](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTime), which is defined as the midnight at the beginning of January 1, 1970, UTC.

```
```
(value: date): number
```
```

### getTimezoneOffset

The `_date.getTimezoneOffset` method returns the [difference, in minutes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getTimezoneOffset), between a date as evaluated in the UTC time zone, and the same date as evaluated in the local time zone.

```
```
(value: date): number
```
```

### getUTCDate

The `_date.getUTCDate` method returns the [day of the month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCDate) of a date according to universal time.

```
```
(value: date): number
```
```

### getUTCDay

The `_date.getUTCDay` method returns the [day of the week](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCDay) of a date according to universal time.

```
```
(value: date): number
```
```

### getUTCFullYear

The `_date.getUTCFullYear` method returns the [year](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCFullYear) of a date according to universal time.

```
```
(value: date): number
```
```

### getUTCHours

The `_date.getUTCHours` method returns the [hour](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCHours) of a date according to universal time.

```
```
(value: date): number
```
```

### getUTCMilliseconds

The `_date.getUTCMilliseconds` method returns the [milliseconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCMilliseconds) of a date according to universal time.

```
```
(value: date): number
```
```

### getUTCMinutes

The `_date.getUTCMinutes` method returns the [minutes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCMinutes) of a date according to universal time.

```
```
(value: date): number
```
```

### getUTCMonth

The `_date.getUTCMonth` method returns the [month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCMonth) of a date according to universal time.

```
```
(value: date): number
```
```

### getUTCSeconds

The `_date.getUTCSeconds` method returns the [seconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getUTCSeconds) of a date according to universal time.

```
```
(value: date): number
```
```

### now

The `_date.now` method returns a date object representing the moment in time it was called. The method can also be used as `_date: now`

```
```
(void): date
```
```

**Arguments:**
The `_date.now` method does not take any arguments.

**Examples:**
###### Get the current date and time:
```yaml
_date.now: null
```
```yaml
_date: now
```
Returns: The current date and time.

### parse

The `_date.parse` method parses a string representation of a date, and returns the number of [milliseconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/parse) since January 1, 1970, 00:00:00 UTC.

```
```
(value: date): string
```
```

### setDate

The `_date.setDate` method changes the [day of the month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setDate) of a date.

```
```
(arguments: {on: date, dayOfMonth: number}): number
(arguments: [on: date, dayOfMonth: number]): number
```
```

### setFullYear

The `_date.setFullYear` method sets the [full year](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setFullYear) of a date.

```
```
(arguments: {on: date, year: number}): number
(arguments: [on: date, year: number]): number
```
```

### setHours

The `_date.setHours` method sets the [hours](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setHours) of a date.

```
```
(arguments: {on: date, hours: number}): number
(arguments: [on: date, hours: number]): number
```
```

### setMilliseconds

The `_date.setMilliseconds` method sets the [milliseconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMilliseconds) of a date.

```
```
(arguments: {on: date, milliseconds: number}): number
(arguments: [on: date, milliseconds: number]): number
```
```

### setMinutes

The `_date.setMinutes` method sets the [minutes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMinutes) of a date.

```
```
(arguments: {on: date, minutes: number}): number
(arguments: [on: date, minutes: number]): number
```
```

### setMonth

The `_date.setMonth` method sets the [month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setMonth) of a date.

```
```
(arguments: {on: date, month: number}): number
(arguments: [on: date, month: number]): number
```
```

### setSeconds

The `_date.setSeconds` method sets the [seconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setSeconds) of a date.

```
```
(arguments: {on: date, seconds: number}): number
(arguments: [on: date, seconds: number]): number
```
```

### setTime

The `_date.setTime` method sets the [time](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setTime) represented by a number of milliseconds since January 1, 1970, 00:00:00 UTC.

```
```
(arguments: {on: date, time: number}): number
(arguments: [on: date, time: number]): number
```
```

### setUTCDate

The `_date.setUTCDate` method changes the [day of the month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCDate) of a date, based on UTC time.

```
```
(arguments: {on: date, dayOfMonth: number}): number
(arguments: [on: date, dayOfMonth: number]): number
```
```

### setFullYear

The `_date.setUTCFullYear` method sets the [full year](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCFullYear) of a date, based on UTC time.

```
```
(arguments: {on: date, year: number}): number
(arguments: [on: date, year: number]): number
```
```

### setUTCHours

The `_date.setUTCHours` method sets the [hours](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCHours) of a date, based on UTC time.

```
```
(arguments: {on: date, hours: number}): number
(arguments: [on: date, hours: number]): number
```
```

### setUTCMilliseconds

The `_date.setUTCMilliseconds` method sets the [milliseconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCMilliseconds) of a date, based on UTC time.

```
```
(arguments: {on: date, milliseconds: number}): number
(arguments: [on: date, milliseconds: number]): number
```
```

### setUTCMinutes

The `_date.setUTCMinutes` method sets the [minutes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCMinutes) of a date, based on UTC time.

```
```
(arguments: {on: date, minutes: number}): number
(arguments: [on: date, minutes: number]): number
```
```

### setUTCMonth

The `_date.setUTCMonth` method sets the [month](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCMonth) of a date, based on UTC time.

```
```
(arguments: {on: date, month: number}): number
(arguments: [on: date, month: number]): number
```
```

### setUTCSeconds

The `_date.setUTCSeconds` method sets the [seconds](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/setUTCSeconds) of a date, based on UTC time.

```
```
(arguments: {on: date, seconds: number}): number
(arguments: [on: date, seconds: number]): number
```
```

### toDateString

The `_date.toDateString` method returns the [date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toDateString) as a string.

```
```
(value: date): string
```
```

### toISOString

The `_date.toISOString` method returns the [date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toISOString) as a string in ISO format.

```
```
(value: date): string
```
```

### toJSON

The `_date.toJSON` method returns the [date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toJSON) as a string in ISO format.

```
```
(value: date): string
```
```

### toString

The `_date.toString` method returns the [date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toString) as a string.

```
```
(value: date): string
```
```

### toTimeString

The `_date.toTimeString` method returns the [time](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toTimeString) of a date as a string.

```
```
(value: date): string
```
```

### toUTCString

The `_date.toUTCString` method returns the [date](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/toUTCString) as a string in UTC time.

```
```
(value: date): string
```
```

### UTC

The `_date.UTC` method accepts [year, month, day, hours, minutes, seconds parameters](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/UTC) of a date but treats them as UTC.

```
```
(arguments: {year: number, month: number, day: number, hours: number, minutes: number, seconds: number}): number
(arguments: [year: number, month: number, day: number, hours: number, minutes: number, seconds: number]): number
```
```

### valueOf

The `_date.valueOf` method returns the [primitive value](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/valueOf) of a date.

```
```
(value: date): number
```
```


---

## File: `operators/_change_case.yaml`

# _change_case

## Description

The `_change_case` operator uses the [`change-case`](https://www.npmjs.com/package/change-case) package to transform an input between camelCase, PascalCase, Capital Case, snake_case, param-case, CONSTANT_CASE and others.

## Arguments

The `_change_case` operator takes `on` and `options` as arguments.
The `on` argument is the input to be transformed and can be a `string`,  `array` or `object`.
The `options` argument is an object with the following properties:
  - `convertKeys`: Only used when `on` is an object. Toggles whether the object keys are converted to the new case (`true`) or left as-is (`false`). Default `false`.
  - `convertValues`: Only used when `on` is an object. Toggles whether the object values are converted to the new case (`true`) or left as-is (`false`). Default `true`.
  - `delimiter`: Value used between words (e.g. " ").
  - `locale`: Lower/upper according to specified locale, defaults to host environment. Set to false to disable.
  - `mergeAmbiguousCharacters`: By default, pascalCase and snakeCase separate ambiguous characters with _. To merge them instead, set mergeAmbiguousCharacters to true.
  - `prefixCharacters``: A string that specifies characters to retain at the beginning of the string. Defaults to "".
  - `split`: A function to define how the input is split into words.
  - `suffixCharacters``: A string that specifies characters to retain at the end of the string. Defaults to "".

The `on` argument behaves as follows:
###### string
Transforms the case of the string.

###### array
Transform the case of each string in the array.

###### object
Transforms the case of the values (when `options.convertValues: true`) and keys (when `options.convertKeys: true`) of the object.

> Note that the `key` and `value` pairs must be strings.

## Examples

###### String with no options:
```yaml
_change_case.capitalCase:
  on: 'foo bar'
```
Returns: `"Foo Bar"`

###### Array with no options:
```yaml
_change_case.capitalCase:
  on:
    - 'foo'
    - 'bar'
```
Returns: `["Foo", "Bar"]`

###### Object with no options:
```yaml
_change_case.capitalCase:
  on:
    foo: 'bar'
```
Returns: `{ "foo": "Bar" }`

###### Object with options.convertKeys: true:
```yaml
_change_case.capitalCase:
  on:
    foo: 'bar'
  options:
    convertKeys: true
```
Returns: `{ "Foo": "Bar" }`

###### Object with options.convertValues: false:
```yaml
_change_case.capitalCase:
  on:
    foo: 'bar'
  options:
    convertValues: false
```
Returns: `{ "foo": "bar" }`

###### Object with options.SPLT:
```yaml
_change_case.capitalCase:
  on: this123is_an example string
  options:
    split:
      _function:
        __string.split:
          - __string.replace:
              - __args: 0
              - '123'
              - '_'
          - '_'
```
Returns: `This Is An example string`

## Methods

### camelCase

The `_change_case.camelCase` method transforms `on` into a string with the separator denoted by the next word capitalized.

```
```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```
```

**Examples:**
###### Transform snake_case variable to camelCase:
```yaml
_change_case.camelCase:
  on: 'my_variable'
```
Returns: `"myVariable"`

### capitalCase

The `_change_case.capitalCase` method transforms `on` into a space separated string with each word capitalized.

```
```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```
```

**Examples:**
###### Transform snake_case variable to capitalCase:
```yaml
_change_case.capitalCase:
  on: 'my_variable'
```
Returns:  `"My Variable"`

### constantCase

The `_change_case.constantCase` method transforms `on` into upper case string with an underscore between words.

```
```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```
```

**Examples:**
###### Transform camelCase variable to constantCase:
```yaml
_change_case.constantCase:
  on: 'myVariable'
```
Returns: `"MY_VARIABLE"`

### dotCase

The `_change_case.dotCase` method transforms `on` into a lower case string with a period between words.

```
```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```
```

**Examples:**
###### Transform camelCase variable to dotCase:
```yaml
_change_case.dotCase:
  on: 'myVariable'
```
Returns: `"my.variable"`

### kebabCase

The `_change_case.kebabCase` method transforms `on` into a lower cased string with dashes between words.

```
```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```
```

**Examples:**
###### Transform snake_case variable to kebabCase:
```yaml
_change_case.kebabCase:
  on: 'my_variable'
```
Returns: `"my-variable"`

### noCase

The `_change_case.noCase` method transforms `on` into a lower cased string with spaces between words.

```
```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```
```

**Examples:**
###### Transform camelCase variable to noCase:
```yaml
_change_case.noCase:
  on: 'myVariable'
```
Returns: `"my variable"`

### pascalCase

The `_change_case.pascalCase` method transforms `on` into a string of capitalized words without separators.

```
```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```
```

**Examples:**
###### Transform snake_case variable to pascalCase:
```yaml
_change_case.pascalCase:
  on: 'my_variable'
```
Returns: `"MyVariable"`

### pascalSnakeCase

The `_change_case.pascalSnakeCase` method transforms `on` into a string of capitalized words with underscores between words.

```
```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```
```

**Examples:**
###### Transform snake_case variable to pascalSnakeCase:
```yaml
_change_case.pascalCase:
  on: 'my_variable'
```
Returns: `"My_Variable"`

### pathCase

The `_change_case.pathCase` method transforms `on` into a lower case string with slashes between words.

```
```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```
```

**Examples:**
###### Transform snake_case variable to pathCase:
```yaml
_change_case.pathCase:
  on: 'my_variable'
```
Returns: `my/variable`

### sentenceCase

The `_change_case.sentenceCase` method transforms `on` into a lower case with spaces between words, then capitalize the first word.

```
```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```
```

**Examples:**
###### Transform snake_case variable to sentenceCase:
```yaml
_change_case.sentenceCase:
  on: 'my_variable'
```
Returns: `"My variable"`

### snakeCase

The `_change_case.snakeCase` method transforms `on` into a lower case string with underscores between words.

```
```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```
```

**Examples:**
###### Transform sentence case variable to snakeCase:
```yaml
_change_case.snakeCase:
  on: 'My variable'
```
Returns: `"my_variable"`

### trainCase

The `_change_case.trainCase` method transforms `on` into a dash separated string of capitalized words.

```
```
({on: string, options: object}): string
([on: string, options: object]): string
({on: object, options: object}): object
([on: object, options: object]): object
({on: array, options: object}): array
([on: array, options: object]): array
```
```

**Examples:**
###### Transform snake_case variable to trainCase:
```yaml
_change_case.trainCase:
  on: 'my_variable'
```
Returns: `"My-Variable"`


---

## File: `operators/_build.yaml`

# _build

## Description

The `_build` operator evaluates at build time. This allows looping over a list in a JSON file generated by another application to calculate a value at build time, or to read environment variables.

## Methods

### env

The `_build.env` method reads from your environment variables. The return value of `_build.env` will form part of the build output, so the [`_secret`](/_secret) operator should rather be used for reading any secrets.

```
```
(key: string): any
(all: boolean): any
```
```

**Examples:**
###### Read environment from environment variables:
With the following development and production environment variables, we can use the `_build.env` method to determine which environment we are in.

`Development environment .env`
```
MY_ENVIRONMENT="development"
```
`Production environment`
```
MY_ENVIRONMENT="production"
```

```yaml
_build.env: MY_ENVIRONMENT
```

This will return "development" in the development environment and "production" in the production environment.

### [operator]

The `_build` operator can be used to evaluate normal operators at build time. Note that when using an operator as a method, the `_` gets left out of the original operator. For example, when using `_and` as a method, we write `_build.and`. When using an operator which has methods itself, we can just chain the methods: `_array.map` as a method becomes `_build.array.map`.

The following operators can be used during the build:
- [_and](/_and)
- [_args](/_args)
- [_array](/_array)
- [_base64](/_base64)
- [_date](/_date)
- [_divide](/_divide)
- [_eq](/_eq)
- [_function](/_function)
- [_get](/_get)
- [_gt](/_gt)
- [_gte](/_gte)
- [_hash](/_hash)
- [_if](/_if)
- [_if_none](/_if_none)
- [_intl](/_intl)
- [_json](/_json)
- [_log](/_log)
- [_lt](/_lt)
- [_lte](/_lte)
- [_math](/_math)
- [_ne](/_ne)
- [_not](/_not)
- [_number](/_number)
- [_object](/_object)
- [_operator](/_operator)
- [_or](/_or)
- [_product](/_product)
- [_random](/_random)
- [_regex](/_regex)
- [_string](/_string)
- [_subtract](/_subtract)
- [_sum](/_sum)
- [_switch](/_switch)
- [_type](/_type)
- [_uri](/_uri)

**Examples:**
###### Check environment variables to determine which url to link to:
Use the `Link` action to link to a production url if the build is a production build in Vercel (the `VERCEL_ENV` variable will be set to "production"), otherwise link to a preview url.

```yaml
id: link_to_website
type: Link
params:
  url:
    _build.if:
      test:
        _build.eq:
          - _build.env: NEXT_PUBLIC_VERCEL_ENV
          - production
      then: "https://www.productionsite.com"
      else: "https://productionsite-git-develop-org.vercel.app"
```

###### Loop over a static list at build time:
Let's say we have a static list of fruit and their sales in a file called `fruit_sales.json` which is generated by another application. We can map over this list at build time to return a list of the fruit and their total sales.

`fruit_sales.json`
```json
[
  {
    "name": "Apples",
    "sales": [
      15,
      20,
      10,
      25
    ]
  },
  {
    "name": "Bananas",
    "sales": [
      20,
      5,
      25,
      17
    ]
  },
  {
    "name": "Oranges",
    "sales": [
      21,
      12,
      31,
      40
    ]
  }
]
```
```yaml
_build.array.map:
  on:
    _ref: fruit_sales.json
  callback:
    _build.function:
      name:
        __build.args: 0.name
      total_sales:
        __build.sum:
          __build.args: 0.sales
```
Returns:
```
- name: Apples
  total_sales: 70
- name: Bananas
  total_sales: 67
- name: Oranges
  total_sales: 104
```


---

## File: `operators/_base64.yaml`

# _base64

## Description

The `_base64` operator converts strings to and from [base64](https://en.wikipedia.org/wiki/Base64) format.

## Methods

### decode

The `_base64.decode` method decodes base64 encoded content into an ASCII string.

```
```
(value: string): string
```
```

**Arguments:**
###### string
The string to decode.

**Examples:**
###### Decode a base64 string:
```yaml
_base64.decode: SGVsbG8=
```
Returns: `"Hello"`.

### encode

The `_base64.encode` method base64 encodes a ASCII string.

```
```
(value: string): string
```
```

**Arguments:**
###### string
The string to encode.

**Examples:**
###### Encode a string as base64:
```yaml
_base64.encode: Hello
```
Returns: `"SGVsbG8="`.


---

## File: `operators/_array.yaml`

# _array

## Description

The `_array` operator can be used to run javascript [`Array`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array) methods.

## Methods

### concat

The `_array.concat` method [concatenates](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/concat) arrays.

```
```
(arrays: any[][]): any[]
```
```

### copyWithin

The `_array.copyWithin` method [copies part of an array to another location in the same array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/copyWithin) without modifying its length.

```
```
(arguments: {
  on: any[],
  target: number,
  start?: number,
  end?: number
}): any[]
(arguments: [
  on: any[],
  target: number,
  start?: number,
  end?: number
]): any[]
```
```

### every

The `_array.every` method  tests whether [all elements in the array pass](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/every) the test implemented by the provided function. It returns a Boolean value.

```
```
(arguments: {
  on: any[],
  callback: function,
}): boolean
(arguments: [
  on: any[],
  callback: function,
]): boolean
```
```

### fill

The `_array.fill` method [changes all elements in an array to a static value](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/fill), from a `start` index to an `end` index.

```
```
(arguments: {
  on: any[],
  value: any,
  start?: number,
  end?: number
}): any[]
(arguments: [
  on: any[],
  value: number,
  start?: number,
  end?: number
]): any[]
```
```

### filter

The `_array.filter` method returns [an array with all elements that pass the test](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/filter) implemented by the provided function.

```
```
(arguments: {
  on: any[],
  callback: function,
}): any[]
(arguments: [
  on: any[],
  callback: function,
]): any[]
```
```

### find

The `_array.find` method returns the value of the [first element in the provided array that satisfies the provided testing function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/find). If no values satisfies the testing function, undefined is returned.

```
```
(arguments: {
  on: any[],
  callback: function,
}): any
(arguments: [
  on: any[],
  callback: function,
]): any
```
```

### findIndex

The `_array.findIndex` method returns [the index of the first element in the array that satisfies the provided testing function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex). Otherwise, it returns -1, indicating that no element passed the test.

```
```
(arguments: {
  on: any[],
  callback: function,
}): number
(arguments: [
  on: any[],
  callback: function,
]): number
```
```

### flat

The `_array.flat` method returns a array with all [sub-array elements concatenated into it recursively](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/flat) up to the specified `depth`.

```
```
(arguments: {on: any[], depth?: number}): any[]
(arguments: [on: any[], depth?: number]): any[]
```
```

### includes

The `_array.includes` method determines whether an array [includes a certain value among its entries](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes), returning `true` or `false` as appropriate.

```
```
(arguments: {on: any[], value: any}): boolean
(arguments: [on: any[], value: any]): boolean
```
```

### indexOf

The `_array.indexOf` method returns the [first index at which a given element can be found](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf) in the array, or `-1` if it is not present.

```
```
(arguments: {on: any[], value: any}): number
(arguments: [on: any[], value: any]): number
```
```

### join

The `_array.join` method returns [a string by concatenating all of the elements in an array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/join), separated by commas or a specified `separator` string. If the array has only one item, then that item will be returned without using the separator.

```
```
(arguments: {on: any[], separator?: string}): string
(arguments: [on: any[], separator?: string]): string
```
```

### lastIndexOf

The `_array.lastIndexOf` method returns the [last index at which a given element can be found](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/lastIndexOf) in the array, or -1 if it is not present.

```
```
(arguments: {on: any[], value: any}): number
(arguments: [on: any[], value: any]): number
```
```

### length

The `_array.length` method returns the [number of elements](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/length) in the array.

```
```
(array: any[]}): number
```
```

### map

The `_array.map` method returns an array populated with the results of [calling a provided function on every element](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/map) in the provided array.

```
```
(arguments: {
  on: any[],
  callback: function,
}): any[]
(arguments: [
  on: any[],
  callback: function,
]): any[]
```
```

### reduce

The `_array.reduce` method [executes a reducer function on each element of the array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/Reduce), resulting in single output value.

```
```
(arguments: {
  on: any[],
  callback: function,
  initialValue?: any
}): any
(arguments: [
  on: any[],
  callback: function,
  initialValue?: any
]): any
```
```

**Examples:**
The simplest example would probably be adding all the elements in an array:
```yaml
sum:
  _array.reduce:
    on: [1, 2, 3, 4]
    callback:
      _function:
        __sum:
          - __args: 0
          - __args: 1
```
This will return `sum: 10`

You can start off by counting from 10 by specifying an `initialValue` for the reducer:
```yaml
sum:
  _array.reduce:
    on: [1, 2, 3, 4]
    callback:
      _function:
        __sum:
          - __args: 0
          - __args: 1
    initialValue: 10
```
This will return `sum: 20`

You can use the index of the array element to add some logic to your `callback`. For instance, when you reach index 2 of your array (the 3rd entry), add 100 instead of the current element value:
```yaml
sum:
  _array.reduce:
    on: [1, 2, 3, 4]
    callback:
      _function:
        __sum:
          - __args: 0
          - __if:
              test:
                __eq:
                  - __args: 2
                  - 2
              then: 100
              else:
                __args: 1
```
This will return `sum: 107`

### reduceRight

The `_array.reduceRight` method [applies a function against an accumulator and each value of the array (from right-to-left)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/ReduceRight) to reduce it to a single value.

```
```
(arguments: {
  on: any[],
  callback: function,
  initialValue?: any
}): any
(arguments: [
  on: any[],
  callback: function,
  initialValue?: any
]): any
```
```

### reverse

The `_array.reverse` method [reverses](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/reverse) an array.

```
```
(array: any[]}): any[]
```
```

### slice

The `_array.slice` method returns [a portion of an array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/slice) selected from `start` to `end` (end not included) where `start` and `end` represent the index of items in that array.

```
```
(arguments: {
  on: any[],
  start?: number,
  end?: number
}): number
(arguments: [
  on: any[],
  start?: number,
  end?: number
]): number
```
```

### some

The `_array.some` method tests whether [at least one element in the array passes the test](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/some) implemented by the provided function. It returns a Boolean value.

```
```
(arguments: {
  on: any[],
  callback: function,
}): boolean
(arguments: [
  on: any[],
  callback: function,
]): boolean
```
```

### sort

The `_array.sort` method [sorts](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort) the elements of an array. The sort order is ascending, built upon converting the elements into strings, then comparing their sequences of UTF-16 code units values.

```
```
(arguments: {on: any[]}): number
```
```

### splice

The `_array.slice` method [changes the contents of an array](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/splice) by removing or replacing existing elements and/or adding new elements.

```
```
(arguments: {
  on: any[],
  start: number,
  deleteCount?: number
  insert: any[]
}): number
(arguments: {
  on: any[],
  start: number,
  deleteCount?: number,
  insert: any[]
}): number
```
```


---

## File: `operators/_args.yaml`

# _args

## Description

The `_args` operator gets a value from the `arguments` array passed to a function operator. The `arguments` array is an array of all the positional arguments passed to the function.

## Types

```
(key: string): any
(key: integer): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string | integer,
  default?: any
}): any
```

## Arguments

###### string
If the `_args` operator is called with a string argument, the value of the key in the `arguments` array is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### integer
If the `_args` operator is called with a integer argument, the value at that index in the `arguments` array is returned. If the value is not found, `null` is returned. Dot notation and [block list indexes](/lists) are supported.

###### boolean
If the `_args` operator is called with boolean argument `true`, the entire `arguments` array is returned.

###### object
  - `all: boolean`: If `all` is set to `true`, the entire `arguments` array is returned. One of `all` or `key` are required.
  - `key: string | integer`: The value of the key or index in the `arguments` array is returned. If the value is not found, `null`, or the specified default value is returned. Dot notation and [block list indexes](/lists) are supported. One of `all` or `key` are required.
  - `default: any`: A value to return if the `key` is not found in `arguments`. By default, `null` is returned if a value is not found.

## Examples

###### Map over an array:

```yaml
_array.map:
  on:
    - firstName: Ted
      lastName: Mosby
    - firstName: Robin
      lastName: Scherbatsky
    - firstName: Marshall
      lastName: Eriksen
    - firstName: Lily
      lastName: Aldrin
    - firstName: Barney
      lastName: Stinson
  callback:
    _function:
      __string.concat:
        - __args: 0.firstName
        - ' '
        - __args: 0.lastName
```
Returns:
```yaml
- Ted Mosby
- Robin Scherbatsky
- Marshall Eriksen
- Lily Aldrin
- Barney Stinson
```


---

## File: `operators/_and.yaml`

# _and

## Description

The `_and` operator performs a logical `and` over an array of inputs, using javascript [truthy](https://developer.mozilla.org/en-US/docs/Glossary/Truthy) and [falsy](https://developer.mozilla.org/en-US/docs/Glossary/Falsy) rules.

It only returns true if all the values in the array are truthy (not `false`, `0`, `null`, `undefined`, or the empty string `""`). Else it returns false.

## Types

```
(values: any[]): boolean
```

## Arguments

###### array
An array of values over which to perform a logical and.

## Examples

###### Two `true` values:
```yaml
_and:
  - true
  - true
```
Returns: `true`

###### Array of `true` and `false` values:
```yaml
_and:
  - true
  - true
  - true
  - false
```
Returns: `false`

###### Check if two boolean inputs are true:
```yaml
_and:
  - _state: confirm_accept_terms
  - _state: confirm_accept_privacy_policy
```
Returns: `true` if both inputs are `true`

###### Truthy values:
```yaml
_and:
  - "Hello"
  - 42
  - []
  - key: value
```
Returns: `true`

###### Falsy values:
```yaml
_and:
  - true
  - null
```
Returns: `false`

```yaml
_and:
  - true
  - 0
```
Returns: `false`

```yaml
_and:
  - true
  - ""
```
Returns: `false`


---

## File: `operators/_actions.yaml`

# _actions

## Description

The `_actions` operator returns the response value for a preceding action in the same event list.

The action response object has the following structure:
```yaml
error: Error,
index: number,
response: any,
skipped: boolean,
type: string,
```

## Types

```
(key: string): any
(all: boolean): any
(arguments: {
  all?: boolean,
  key?: string,
  default?: any,
}): any
```

## Arguments

###### string
If the `_actions` operator is called with a string equal to a preceding action id in the same event list, the action response object returned. If a string is passed which does not match preceding action id in the same event list, `null` is returned. Dot notation is supported.

###### boolean
If the `_actions` operator is called with boolean argument `true`, an object with all the preceding action id responses in the same event list is returned.

## Examples

##### Using a action response:
```yaml
_actions: my_action.response
```
Returns: The response returned by the action.

##### Setting a action response to `state`:
```yaml
id: refresh
type: Button
events:
  onClick:
    - id: get_fresh_data
      type: Request
      skip:
        _state: should_not_fetch
      params: get_data
    - id: set_data
      type: SetState
      params:
        did_not_fetch_data:
          _actions: get_fresh_data.skipped
```


---

## File: `migration/v3-to-v4.yaml`

# Version 3 to Version 4

**Section:** Migration


---
**Nunjucks Template:**
```yaml
## Payload on Requests

In version 3, the `state`, `global`, `input`, `urlQuery` and `event` data objects were sent with the request. This allowed the use of the [`_state`](/_state), [`_global`](/_global), [`_input`](/_input), [`_url_query`](/_url_query) and [`_event`](/_event) operators inside requests and connections. If the state became too large, this would result in a payload size exceeded error on request calls.

In version 4, these operators can no longer be used in requests, and request payloads are introduced. Payloads can be used to specify the data that should be sent with the request. The data specified in the payload can be accessed using the `_payload` operator. Operators are evaluated in the payload before it is sent, so operators such as [`_state`](/_state) and [`_global`](_global) can be used in the payload.

If only the [`_state`](/_state) operator was used, the entire state object can be set as the payload:

###### Version 3:

```yaml
id: api_call
type: AxiosHttp
connectionId: my_api
properties:
  url: /products/new
  method: post
  data:
    name:
      _state: name
    product_category:
      _state: name
```

###### Version 4:

```yaml
id: api_call
type: AxiosHttp
connectionId: my_api
payload:
  _state: true
properties:
  url: /products/new
  method: post
  data:
    name:
      _payload: name
    product_category:
      _payload: product_category
```

The payload can also be created more explicitly using more than one operator type:

###### Version 3:

```yaml
id: api_call
type: AxiosHttp
connectionId: my_api
properties:
  url: /products/update
  method: post
  data:
    id:
      _url_query: id
    name:
      _state: name
```

###### Version 4:

```yaml
id: api_call
type: AxiosHttp
connectionId: my_api
payload:
  id:
    _url_query: id
  name:
    _state: name
properties:
  url: /products/new
  method: post
  data:
    id:
      _payload: id
    name:
      _payload: name
```

The `user` data object is still available in requests, and the [`_user`](/_user) operator should be used in the request properties not in they payload as malicious users can modify the data sent in payload.

###### Don't do:

```yaml
id: api_call
type: AxiosHttp
connectionId: my_api
payload:
  # ...
  created_by:
    _user: id
properties:
  url: /products/new
  method: post
  data:
    # ...
    created_by:
      _payload: created_by
```

###### Do:

```yaml
id: api_call
type: AxiosHttp
connectionId: my_api
payload:
  # ...
properties:
  url: /products/new
  method: post
  data:
    # ...
    created_by:
      _user: id
```

> If you see a warning message like `Operator type "_state" was used but is not defined.`, you are using the `_state` operator in a request's properties and should move it to payload.

## Icons

The Ant Design icons used in version 3 have been replaced by [React Icons](https://react-icons.github.io/react-icons/), which has a much larger library of icons to choose from, including the Ant Design icons. To use a React Icon, set the `icon` or `icon.name` property to the React Icon name.

To convert existing Ant Design icons to React Icons, the icon names should be changed to the new format:

###### Version 3:

```yaml
id: save_button
type: Button
properties:
  icon: SaveOutlined
```

###### Version 4:

```yaml
# Using the same Ant Design icon
id: save_button
type: Button
properties:
  icon: AiOutlineSave
```

```yaml
# Using the Font Awesome icon
id: save_button
type: Button
properties:
  icon: FaRegSave
```

## Renames and Minor changes

The `Message` action has been renamed to [`DisplayMessage`](/DisplayMessage). Change the type name of `Message` actions to [`DisplayMessage`](/DisplayMessage).

The `onEnter` and `onEnterAsync` events have been removed as their functionality is duplicated by the `onMount` and `onMountAsync` events. Rename all `onEnter` and `onEnterAsync` events to `onMount` and `onMountAsync` respectively.

Duplicate action ids in the same action chain were allowed in version 3, but are not allowed in version 4. If you get a build error about duplicate action ids, give the actions unique ids.

The `Notification` action has been removed. Switch to the [`DisplayMessage`](/DisplayMessage) action, or use a [`Notification`](/Notification) block and the `CallMethod` action to open the notification.

The 404 page is now always a public page.

The [`Anchor`](/Anchor) block properties schema has changed. The `href` property has been removed and it now takes the same props as the [`Link`](/Link) action.

The [`_yaml.parse`](/_yaml) operator now takes an object with a `on` property or an array where the first argument is the string to parse, instead of just a string, to allow it to take additional options.

The `ChromeColorSelector`, `CircleColorSelector`, `CompactColorSelector`, `GithubColorSelector`, `SliderColorSelector`, `SwatchesColorSelector`, and `TwitterColorSelector` have been replaced by the [`ColorSelector`](/ColorSelector) block.

The `color` properties in blocks like [`MobileMenu`](/MobileMenu), [`PageHeaderMenu`](/PageHeaderMenu), [`PageSiderMenu`](/PageSiderMenu) have been removed. Use Ant Design theme less variables instead.

The [`_var`](/_var) operator `name` param has been renamed to `key` to be more consistent with other getter operators.

The `_format` operator has been replaced with the [`_intl`](/_intl) and [`_moment`](/_moment) operator, with some minor schema changes.

The format of dates in the output of the  [`_json.stringify`](/_json) and [`_yaml.stringify`](/_yaml) operators, as well as in URL query parameters has changed from `_date: {iso_date_string}` to `~d: {iso_date_string}`.

## Block Loading States

The page loading states in version 4 have been improved. In general apps should load a lot faster. Blocks will now be a lot less likely to show a loading state and rather render as normal, and render their children. Input blocks will be disabled while in a loading state. This contributes to users seeing useful content sooner, and to less layout shifts once the app finishes loading.

In version 3, blocks had a `loading` property to specify the loading skeleton that should be used while the block is in a loading state. This functionality has been replaced by the `skeleton` property. The `loading` property is now used to control the loading state of the block. The block will be in a loading state if an `onInit` or `onMount` event is busy, if a parent block is loading or if the `loading` property evaluates to true. See more about loading [here](/blocks).

The convert from version 3 to version 4, replace the `loading` property on blocks with the `skeleton` property.

###### Version 3:

```yaml
id: paragraph_one
type: Markdown
loading:
  type: SkeletonParagraph
  properties:
    lines: 5
properties:
  content:
    _request: get_text.body_text
```

###### Version 4:

```yaml
id: paragraph_one
type: Markdown
skeleton:
  type: SkeletonParagraph
  properties:
    lines: 5
properties:
  content:
    _request: get_text.body_text
```

```yaml
# Keep the block in loading while the request is loading
id: paragraph_one
type: Markdown
loading:
  _eq:
    - _request: get_text
    - null
skeleton:
  type: SkeletonParagraph
  properties:
    lines: 5
properties:
  content:
    _request: get_text.body_text
```

## Static files

Static files placed in the `public` folder of your project were always served from the public url path - for example `https://example.com/public/filename.jpeg`. These files are now served from the root path of your app. The example above will now be served from `https://example.com/filename.jpeg`. This allows you to serve files like `robots.txt` and `sitemap.xml` from the root path. Change all references in your config to the new paths.

If you still want to serve assets under the `/public` path, you can add an addition `public` folder inside the existing `public` folder:

```txt
.
├─ public
│  └─ public
│     └─ my-logo.jpeg
└─ lowdefy.yaml
```

## Authentication Changes

In version 4, authentication has been reworked to use [NextAuth.js](https://next-auth.js.org), which offers a lot more flexibility and additional features - read more [here](/users-introduction).

To migrate a version 3 OpenID Connect provider, at least the following needs to be done:
- The `config.auth` property has moved to the `auth` root level property.
- The `config.auth.openId` properties have been removed, replace them with configuration for your provider:
```yaml
auth:
  providers:
    - id: auth0
      type: Auth0Provider
      properties:
        clientId:
          _secret: AUTH0_CLIENT_ID
        clientSecret:
          _secret: AUTH0_CLIENT_SECRET
        issuer:
          _secret: AUTH0_ISSUER
```

- The `NEXTAUTH_SECRET` environment variable needs to be set to a secure secret value (replacing `LOWDEFY_SECRET_JWT_SECRET`).
- The callback URLs configured with the provider change from `{{ protocol }}{{ host }}/auth/openid-callback` to `{{ protocol }}{{ host }}/api/auth/callback/{{ providerId }}`.
- The `Login` and `Logout` action params have changed between V3 and V4.

## Custom Blocks, Actions and Operators

Custom blocks, the `JsAction` action and the `_js` operator have been replaced by the new Lowdefy plugin system which is an easier, more powerful and standardized way to extend actions, blocks, connections, operators and the authentication system with custom JavaScript. See the [plugin documentation](/plugins-introduction) for more information on how to use and develop plugins.

The [AgGrid](https://github.com/lowdefy/blocks-aggrid) custom blocks have been added as default Lowdefy blocks, so these blocks can now be used without any additional configuration.

## Context has been removed

In version 3, the first block on a page needed to be a `context` category block. This was because in version 3 you could have multiple context blocks on the same page, each with it's own separate state.

This feature was found to be unnecessary, created additional complexity and was difficult to understand, so it was removed.

The `Context` type block was removed, as it was a `Box` block that also created a context. The `Context` block can be replaced by a `Box`.

If the `Context` block is no longer necessary it can also be removed:

###### Version 3:

```yaml
id: '404'
type: Context
style:
  minHeight: 100vh
blocks:
  - id: 404_result
    type: Result
    properties:
      status: 404
      title: '404'
      subTitle: Sorry, the page you are visiting does not exist.
```

###### Version 4:

```yaml
id: '404'
type: Result
style:
  minHeight: 100vh
properties:
  status: 404
  title: '404'
  subTitle: Sorry, the page you are visiting does not exist.
```

## Other removed blocks

In version 4 the `PageHCF`, `PageHCSF`, `PageHSCF`, and `PageSHCF` blocks have been removed. Instead you can now use the `Layout`, `Header`, `Content`, `Sider` and `Footer` blocks. See more about this [here](https://4x.ant.design/components/layout/).

###### Layout, Header-Content-Footer example:

```yaml
id: layout
type: Layout
style:
  textAlign: center
blocks:
  - id: header
    type: Header
    blocks:
      - id: Title
        type: Title
        properties:
          content: Header
        style:
          backgroundColor: red
  - id: content
    type: Content
    blocks:
      - id: Title
        type: Title
        style:
          backgroundColor: green
        properties:
          content: Content
  - id: footer
    type: Footer
    blocks:
      - id: Title
        type: Title
        style:
          backgroundColor: blue
        properties:
          content: Footer
```

## Server Configuration

The `LOWDEFY_SERVER_BASE_PATH` environment variable configuration option has been removed. To configure a base path, use the `config.basePath` configuration option.

``yaml
lowdefy: {{ version }}

config:
  basePath: /foo
```

The `_build.env` operator can be used to set the base path using an environment variable:
```yaml
lowdefy: {{ version }}

config:
  basePath:
    _build.env: LOWDEFY_BASE_PATH
```

The `LOWDEFY_SERVER_PUBLIC_DIRECTORY` and `LOWDEFY_SERVER_BUILD_DIRECTORY` are no longer supported because configuration is bundled with the server at build time.

The `LOWDEFY_SERVER_PORT` environment variable has been replaced by the `PORT` environment variable.

## _change_case

The options splitRegex and stripRegex are no longer supported in v4 and the following have been renamed:
  - paramCase to kebabCase
  - headerCase to trainCase

###### Version 3:

```yaml
_change_case.paramCase:
  on: example string
```

###### Version 4:

```yaml
_change_case.kebabCase:
  on: example string
```

###### Version 3:

```yaml
_change_case.headerCase:
  on: example string
```

###### Version 4:

```yaml
_change_case.trainCase:
  on: example string
```
```
---


---

## File: `README.md`

# @lowdefy/docs

The Lowdefy docs are written using Lowdefy, and are hosted at https://docs.lowdefy.com.

Blocks documentation is built from block schemas in the blocks packages.

## More Lowdefy resources

- Getting started with Lowdefy - https://docs.lowdefy.com/tutorial-start
- Lowdefy docs - https://docs.lowdefy.com
- Lowdefy website - https://lowdefy.com
- Community forum - https://github.com/lowdefy/lowdefy/discussions
- Bug reports and feature requests - https://github.com/lowdefy/lowdefy/issues

## Licence

[Apache-2.0](https://github.com/lowdefy/lowdefy/blob/main/LICENSE)
