# @lowdefy/blocks-algolia

Algolia search integration for Lowdefy.

## Block

| Block | Purpose |
|-------|---------|
| `AlgoliaAutocomplete` | Algolia-powered search autocomplete |

## Usage

```yaml
- id: search
  type: AlgoliaAutocomplete
  properties:
    appId:
      _secret: ALGOLIA_APP_ID
    searchApiKey:
      _secret: ALGOLIA_SEARCH_KEY
    indexName: products
    placeholder: Search products...
```

## Properties

| Property | Purpose |
|----------|---------|
| `appId` | Algolia application ID |
| `searchApiKey` | Algolia search-only API key |
| `indexName` | Index to search |
| `placeholder` | Input placeholder |
| `hitsPerPage` | Results per page |

## Events

| Event | Payload |
|-------|---------|
| `onSelect` | Selected item data |
| `onChange` | Search query |
