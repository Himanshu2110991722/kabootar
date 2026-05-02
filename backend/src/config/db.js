const mongoose = require('mongoose');

const connectDB = async (retries = 5, delay = 3000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await mongoose.connect(process.env.MONGO_URI, {
        serverSelectionTimeoutMS: 10000,
        family: 4, // force IPv4 — avoids IPv6 DNS issues on some ISPs
      });
      console.log('✅ MongoDB connected');
      return;
    } catch (err) {
      console.error(`❌ MongoDB attempt ${attempt}/${retries} failed: ${err.message}`);
      if (attempt < retries) {
        console.log(`   Retrying in ${delay / 1000}s…`);
        await new Promise(r => setTimeout(r, delay));
      } else {
        console.error('   All retries exhausted. Server running WITHOUT database.');
        // Don't exit — let the server start so you see the error clearly
        // API calls will fail with 500 until DB reconnects
      }
    }
  }
};

// Auto-reconnect on disconnect
mongoose.connection.on('disconnected', () => {
  console.warn('⚠️  MongoDB disconnected. Attempting reconnect…');
  setTimeout(() => connectDB(3, 5000), 2000);
});

module.exports = connectDB;
