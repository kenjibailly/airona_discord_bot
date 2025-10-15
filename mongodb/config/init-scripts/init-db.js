// Import Node.js crypto module
const crypto = require("crypto");

print(
  "Start #################################################################"
);

db = db.getSiblingDB("airona");

// Function to hash the password
function hashPassword(password) {
  // Use SHA-256 hashing algorithm
  const hashedPassword = crypto
    .createHash("sha256")
    .update(password)
    .digest("hex");
  return hashedPassword;
}

// Hash the provided password
const hashedPassword = hashPassword(process.env.MONGO_PASSWORD);

db.createUser({
  user: process.env.MONGO_USER,
  pwd: hashedPassword,
  roles: [{ role: "readWrite", db: "airona" }],
});

print("END #################################################################");
