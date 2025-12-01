const { sql } = require('/C/Users/ac301/Downloads/BCA-main/BCA/lib/db.ts');

async function checkUser() {
  try {
    const result = await sql`SELECT id, email, password_hash FROM users WHERE lower(trim(email)) = 'juan12@gmail.com'`;
    const user = result?.[0];
    if (user) {
      console.log('User found:', user);
    } else {
      console.log('User NOT found');
      // List all users
      const allUsers = await sql`SELECT id, email FROM users LIMIT 10`;
      console.log('All users:', allUsers);
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkUser();
