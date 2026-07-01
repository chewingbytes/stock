import { prisma } from "../db";
import { importFixtures } from "./fixtureImport";

importFixtures()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
