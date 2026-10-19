A page is served at its `id` by default: a page with id `ticket` is at `/ticket`, and the record it shows is passed in the query string, like `/ticket?ticket_id=1234`. Set a page's `path` to give it an address of its own, with placeholders for the values that say which record it shows:

```yaml
pages:
  - id: ticket
    path: tickets/{space}/{ticket_id}
    type: PageHeaderMenu
    blocks:
      - id: title
        type: Title
        properties:
          content:
            _string.concat:
              - 'Ticket '
              - _path_params: ticket_id
```

The page is now served at `/tickets/support/1234`, and [`_path_params`](/_path_params) reads `support` and `1234` from the URL. A page without `path` is served at its id, as before.

The `id` stays the page's identity. [`auth.pages`](/protected-pages-apis), menus, the `Link` action's `pageId`, [`_module.pageId`](/_module), `_location: pageId`, requests and agents all name the page by its id. Only the URL changes.

## Writing a path

A `path` is written like a page id: no leading or trailing `/`, with segments separated by `/`. Each segment is either:

- fixed text, using the characters a page id may use (`A-Z`, `a-z`, `0-9`, `-`, `_` and `:`), or
- a placeholder, `{name}`, filling the whole segment. A name starts with a letter or `_` and only contains `A-Z`, `a-z`, `0-9` and `_`. Each name appears once in a path.

Placeholders can go in any segment, the first included. A `path` without placeholders is allowed too, and serves the page at that address instead of its id.

These are not supported, and the build fails on them:

- A placeholder inside a segment, like `ticket-{id}`.
- Optional placeholders, like `{id?}`.
- Catch-all placeholders, like `{...rest}`.

### Quote a path that starts with a placeholder

In YAML, a value that starts with `{` is read as an object, so a path that starts with a placeholder must be quoted:

```yaml
pages:
  - id: space-ticket
    path: '{space}/tickets/{ticket_id}'
```

Unquoted, `path: {space}/tickets/{ticket_id}` fails to parse, and `path: {slug}` parses as an object with no error from YAML. The build checks that `path` is a string and tells you to quote it.

### Pages in modules

A module page's `path` is prefixed with its module entry id, as its `id` is. A module page with `path: '{space}/tickets/{ticket_id}'`, in a module entry with id `support`, is served at `/support/{space}/tickets/{ticket_id}`. Since the entry id is a fixed first segment, module pages always outrank app pages whose path starts with a placeholder.

### Pages the framework links to

Some pages are reached at an address Lowdefy writes for you, with no values to fill placeholders, so these pages cannot have them:

- **The home page.** The `config.homePageId` page is served at `/`, so it cannot have placeholders. When `homePageId` is not set, home is the first menu link the user may see. A menu link to a page with placeholders must give their values in `pathParams` (see [Menus](/menus)), and home then opens that page with those values.
- **Auth pages.** The pages in `auth.authPages`, such as the sign-in page, are redirect targets and cannot have placeholders. When an auth page has a `path`, set its `authPages` URL to that path (`/` and the path), since nothing is served at its id.
- **The `404` page.** The `404` page cannot have a `path` at all. Every URL that matches no page is redirected to `/404`.

## Linking to a page with a path

Link to a page by its `pageId`, and give the placeholder values in `pathParams`, next to `urlQuery`:

```yaml
- id: open_ticket
  type: Link
  params:
    pageId: ticket
    pathParams:
      space: support
      ticket_id:
        _state: ticket_id
    urlQuery:
      tab: comments
```

This opens `/tickets/support/1234?tab=comments`. Lowdefy builds the URL from the page's path, adds the app's `basePath` and encodes each value, so a value can hold any character, `/` included.

`pathParams` works wherever a page link is written:

