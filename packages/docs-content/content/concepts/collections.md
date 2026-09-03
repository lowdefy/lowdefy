# Collections

A connection names the collection it addresses, but nothing on a connection records what a document in that collection contains, which field points at which other collection, or that two connections address the same collection. The optional, app-level `collections` object writes that down once.

A collection is a property of the database, not of a connection: one collection is routinely addressed by several connections (a read-only one, a writing one, a shared-catalogue one), so it is declared once at the root of `lowdefy.yaml`, keyed by collection name, and the build joins it to every connection whose `properties.collection` names it.

```yaml
collections:
  answers:
    tenant: organization_id          # or: shared
    fields:
      test_id: string
      result: { enum: [pass, fail, partial, na] }
      evidence_ids: [string]
      superseded: boolean
      created_at: date
    relations:
      test_id: tests._id
      evidence_ids: evidence._id
    indexes:
      - keys: { organization_id: 1, test_id: 1 }
        options: { unique: true }
  controls:
    tenant: shared
    fields: { title: string, framework_id: string }
```

Every key inside a collection is optional. Anything other than `tenant`, `fields`, `relations` and `indexes` is a build error.

## Schema

- `tenant: string`: Either `shared` for a collection that carries no tenant field and is read across organizations, or the name of the top-level field the [tenant wall](/organizations) stamps and matches. The build normalises a field name to `{ field: <name> }`, the same shape a connection's `tenant` uses.
- `fields: object`: A map of field name to type. Each value takes one of three forms, all normalised to a JSON Schema fragment:
  - A type name: `string`, `number`, `integer`, `boolean`, `date`, `object` or `array`. `date` becomes `{ instanceof: Date }`, since JSON Schema has no date type.
  - A one-element array shorthand, `[string]`, for an array of that type: `{ type: array, items: { type: string } }`.
  - An object with `type`, `enum`, `items` and `required`. A bare `enum` infers no type.

  An unknown type name is a build error listing the accepted names. There is no `objectId` type: a validator cannot check a constructor it does not know, so declare an `ObjectId` field as `object` or leave it undeclared.
- `relations: object`: A map of field name to `"<collection>.<field>"`. The target collection must be declared, and the target field must be one of its declared fields unless the target declares no `fields` at all.
- `indexes: array`: Each entry has a `keys` object and an optional `options` object, in the MongoDB `createIndex` shape. The shape is validated and passed through. **Declaring an index does not create it** - index creation belongs to `lowdefy migrate`.

## Tenancy agreement

When a collection declares `tenant` and a connection joined to it declares `tenant` too, they must agree: both `shared`, or both the same field. Disagreement is a build error at the connection:

```
Connection "org-scope" is tenant-scoped on "organization_id" but collection "controls" is declared shared. One of the two is wrong — a scoped read of a shared collection matches nothing.
```

A connection that declares no `tenant` of its own against a collection that does is not an error - it may deliberately be an admin path - but `lowdefy check` reports it.

A collection declared `tenant: shared` is also authoritative for the `tenant-lookup` check: an aggregation on a tenant-scoped connection that `$lookup`s or `$unionWith`s a shared collection fails the build even when no connection for that collection exists in the app.

## Checks

`lowdefy check` runs three notes under the `collections` slug, all silent when the app declares no `collections` at all:

- a connection addresses a collection the app does not declare - the contract is opt-in, so this is a gap, not a fault;
- a connection names its collection with an operator, so it cannot be joined to the declaration and opts out of the tenancy agreement, `tenant-lookup` and data model checks;
- a connection with no `tenant` addresses a collection declared with a tenant field.

Suppress them on a connection with `~ignoreBuildChecks: [collections]`.

## The build artifact

The build always writes `build/collections.json`, as `{}` when nothing is declared, so downstream tooling never needs a fallback:

```json
{
  "answers": {
    "tenant": { "field": "organization_id" },
    "fields": {
      "test_id": { "type": "string" },
      "evidence_ids": { "type": "array", "items": { "type": "string" } }
    },
    "relations": { "test_id": { "collection": "tests", "field": "_id" } },
    "indexes": [{ "keys": { "organization_id": 1, "test_id": 1 }, "options": { "unique": true } }],
    "connections": [
      { "connectionId": "answers_rw", "read": true, "write": true, "tenant": { "field": "organization_id" } }
    ]
  }
}
```

