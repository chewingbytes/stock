/**
 * Promote an existing account to ADMIN.
 *
 *   npx tsx scripts/setAdmin.ts you@example.com
 *
 * Use this to bootstrap the first admin; afterwards admins can promote others
 * from the /admin page.
 */
import { prisma } from "../src/server/db";

async function main() {
  const email = process.argv[2]?.trim().toLowerCase();

  if (!email) {
    console.error("Usage: tsx scripts/setAdmin.ts <email>");
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(
      `No account found for ${email}. Register the account first, then re-run.`,
    );
    process.exit(1);
  }

  const updated = await prisma.user.update({
    where: { email },
    data: { role: "ADMIN" },
    select: { email: true, role: true },
  });

  console.log(`${updated.email} is now ${updated.role}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
