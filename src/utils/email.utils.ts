import nodemailer from "nodemailer";
import { google } from "googleapis";
import logger from "./logger";
import SMTPTransport from "nodemailer/lib/smtp-transport";
import { OAuthTokenService } from "../services/oauth-token.service";
import { EmailQueueService } from "../services/email-queue.service";

// Email configuration
const EMAIL_ADDRESS = process.env.EMAIL_ADDRESS;
const EMAIL_PASSWORD = process.env.EMAIL_PASSWORD;
const CLIENT_ID = process.env.ClientID;
const CLIENT_SECRET = process.env.Clientsecret;
const REDIRECT_URI = "https://developers.google.com/oauthplayground";
const REFRESH_TOKEN = process.env.EMAIL_REFRESH_TOKEN;

/**
 * Create and configure nodemailer transport with enhanced error handling
 */
const createTransport = async () => {
  try {
    // Validate OAuth configuration first
    if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
      if (!OAuthTokenService.validateConfiguration()) {
        logger.warn(
          "OAuth configuration invalid, falling back to password authentication"
        );
        return createPasswordTransport();
      }

      try {
        const accessToken = await OAuthTokenService.getFreshAccessToken();

        const transportConfig: SMTPTransport.Options = {
          service: "gmail",
          auth: {
            type: "OAuth2",
            user: EMAIL_ADDRESS,
            clientId: CLIENT_ID,
            clientSecret: CLIENT_SECRET,
            refreshToken: REFRESH_TOKEN,
            accessToken: accessToken,
          },
        };

        const transport = nodemailer.createTransport(transportConfig);

        // Test the connection
        await transport.verify();
        logger.info("OAuth email transport created successfully");

        return transport;
      } catch (oauthError) {
        logger.error(
          "OAuth transport failed, attempting password fallback:",
          oauthError
        );

        // If OAuth fails, try password authentication as fallback
        if (EMAIL_PASSWORD) {
          logger.info("Falling back to password authentication");
          return createPasswordTransport();
        }

        throw oauthError;
      }
    }

    // Fallback to standard SMTP transport with password
    return createPasswordTransport();
  } catch (error) {
    logger.error(
      `Failed to create email transport: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    throw error;
  }
};

/**
 * Create password-based email transport
 */
const createPasswordTransport = () => {
  if (!EMAIL_PASSWORD) {
    throw new Error("Email password not configured and OAuth failed");
  }

  const transportConfig: SMTPTransport.Options = {
    service: "gmail",
    auth: {
      user: EMAIL_ADDRESS,
      pass: EMAIL_PASSWORD,
    },
  };

  const transport = nodemailer.createTransport(transportConfig);
  logger.info("Password email transport created successfully");

  return transport;
};

/**
 * Send email directly (bypassing queue)
 */
export const sendEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string
): Promise<boolean> => {
  try {
    // Create transporter
    const transporter = await createTransport();

    // Send email
    const info = await transporter.sendMail({
      from: `Restaurant Hub <${EMAIL_ADDRESS}>`,
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ""), // Strip HTML tags for plain text
      html,
    });

    logger.info(`Email sent: ${info.messageId} to ${to}`);
    return true;
  } catch (error) {
    logger.error(
      `Failed to send email: ${
        error instanceof Error ? error.message : String(error)
      }`
    );
    return false;
  }
};

/**
 * Queue email for delivery (recommended method)
 */
export const queueEmail = async (
  to: string,
  subject: string,
  html: string,
  text?: string,
  options?: {
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    template?: string;
    templateData?: any;
    scheduledFor?: Date;
  }
): Promise<void> => {
  await EmailQueueService.queueEmail({
    to,
    subject,
    html,
    text,
    priority: options?.priority,
    template: options?.template,
    templateData: options?.templateData,
    scheduledFor: options?.scheduledFor,
  });
};

/**
 * Send email using template (queued)
 */
export const sendTemplatedEmail = async (
  to: string,
  template:
    | "verification"
    | "password-reset"
    | "order-confirmation"
    | "order-status",
  data: any,
  options?: {
    priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
    scheduledFor?: Date;
  }
): Promise<void> => {
  let subject: string;
  let html: string;

  switch (template) {
    case "verification":
      subject = "Verify Your Email - Restaurant Hub";
      html = getVerificationEmailTemplate(data.userName, data.verificationLink);
      break;
    case "password-reset":
      subject = "Reset Your Password - Restaurant Hub";
      html = getPasswordResetEmailTemplate(data.userName, data.resetLink);
      break;
    case "order-confirmation":
      subject = `Order Confirmation #${data.orderNumber} - Restaurant Hub`;
      html = getOrderConfirmationTemplate(data);
      break;
    case "order-status":
      subject = `Order Update #${data.orderNumber} - Restaurant Hub`;
      html = getOrderStatusUpdateTemplate(data);
      break;
    default:
      throw new Error(`Unknown email template: ${template}`);
  }

  await queueEmail(to, subject, html, undefined, {
    priority: options?.priority || "NORMAL",
    template,
    templateData: data,
    scheduledFor: options?.scheduledFor,
  });
};

