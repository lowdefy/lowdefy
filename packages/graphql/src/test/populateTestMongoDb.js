import { MongoClient } from 'mongodb';

async function populateTestMongoDb({ collection, documents }) {
  const client = new MongoClient(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  const db = client.db();
  await db.collection(collection).deleteMany({});
  await db.collection(collection).insertMany(documents);

  await client.close();
}

export default populateTestMongoDb;
