// After
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // After
  async findAll() {
    return this.prisma.user.findMany({
      where: { deactivatedAt: null },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

// After
async findById(id: string) {
  const user = await this.prisma.user.findFirst({
    where: { id, deactivatedAt: null },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}

  async create(dto: CreateUserDto) {
  const existing = await this.prisma.user.findUnique({
    where: { email: dto.email.toLowerCase() },
  });

  if (existing) {
    if (existing.deactivatedAt !== null) {
      // Reactivate the existing account instead of creating a duplicate
      return this.prisma.user.update({
        where: { id: existing.id },
        data: {
          name: dto.name,
          passwordHash: await bcrypt.hash(dto.password, 12),
          role: dto.role ?? UserRole.SALES,
          deactivatedAt: null,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          updatedAt: true,
        },
      });
    }
    throw new ConflictException('Email already registered');
  }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email.toLowerCase(),
        passwordHash,
        role: dto.role ?? UserRole.SALES,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);

    if (dto.email) {
      const emailTaken = await this.prisma.user.findFirst({
        where: { email: dto.email.toLowerCase(), id: { not: id } },
      });
      if (emailTaken) {
        throw new ConflictException('Email already registered');
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email?.toLowerCase(),
        role: dto.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

// After
async remove(id: string, requestingUserId: string) {
  await this.findById(id);
  await this.assertNotLastAdmin(id);

  await this.prisma.user.update({
    where: { id },
    data: { deactivatedAt: new Date() },
  });

  return { message: 'User deactivated' };
}

private async assertNotLastAdmin(targetId: string) {
  const target = await this.prisma.user.findUnique({
    where: { id: targetId },
    select: { role: true },
  });

  if (target?.role !== UserRole.ADMIN) return;

  const activeAdminCount = await this.prisma.user.count({
    where: { role: UserRole.ADMIN, deactivatedAt: null },
  });

  if (activeAdminCount <= 1) {
    throw new ForbiddenException('Cannot deactivate the last admin account');
  }
}
}