- The [`Link`](/Link) action, and the `callbackUrl` of the auth actions, like [`Login`](/Login), [`Logout`](/Logout), [`MagicLinkVerify`](/MagicLinkVerify) and [`EmailOtpVerify`](/EmailOtpVerify).
- [Menu links](/menus). A menu link's `pathParams` must be literal strings, since menus are built once for the app.
- HTML links, with the `data-path-params` attribute next to `data-page-id` (see [HTML attributes](/html-attributes#links)).
- Table and grid cell links and row links in [`Table`](/Table), [`TableLight`](/TableLight) and [`AgGrid`](/AgGrid), where each `pathParams` value is a field path in the row, as `urlQuery` values are there: `link: { pageId: ticket, pathParams: { space: space_id, ticket_id: _id } }`.
- The [`Anchor`](/Anchor) block.
- [Notification and email links](/notifications#links).

The rules for values:

- Values are strings. A number is converted with `String()`, so `1234` gives `"1234"`.
- Every placeholder needs a value. A missing, `null` or empty value fails the link with an error naming the page and the placeholder.
- A value cannot be `.` or `..`. Browsers drop those segments from a URL before the request is sent, so no link could reach the page. Values that contain dots, like `v1.2`, are fine.
- Keys the path does not use are ignored.
- Values never merge into `urlQuery`. A page can have a `space` placeholder and a `space` query value, and each is read with its own operator.

The build checks the links it can read: a `Link` action with a literal `pageId`, an HTML `data-page-id` link and a menu link must give a value for every placeholder of the page they link to. Values computed by operators, and links in block properties such as table cells, are checked when the link is used.

### Block property links on public pages

The browser only knows the paths of the pages the user may open, and of the pages the current page links to with a `Link` action or an HTML `data-page-id` link. Links in block properties, like `Anchor` and table or grid cells, and links in app events are not collected. On a public page, such a link to a protected page with a path cannot be built for a logged-out user, and fails. Use a `Link` action or an HTML link there instead: the logged-out user is then sent to sign in, and returned to the page afterwards.

## Reading the values

- [`_path_params`](/_path_params) reads the values in a page, with the same `key`, `all` and `default` arguments as [`_url_query`](/_url_query).
- In a [`_js`](/_js) function, `pathParams('ticket_id')` does the same.
- An action plugin reads them with `getPathParams`, as it reads the query with `getUrlQuery` (see [Action plugins](/plugins-actions)).
- [Dynamic page content](/dynamic-page-content) endpoints receive them as `pathParams` in the payload, next to `urlQuery`.
- An [agent](/agent-properties) receives them as `pathParams` when the [`AgentChat`](/AgentChat) block is on a page with a path, and includes them in its page context.

Requests run on the server and cannot read the URL. Pass the values to a request in its `payload`:

```yaml
requests:
  - id: get_ticket
    type: MongoDBFindOne
    connectionId: tickets
    payload:
      space:
        _path_params: space
      ticket_id:
        _path_params: ticket_id
    properties:
      query:
        space:
          _payload: space
        ticket_id:
          _payload: ticket_id
```

## How URLs match pages

When a URL is requested, Lowdefy compares its segments with every page path that has the same number of segments. Pages without a `path` take part with their id, as all-fixed paths. When more than one path matches, they are compared from left to right, and at the first segment where they differ, a fixed segment beats a placeholder.

For example, with these three pages:

```yaml
pages:
  - id: space-tickets
    path: '{space}/tickets'
  - id: admin-section
    path: admin/{section}
  - id: admin/tickets
```

- `/support/tickets` opens `space-tickets`, with `space` set to `support`.
- `/admin/users` opens `admin-section`, with `section` set to `users`.
- `/admin/tickets` opens the `admin/tickets` page. All three paths match, and the fixed `admin` beats `{space}` in the first segment, then the fixed `tickets` beats `{section}` in the second.

The order of pages in your config never changes which page a URL opens.

**Ties.** Two paths tie when they have the same number of segments, placeholders in the same positions, and the same fixed segments, ignoring case. `tickets/{id}` and `tickets/{ticket_id}` tie, as do `Tickets/{id}` and `tickets/{id}`. The build fails on a tie and names both pages.

**Case.** Matching is case-sensitive: `/Tickets/support/1234` does not open `tickets/{space}/{ticket_id}`. Values keep their case.

**Slashes.** One trailing `/` is ignored. A URL with an empty segment, like `/tickets//1234`, matches no page, so a missing value can never shift the other values into a shorter path. A segment that is `.` or `..`, encoded or not, matches no page either.

**Encoding.** Each segment is decoded before it is matched, so `%2F` in a URL gives a value that contains `/`, and `a+b` and `a%2Bb` give the same value.

### Values that other addresses take first

A placeholder matches any value, but some values reach something else first. This matters most for a path that starts with a placeholder, like `{space}/tickets/{ticket_id}`:

- **A fixed segment of another page.** If `admin/tickets/new` is a page, a space named `admin` cannot reach `{space}/tickets/new`. The build cannot see your data, so it cannot catch this.
- **`.well-known`**, always.
- **`404`**, the not-found page.
- **`api`**, where the rest of the URL is a Lowdefy API route, like `/api/page/...` or `/api/request/...`. Other `/api/...` URLs reach the pages.
- **Static files.** A URL where a file exists in the app's `public` folder, or a built asset under `/assets`, serves the file.
- **In development**, the dev server's own addresses: `/lowdefy-docs`, and the paths that start with `client`, `lib`, `build`, `node_modules` or `@`, and `/favicon.ico`.

An app that starts a path with a placeholder should keep its values clear of these names.

## Page instances

A page with placeholders has one instance for each set of values. Each instance has its own state, request results and input, and runs its own `onInit`. Opening ticket 2 after ticket 1 starts a fresh page, and going back to ticket 1 finds it as the user left it.

- Each page keeps its 10 most recently used instances. When an 11th is opened, the least recently used one is dropped, and opening it again is a first visit.
- Changing only the query string, for example with a `Link` action that updates `urlQuery`, stays on the same instance.
- Two URLs that decode to the same values, like `/tickets/a+b` and `/tickets/a%2Bb`, open the same instance.
- A page with a [`Dynamic`](/dynamic-page-content) block keeps no state between visits, as before. Each visit starts fresh.
- A page without placeholders has one instance, as every page did before.

As on any page, `onInit` runs once per instance and `onMount` every time it is shown. Load data that must be up to date each time the user returns to a record in `onMount`, and set up state that should survive a trip away and back in `onInit`.

Menu highlighting follows the page id, so every ticket highlights the menu link to the ticket page.

## Security

Path values are as user-controlled as the query string. Anyone can type a different value into the URL.

> **DO NOT** put any private or personal information in a path; all values in a URL are visible. Using a value that can be guessed, like an incremental id, can lead to security issues, since users can easily guess the URLs of other records.

A path authorises nothing. Which users may open a page is still set by [`auth.pages`](/protected-pages-apis) on its page id, and which records they may see is up to the requests that load them. Check in the request that the user may read the record the values name.

The browser is never sent the id or path of a page the user may not open, unless the page they are on already links to it.

## Build errors

The build fails when:

- a `path` is not a string (a path starting with a placeholder that is not quoted),
- a path has an empty segment, starts or ends with `/`, has a segment with characters a page id cannot use, or uses a placeholder name twice,
- a path has a placeholder inside a segment, an optional placeholder or a catch-all placeholder,
- two pages' paths tie,
- the `homePageId` page or an auth page has placeholders, or the `404` page has a `path`,
- an auth page has a `path`, and its `authPages` URL names its id instead,
- a `Link` action with a literal `pageId`, an HTML `data-page-id` link or a menu link does not give every placeholder of the page a value.
