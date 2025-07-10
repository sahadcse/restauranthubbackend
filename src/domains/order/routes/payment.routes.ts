import { Router } from "express";
import * as PaymentController from "../controllers/payment.controller";
import { authenticate } from "../../../middleware/auth.middleware";
import { validateRequest } from "../../../middleware/validation.middleware";
import { z } from "zod";
import express from "express";

const router = Router();

// Validation schemas
const createPaymentIntentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().optional().default("usd"),
});

const createCheckoutSessionSchema = z.object({
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
});

// -----------------------------------------------------------------------------
// IMPORTANT: Webhook route MUST come first before parameterized routes
// This prevents Express from matching "webhooks" as an orderId
// ----------------------------------------------------------------------------/

/**
 * @route   POST /payments/webhooks/stripe
 * @desc    Handle Stripe webhooks
 * @access  Public (Stripe webhook)
 */
router.post(
  "/webhooks/stripe",
  express.raw({ type: "application/json" }), // Important: use raw body for webhook verification
  PaymentController.handleWebhook
);

// -----------------------------------------------------------------------------
// Order-specific payment routes
// ----------------------------------------------------------------------------/

/**
 * @route   POST /payments/:orderId/payment-intent
 * @desc    Create payment intent for an order
 * @access  Private (Order owner)
 */
router.post(
  "/:orderId/payment-intent",
  authenticate,
  validateRequest(createPaymentIntentSchema),
  PaymentController.createPaymentIntent
);

/**
 * @route   POST /payments/:orderId/checkout-session
 * @desc    Create Stripe Checkout session for an order
 * @access  Private (Order owner)
 */
router.post(
  "/:orderId/checkout-session",
  authenticate,
  validateRequest(createCheckoutSessionSchema),
  PaymentController.createCheckoutSession
);

export default router;
