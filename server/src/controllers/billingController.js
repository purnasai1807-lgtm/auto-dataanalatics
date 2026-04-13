import { z } from "zod";
import { env } from "../config/env.js";
import { AppError } from "../lib/appError.js";
import { User } from "../models/User.js";
import { ensureStripeCustomer, isBillingEnabled, stripe } from "../services/billingService.js";

const returnSchema = z.object({
  returnUrl: z.string().url().optional()
});

export async function createCheckoutSession(req, res) {
  if (!isBillingEnabled()) {
    throw new AppError("Billing is not configured.", 503);
  }

  const input = returnSchema.parse(req.body ?? {});
  const customerId = await ensureStripeCustomer(req.user);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [
      {
        price: env.STRIPE_PRO_PRICE_ID,
        quantity: 1
      }
    ],
    success_url: `${input.returnUrl ?? env.APP_URL}/dashboard?billing=success`,
    cancel_url: `${input.returnUrl ?? env.APP_URL}/pricing?billing=cancelled`,
    allow_promotion_codes: true,
    metadata: {
      userId: req.user.id
    }
  });

  res.status(201).json({
    url: session.url
  });
}

export async function createPortalSession(req, res) {
  if (!isBillingEnabled()) {
    throw new AppError("Billing is not configured.", 503);
  }

  if (!req.user.stripeCustomerId) {
    throw new AppError("No Stripe billing profile found for this account.", 404);
  }

  const input = returnSchema.parse(req.body ?? {});
  const session = await stripe.billingPortal.sessions.create({
    customer: req.user.stripeCustomerId,
    return_url: `${input.returnUrl ?? env.APP_URL}/profile`
  });

  res.status(201).json({
    url: session.url
  });
}

export async function handleStripeWebhook(req, res) {
  if (!stripe || !env.STRIPE_WEBHOOK_SECRET) {
    throw new AppError("Billing is not configured.", 503);
  }

  const signature = req.headers["stripe-signature"];
  const event = stripe.webhooks.constructEvent(req.body, signature, env.STRIPE_WEBHOOK_SECRET);

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const userId = session.metadata?.userId;

    if (userId) {
      await User.findByIdAndUpdate(userId, {
        plan: "pro",
        stripeCustomerId: session.customer,
        stripeSubscriptionId: session.subscription
      });
    }
  }

  if (event.type === "customer.subscription.deleted") {
    const subscription = event.data.object;
    await User.findOneAndUpdate(
      { stripeCustomerId: subscription.customer },
      { plan: "free", stripeSubscriptionId: null }
    );
  }

  if (event.type === "customer.subscription.updated") {
    const subscription = event.data.object;
    const activeStatuses = new Set(["active", "trialing"]);
    await User.findOneAndUpdate(
      { stripeCustomerId: subscription.customer },
      {
        plan: activeStatuses.has(subscription.status) ? "pro" : "free",
        stripeSubscriptionId: activeStatuses.has(subscription.status) ? subscription.id : null
      }
    );
  }

  res.json({ received: true });
}
