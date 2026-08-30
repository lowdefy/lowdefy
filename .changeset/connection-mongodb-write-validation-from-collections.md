---
'@lowdefy/connection-mongodb': minor
'@lowdefy/api': minor
'@lowdefy/docs': patch
---

feat(connection-mongodb): Validate MongoDB writes against the declared `collections.fields`.

When the app declares a collection with `fields` under the root `collections` object, every MongoDB
write request on a connection addressing that collection now checks what it writes before the driver
is called. `MongoDBInsertOne`, `MongoDBInsertMany`, `MongoDBInsertConsecutiveId` and
`MongoDBInsertManyConsecutiveIds` check each inserted document; `MongoDBUpdateOne`,
`MongoDBUpdateMany` and `MongoDBVersionedUpdateOne` check the values of `$set` and `$setOnInsert`
(other update operators express deltas, not shapes, and are not checked); `MongoDBBulkWrite` checks
each operation by kind. Undeclared fields pass, `null` passes for a field that is not `required`, a
`required` field must be present in an insert, and a `date` field is checked as a real `Date` after
deserialization. A violation is a request error naming the field, the expected type and the received
value, with the request's config location attached.

The API layer resolves the contract from `build/collections.json` by the _evaluated_
`connection.properties.collection` in both page requests and routine steps, and hands it to the
request resolver as `collectionSchema` beside `tenant` - `null` when the collection is undeclared or
declares no `fields`, in which case every write behaves exactly as before. Validation runs in the
connection with ajv rather than as a `$jsonSchema` collection validator: it needs no database
privileges, keeps the error text Lowdefy's, and mirrors the tenant wall.
