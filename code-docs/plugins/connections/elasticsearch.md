# @lowdefy/connection-elasticsearch

[Elasticsearch](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html) connection for Lowdefy.

## Connection Type

| Type            | Purpose                  |
| --------------- | ------------------------ |
| `Elasticsearch` | Connect to Elasticsearch |

## Connection Configuration

```yaml
connections:
  - id: elastic
    type: Elasticsearch
    properties:
      node: https://localhost:9200
      auth:
        username:
          _secret: ES_USER
        password:
          _secret: ES_PASSWORD
```

## Request Types

| Type                  | Purpose          |
| --------------------- | ---------------- |
| `ElasticsearchSearch` | Search documents |
| `ElasticsearchIndex`  | Index document   |
| `ElasticsearchDelete` | Delete document  |
| `ElasticsearchUpdate` | Update document  |

## ElasticsearchSearch

```yaml
requests:
  - id: searchProducts
    type: ElasticsearchSearch
    connectionId: elastic
    properties:
      index: products
      body:
        query:
          bool:
            must:
              - match:
                  name:
                    _state: searchQuery
            filter:
              - term:
                  category:
                    _state: category
        size: 20
        from: 0
        sort:
          - _score: desc
```

## ElasticsearchIndex

```yaml
requests:
  - id: indexProduct
    type: ElasticsearchIndex
    connectionId: elastic
    properties:
      index: products
      id:
        _state: productId
      body:
        name:
          _state: name
        description:
          _state: description
        category:
          _state: category
```

## Full-Text Search Example

```yaml
requests:
  - id: fullTextSearch
    type: ElasticsearchSearch
    connectionId: elastic
    properties:
      index: articles
      body:
        query:
          multi_match:
            query:
              _state: query
            fields:
              - title^3
              - content
              - tags^2
        highlight:
          fields:
            title: {}
            content: {}
```
