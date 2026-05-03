import { prisma } from "../src/server/db";
import { importFixtures } from "../src/server/import/fixtureImport";

importFixtures()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
