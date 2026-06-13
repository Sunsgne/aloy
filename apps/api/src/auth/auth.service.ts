import { createHash, randomBytes } from "node:crypto";
import { prisma } from "@aloy/database";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { compare } from "bcryptjs";

interface LoginInput {
  tenantSlug?: string;
  email: string;
  password: string;
}

interface AuthUser {
  id: string;
  tenantId: string | null;
  userRoles: Array<{
    role: {
      name: string;
      permissions: Array<{ permission: { key: string } }>;
    };
  }>;
}

@Injectable()
export class AuthService {
  constructor(private readonly jwtService: JwtService) {}

  async login(input: LoginInput) {
    const user = await prisma.user.findFirst({
      where: {
        email: input.email.toLowerCase(),
        deletedAt: null,
        status: "ACTIVE",
        tenant: input.tenantSlug
          ? { slug: input.tenantSlug, status: "ACTIVE", deletedAt: null }
          : null,
      },
      include: {
        userRoles: {
          where: { role: { deletedAt: null } },
          include: {
            role: { include: { permissions: { include: { permission: true } } } },
          },
        },
      },
    });

    if (!user || !(await compare(input.password, user.passwordHash))) {
      throw new UnauthorizedException("Invalid credentials");
    }

    return this.issueTokens(user);
  }

  async refresh(rawRefreshToken: string) {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash: this.hashToken(rawRefreshToken) },
      include: {
        user: {
          include: {
            userRoles: {
              where: { role: { deletedAt: null } },
              include: {
                role: { include: { permissions: { include: { permission: true } } } },
              },
            },
          },
        },
      },
    });

    if (
      !storedToken ||
      storedToken.revokedAt ||
      storedToken.expiresAt <= new Date() ||
      storedToken.user.status !== "ACTIVE"
    ) {
      throw new UnauthorizedException("Invalid refresh token");
    }

    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });
    return this.issueTokens(storedToken.user);
  }

  async logout(rawRefreshToken: string) {
    await prisma.refreshToken.updateMany({
      where: { tokenHash: this.hashToken(rawRefreshToken), revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { success: true };
  }

  private async issueTokens(user: AuthUser) {
    const roles = user.userRoles.map(({ role }) => role.name);
    const permissions = [
      ...new Set(
        user.userRoles.flatMap(({ role }) =>
          role.permissions.map(({ permission }) => permission.key),
        ),
      ),
    ];
    const accessToken = await this.jwtService.signAsync({
      sub: user.id,
      tenantId: user.tenantId,
      roles,
      permissions,
    });
    const refreshToken = randomBytes(48).toString("base64url");

    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash: this.hashToken(refreshToken),
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private hashToken(token: string) {
    return createHash("sha256").update(token).digest("hex");
  }
}
