import axios from "axios";
import prisma from "../../../../db";
import auth0Config from "../../../../config/auth0.config";
import { generateAuthTokens } from "../../../../utils/jwt.utils";
import { UserRole } from "../../../../../prisma/generated/prisma";
import AppError from "../../../../utils/AppError";
import logger from "../../../../utils/logger";
import { createUserAudit } from "../../../audit/audit.service";

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
  verified_email: boolean;
  locale?: string;
}

export interface FacebookUserInfo {
  id: string;
  email: string;
  name: string;
  first_name: string;
  last_name: string;
  picture: {
    data: {
      url: string;
    };
  };
}

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export interface FacebookTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

export class Auth0Service {
  /**
   * Exchange authorization code for access token (Google)
   */
  static async exchangeCodeForToken(
    code: string
  ): Promise<GoogleTokenResponse> {
    try {
      const response = await axios.post(
        "https://oauth2.googleapis.com/token",
        {
          code,
          client_id: auth0Config.google.clientId,
          client_secret: auth0Config.google.clientSecret,
          redirect_uri: auth0Config.google.redirectUri,
          grant_type: "authorization_code",
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error(
        "Failed to exchange code for token:",
        error.response?.data || error.message
      );
      throw new AppError("Failed to authenticate with Google", 400);
    }
  }

  /**
   * Exchange authorization code for access token (Facebook)
   */
  static async exchangeFacebookCodeForToken(
    code: string
  ): Promise<FacebookTokenResponse> {
    try {
      const response = await axios.post(
        "https://graph.facebook.com/v18.0/oauth/access_token",
        {
          client_id: auth0Config.facebook.appId,
          client_secret: auth0Config.facebook.appSecret,
          redirect_uri: auth0Config.facebook.redirectUri,
          code,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          timeout: 10000,
        }
      );

      return response.data;
    } catch (error: any) {
      logger.error(
        "Failed to exchange Facebook code for token:",
        error.response?.data || error.message
      );
      throw new AppError("Failed to authenticate with Facebook", 400);
    }
  }

  /**
   * Get user information from Google
   */
  static async getUserInfo(accessToken: string): Promise<GoogleUserInfo> {
    try {
      const response = await axios.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          timeout: 10000,
        }
      );

      if (!response.data.verified_email) {
        throw new AppError("Google account email is not verified", 400);
      }

      return response.data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      logger.error(
        "Failed to get Google user info:",
        error.response?.data || error.message
      );
      throw new AppError("Failed to get user information from Google", 400);
    }
  }

  /**
   * Get user information from Facebook
   */
  static async getFacebookUserInfo(
    accessToken: string
  ): Promise<FacebookUserInfo> {
    try {
      const response = await axios.get("https://graph.facebook.com/me", {
        params: {
          fields: "id,email,name,first_name,last_name,picture",
          access_token: accessToken,
        },
        timeout: 10000,
      });

      if (!response.data.email) {
        throw new AppError(
          "Facebook account does not have a verified email",
          400
        );
      }

      return response.data;
    } catch (error: any) {
      if (error instanceof AppError) throw error;

      logger.error(
        "Failed to get Facebook user info:",
        error.response?.data || error.message
      );
      throw new AppError("Failed to get user information from Facebook", 400);
    }
  }

