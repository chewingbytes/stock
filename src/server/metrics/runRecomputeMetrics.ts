import { prisma } from "../db";
import { recomputeMetrics } from "./recomputeMetrics";

recomputeMetrics()
  .then((summary) => {
    console.log(JSON.stringify(summary, null, 2));
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
