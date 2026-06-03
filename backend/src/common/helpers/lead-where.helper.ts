import { UserRole, LeadStatus, Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../types/authenticated-user.type';


export function buildLeadWhereForUser(
  user: AuthenticatedUser,
): Prisma.LeadWhereInput {
  const base: Prisma.LeadWhereInput = { deletedAt: null };

  if (user.role === UserRole.DEVELOPER) {
    return { ...base, status: LeadStatus.QUALIFIED };
  }

  return base;
}