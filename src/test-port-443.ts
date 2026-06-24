import pg from "pg";

const { Client } = pg;

async function runTest() {
  const host = "aws-0-ap-south-1.pooler.supabase.com";

  console.log("Trying Port 443 with User suffix...");
  const client1 = new Client({
    connectionString: `postgresql://postgres.hdmuzwcnthsbamrwzjsd:2k7rOQg983ziJ2Ow@${host}:443/postgres`,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client1.connect();
    console.log("✅ Success! Port 443 connected successfully!");
    const res = await client1.query("SELECT * FROM studio_details ORDER BY id DESC LIMIT 1");
    console.log("Result:", res.rows);
    await client1.end();
  } catch (err: any) {
    console.error("❌ Failed:", err.message);
    try { await client1.end(); } catch (e) {}
  }
}

runTest();
