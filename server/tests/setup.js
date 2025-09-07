import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";

// Increase default Jest timeout to allow MongoDB binary download/startup on first run
jest.setTimeout(60000);

let mongoServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();  // start fake DB
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");                     // connect app to it
});

afterEach(async () => {
  await mongoose.connection.db.dropDatabase();     // wipe data between tests
  console.log("Dropped database");
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();                        // cleanup
  console.log("Stopped MongoDB");
});
