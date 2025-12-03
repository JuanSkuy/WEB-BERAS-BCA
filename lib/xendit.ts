/**
 * Xendit Payment Gateway Integration
 * Documentation: https://docs.xendit.co
 */

export interface XenditInvoiceRequest {
  external_id: string; // Unique invoice ID (required, max 64 chars)
  amount: number; // Amount in IDR (required, min 10000)
  currency?: string; // Currency code (default: IDR)
  payer_email?: string; // Customer email (required)
  description?: string; // Invoice description (max 255 chars)
  invoice_duration?: number; // Duration in seconds (default: 86400 = 24 hours)
  customer?: {
    given_names: string; // Required, max 255 chars
    surname?: string; // Optional, max 255 chars
    email: string; // Required
    mobile_number?: string; // Optional, max 20 chars
    addresses?: Array<{
      city?: string;
      country?: string;
      postal_code?: string;
      state?: string;
      street_line1?: string;
      street_line2?: string;
    }>;
  };
  customer_notification_preference?: {
    invoice_created?: string[];
    invoice_reminder?: string[];
    invoice_paid?: string[];
    invoice_expired?: string[];
  };
  success_redirect_url?: string;
  failure_redirect_url?: string;
  items?: Array<{
    name: string; // Required, max 255 chars
    quantity: number; // Required, min 1
    price: number; // Required, min 0
    category?: string;
  }>;
  fees?: Array<{
    type: string;
    value: number;
  }>;
}

export interface XenditInvoiceResponse {
  id: string;
  user_id: string;
  external_id: string;
  status: string; // PENDING, PAID, EXPIRED
  merchant_name: string;
  merchant_profile_picture_url: string;
  amount: number;
  payer_email: string;
  description: string;
  invoice_url: string;
  expiry_date: string;
  available_banks?: Array<{
    bank_code: string;
    collection_type: string;
    bank_account_number: string;
    transfer_amount: number;
    bank_branch: string;
    account_holder_name: string;
    identity_amount: number;
  }>;
  available_retail_outlets?: Array<{
    retail_outlet_name: string;
  }>;
  available_ewallets?: Array<{
    ewallet_type: string;
  }>;
  should_exclude_credit_card: boolean;
  should_send_email: boolean;
  created: string;
  updated: string;
  currency: string;
}

export interface XenditWebhookPayload {
  id: string;
  external_id: string;
  user_id: string;
  status: string; // PENDING, PAID, EXPIRED
  merchant_name: string;
  merchant_profile_picture_url: string;
  amount: number;
  paid_amount: number;
  paid_at: string;
  payer_email: string;
  description: string;
  invoice_url: string;
  expiry_date: string;
  created: string;
  updated: string;
  currency: string;
}

/**
 * Create invoice in Xendit
 */
export async function createXenditInvoice(
  invoiceRequest: XenditInvoiceRequest
): Promise<XenditInvoiceResponse> {
  const apiKey = process.env.XENDIT_SECRET_KEY;
  const baseUrl = process.env.XENDIT_BASE_URL || 'https://api.xendit.co';

  if (!apiKey) {
    throw new Error('Xendit API key not configured');
  }

  // Use test API key format: xnd_development_... or production: xnd_production_...
  const authHeader = Buffer.from(`${apiKey}:`).toString('base64');

  const requestBody = JSON.stringify(invoiceRequest);
  
  // Log request for debugging
  if (process.env.NODE_ENV === 'development') {
    console.log('Xendit API Request:', {
      url: `${baseUrl}/v2/invoices`,
      method: 'POST',
      hasApiKey: !!apiKey,
      apiKeyPrefix: apiKey?.substring(0, 20) + '...',
    });
  }

  const response = await fetch(`${baseUrl}/v2/invoices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Basic ${authHeader}`,
    },
    body: requestBody,
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorData;
    try {
      errorData = JSON.parse(errorText);
    } catch {
      errorData = { message: errorText || 'Unknown error' };
    }
    
    // Log detailed error for debugging
    console.error('Xendit API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData,
      requestBody: process.env.NODE_ENV === 'development' ? requestBody : '[hidden]',
    });
    
    const errorMessage = errorData.message || 
                        errorData.errors?.map((e: any) => e.message).join(', ') ||
                        response.statusText;
    throw new Error(`Xendit API error: ${errorMessage}`);
  }

  return await response.json();
}

/**
 * Get invoice details from Xendit
 */
export async function getXenditInvoice(invoiceId: string): Promise<XenditInvoiceResponse> {
  const apiKey = process.env.XENDIT_SECRET_KEY;
  const baseUrl = process.env.XENDIT_BASE_URL || 'https://api.xendit.co';

  if (!apiKey) {
    throw new Error('Xendit API key not configured');
  }

  const authHeader = Buffer.from(`${apiKey}:`).toString('base64');

  const response = await fetch(`${baseUrl}/v2/invoices/${invoiceId}`, {
    method: 'GET',
    headers: {
      'Authorization': `Basic ${authHeader}`,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Xendit API error: ${error.message || response.statusText}`);
  }

  return await response.json();
}

/**
 * Verify Xendit webhook signature (if using webhook token)
 */
export function verifyXenditWebhook(
  webhookToken: string,
  callbackToken: string
): boolean {
  return webhookToken === callbackToken;
}

