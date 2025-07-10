/**
 * Utility functions for common validation tasks
 */

/**
 * Validates if the provided string is a properly formatted email
 * @param email The email string to validate
 * @returns boolean indicating if the email is valid
 */
export const isValidEmail = (email: string): boolean => {
  // RFC 5322 compliant email regex
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(email);
};

/**
 * Validates if a password meets minimum security requirements
 * @param password The password to validate
 * @param minLength Minimum length required (default: 8)
 * @param requireSpecialChar Whether to require at least one special character (default: false)
 * @param requireNumber Whether to require at least one number (default: false)
 * @returns boolean indicating if the password is valid
 */
export const isValidPassword = (
  password: string,
  minLength = 8,
  requireSpecialChar = false,
  requireNumber = false
): boolean => {
  if (!password || password.length < minLength) {
    return false;
  }

  if (
    requireSpecialChar &&
    !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(password)
  ) {
    return false;
  }

  if (requireNumber && !/\d/.test(password)) {
    return false;
  }

  return true;
};
