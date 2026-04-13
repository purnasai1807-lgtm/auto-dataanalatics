import Stripe from "stripe";
import { env } from "../config/env.js";

export const stripe = env.STRIPE_SECRET_KEY ? new Stripe(env.STRIPE_SECRET_KEY) : null;

export async function ensureStripeCustomer(user) {
  if (!stripe) {
    throw new Error("Stripe is not configured.");
  }

  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email: user.email,
    name: user.name,
    metadata: {
      userId: user.id
    }
  });

  user.stripeCustomerId = customer.id;
  await user.save();

  return customer.id;
}

export function isBillingEnabled() {
  return Boolean(stripe && env.STRIPE_PRO_PRICE_ID);
}
