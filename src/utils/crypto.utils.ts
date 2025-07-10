/**
 * Utility functions for cryptographic operations like password hashing
 */

import bcrypt from "bcrypt";
import crypto from "crypto";

/**
 * Default number of salt rounds for bcrypt
 * Higher values increase security but also increase computation time
 */
const DEFAULT_SALT_ROUNDS = 10;

/**
 * Hashes a plaintext password using bcrypt
 *
 * @param password The plaintext password to hash
 * @param saltRounds The number of salt rounds (default: 10)
 * @returns Promise resolving to the bcrypt hash
 */
export const hashPassword = async (
  password: string,
  saltRounds: number = DEFAULT_SALT_ROUNDS
): Promise<string> => {
  return bcrypt.hash(password, saltRounds);
};

/**
 * Compares a plaintext password with a stored hash
 *
 * @param password The plaintext password to verify
 * @param hash The stored bcrypt hash to compare against
 * @returns Promise resolving to a boolean indicating if the password matches
 */
export const verifyPassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

/**
 * Generates a secure random token of specified length
 * Useful for creating session tokens, reset tokens, etc.
 *
 * @param length The length of the token to generate (default: A strong 64 characters)
 * @returns A random string token
 */
export const generateRandomToken = (length: number = 64): string => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
};

/**
 * Generates a secure random password that meets common complexity requirements
 *
 * @param length The length of the password (default: 12)
 * @returns A secure random password
 */
export const generateRandomPassword = (length: number = 12): string => {
  // Define character pools
  const uppercaseChars = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // Omitting similar characters like I and O
  const lowercaseChars = "abcdefghijkmnopqrstuvwxyz"; // Omitting similar characters like l
  const numericChars = "23456789"; // Omitting 0 and 1 which can look like O and l
  const specialChars = "!@#$%^&*_-+=";

  // Ensure at least one character from each group
  let password = "";
  password += uppercaseChars.charAt(
    Math.floor(crypto.randomInt(uppercaseChars.length))
  );
  password += lowercaseChars.charAt(
    Math.floor(crypto.randomInt(lowercaseChars.length))
  );
  password += numericChars.charAt(
    Math.floor(crypto.randomInt(numericChars.length))
  );
  password += specialChars.charAt(
    Math.floor(crypto.randomInt(specialChars.length))
  );

  // Fill the rest of the password with random characters from all pools
  const allChars =
    uppercaseChars + lowercaseChars + numericChars + specialChars;
  for (let i = 4; i < length; i++) {
    password += allChars.charAt(Math.floor(crypto.randomInt(allChars.length)));
  }

  // Shuffle the password characters to avoid predictable pattern
  return shuffleString(password);
};

/**
 * Shuffles the characters in a string
 *
 * @param str The string to shuffle
 * @returns The shuffled string
 */
function shuffleString(str: string): string {
  const arr = str.split("");

  // Fisher-Yates shuffle algorithm
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(crypto.randomInt(i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr.join("");
}
