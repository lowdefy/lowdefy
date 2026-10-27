---
'@lowdefy/helpers': minor
'@lowdefy/blocks-table': minor
'@lowdefy/connection-mongodb': minor
---

feat(helpers, blocks-table, connection-mongodb): A Table filter reads as one sentence, on the page and from `MongoDBTableQuery`

A saved view's filter was readable only by opening the filter builder, and a server routine running the view through `MongoDBTableQuery` had no way to say what it matched. `describeCondition({ condition, fields })`, new in `@lowdefy/helpers`, turns a filter condition into a sentence such as "Stage is any of Lead or Won and Name contains CX": field titles, operator words, option labels, relative dates in words, `$user` values as "me", and brackets for groups past the first level. A key that names no field reads "an unknown field, <key>," rather than being dropped. The Table's Filter button shows the sentence as its tooltip. `MongoDBTableQuery` fields accept `title` and `options` as Table columns do, and the response carries `sentence` when a filter is set, the same sentence the Table shows for the same titles and options.
