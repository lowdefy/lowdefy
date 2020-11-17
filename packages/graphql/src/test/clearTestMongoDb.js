import { MongoClient } from 'mongodb';

async function clearTestMongoDb({ collection }) {
  const client = new MongoClient(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  await client.connect();
  const db = client.db();
  await db.collection(collection).deleteMany({});
  await client.close();
}

export default clearTestMongoDb;
