import { database } from "../../../database/database";
import { issueInvite } from "../services/createInvite";

const [email, ...nameParts] = process.argv.slice(2);
const name = nameParts.join(" ");

async function createFirstManager(): Promise<void> {
  if (!email || !name) {
    throw new Error(
      'Usage: npm run create-first-manager -- you@studio.com "Your Name"'
    );
  }

  const existing = await database.query("SELECT 1 FROM users LIMIT 1");
  if (existing.rowCount)
    throw new Error("Accounts already exist. Ask a manager to invite you.");

  const invite = await issueInvite(
    { email, name, role: "creative_lead" },
    null
  );
  console.log(`Open this link to set your password:\n${invite.inviteLink}`);
}

createFirstManager()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => void database.end());
