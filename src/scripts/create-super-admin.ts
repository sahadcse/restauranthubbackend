/**
 * Script to create the first SUPER_ADMIN user in the system
 * Run this script only once during initial setup
 *
 * Usage: npx ts-node src/scripts/create-super-admin.ts
 */
import {
  PrismaClient,
  UserRole,
  AccountStatus,
} from "../../prisma/generated/prisma";
import { hash } from "bcrypt";
import readline from "readline";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const promptQuestion = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

async function createSuperAdmin() {
  try {
    console.log("=========================================");
    console.log("SUPER ADMIN CREATION UTILITY");
    console.log("=========================================");
    console.log(
      "This script will create the first SUPER_ADMIN user in the system."
    );
    console.log("It should only be run once during initial setup.\n");

    // Check if SUPER_ADMIN already exists
    const existingSuperAdmin = await prisma.user.findFirst({
      where: { role: UserRole.SUPER_ADMIN },
    });

    if (existingSuperAdmin) {
      console.error("Error: A SUPER_ADMIN user already exists in the system.");
      console.log(`Email: ${existingSuperAdmin.email}`);
      return;
    }

    // Collect super admin information
    const email = await promptQuestion("Enter email address: ");
    const password = await promptQuestion(
      "Enter password (min 8 characters): "
    );
    const firstName = await promptQuestion("Enter first name: ");
    const lastName = await promptQuestion("Enter last name: ");
    const phoneNumber = await promptQuestion("Enter phone number (optional): ");

    // Validate inputs
    if (!email || !email.includes("@") || !password || password.length < 8) {
      console.error(
        "Error: Please provide a valid email and a password with at least 8 characters."
      );
      return;
    }

    // Hash the password
    const passwordHash = await hash(password, 10);

    // Create the SUPER_ADMIN user
    const superAdmin = await prisma.user.create({
      data: {
        id: uuidv4(),
        email,
        passwordHash,
        firstName: firstName || null,
        lastName: lastName || null,
        phoneNumber: phoneNumber || null,
        role: UserRole.SUPER_ADMIN,
        accountStatus: AccountStatus.ACTIVE,
        isActive: true,
        privacyConsent: true,
        consentGivenAt: new Date(),
      },
    });

    // Create audit log
    await prisma.userAudit.create({
      data: {
        userId: superAdmin.id,
        operation: "SUPER_ADMIN_CREATION",
        changes: { email, firstName, lastName, phoneNumber },
      },
    });

    console.log("\n=========================================");
    console.log("SUPER_ADMIN created successfully!");
    console.log(`User ID: ${superAdmin.id}`);
    console.log(`Email: ${superAdmin.email}`);
    console.log("=========================================");
    console.log(
      "You can now use these credentials to log in and create other admin users."
    );
  } catch (error) {
    console.error("An error occurred:", error);
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

createSuperAdmin();
