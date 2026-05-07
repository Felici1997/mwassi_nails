import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seeding...');

  // 1. Create a default Salon
  const salon = await prisma.salon.upsert({
    where: { name: 'Salon d'Onglerie Prestige' },
    update: {},
    create: {
      name: 'Salon d'Onglerie Prestige',
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

  const services = [
    // Sur Ongles Naturels
    { name: 'Vernis Semi Permanent', duration: 30, price: 5000, description: 'Prix: 5 000 / 8 000 / 10 000 Fcfa' },
    { name: 'Gainage Acrigel + VSP', duration: 70, price: 10000, description: 'Prix: 10 000 / 13 000 / 15 000 Fcfa' },
    { name: 'Gainage Gel + VSP', duration: 80, price: 12000, description: 'Prix: 12 000 / 15 000 / 17 000 Fcfa' },
    
    // Construction Chablon
    { name: 'Construction Chablon Taille 1-3', duration: 90, price: 20000, description: 'Prix: 20 000 / 23 000 / 25 000 Fcfa' },
    { name: 'Construction Chablon Taille 4-6', duration: 135, price: 22000, description: 'Prix: 22 000 / 25 000 / 27 000 Fcfa' },
    { name: 'Construction Chablon Taille 6+', duration: 180, price: 25000, description: 'Prix: 25 000 / 28 000 / 30 000 Fcfa' },
    { name: 'Remplissage Chablon', duration: 90, price: 12000, description: 'Prix: 12 000 / 15 000 / 17 000 Fcfa' },
    { name: 'Modification De Forme Chablon', duration: 30, price: 5000, description: 'Prix: 5 000 Fcfa' },

    // Construction Pop it
    { name: 'Construction Pop it Taille 1-3', duration: 105, price: 20000, description: 'Prix: 20 000 / 23 000 / 25 000 Fcfa' },
    { name: 'Construction Pop it Taille 4-6', duration: 150, price: 25000, description: 'Prix: 25 000 / 28 000 / 30 000 Fcfa' },
    { name: 'Construction Pop it Taille 6+', duration: 195, price: 27000, description: 'Prix: 27 000 / 30 000 / 32 000 Fcfa' },
    { name: 'Remplissage Pop it', duration: 90, price: 15000, description: 'Prix: 15 000 / 18 000 / 20 000 Fcfa' },
    { name: 'Modification De Forme Pop it', duration: 30, price: 7000, description: 'Prix: 7 000 Fcfa' },

    // Sur Capsules
    { name: 'Capsule + VSP', duration: 60, price: 10000, description: 'Prix: 10 000 / 13 000 / 15 000 Fcfa' },
    { name: 'Capsule + VSP + Acrigel', duration: 90, price: 15000, description: 'Prix: 15 000 / 18 000 / 20 000 Fcfa' },
    { name: 'Capsule + VSP + Gel', duration: 120, price: 17000, description: 'Prix: 17 000 / 20 000 / 22 000 Fcfa' },
    { name: 'Remplissage Capsule', duration: 90, price: 12000, description: 'Prix: 12 000 / 15 000 / 17 000 Fcfa' },
    { name: 'Modification De Forme Capsule', duration: 30, price: 5000, description: 'Prix: 5 000 Fcfa' },

    // Soins
    { name: 'Manucure', duration: 30, price: 5000, description: 'Prix: 5 000 / 8 000 Fcfa' },
    { name: 'Manucure + Paraffine', duration: 50, price: 13000, description: 'Prix: 13 000 / 16 000 Fcfa' },
    { name: 'Pédicure', duration: 90, price: 7000, description: 'Prix: 7 000 / 10 000 Fcfa' },
    { name: 'Pédicure + Paraffine', duration: 110, price: 15000, description: 'Prix: 15 000 / 18 000 Fcfa' },

    // Nail Art
    { name: 'French Manucure Simple / Baby Boomer', duration: 15, price: 500, description: 'Prix: 500 Fcfa' },
    { name: 'French Manucure Composé', duration: 20, price: 750, description: 'Prix: 750 / 1 000 Fcfa' },
    { name: 'Baby Boomer Acrigel', duration: 20, price: 750, description: 'Prix: 750 Fcfa' },
    { name: 'Poudre Neon, Holo, Miroir', duration: 15, price: 500, description: 'Prix: 500 Fcfa' },
    { name: 'Pierres', duration: 15, price: 500, description: 'Prix: 500 / 3 500 Fcfa' },
    { name: 'Cat Eyes', duration: 15, price: 750, description: 'Prix: 750 Fcfa' },
    { name: 'Feuilles d\'Or', duration: 15, price: 500, description: 'Prix: 500 / 2 000 Fcfa' },
    { name: 'Dessins', duration: 30, price: 1000, description: 'Prix: 1 000 / 4 000 Fcfa' },

    // Dépose
    { name: 'Dépose Vernis Semi Permanent', duration: 20, price: 2000, description: 'Prix: 2 000 Fcfa' },
    { name: 'Dépose Capsule', duration: 30, price: 3000, description: 'Prix: 3 000 Fcfa' },
    { name: 'Dépose Construction', duration: 45, price: 5000, description: 'Prix: 5 000 Fcfa' },

    // Renforcement
    { name: 'Renforcement Semi Permanent + Ongles Courts', duration: 45, price: 20000, description: 'Prix: 20 000 / 22 000 Fcfa' },
    { name: 'Renforcement Semi Permanent + Ongles Longs', duration: 60, price: 25000, description: 'Prix: 25 000 / 27 000 Fcfa' },
    { name: 'Renforcement Acrigel + Ongles Moyens', duration: 90, price: 30000, description: 'Prix: 30 000 / 32 000 Fcfa' },
    { name: 'Renforcement Acrigel + Ongles Longs', duration: 105, price: 35000, description: 'Prix: 35 000 / 37 000 Fcfa' },
    { name: 'Renforcement Gel + Ongles Moyens', duration: 100, price: 33000, description: 'Prix: 33 000 / 35 000 Fcfa' },
    { name: 'Renforcement Gel + Ongles Longs', duration: 110, price: 38000, description: 'Prix: 38 000 / 40 000 Fcfa' },
    { name: 'Renforcement Chablon Taille 1-3', duration: 165, price: 40000, description: 'Prix: 40 000 / 42 000 Fcfa' },
    { name: 'Renforcement Chablon Taille 4-6', duration: 190, price: 45000, description: 'Prix: 45 000 / 47 000 Fcfa' },
    { name: 'Renforcement Chablon Taille 6+', duration: 240, price: 50000, description: 'Prix: 50 000 / 52 000 Fcfa' },
    { name: 'Manucure Russe', duration: 30, price: 15000, description: 'Prix: 15 000 Fcfa' },
    { name: 'Pédicure Russe', duration: 30, price: 15000, description: 'Prix: 15 000 Fcfa' },
  ];

  for (const s of services) {
    await prisma.service.create({
      data: {
        ...s,
        salonId: salon.id,
      },
    });
  }

  console.log('Seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
