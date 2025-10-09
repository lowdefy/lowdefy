<TITLE>
KnexBuilder
</TITLE>

<DESCRIPTION>

### Properties

- `query: object[]`: **Required** - SQL query builder array. An array of objects, with a single key which is the name of the knex builder function. The value should be an array of arguments to pass to the builder function.
- `tableName: string | object`: The name of the table to query from.

</DESCRIPTION>

<CONNECTION>
Knex
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - KnexBuilder',
  type: 'object',
  required: ['query'],
  properties: {
    query: {
      type: 'array',
      description:
        'SQL query builder array. An array of objects, with a single key which is the name of the knex builder function. The value should be an array of arguments to pass to the builder function.',
      errorMessage: {
        type: 'KnexBuilder request property "query" should be an array.',
      },
    },
    tableName: {
      type: ['string', 'object'],
      description: 'The name of the table to query from.',
      errorMessage: {
        type: 'KnexBuilder request property "tableName" should be a string or object',
      },
    },
  },
  errorMessage: {
    type: 'KnexBuilder request properties should be an object.',
    required: {
      query: 'KnexBuilder request should have required property "query".',
    },
  },
};
```

</SCHEMA>

<EXAMPLES>

### Build a query

```yaml
id: knexBuilder
type: KnexBuilder
connectionId: knex
payload:
  name:
    _state: name
properties:
  query:
    - select:
        - '*'
    - from:
        - users
    - where:
        - name
        - _payload: name
```

### Using `tableName`

```yaml
id: knexBuilder
type: KnexBuilder
connectionId: knex
payload:
  name:
    _state: name
properties:
  tableName: users
  query:
    - select:
        - '*'
    - where:
        - name
        - _payload: name
```

### Aliases

```yaml
id: knexBuilder
type: KnexBuilder
connectionId: knex
properties:
  tableName:
    a: tableA
    b: tableB
  query:
    - select:
        - aField: 'a.field'
        - bField: 'b.field'
    - limit:
        - 1
```

</EXAMPLES>
