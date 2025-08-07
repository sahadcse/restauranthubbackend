import Stripe from "stripe";
import { config } from "../config/env.config";

if (!config.stripe.secretKey) {
  throw new Error("STRIPE_SECRET_KEY is required");
}

export const stripe = new Stripe(config.stripe.secretKey, {
  typescript: true,
});

export interface CreatePaymentIntentRequest {
  amount: number; // Amount in cents
  currency?: string;
  orderId: string;
  customerId?: string;
  description?: string;
  metadata?: Record<string, string>;
}

export interface CreateCheckoutSessionRequest {
  orderId: string;
  amount: number;
  currency?: string;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
  description?: string;
}

export class StripeService {
  /**
   * Create a payment intent for direct charges
   */
  static async createPaymentIntent(
    data: CreatePaymentIntentRequest
  ): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(data.amount * 100), // Convert to cents
        currency: data.currency || "usd",
        description: data.description || `Payment for Order ${data.orderId}`,
        metadata: {
          orderId: data.orderId,
          ...data.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
        ...(data.customerId && { customer: data.customerId }),
      });

      return paymentIntent;
    } catch (error) {
      console.error("Stripe Payment Intent creation failed:", error);
      throw new Error(
        error instanceof Stripe.errors.StripeError
          ? error.message
          : "Payment processing failed"
      );
    }
  }

  /**
   * Create a Checkout Session for hosted payment page
   */
  static async createCheckoutSession(
    data: CreateCheckoutSessionRequest
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: data.currency || "usd",
              product_data: {
                name: `Order #${data.orderId}`,
                description: data.description || "Restaurant Order",
              },
              unit_amount: Math.round(data.amount * 100), // Convert to cents
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: data.successUrl,
        cancel_url: data.cancelUrl,
        metadata: {
          orderId: data.orderId,
        },
        ...(data.customerEmail && { customer_email: data.customerEmail }),
      });

      return session;
    } catch (error) {
      console.error("Stripe Checkout Session creation failed:", error);
      throw new Error(
        error instanceof Stripe.errors.StripeError
          ? error.message
          : "Checkout session creation failed"
      );
    }
  }

  /**
   * Retrieve payment intent by ID
   */
  static async retrievePaymentIntent(
    paymentIntentId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      console.error("Failed to retrieve payment intent:", error);
      throw new Error("Failed to retrieve payment information");
    }
  }

  /**
   * Confirm payment intent
   */
  static async confirmPaymentIntent(
    paymentIntentId: string,
    paymentMethodId: string
  ): Promise<Stripe.PaymentIntent> {
    try {
      return await stripe.paymentIntents.confirm(paymentIntentId, {
        payment_method: paymentMethodId,
      });
    } catch (error) {
      console.error("Payment confirmation failed:", error);
      throw new Error(
        error instanceof Stripe.errors.StripeError
          ? error.message
          : "Payment confirmation failed"
      );
    }
  }

  /**
   * Create a refund
   */
  static async createRefund(
    paymentIntentId: string,
    amount?: number
  ): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100);
      }

      return await stripe.refunds.create(refundData);
    } catch (error) {
      console.error("Refund creation failed:", error);
      throw new Error(
        error instanceof Stripe.errors.StripeError
          ? error.message
          : "Refund processing failed"
      );
    }
  }

  /**
   * Construct webhook event from raw body and signature
   */
  static constructWebhookEvent(
    payload: string | Buffer,
    signature: string
  ): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret!
      );
    } catch (error) {
      console.error("Webhook signature verification failed:", error);
      throw new Error("Invalid webhook signature");
    }
  }
}
