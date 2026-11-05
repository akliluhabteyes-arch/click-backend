/**
 * Creates the superadmin account, or resets its password if it already exists.
 *
 *   npm run create:superadmin -- <username> <password> "<Full Name>"
 */
import { supabase } from "../src/config/supabase.js";
import { hashPassword } from "../src/utils/password.js";

const [, , rawUsername, password, fullName = "Super Admin"] = process.argv;
const username = (rawUsername || "").trim().toLowerCase();

const exit = (message) => {
  console.error(`\n✖ ${message}\n`);
  console.error('Usage: npm run create:superadmin -- <username> <password> "<Full Name>"\n');
  process.exit(1);
};

if (!/^[a-z0-9._-]{3,50}$/.test(username)) {
  exit("Username must be 3–50 characters: letters, numbers, dot, dash or underscore");
}
if (!password || password.length < 8) exit("Password must be at least 8 characters");

const run = async () => {
  const { data: existing, error: findError } = await supabase
    .from("admin_users")
    .select("id")
    .eq("username", username)
    .maybeSingle();
  if (findError) {
    if (findError.code === "42P01" || /admin_users/.test(findError.message)) {
      exit("Table admin_users not found. Run database/002_admin_users.sql in Supabase first.");
    }
    throw findError;
  }

  const row = {
    username,
    full_name: fullName,
    password_hash: await hashPassword(password),
    role: "superadmin",
    is_active: true,
    password_changed_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await supabase.from("admin_users").update(row).eq("id", existing.id)
    : await supabase.from("admin_users").insert(row);
  if (error) throw error;

  console.log(
    `\n✔ Superadmin "${username}" ${existing ? "updated (password reset)" : "created"}.` +
      `\n  Log in at http://localhost:5000/admin\n`
  );
};

run().catch((err) => exit(err.message || String(err)));
