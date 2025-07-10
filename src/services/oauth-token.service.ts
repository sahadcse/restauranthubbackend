import { google } from "googleapis";
import { PrismaClient } from "../../prisma/generated/prisma";
import logger from "../utils/logger";

const prisma = new PrismaClient();

export interface TokenData {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
  token_type: string;
  scope: string;
}

export class OAuthTokenService {
  private static oauth2Client: any = null;

  /**
   * Initialize OAuth2 client
   */
  private static initializeOAuth2Client(): void {
    if (!this.oauth2Client) {
      this.oauth2Client = new google.auth.OAuth2(
        process.env.ClientID,
        process.env.Clientsecret,
        "https://developers.google.com/oauthplayground"
      );

      this.oauth2Client.setCredentials({
        refresh_token: process.env.EMAIL_REFRESH_TOKEN,
      });
    }
  }

  /**
   * Get fresh access token with enhanced error handling
   */
  static async getFreshAccessToken(): Promise<string> {
    try {
      this.initializeOAuth2Client();

      // Try to get existing valid token from database
      const storedToken = await this.getStoredToken();

      if (storedToken && this.isTokenValid(storedToken)) {
        return storedToken.access_token;
      }

      // Refresh token with better error handling
      try {
        const { credentials } = await this.oauth2Client.refreshAccessToken();

        if (!credentials.access_token) {
          throw new Error("No access token received from refresh");
        }

        // Store new token
        await this.storeToken({
          access_token: credentials.access_token,
          refresh_token:
            credentials.refresh_token || process.env.EMAIL_REFRESH_TOKEN!,
          expiry_date: credentials.expiry_date || Date.now() + 3600 * 1000,
          token_type: credentials.token_type || "Bearer",
          scope: credentials.scope || "https://mail.google.com/",
        });

        logger.info("OAuth access token refreshed successfully");
        return credentials.access_token;
      } catch (refreshError: any) {
        logger.error("OAuth refresh failed:", refreshError.message);

        // Handle specific OAuth errors
        if (refreshError.message?.includes("invalid_grant")) {
          logger.error(
            "Invalid grant error - refresh token may be expired or revoked"
          );
          throw new Error(
            "OAuth refresh token expired. Please reconfigure email authentication."
          );
        }

        if (refreshError.message?.includes("invalid_client")) {
          logger.error("Invalid client error - check OAuth credentials");
          throw new Error(
            "Invalid OAuth client credentials. Please check your configuration."
          );
        }

        throw new Error(`OAuth token refresh failed: ${refreshError.message}`);
      }
    } catch (error) {
      logger.error("Failed to get fresh access token:", error);

      // Return a more specific error message
      if (error instanceof Error) {
        throw error;
      }

      throw new Error("OAuth token service unavailable");
    }
  }

  /**
   * Store token in database
   */
  private static async storeToken(tokenData: TokenData): Promise<void> {
    try {
      await prisma.oAuthToken.upsert({
        where: {
          provider_service: {
            provider: "google",
            service: "gmail",
          },
        },
        update: {
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(tokenData.expiry_date),
          tokenType: tokenData.token_type,
          scope: tokenData.scope,
          updatedAt: new Date(),
        },
        create: {
          provider: "google",
          service: "gmail",
          accessToken: tokenData.access_token,
          refreshToken: tokenData.refresh_token,
          expiresAt: new Date(tokenData.expiry_date),
          tokenType: tokenData.token_type,
          scope: tokenData.scope,
        },
      });
    } catch (error) {
      logger.error("Failed to store OAuth token:", error);
      throw error;
    }
  }

  /**
   * Get stored token from database
   */
  private static async getStoredToken(): Promise<TokenData | null> {
    try {
      const storedToken = await prisma.oAuthToken.findUnique({
        where: {
          provider_service: {
            provider: "google",
            service: "gmail",
          },
        },
      });

      if (!storedToken) return null;

      return {
        access_token: storedToken.accessToken,
        refresh_token: storedToken.refreshToken,
        expiry_date: storedToken.expiresAt.getTime(),
        token_type: storedToken.tokenType,
        scope: storedToken.scope,
      };
    } catch (error) {
      logger.error("Failed to get stored token:", error);
      return null;
    }
  }

  /**
   * Check if token is valid (not expired)
   */
  private static isTokenValid(tokenData: TokenData): boolean {
    const now = Date.now();
    const bufferTime = 5 * 60 * 1000; // 5 minutes buffer
    return tokenData.expiry_date > now + bufferTime;
  }

  /**
   * Schedule automatic token refresh
   */
  static scheduleTokenRefresh(): void {
    // Refresh token every 50 minutes (tokens usually expire in 1 hour)
    setInterval(async () => {
      try {
        await this.getFreshAccessToken();
        logger.info("Scheduled token refresh completed");
      } catch (error) {
        logger.error("Scheduled token refresh failed:", error);
      }
    }, 50 * 60 * 1000);

    logger.info("OAuth token refresh scheduler started");
  }

  /**
   * Validate OAuth configuration
   */
  static validateConfiguration(): boolean {
    const requiredEnvVars = [
      "ClientID",
      "Clientsecret",
      "EMAIL_REFRESH_TOKEN",
      "EMAIL_ADDRESS",
    ];

    const missing = requiredEnvVars.filter((envVar) => !process.env[envVar]);

    if (missing.length > 0) {
      logger.error(`Missing OAuth configuration: ${missing.join(", ")}`);
      return false;
    }

    return true;
  }

  /**
   * Test OAuth token validity
   */
  static async testTokenValidity(): Promise<boolean> {
    try {
      if (!this.validateConfiguration()) {
        return false;
      }

      await this.getFreshAccessToken();
      logger.info("OAuth token test successful");
      return true;
    } catch (error) {
      logger.error("OAuth token test failed:", error);
      return false;
    }
  }
}
