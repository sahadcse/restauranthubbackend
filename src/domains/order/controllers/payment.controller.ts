import { Request, Response } from "express";
import { StripeService } from "../../../services/stripe.service";
import { PrismaClient, UserRole } from "../../../../prisma/generated/prisma";

const prisma = new PrismaClient();

/**
 * Create payment intent for an order
 */
export const createPaymentIntent = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { amount, currency = "usd" } = req.body;

    // Type assertion for authenticated user
    const user = req.user as { id: string; email: string; role: UserRole };
    const userId = user.id;

    // Verify order belongs to user and get order details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      include: {
        restaurant: true,
      },
    });

    if (!order) {
      res.status(404).json({
        status: "error",
        message: "Order not found",
      });
      return;
    }

    // Verify order amount matches
    if (Math.abs(order.total - amount) > 0.01) {
      res.status(400).json({
        status: "error",
        message: "Payment amount does not match order total",
      });
      return;
    }

    // Create payment intent
    const paymentIntent = await StripeService.createPaymentIntent({
      amount,
      currency,
      orderId,
      description: `Payment for Order #${order.id}`,
      metadata: {
        userId,
        restaurantId: order.restaurantId,
      },
    });

    // Store payment intent in database
    await prisma.payment.create({
      data: {
        orderId,
        amount,
        currency,
        method: "CREDIT_CARD",
        status: "PENDING",
        transactionId: paymentIntent.id,
        gatewayResponse: {
          paymentIntentId: paymentIntent.id,
          clientSecret: paymentIntent.client_secret,
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    console.error("Payment intent creation error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error ? error.message : "Payment processing failed",
    });
  }
};

/**
 * Create Checkout session for hosted payment
 */
export const createCheckoutSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { orderId } = req.params;
    const { successUrl, cancelUrl } = req.body;

    // Type assertion for authenticated user
    const user = req.user as { id: string; email: string; role: UserRole };
    const userId = user.id;

    // Verify order belongs to user and get order details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
      },
      include: {
        restaurant: true,
      },
    });

    if (!order) {
      res.status(404).json({
        status: "error",
        message: "Order not found",
      });
      return;
    }

    // Create checkout session
    const session = await StripeService.createCheckoutSession({
      orderId,
      amount: order.total,
      successUrl,
      cancelUrl,
      customerEmail: user.email,
      description: `Order from ${order.restaurant.name}`,
    });

    // Store payment record
    await prisma.payment.create({
      data: {
        orderId,
        amount: order.total,
        currency: "usd",
        method: "CREDIT_CARD",
        status: "PENDING",
        transactionId: session.id,
        gatewayResponse: {
          sessionId: session.id,
          sessionUrl: session.url,
        },
      },
    });

    res.status(200).json({
      status: "success",
      data: {
        sessionId: session.id,
        sessionUrl: session.url,
      },
    });
  } catch (error) {
    console.error("Checkout session creation error:", error);
    res.status(500).json({
      status: "error",
      message:
        error instanceof Error
          ? error.message
          : "Checkout session creation failed",
    });
  }
};

/**
 * Handle Stripe webhooks
 */
export const handleWebhook = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const signature = req.headers["stripe-signature"] as string;
    const payload = req.body;

    if (!signature) {
      res.status(400).json({
        status: "error",
        message: "Missing stripe-signature header",
      });
      return;
    }

    // Construct the event using raw body - this verifies the webhook signature
    const event = StripeService.constructWebhookEvent(payload, signature);

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded":
        await handlePaymentIntentSucceeded(event.data.object);
        break;
      case "payment_intent.payment_failed":
        await handlePaymentIntentFailed(event.data.object);
        break;
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error("Webhook handling error:", error);
    res.status(400).json({
      status: "error",
      message: "Webhook handling failed",
    });
  }
};

/**
 * Handle successful payment intent
 */
const handlePaymentIntentSucceeded = async (
  paymentIntent: any
): Promise<void> => {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
      console.error("No orderId in payment intent metadata");
      return;
    }

    // Update payment status
    await prisma.payment.updateMany({
      where: { transactionId: paymentIntent.id },
      data: {
        status: "PAID",
        gatewayResponse: paymentIntent,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PREPARING",
        paymentStatus: "PAID",
      },
    });

    console.log(`Payment successful for order ${orderId}`);
  } catch (error) {
    console.error("Error handling payment success:", error);
  }
};

/**
 * Handle failed payment intent
 */
const handlePaymentIntentFailed = async (paymentIntent: any): Promise<void> => {
  try {
    const orderId = paymentIntent.metadata?.orderId;
    if (!orderId) {
      console.error("No orderId in payment intent metadata");
      return;
    }

    // Update payment status
    await prisma.payment.updateMany({
      where: { transactionId: paymentIntent.id },
      data: {
        status: "FAILED",
        gatewayResponse: paymentIntent,
      },
    });

    // Update order payment status
    await prisma.order.update({
      where: { id: orderId },
      data: { paymentStatus: "FAILED" },
    });

    console.log(`Payment failed for order ${orderId}`);
  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
};

/**
 * Handle completed checkout session
 */
const handleCheckoutSessionCompleted = async (session: any): Promise<void> => {
  try {
    const orderId = session.metadata?.orderId;
    if (!orderId) {
      console.error("No orderId in checkout session metadata");
      return;
    }

    // Update payment status
    await prisma.payment.updateMany({
      where: { transactionId: session.id },
      data: {
        status: "PAID",
        gatewayResponse: session,
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: {
        status: "PREPARING",
        paymentStatus: "PAID",
      },
    });

    console.log(`Checkout completed for order ${orderId}`);
  } catch (error) {
    console.error("Error handling checkout completion:", error);
  }
};
