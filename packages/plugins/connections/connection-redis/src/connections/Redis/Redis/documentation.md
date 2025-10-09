<TITLE>
Redis
</TITLE>

<DESCRIPTION>

### Properties

- `command: string`: **Required** - Redis command to be executed, accepts all of the [out-of-the-box Redis commands](https://redis.io/commands).
- `parameters: array`: An array of parameters to be passed to the redis command.
- `modifiers: object`: The redis modififers to be passed to the redis command.

</DESCRIPTION>

<CONNECTION>
Redis
</CONNECTION>

<SCHEMA>

```js
export default {
  $schema: 'http://json-schema.org/draft-07/schema#',
  title: 'Lowdefy Request Schema - Redis',
  type: 'object',
  properties: {
    command: {
      type: 'string',
      description: 'Redis command to execute.',
      errorMessage: {
        type: 'Redis request property "command" should be a string.',
      },
    },
    parameters: {
      type: 'array',
      description: 'The parameters to use with the command.',
      errorMessage: {
        type: 'Redis request property "parameters" should be an array.',
      },
    },
    modifiers: {
      type: 'object',
      description: 'The modifiers to use with the command.',
      default: {},
      errorMessage: {
        type: 'Redis request property "modifiers" should be an object.',
      },
    },
  },
  required: ['command'],
  errorMessage: {
    type: 'Redis request properties should be an object.',
  },
};
```

</SCHEMA>

<EXAMPLES>

### Setting a key-value pair in redis

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

### Getting a value from redis

```yaml
id: redisRequest
type: Redis
connectionId: redis
properties:
  command: get
  parameters:
    - key
```

### Setting a key-value pair only if key does not exist

```yaml
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

</EXAMPLES>
