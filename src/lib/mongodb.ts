import { MongoClient, Db } from 'mongodb';

// Connection URI and DB name are provided via environment variables.
const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB;

if (!uri) {
  throw new Error('MONGODB_URI environment variable is not set');
}

if (!dbName) {
  throw new Error('MONGODB_DB environment variable is not set');
}

let client: MongoClient | null = null;
let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (client) {
    return client;
  }
  if (!clientPromise) {
    clientPromise = MongoClient.connect(uri).then((connectedClient) => {
      client = connectedClient;
      return connectedClient;
    });
  }
  return clientPromise;
}

export async function getDb(): Promise<Db> {
  const mongoClient = await getMongoClient();
  return mongoClient.db(dbName);
}

