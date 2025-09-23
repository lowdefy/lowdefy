<TITLE>
Link
<TITLE>

<DESCRIPTION>
The `Link` action is used to link a user to another page. An input can be passed to the next page using either the
`urlQuery`, which is visible to the user, but persists if the browser is refreshed, or by using the `input` object, which is not
visible to the user.
<DESCRIPTION>

<USAGE>
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
</USAGE>

<EXAMPLES>
### Shorthand, only specify pageId as string:
```yaml
- id: shorthand
  type: Link
  params: my_page_id
```

### Specify pageId:
```yaml
- id: link_page_id
  type: Link
  params:
    pageId: myPageId
```

### Link to home page:
```yaml
- id: link_home
  type: Link
  params:
    home: true
```

### Link to an external url:
```yaml
- id: link_url
  type: Link
  params:
    url: www.lowdefy.com
```

### Open a link in a new tab:
```yaml
- id: link_new_tab
  type: Link
  params:
    pageId: my_page_id
    newTab: true
```

### Set the urlQuery of the page that is linked to:
```yaml
- id: link_url_query
  type: Link
  params:
    pageId: my_page_id
    urlQuery:
      id:
        _state: id
```

### Set the input of the page that is linked to:
```yaml
- id: link_input
  type: Link
  params:
    pageId: my_page_id
    input:
      id:
        _args: row.id
```

### Go to the previous page:
```yaml
- id: link_back
  type: Link
  params:
    back: true
```
</EXAMPLES>
