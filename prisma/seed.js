const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  console.log('Starting comprehensive seeding for Mwassi Nails...');

  const salonName = "Mwassi Nails";

  const salon = await prisma.salon.upsert({
    where: { name: salonName },
    update: {},
    create: {
      name: salonName,
      createdBy: {
        connectOrCreate: {
          where: { email: 'admin@nailbook.com' },
          create: {
            email: 'admin@nailbook.com',
            givenName: 'Admin',
            familyName: 'NailBook',
          },
        },
      },
    },
  });

  const servicesData = [
    // Sur Ongles Naturels
    { name: 'Vernis Semi Permanent', duration: 30, price: 5000, category: 'Sur Ongles Naturels', description: 'Tarifs: 5 000 / 8 000 / 10 000 FCFA' },
    { name: 'Gainage Acrigel + VSP', duration: 70, price: 10000, category: 'Sur Ongles Naturels', description: 'Tarifs: 10 000 / 13 000 / 15 000 FCFA' },
    { name: 'Gainage Gel + VSP', duration: 80, price: 12000, category: 'Sur Ongles Naturels', description: 'Tarifs: 12 000 / 15 000 / 17 000 FCFA' },

    // Construction Chablon
    { name: 'Construction Chablon Taille 1-3', duration: 90, price: 20000, category: 'Construction Chablon', description: 'Tarifs: 20 000 / 23 000 / 25 000 FCFA' },
    { name: 'Construction Chablon Taille 4-6', duration: 135, price: 22000, category: 'Construction Chablon', description: 'Tarifs: 22 000 / 25 000 / 27 000 FCFA' },
    { name: 'Construction Chablon Taille 6+', duration: 180, price: 25000, category: 'Construction Chablon', description: 'Tarifs: 25 000 / 28 000 / 30 000 FCFA' },
    { name: 'Remplissage Chablon', duration: 90, price: 12000, category: 'Construction Chablon', description: 'Tarifs: 12 000 / 15 000 / 17 000 FCFA' },
    { name: 'Modification De Forme Chablon', duration: 30, price: 5000, category: 'Construction Chablon', description: 'Prix unique: 5 000 FCFA' },

    // Construction Pop it
    { name: 'Construction Pop it Taille 1-3', duration: 105, price: 20000, category: 'Construction Pop it', description: 'Tarifs: 20 000 / 23 000 / 25 000 FCFA' },
    { name: 'Construction Pop it Taille 4-6', duration: 150, price: 25000, category: 'Construction Pop it', description: 'Tarifs: 25 000 / 28 000 / 30 000 FCFA' },
    { name: 'Construction Pop it Taille 6+', duration: 195, price: 27000, category: 'Construction Pop it', description: 'Tarifs: 27 000 / 30 000 / 32 000 FCFA' },
    { name: 'Remplissage Pop it', duration: 90, price: 15000, category: 'Construction Pop it', description: 'Tarifs: 15 000 / 18 000 / 20 000 FCFA' },
    { name: 'Modification De Forme Pop it', duration: 30, price: 7000, category: 'Construction Pop it', description: 'Prix unique: 7 000 FCFA' },

    // Sur Capsules
    { name: 'Capsule + VSP', duration: 60, price: 10000, category: 'Sur Capsules', description: 'Tarifs: 10 000 / 13 000 / 15 000 FCFA' },
    { name: 'Capsule + VSP + Acrigel', duration: 90, price: 15000, category: 'Sur Capsules', description: 'Tarifs: 15 000 / 18 000 / 20 000 FCFA' },
    { name: 'Capsule + VSP + Gel', duration: 120, price: 17000, category: 'Sur Capsules', description: 'Tarifs: 17 000 / 20 000 / 22 000 FCFA' },
    { name: 'Remplissage Capsule', duration: 90, price: 12000, category: 'Sur Capsules', description: 'Tarifs: 12 000 / 15 000 / 17 000 FCFA' },
    { name: 'Modification De Forme Capsule', duration: 30, price: 5000, category: 'Sur Capsules', description: 'Prix unique: 5 000 FCFA' },

    // Soins
    { name: 'Manucure', duration: 30, price: 5000, category: 'Soins', description: 'Tarifs: 5 000 / 8 000 FCFA' },
    { name: 'Manucure + Paraffine', duration: 50, price: 13000, category: 'Soins', description: 'Tarifs: 13 000 / 16 000 FCFA' },
    { name: 'Pédicure', duration: 90, price: 7000, category: 'Soins', description: 'Tarifs: 7 000 / 10 000 FCFA' },
    { name: 'Pédicure + Paraffine', duration: 110, price: 15000, category: 'Soins', description: 'Tarifs: 15 000 / 18 000 FCFA' },

    // Nail Art (Par Doigt)
    { name: 'French Manucure Simple / Baby Boomer (VSP)', duration: 15, price: 500, category: 'Nail Art', description: 'Prix: 500 FCFA' },
    { name: 'French Manucure Composé (VSP)', duration: 20, price: 750, category: 'Nail Art', description: 'Tarifs: 750 / 1 000 FCFA' },
    { name: 'Baby Boomer Acrigel', duration: 20, price: 750, category: 'Nail Art', description: 'Prix: 750 FCFA' },
    { name: 'Poudre Neon, Holo, Miroir', duration: 15, price: 500, category: 'Nail Art', description: 'Prix: 500 FCFA' },
    { name: 'Pierres', duration: 15, price: 500, category: 'Nail Art', description: 'Tarifs: 500 / 3 500 FCFA' },
    { name: 'Cat Eyes', duration: 15, price: 750, category: 'Nail Art', description: 'Prix: 750 FCFA' },
    { name: 'Feuilles d\'Or', duration: 15, price: 500, category: 'Nail Art', description: 'Tarifs: 500 / 2 000 FCFA' },
    { name: 'Dessins', duration: 30, price: 1000, category: 'Nail Art', description: 'Tarifs: 1 000 / 4 000 FCFA' },

    // Dépose
    { name: 'Dépose Vernis Semi Permanent', duration: 20, price: 2000, category: 'Dépose', description: 'Prix: 2 000 FCFA' },
    { name: 'Dépose Capsule', duration: 30, price: 3000, category: 'Dépose', description: 'Prix: 3 000 FCFA' },
    { name: 'Dépose Construction', duration: 45, price: 5000, category: 'Dépose', description: 'Prix: 5 000 FCFA' },

    // Renforcement (Signature Mwassi)
    { name: 'Renforcement Semi Permanent + Ongles Courts', duration: 45, price: 20000, category: 'Signature Mwassi', description: 'Tarifs: 20 000 / 22 000 FCFA' },
    { name: 'Renforcement Semi Permanent + Ongles Longs', duration: 60, price: 25000, category: 'Signature Mwassi', description: 'Tarifs: 25 000 / 27 000 FCFA' },
    { name: 'Renforcement Acrigel + Ongles Moyens', duration: 90, price: 30000, category: 'Signature Mwassi', description: 'Tarifs: 30 000 / 32 000 FCFA' },
    { name: 'Renforcement Acrigel + Ongles Longs', duration: 105, price: 35000, category: 'Signature Mwassi', description: 'Tarifs: 35 000 / 37 000 FCFA' },
    { name: 'Renforcement Gel + Ongles Moyens', duration: 100, price: 33000, category: 'Signature Mwassi', description: 'Tarifs: 33 000 / 35 000 FCFA' },
    { name: 'Renforcement Gel + Ongles Longs', duration: 110, price: 38000, category: 'Signature Mwassi', description: 'Tarifs: 38 000 / 40 000 FCFA' },
    { name: 'Signature Construction Chablon Taille 1-3', duration: 165, price: 40000, category: 'Signature Mwassi', description: 'Tarifs: 40 000 / 42 000 FCFA' },
    { name: 'Signature Construction Chablon Taille 4-6', duration: 190, price: 45000, category: 'Signature Mwassi', description: 'Tarifs: 45 000 / 47 000 FCFA' },
    { name: 'Signature Construction Chablon Taille 6+', duration: 240, price: 50000, category: 'Signature Mwassi', description: 'Tarifs: 50 000 / 52 000 FCFA' },
    { name: 'Manucure Russe', duration: 30, price: 15000, category: 'Signature Mwassi', description: 'Prix: 15 000 FCFA' },
    { name: 'Pédicure Russe', duration: 30, price: 15000, category: 'Signature Mwassi', description: 'Prix: 15 000 FCFA' },
  ];

  // Clear existing services to avoid duplicates on re-seed
  await prisma.service.deleteMany({
    where: { salonId: salon.id }
  });

  for (const s of servicesData) {
    await prisma.service.create({
      data: {
        ...s,
        salonId: salon.id,
      },
    });
  }

  console.log('Seeding completed successfully! All services added to Mwassi Nails.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
