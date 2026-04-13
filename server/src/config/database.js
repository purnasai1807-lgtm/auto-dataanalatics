import mongoose from "mongoose";

function shouldUseMongo(connectionString) {
  return Boolean(connectionString && !["disabled", "false", "none"].includes(connectionString.toLowerCase()));
}

export async function connectDatabase(connectionString) {
  if (!shouldUseMongo(connectionString)) {
    return;
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(connectionString);
}
