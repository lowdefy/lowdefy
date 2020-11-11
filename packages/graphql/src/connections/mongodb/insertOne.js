import { MongoClient } from 'mongodb';
import { get, type } from '@lowdefy/helpers';
import { serialize, deserialize } from './serialize';

function validateRequest({ request, context }) {
  if (!request.doc) {
    throw new context.ConfigurationError('Request doc not specified');
  }
}

function validateConnection({ connection, context }) {
  if (!connection.databaseUri) {
    throw new context.ConfigurationError('Connection databaseUri not specified');
  }
  if (!type.isString(connection.databaseUri)) {
    throw new context.ConfigurationError('Connection databaseUri is not a string');
  }
  if (!connection.collection) {
    throw new context.ConfigurationError('Connection collection not specified');
  }
  if (!type.isString(connection.collection)) {
    throw new context.ConfigurationError('Connection collection is not a string');
  }
  if (!get(connection, 'write', { default: false })) {
    throw new context.ConfigurationError('Connection does not allow writes');
  }
}

async function mongodbInsertOne({ request, connection, context }) {
  validateRequest({ request, context });
  validateConnection({ connection, context });
  const deserializedRequest = deserialize(request);
  const { doc, options } = deserializedRequest;
  const { databaseUri, databaseName, collection } = connection;
  let client;
  try {
    client = new MongoClient(databaseUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    await client.connect();
  } catch (err) {
    throw new context.RequestError(`${err.name}: ${err.message}`);
  }
  let res;
  try {
    const db = client.db(databaseName);
    res = await db.collection(collection).insertOne(doc, options);
  } catch (err) {
    await client.close();
    throw new context.RequestError(`${err.name}: ${err.message}`);
  }
  await client.close();
  const { insertedCount, insertedId, ops } = serialize(res);
  return { insertedCount, insertedId, ops };
}

export default mongodbInsertOne;