Each joined connection records its `read` and `write` flags (the connection's literal `read` / `write` properties, defaulting like `MongoDBCollection` to read on and write off) and its own `tenant` declaration.

## Validation on write

When a collection declares `fields`, every MongoDB write request on a connection addressing that collection is checked against them before the driver is called. The check runs in the connection: the API layer resolves the contract from `build/collections.json` by the *evaluated* `properties.collection` of the connection - so a collection named by an operator is still covered - and hands it to the request type beside the tenant verdict. There is no caller opt-in and nothing to configure; declaring `fields` turns it on, and a collection without `fields` (or one that is not declared) is written exactly as before.

What is validated:

- `MongoDBInsertOne`, `MongoDBInsertMany`, `MongoDBInsertConsecutiveId` and `MongoDBInsertManyConsecutiveIds` check each inserted document.
- `MongoDBUpdateOne`, `MongoDBUpdateMany` and `MongoDBVersionedUpdateOne` check the values of `$set` and `$setOnInsert` only, resolving dotted keys (`evidence_ids.0`, `tags.$[el]`) into the field's `items`. Other update operators (`$inc`, `$push`, `$unset`, `$rename`, ...) express deltas over the stored value rather than the shape it will hold, and an aggregation-pipeline update is opaque, so they are not checked. `MongoDBVersionedUpdateOne` also checks the version copy it re-inserts.
- `MongoDBBulkWrite` checks each operation by kind: `insertOne` documents and `replaceOne` replacements as documents, `updateOne` and `updateMany` as updates. Deletes carry no shape.

Rules:

- **Undeclared fields pass.** A declaration describes the fields it knows about; rejecting the rest would break every write that adds a field before the declaration catches up. There is no `additionalProperties: false`.
- `null` passes for any field that is not `required` - it is how a field is cleared (`$set: { closed_at: null }`), and the shorthand has no way to say `[string, null]`.
- A field declared `required: true` must be present and non-null in an insert or replacement document. Presence is not checked on updates. The tenant wall stamps its field before validation runs, so a contract may declare the tenant field required.
- A `date` field passes on a real `Date` - the request is deserialized (`~d` markers restored) before the check. There is no `objectId` type; an `ObjectId` instance passes a field declared `object`.
- Reads are not validated. A document already in the database that violates the contract is a migration concern, not a request error.

A violation is a request error naming the field, the expectation and the value, so the write that is wrong (or the declaration that is) can be fixed without reading the collection:

```
Field "result" in an insert document for collection "answers" does not match the declared contract: must be equal to one of the allowed values (pass, fail, partial, na). Received "Pass".
```

#### Why ajv in the connection and not a `$jsonSchema` validator

MongoDB can hold a `$jsonSchema` validator on the collection itself. Lowdefy deliberately does not use it. A collection validator needs `collMod` privileges the app user may not have on a managed cluster, and it cannot be applied from a build. It also polices writes made outside Lowdefy, which sounds attractive but surfaces as an opaque `DocumentFailedValidation` driver error that names neither the field nor the value, so an agent (or a person) cannot act on it. Validating in the connection needs no database privileges, keeps the error text Lowdefy's - field, expectation, received value, and the config location of the request - and mirrors the tenant wall exactly: one place, every write, no caller opt-in. Because a violation never reaches the driver, it never overlaps with the driver error mapping.

## What consumes it

- The `tenant-lookup` build check reads `tenant` to refuse scoped pipelines that join shared collections.
- The dev server's `lowdefy_data_model` MCP tool (`GET /lowdefy-docs/data-model`) prints every collection with its fields, relations, indexes and tenant verdict, the connections addressing it, and every request, routine step and websocket that reads or writes it — see [Docs for AI Agents](/ai-agent-docs#data-model-lowdefy_data_model). It works without a declaration too, but only a declaration gives it fields and relations to print.
- Every MongoDB write request checks documents and `$set` / `$setOnInsert` values against `fields` before the driver is called (see [Validation on write](#validation-on-write)).
- `lowdefy migrate` creates the declared `indexes` and migrates data toward the declared shape.