/**
 * Test email configuration and connection with detailed diagnostics
 */
export const testEmailConnection = async (): Promise<{
  success: boolean;
  message: string;
  details?: any;
}> => {
  try {
    // Test OAuth configuration first
    let oauthStatus = "not_configured";
    let oauthError = null;

    if (CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN) {
      try {
        const tokenValid = await OAuthTokenService.testTokenValidity();
        oauthStatus = tokenValid ? "working" : "failed";
      } catch (error) {
        oauthStatus = "failed";
        oauthError = error instanceof Error ? error.message : String(error);
        logger.warn("OAuth test failed:", oauthError);
      }
    }

    // Create and test transporter
    const transporter = await createTransport();
    await transporter.verify();

    // Determine which authentication method was used
    const authMethod = oauthStatus === "working" ? "OAuth2" : "Password";

    return {
      success: true,
      message: "Email connection successful. Your configuration is working.",
      details: {
        authMethod,
        oauthStatus,
        oauthError,
        provider: "Gmail",
        hasPasswordFallback: !!EMAIL_PASSWORD,
        recommendations:
          oauthStatus === "failed" && EMAIL_PASSWORD
            ? [
                "OAuth failed but password fallback is working. Consider regenerating OAuth tokens.",
              ]
            : oauthStatus === "failed"
            ? [
                "OAuth failed and no password fallback configured. Please fix OAuth or configure app password.",
              ]
            : [],
      },
    };
  } catch (error) {
    logger.error(
      `Email configuration test failed: ${
        error instanceof Error ? error.message : String(error)
      }`
    );

    // Provide helpful error messages based on common issues
    let message = `Failed to connect: ${
      error instanceof Error ? error.message : String(error)
    }`;
    let suggestion = "Check your email configuration";

    if (error instanceof Error) {
      if (error.message.includes("OAuth refresh token expired")) {
        message = "OAuth refresh token has expired or been revoked.";
        suggestion =
          "Please regenerate your OAuth tokens from Google Console or configure an app password";
      } else if (error.message.includes("Invalid login")) {
        message =
          "Authentication failed. Check your email address and password or OAuth credentials.";
        suggestion = "Verify your email credentials in the .env file";
      } else if (error.message.includes("Invalid OAuth")) {
        message =
          "OAuth authentication failed. Verify your Client ID, Client Secret, and Refresh Token.";
        suggestion = "Regenerate your OAuth tokens from Google Console";
      } else if (error.message.includes("certificate")) {
        message =
          "SSL certificate verification failed. Check your network settings or proxy configuration.";
        suggestion = "Check your network/firewall settings";
      }
    }

    return {
      success: false,
      message,
      details: {
        suggestion,
        authMethod: CLIENT_ID ? "OAuth2 (failed)" : "Password",
        hasOAuthConfig: !!(CLIENT_ID && CLIENT_SECRET && REFRESH_TOKEN),
        hasPasswordConfig: !!EMAIL_PASSWORD,
        recommendations: [
          "Check Google Console for OAuth token status",
          "Consider using Gmail App Passwords as fallback",
          "Verify all environment variables are set correctly",
        ],
      },
    };
  }
};

/**
 * Template for account verification email
 */
