import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: {
    user: {
      findUnique: jest.Mock;
      update: jest.Mock;
      create: jest.Mock;
    };
  };
  let jwtService: { signAsync: jest.Mock };

  const baseUser = {
    id: 'user-1',
    name: 'Test',
    email: 'test@example.com',
    passwordHash: '',
    role: UserRole.SALES,
    refreshTokenHash: null as string | null,
    refreshTokenVersion: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    baseUser.passwordHash = await bcrypt.hash('Password123!', 12);
    prisma = {
      user: {
        findUnique: jest.fn(),
        update: jest.fn(),
        create: jest.fn(),
      },
    };
    jwtService = {
      signAsync: jest
        .fn()
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token'),
    };

    const configService = {
      get: jest.fn((key: string) => {
        const map: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret-min-32-characters-long',
          JWT_REFRESH_SECRET: 'refresh-secret-min-32-characters-long',
          JWT_ACCESS_EXPIRES_IN: '15m',
          JWT_REFRESH_EXPIRES_IN: '7d',
        };
        return map[key];
      }),
      getOrThrow: jest.fn((key: string) => {
        const map: Record<string, string> = {
          JWT_ACCESS_SECRET: 'access-secret-min-32-characters-long',
          JWT_REFRESH_SECRET: 'refresh-secret-min-32-characters-long',
        };
        return map[key];
      }),
    };

    service = new AuthService(
      prisma as unknown as PrismaService,
      jwtService as unknown as JwtService,
      configService as unknown as ConfigService,
    );
  });

  it('rejects invalid login credentials', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    await expect(
      service.login({ email: 'test@example.com', password: 'wrong' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('issues tokens on valid login', async () => {
    prisma.user.findUnique.mockResolvedValue(baseUser);
    prisma.user.update.mockResolvedValue(baseUser);

    const result = await service.login({
      email: 'test@example.com',
      password: 'Password123!',
    });

    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(prisma.user.update).toHaveBeenCalled();
  });

  it('detects refresh token version mismatch (reuse)', async () => {
    prisma.user.findUnique.mockResolvedValue({
      ...baseUser,
      refreshTokenHash: await bcrypt.hash('old-refresh', 12),
      refreshTokenVersion: 2,
    });
    prisma.user.update.mockResolvedValue(baseUser);

    await expect(
      service.refresh('user-1', 'old-refresh', 1),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
