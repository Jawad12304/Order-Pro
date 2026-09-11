// ==========================================
// ORDER-PRO — 1-Click Database Import Script
// Use this script to import orderpro_production_dump.sql
// into any PostgreSQL database (Neon, Supabase, Hostinger, Aiven, etc.)
//
// Usage:
//   node import-to-cloud-db.js "postgresql://user:password@host:port/dbname?sslmode=require"
// ==========================================

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

let targetUrl = process.argv[2] || process.env.DATABASE_URL;

if (!targetUrl) {
  console.error('\n❌ Error: Please provide the target database connection string.');
  console.error('Usage: node import-to-cloud-db.js "postgresql://user:password@host:5432/dbname"\n');
  process.exit(1);
}

const dumpPath = path.resolve(__dirname, 'orderpro_production_dump.sql');

if (!fs.existsSync(dumpPath)) {
  console.error(`\n❌ Error: Dump file not found at: ${dumpPath}\n`);
  process.exit(1);
}

console.log('\n=============================================');
console.log('🚀 Order-Pro Cloud Database Importer');
console.log('=============================================');
console.log(`Target DB: ${targetUrl.replace(/:[^:@]+@/, ':****@')}`);
console.log(`Reading:   ${dumpPath}`);

async function importDatabase() {
  // Clean connection string (remove ?schema=public which causes postgres.js to error)
  const cleanUrl = targetUrl.replace(/[?&]schema=[^&]+/, '');
  const isSsl = cleanUrl.includes('sslmode=require') || (!cleanUrl.includes('localhost') && !cleanUrl.includes('127.0.0.1'));
  
  const sql = postgres(cleanUrl, {
    ssl: isSsl ? 'require' : false,
    max: 1,
    connect_timeout: 30,
  });

  try {
    console.log('🔄 Connecting to target database...');
    const nowResult = await sql`SELECT NOW()`;
    console.log(`✅ Connected! Target database time: ${nowResult[0].now}`);

    console.log('🔄 Reading and sanitizing SQL dump file...');
    let rawContent = fs.readFileSync(dumpPath, 'utf8');

    // Remove any psql specific backslash commands like \restrict, \connect, \set
    let sanitizedContent = rawContent.split(/\r?\n/).filter(line => !line.trim().startsWith('\\')).join('\n');

    console.log('🔄 Executing dump script against target database...');
    await sql.unsafe(sanitizedContent);

    // Reset search_path back to public
    await sql.unsafe("SET search_path TO public;");

    console.log('✅ SQL execution complete!');

    // Verify imported tables and counts
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name;
    `;
    console.log(`\n📋 Verified ${tables.length} tables in target database:`);
    console.log(tables.map(t => `   - ${t.table_name}`).join('\n'));

    const users = await sql`SELECT username, role FROM public."User" ORDER BY username;`;
    console.log(`\n👥 Verified ${users.length} seeded users:`);
    console.log(users.map(u => `   - ${u.username} (${u.role})`).join('\n'));

    const restaurants = await sql`SELECT name, slug FROM public."Restaurant";`;
    console.log(`\n🍽️ Verified ${restaurants.length} seeded restaurants:`);
    console.log(restaurants.map(r => `   - ${r.name} (${r.slug})`).join('\n'));

    console.log('\n=============================================');
    console.log('🎉 Database successfully imported & ready for production!');
    console.log('=============================================\n');
    await sql.end();
    process.exit(0);
  } catch (err) {
    console.error('\n❌ Import failed with error:', err.message);
    await sql.end({ timeout: 2 }).catch(() => {});
    process.exit(1);
  }
}

importDatabase();
