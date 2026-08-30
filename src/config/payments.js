/**
 * Pi Network payment configuration.
 *
 * Keep pricing and product metadata here so it can be changed in one place.
 * The IDEA_SUBMISSION_PRICE is the amount (in Pi) a user must pay to submit an idea.
 */

// Initial / default price per idea submission. Change this value to adjust the fee.
export const IDEA_SUBMISSION_PRICE = 1;

// Product identity used consistently in the frontend payment request and backend validation.
export const IDEA_SUBMISSION_PRODUCT = {
  productId: "idea_submission",
  amount: IDEA_SUBMISSION_PRICE,
  memo: `Originly idea submission (${IDEA_SUBMISSION_PRICE} Pi)`,
};

/**
 * Build the payment data object for a specific idea submission attempt.
 * The metadata links the payment to the app-side product and lets the
 * backend validate that the amount and product match expectations.
 */
export function buildIdeaSubmissionPaymentData() {
  return {
    amount: IDEA_SUBMISSION_PRODUCT.amount,
    memo: IDEA_SUBMISSION_PRODUCT.memo,
    metadata: {
      productId: IDEA_SUBMISSION_PRODUCT.productId,
      type: "idea_submission",
    },
  };
}
