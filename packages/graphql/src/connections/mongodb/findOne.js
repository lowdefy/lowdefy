import { MongoClient } from 'mongodb';
import { get, type } from '@lowdefy/helpers';
import { serialize, deserialize } from './serialize';

function validateRequest({ request, context }) {
  if (!request.query) {
    throw new context.ConfigurationError('Request query not specified');
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
  if (!get(connection, 'read', { default: true })) {
    throw new context.ConfigurationError('Connection does not allow reads');
  }
}

async function mongodbFindOne({ request, connection, context }) {
  validateRequest({ request, context });
  validateConnection({ connection, context });
  const deserializedRequest = deserialize(request);
  const { query, options } = deserializedRequest;
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
    res = await db.collection(collection).findOne(query, options);
  } catch (err) {
    await client.close();
    throw new context.RequestError(`${err.name}: ${err.message}`);
  }
  await client.close();
  return serialize(res);
}

export default mongodbFindOne;
