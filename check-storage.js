// Script untuk cek isi AsyncStorage
// Jalankan ini di browser console saat aplikasi sudah terbuka

console.log("=== NOVEA DATABASE CHECK ===\n");

// Cek semua keys yang ada di localStorage
const allKeys = Object.keys(localStorage);
console.log("Total keys di localStorage:", allKeys.length);
console.log("All keys:", allKeys);
console.log("\n");

// Cek users database
const usersDB = localStorage.getItem("@novea_users_database");
if (usersDB) {
  console.log("📦 USERS DATABASE FOUND!");
  const users = JSON.parse(usersDB);
  console.log(`Total users: ${users.length}\n`);
  
  users.forEach((user, index) => {
    console.log(`User ${index + 1}:`);
    console.log(`  - ID: ${user.id}`);
    console.log(`  - Name: ${user.name}`);
    console.log(`  - Email: ${user.email}`);
    console.log(`  - Writer: ${user.isWriter ? 'Yes' : 'No'}`);
    console.log(`  - Coins: ${user.coinBalance}`);
    console.log(`  - Created: ${user.createdAt}`);
    console.log("");
  });
} else {
  console.log("❌ No users database found");
}

// Cek current session
const currentUser = localStorage.getItem("@novea_user");
if (currentUser) {
  console.log("👤 CURRENT SESSION:");
  const user = JSON.parse(currentUser);
  console.log(`  - Name: ${user.name}`);
  console.log(`  - Email: ${user.email}`);
  console.log("\n");
} else {
  console.log("❌ No active session\n");
}

// Cek coin balance
const coinBalance = localStorage.getItem("@novea_coin_balance");
if (coinBalance) {
  console.log(`💰 Coin Balance: ${coinBalance}\n`);
}

console.log("=== END OF CHECK ===");
