/**
 * PRODUCTION PAYMENT SERVICE
 * This service manages the connection to Iyzico (Turkey) or Stripe (International).
 */

export interface PaymentRequest {
  orderNumber: string;
  amount: number;
  customerName: string;
  customerEmail: string;
  cardDetails: {
    number: string;
    expiry: string;
    cvv: string;
  };
}

export const paymentService = {
  /**
   * Process payment via selected provider.
   * NOTE: For real security, this should call your BACKEND which then calls Iyzico/Stripe.
   */
  async processPayment(req: PaymentRequest): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    console.log(`Processing payment for ${req.orderNumber}: ₺${req.amount}`);
    
    // DELAY for realistic feel
    await new Promise(r => setTimeout(r, 2000));

    // MOCK SUCCESS
    // In production, replace this with:
    // const res = await fetch('/api/payment/process', { method: 'POST', body: JSON.stringify(req) });
    // return await res.json();
    
    return { 
      success: true, 
      transactionId: `TX-${Math.random().toString(36).substr(2, 9).toUpperCase()}` 
    };
  },

  /**
   * IYZICO INTEGRATION GUIDE (Turkey)
   * 1. Create Iyzico account: https://www.iyzico.com/
   * 2. Install library: npm install iyzipay
   * 3. Implementation must be on a Node.js/Next.js backend to protect your API keys.
   */
   
  /**
   * STRIPE INTEGRATION GUIDE (International)
   * 1. Create Stripe account: https://stripe.com/
   * 2. Install library: npm install @stripe/stripe-js
   * 3. Wrap Checkout in <Elements stripe={stripePromise}>
   */
};
