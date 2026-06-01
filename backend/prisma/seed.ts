import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const SEED_USERS = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin123!',
    role: UserRole.ADMIN,
  },
  {
    name: 'Sales User',
    email: 'sales@example.com',
    password: 'Sales123!',
    role: UserRole.SALES,
  },
  {
    name: 'Developer User',
    email: 'developer@example.com',
    password: 'Developer123!',
    role: UserRole.DEVELOPER,
  },
] as const;

async function main() {
  for (const user of SEED_USERS) {
    const passwordHash = await bcrypt.hash(user.password, 12);
    await prisma.user.upsert({
      where: { email: user.email },
      update: {
        name: user.name,
        passwordHash,
        role: user.role,
        refreshTokenHash: null,
      },
      create: {
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role,
      },
    });
  }

  console.log('Seed completed: admin, sales, and developer users are ready.');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
