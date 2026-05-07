const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Updating appointments...');
  const result = await prisma.appointment.updateMany({
    where: {
      postNumber: null,
    },
    data: {
      postNumber: 1,
    },
  });
  console.log(`Successfully updated ${result.count} appointments.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
