<TITLE>
DocSearch
</TITLE>

<DESCRIPTION>

This block renders a [Algolia DocSearch](https://docsearch.algolia.com/) search box.

To use the block, the `apiKey`, `appId` and `indexName` properties need to be configured.

The DocSearch CSS files and preconnect optimisation also need to be added to the HTML head of your app using `appendHead` as follows:

```yaml
lowdefy: { { version } }
app:
  html:
    appendHead: |
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@docsearch/css@3" />
      <link rel="preconnect" href="https://YOUR_APP_ID-dsn.algolia.net" crossorigin />
```

</DESCRIPTION>

<SCHEMA>

```json
{
  "type": "object",
  "properties": {
    "type": "object",
    "additionalProperties": false,
    "properties": {
      "apiKey": {
        "type": "string",
        "description": "Your Algolia Search API key."
      },
      "appId": {
        "type": "string",
        "description": "Your Algolia application ID."
      },
      "disableUserPersonalization": {
        "type": "boolean",
        "description": "Disable saving recent searches and favorites to the local storage."
      },
      "indexName": {
        "type": "string",
        "description": "Your Algolia index name."
      },
      "initialQuery": {
        "type": "string",
        "description": "The search input initial query."
      },
      "maxResultsPerGroup": {
        "type": "number",
        "description": "The maximum number of results to display per search group. Default is 5."
      }
    }
  },
  "events": {
    "type": "object",
    "additionalProperties": false,
    "properties": {}
  }
}
```

</SCHEMA>

<EXAMPLES>

### Standard Usage

```yaml
id: standard_usage
type: DocSearch
properties:
  apiKey: YOUR_API_KEY
  appId: YOUR_APP_ID
  indexName: YOUR_INDEX_NAME
```

</EXAMPLES>
