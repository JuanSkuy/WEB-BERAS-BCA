/**
 * Doku Payment Gateway Integration
 * Documentation: https://docs.doku.com
 */

export interface DokuPaymentRequest {
  order: {
    invoice_number: string;
    amount: number; // in IDR (not cents)
    currency: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
    address?: string;
    city?: string;
    postal_code?: string;
  };
  payment: {
    payment_due_date: number; // minutes from now
  };
  url: {
    notify_url: string;
    redirect_url: string;
    callback_url: string;
  };
}

export interface DokuPaymentResponse {
  response: {
    result: {
      invoice_number: string;
      payment_url: string;
      expired_date: string;
    };
  };
  status: {
    code: string;
    message: string;
  };
}

export interface DokuNotification {
  order: {
    invoice_number: string;
    amount: number;
  };
  virtual_account_info: {
    virtual_account_number: string;
    how_to_pay_page: string;
    how_to_pay_api: string;
    created_date: string;
    expired_date: string;
    created_date_utc: string;
    expired_date_utc: string;
  };
  payment: {
    payment_status: string; // SUCCESS, FAILED, PENDING
    payment_status_date: string;
    payment_channel: string;
    payment_code: string;
  };
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  additional_info: {
    source: string;
  };
}

/**
 * Generate Doku signature for authentication
 */
export function generateDokuSignature(
  clientId: string,
  requestId: string,
  requestTarget: string,
  requestTimestamp: string,
  requestBody: string,
  secretKey: string
): string {
  const crypto = require('crypto');
  
  // Create component string
  const componentString = 
    `Client-Id:${clientId}\n` +
    `Request-Id:${requestId}\n` +
    `Request-Timestamp:${requestTimestamp}\n` +
    `Request-Target:${requestTarget}\n` +
    `Digest:${generateDigest(requestBody)}\n`;

  // Generate signature
  const signature = crypto
    .createHmac('sha256', secretKey)
    .update(componentString)
    .digest('base64');

  return signature;
}

/**
 * Generate SHA-256 digest
 */
function generateDigest(body: string): string {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(body, 'utf8').digest('base64');
}

/**
 * Verify Doku notification signature
 */
export function verifyDokuSignature(
  signature: string,
  clientId: string,
  requestId: string,
  requestTarget: string,
  requestTimestamp: string,
  requestBody: string,
  secretKey: string
): boolean {
  const expectedSignature = generateDokuSignature(
    clientId,
    requestId,
    requestTarget,
    requestTimestamp,
    requestBody,
    secretKey
  );
  return signature === expectedSignature;
}

/**
 * Create payment request to Doku
 */
export async function createDokuPayment(
  paymentRequest: DokuPaymentRequest
): Promise<DokuPaymentResponse> {
  const clientId = process.env.DOKU_CLIENT_ID;
  const secretKey = process.env.DOKU_SECRET_KEY;
  const baseUrl = process.env.DOKU_BASE_URL || 'https://api.doku.com';

  if (!clientId || !secretKey) {
    throw new Error('Doku credentials not configured');
  }

  const requestId = generateRequestId();
  const requestTimestamp = new Date().toISOString();
  const requestTarget = '/checkout/v1/payment';
  const requestBody = JSON.stringify(paymentRequest);

  const signature = generateDokuSignature(
    clientId,
    requestId,
    requestTarget,
    requestTimestamp,
    requestBody,
    secretKey
  );

  const response = await fetch(`${baseUrl}${requestTarget}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Client-Id': clientId,
      'Request-Id': requestId,
      'Request-Timestamp': requestTimestamp,
      'Signature': `HMACSHA256=${signature}`,
    },
    body: requestBody,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(`Doku API error: ${error.message || response.statusText}`);
  }

  return await response.json();
}

/**
 * Generate unique request ID
 */
function generateRequestId(): string {
  return `req-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

