<TITLE>
KnexRaw
</TITLE>

<DESCRIPTION>

### Properties

- `query: string`: **Required** - SQL query string.
- `parameters: string | number | array | object`: SQL query parameters.

</DESCRIPTION>

<CONNECTION>
Knex
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - KnexRaw',
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'string',
      description: 'SQL query string.',
      errorMessage: {
        type: 'KnexRaw request property "query" should be a string.',
      },
    },
    parameters: {
      type: ['string', 'number', 'array', 'object'],
      description: 'SQL query parameters.',
      errorMessage: {
        type: 'KnexRaw request property "parameters" should be a string, number, array, or object.',
      },
    },
  },
  errorMessage: {
    type: 'KnexRaw request properties should be an object.',
    required: {
      query: 'KnexRaw request should have required property "query".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### Simple raw query

```yaml
id: knexRaw
type: KnexRaw
connectionId: knex
properties:
  query: SELECT * FROM "my_table";
```

### Query with named parameters

```yaml
id: knexRaw
type: KnexRaw
connectionId: knex
payload:
  selected_name:
    _state: selected_name
properties:
  query: select * from users where name = :name
  parameters:
    name:
      _payload: selected_name
```

### Query with positional parameters

```yaml
id: knexRaw
type: KnexRaw
connectionId: knex
payload:
  selected_name:
    _state: selected_name
properties:
  query: select * from users where name = ?
  parameters:
    - _payload: selected_name
```

### Reference a `.sql` file

```yaml
id: knexRaw
type: KnexRaw
connectionId: knex
properties:
  query:
    _ref: my_query.sql
```

</EXAMPLES>
