import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const permissions = [
  ["tenant.read", "View tenant records"],
  ["tenant.write", "Create, update, and delete tenant records"],
  ["user.read", "View users in the current tenant"],
  ["user.write", "Create, update, and delete users in the current tenant"],
  ["role.read", "View roles and the permission catalog"],
  ["role.write", "Create, update, and delete roles"],
  ["subscription.read", "View the current tenant subscription and quotas"],
  ["subscription.write", "Create tenant subscriptions and quotas"],
  ["audit.read", "View tenant audit events"],
  ["api-token.read", "View API token metadata"],
  ["api-token.write", "Create and revoke API tokens"],
  ["site.read", "View sites in the current tenant"],
  ["site.write", "Create and update sites in the current tenant"],
  ["device.read", "View devices and onboarding state"],
  ["device.write", "Create and update devices"],
  ["onboarding.read", "View RouterOS onboarding sessions"],
  ["onboarding.write", "Issue bootstrap tokens and manage onboarding"],
];

try {
  await prisma.$transaction(
    permissions.map(([key, description]) =>
      prisma.permission.upsert({
        where: { key },
        update: { description },
        create: { key, description },
      }),
    ),
  );
  console.log(`Seeded ${permissions.length} permissions.`);
} finally {
  await prisma.$disconnect();
}