  /**
   * Find or create user from Google OAuth
   */
  static async findOrCreateUser(
    googleUser: GoogleUserInfo,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Check if user exists by email
      let user = await prisma.user.findUnique({
        where: { email: googleUser.email },
      });

      const isNewUser = !user;

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: googleUser.email,
            firstName: googleUser.given_name,
            lastName: googleUser.family_name,
            avatarUrl: googleUser.picture,
            provider: "google",
            providerId: googleUser.id,
            role: UserRole.CUSTOMER,
            accountStatus: "ACTIVE", // Google accounts are pre-verified
            privacyConsent: true,
            consentGivenAt: new Date(),
            passwordHash: "google_oauth", // Placeholder for OAuth users
          },
        });

        // Create audit entry for new user
        await createUserAudit({
          userId: user.id,
          operation: "GOOGLE_OAUTH_REGISTER",
          ipAddress,
          userAgent,
        });

        logger.info(`New user created via Google OAuth: ${user.email}`);
      } else {
        // Update existing user's Google info if needed
        const updateData: any = {
          lastLoginAt: new Date(),
          lastActivityAt: new Date(),
        };

        // Update provider info if not set
        if (!user.provider || user.provider !== "google") {
          updateData.provider = "google";
          updateData.providerId = googleUser.id;
        }

        // Update avatar if available
        if (googleUser.picture && googleUser.picture !== user.avatarUrl) {
          updateData.avatarUrl = googleUser.picture;
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        // Create audit entry for login
        await createUserAudit({
          userId: user.id,
          operation: "GOOGLE_OAUTH_LOGIN",
          ipAddress,
          userAgent,
        });

        logger.info(`User logged in via Google OAuth: ${user.email}`);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AppError("User account is deactivated", 403);
      }

      // Generate tokens
      const tokens = generateAuthTokens({
        userId: user.id,
        role: user.role,
        email: user.email,
      });

      // Create session
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.accessToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress,
          userAgent,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          isNewUser,
        },
        tokens,
        session,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error("Failed to find or create user:", error);
      throw new AppError("Failed to process user authentication", 500);
    }
  }

  /**
   * Find or create user from Facebook OAuth
   */
  static async findOrCreateFacebookUser(
    facebookUser: FacebookUserInfo,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Check if user exists by email
      let user = await prisma.user.findUnique({
        where: { email: facebookUser.email },
      });

      const isNewUser = !user;

      if (!user) {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: facebookUser.email,
            firstName: facebookUser.first_name,
            lastName: facebookUser.last_name,
            avatarUrl: facebookUser.picture?.data?.url,
            provider: "facebook",
            providerId: facebookUser.id,
            role: UserRole.CUSTOMER,
            accountStatus: "ACTIVE", // Facebook accounts are pre-verified
            privacyConsent: true,
            consentGivenAt: new Date(),
            passwordHash: "facebook_oauth", // Placeholder for OAuth users
          },
        });

        // Create audit entry for new user
        await createUserAudit({
          userId: user.id,
          operation: "FACEBOOK_OAUTH_REGISTER",
          ipAddress,
          userAgent,
        });

        logger.info(`New user created via Facebook OAuth: ${user.email}`);
      } else {
        // Update existing user's Facebook info if needed
        const updateData: any = {
          lastLoginAt: new Date(),
          lastActivityAt: new Date(),
        };

        // Update provider info if not set
        if (!user.provider || user.provider !== "facebook") {
          updateData.provider = "facebook";
          updateData.providerId = facebookUser.id;
        }

        // Update avatar if available
        if (
          facebookUser.picture?.data?.url &&
          facebookUser.picture.data.url !== user.avatarUrl
        ) {
          updateData.avatarUrl = facebookUser.picture.data.url;
        }

        user = await prisma.user.update({
          where: { id: user.id },
          data: updateData,
        });

        // Create audit entry for login
        await createUserAudit({
          userId: user.id,
          operation: "FACEBOOK_OAUTH_LOGIN",
          ipAddress,
          userAgent,
        });

        logger.info(`User logged in via Facebook OAuth: ${user.email}`);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AppError("User account is deactivated", 403);
      }

      // Generate tokens
      const tokens = generateAuthTokens({
        userId: user.id,
        role: user.role,
        email: user.email,
      });

      // Create session
      const session = await prisma.session.create({
        data: {
          userId: user.id,
          token: tokens.accessToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          ipAddress,
          userAgent,
        },
      });

      return {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          avatarUrl: user.avatarUrl,
          isNewUser,
        },
        tokens,
        session,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error("Failed to find or create Facebook user:", error);
      throw new AppError("Failed to process user authentication", 500);
    }
  }

  /**
   * Handle complete Google OAuth flow
   */
  static async handleGoogleCallback(
    code: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Exchange code for token
      const tokenData = await this.exchangeCodeForToken(code);

      // Get user info
      const googleUser = await this.getUserInfo(tokenData.access_token);

      // Find or create user
      const result = await this.findOrCreateUser(
        googleUser,
        ipAddress,
        userAgent
      );

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error("Google OAuth callback failed:", error);
      throw new AppError("Google authentication failed", 500);
    }
  }

  /**
   * Handle complete Facebook OAuth flow
   */
  static async handleFacebookCallback(
    code: string,
    ipAddress?: string,
    userAgent?: string
  ) {
    try {
      // Exchange code for token
      const tokenData = await this.exchangeFacebookCodeForToken(code);

      // Get user info
      const facebookUser = await this.getFacebookUserInfo(
        tokenData.access_token
      );

      // Find or create user
      const result = await this.findOrCreateFacebookUser(
        facebookUser,
        ipAddress,
        userAgent
      );

      return result;
    } catch (error) {
      if (error instanceof AppError) throw error;

      logger.error("Facebook OAuth callback failed:", error);
      throw new AppError("Facebook authentication failed", 500);
    }
  }
}
