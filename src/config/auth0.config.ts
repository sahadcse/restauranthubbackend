import logger from "../utils/logger";

export interface GoogleOAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string;
  frontendUrl: string;
}

export interface FacebookOAuthConfig {
  appId: string;
  appSecret: string;
  redirectUri: string;
  scope: string;
  frontendUrl: string;
}

class Auth0Config {
  public readonly google: GoogleOAuthConfig;
  public readonly facebook: FacebookOAuthConfig;

  constructor() {
    this.google = this.initializeGoogleConfig();
    this.facebook = this.initializeFacebookConfig();
    this.validateConfiguration();
  }

  private initializeGoogleConfig(): GoogleOAuthConfig {
    return {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      redirectUri: process.env.GOOGLE_REDIRECT_URI || "",
      scope: "email profile",
      frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    };
  }

  private initializeFacebookConfig(): FacebookOAuthConfig {
    return {
      appId: process.env.FACEBOOK_APP_ID || "",
      appSecret: process.env.FACEBOOK_APP_SECRET || "",
      redirectUri: process.env.FACEBOOK_REDIRECT_URI || "",
      scope: "email,public_profile",
      frontendUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    };
  }

  private validateConfiguration(): void {
    const requiredGoogleEnvVars = [
      "GOOGLE_CLIENT_ID",
      "GOOGLE_CLIENT_SECRET",
      "GOOGLE_REDIRECT_URI",
    ];

    const requiredFacebookEnvVars = [
      "FACEBOOK_APP_ID",
      "FACEBOOK_APP_SECRET",
      "FACEBOOK_REDIRECT_URI",
    ];

    const missingGoogleVars = requiredGoogleEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    const missingFacebookVars = requiredFacebookEnvVars.filter(
      (envVar) => !process.env[envVar]
    );

    if (missingGoogleVars.length > 0) {
      logger.warn(
        `Missing Google OAuth configuration: ${missingGoogleVars.join(", ")}`
      );
    }

    if (missingFacebookVars.length > 0) {
      logger.warn(
        `Missing Facebook OAuth configuration: ${missingFacebookVars.join(
          ", "
        )}`
      );
    }

    if (missingGoogleVars.length === 0) {
      logger.info("Google OAuth configuration validated successfully");
    }

    if (missingFacebookVars.length === 0) {
      logger.info("Facebook OAuth configuration validated successfully");
    }
  }

  public getGoogleAuthUrl(state?: string): string {
    const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const params = new URLSearchParams({
      client_id: this.google.clientId,
      redirect_uri: this.google.redirectUri,
      response_type: "code",
      scope: this.google.scope,
      access_type: "offline",
      prompt: "consent",
      ...(state && { state }),
    });

    return `${baseUrl}?${params.toString()}`;
  }

  public getFacebookAuthUrl(state?: string): string {
    const baseUrl = "https://www.facebook.com/v18.0/dialog/oauth";
    const params = new URLSearchParams({
      client_id: this.facebook.appId,
      redirect_uri: this.facebook.redirectUri,
      response_type: "code",
      scope: this.facebook.scope,
      ...(state && { state }),
    });

    return `${baseUrl}?${params.toString()}`;
  }
}

export default new Auth0Config();