export const getVerificationEmailTemplate = (
  userName: string,
  verificationLink: string
): string => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #333;">Verify Your Email</h1>
    </div>
    <div style="margin-bottom: 30px;">
      <p>Hello ${userName},</p>
      <p>Thank you for registering with Restaurant Hub. To complete your registration and activate your account, please verify your email address by clicking the button below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Verify Email</a>
      </div>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account with us, please ignore this email or contact our support team.</p>
    </div>
    <div style="border-top: 1px solid #e1e1e1; padding-top: 20px; color: #777; font-size: 12px;">
      <p>If the button doesn't work, copy and paste this link into your browser: ${verificationLink}</p>
      <p>&copy; ${new Date().getFullYear()} Restaurant Hub. All rights reserved.</p>
    </div>
  </div>
  `;
};

/**
 * Template for password reset email
 */
export const getPasswordResetEmailTemplate = (
  userName: string,
  resetLink: string
): string => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #333;">Reset Your Password</h1>
    </div>
    <div style="margin-bottom: 30px;">
      <p>Hello ${userName},</p>
      <p>We received a request to reset your password. Click the button below to create a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #2196F3; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Reset Password</a>
      </div>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>If you didn't request a password reset, please ignore this email or contact our support team if you have concerns about your account security.</p>
    </div>
    <div style="border-top: 1px solid #e1e1e1; padding-top: 20px; color: #777; font-size: 12px;">
      <p>If the button doesn't work, copy and paste this link into your browser: ${resetLink}</p>
      <p>&copy; ${new Date().getFullYear()} Restaurant Hub. All rights reserved.</p>
    </div>
  </div>
  `;
};

/**
 * New order confirmation email template
 */
export const getOrderConfirmationTemplate = (data: {
  userName: string;
  orderNumber: string;
  restaurantName: string;
  items: any[];
  total: number;
  estimatedDelivery?: string;
}): string => {
  const itemsList = data.items
    .map((item) => `<li>${item.name} x ${item.quantity} - $${item.price}</li>`)
    .join("");

  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #333;">Order Confirmation</h1>
    </div>
    <div style="margin-bottom: 30px;">
      <p>Hello ${data.userName},</p>
      <p>Thank you for your order! We're excited to prepare your delicious meal.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3>Order #${data.orderNumber}</h3>
        <p><strong>Restaurant:</strong> ${data.restaurantName}</p>
        ${
          data.estimatedDelivery
            ? `<p><strong>Estimated Delivery:</strong> ${data.estimatedDelivery}</p>`
            : ""
        }
      </div>

      <h3>Order Items:</h3>
      <ul style="list-style-type: none; padding: 0;">
        ${itemsList}
      </ul>
      
      <div style="text-align: right; font-size: 18px; font-weight: bold; margin-top: 20px;">
        <p>Total: $${data.total}</p>
      </div>
    </div>
    <div style="border-top: 1px solid #e1e1e1; padding-top: 20px; color: #777; font-size: 12px;">
      <p>&copy; ${new Date().getFullYear()} Restaurant Hub. All rights reserved.</p>
    </div>
  </div>
  `;
};

/**
 * Order status update email template
 */
export const getOrderStatusUpdateTemplate = (data: {
  userName: string;
  orderNumber: string;
  status: string;
  statusMessage: string;
  trackingUrl?: string;
}): string => {
  return `
  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e1e1; border-radius: 5px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <h1 style="color: #333;">Order Update</h1>
    </div>
    <div style="margin-bottom: 30px;">
      <p>Hello ${data.userName},</p>
      <p>Your order status has been updated:</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; text-align: center;">
        <h3>Order #${data.orderNumber}</h3>
        <p style="font-size: 18px; color: #28a745;"><strong>Status: ${
          data.status
        }</strong></p>
        <p>${data.statusMessage}</p>
      </div>

      ${
        data.trackingUrl
          ? `
        <div style="text-align: center; margin: 30px 0;">
          <a href="${data.trackingUrl}" style="background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 4px; font-weight: bold;">Track Your Order</a>
        </div>
      `
          : ""
      }
    </div>
    <div style="border-top: 1px solid #e1e1e1; padding-top: 20px; color: #777; font-size: 12px;">
      <p>&copy; ${new Date().getFullYear()} Restaurant Hub. All rights reserved.</p>
    </div>
  </div>
  `;
};
