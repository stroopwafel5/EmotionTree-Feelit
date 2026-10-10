/**
 * add-school.js
 * --------------------------------------------------------------------------
 * Adds a school or kindergarten (only the app owner can do this).
 * The server must be running. The school gets an email with its login link.
 *
 *   ADMIN_KEY=your-secret npm run add-school -- --name "Sunflower Kindergarten" --email teacher@sunflower.org --kind kindergarten
 *
 * Options:
 *   --name    the school's name (shown to parents and children)
 *   --email   the school's email (gets the login links)
 *   --kind    "school" or "kindergarten"
 *   --server  server address (default http://localhost:8787)
 */
const args = Object.fromEntries(
  process.argv.slice(2).reduce((pairs, arg, i, all) => {
    if (arg.startsWith('--')) {
      pairs.push([arg.slice(2), all[i + 1]]);
    }
    return pairs;
  }, []),
);

const server = args.server ?? 'http://localhost:8787';
const adminKey = process.env.ADMIN_KEY ?? 'dev-admin-key';

if (!args.name || !args.email) {
  console.log('Usage: npm run add-school -- --name "School name" --email school@mail.com --kind school|kindergarten');
  process.exit(1);
}

const response = await fetch(`${server}/admin/schools`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Admin-Key': adminKey },
  body: JSON.stringify({ name: args.name, email: args.email, kind: args.kind ?? 'school' }),
});
const data = await response.json();
if (!response.ok) {
  console.error('❌', data.error);
  process.exit(1);
}
console.log(`✅ Added "${data.school.name}" (${data.school.kind}). A login link was emailed to ${data.school.email}.`);
console.log(`   You can also give the school this link yourself (it works once, for 7 days):`);
console.log(`   ${data.loginUrl}`);
console.log('   On the school page, the school can set a password for next time.');
