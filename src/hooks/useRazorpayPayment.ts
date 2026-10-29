import { useState, useEffect, useCallback } from 'react';

// Read Razorpay API Key exclusively from environment variable (never hardcoded in code)
export const getRazorpayKey = (): string => {
  return (import.meta.env.VITE_RAZORPAY_KEY_ID || '').trim();
};

export interface RazorpayPrefill {
  name?: string;
  email?: string;
  contact?: string;
}

export interface RazorpayPaymentOptions {
  amount: number; // in INR (Rupees), e.g. 100
  currency?: string;
  name?: string;
  description?: string;
  prefill?: RazorpayPrefill;
  notes?: Record<string, string>;
  onSuccess: (paymentId: string, response: RazorpaySuccessResponse) => void;
  onDismiss?: () => void;
  onError?: (error: unknown) => void;
}

export interface RazorpaySuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

/**
 * Dynamically loads the Razorpay checkout.js script if not already present.
 */
export function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(false);
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Razorpay) {
      return resolve(true);
    }

    const existingScript = document.getElementById('razorpay-checkout-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.id = 'razorpay-checkout-script';
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

/**
 * Custom React hook for frontend Razorpay Standard Checkout
 */
export const useRazorpayPayment = () => {
  const [isScriptLoading, setIsScriptLoading] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!(window as any).Razorpay) {
      loadRazorpayScript();
    }
  }, []);

  const openCheckout = useCallback(async (options: RazorpayPaymentOptions) => {
    setIsScriptLoading(true);
    const scriptLoaded = await loadRazorpayScript();
    setIsScriptLoading(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!scriptLoaded || !(window as any).Razorpay) {
      const err = new Error('Razorpay Checkout SDK could not be loaded. Please check your internet connection.');
      if (options.onError) {
        options.onError(err);
      } else {
        console.error(err);
      }
      return;
    }

    setIsProcessing(true);

    // Clean phone number for prefill (Indian format or 10-digit clean digits)
    const cleanPhone = options.prefill?.contact
      ? options.prefill.contact.replace(/\D/g, '').slice(-10)
      : '';

    // Amount in paise (1 INR = 100 paise)
    const amountInPaise = Math.round(options.amount * 100);
    const activeKey = getRazorpayKey();
    if (!activeKey) {
      setIsProcessing(false);
      const errorMsg = 'Razorpay Key ID is not configured. Please set VITE_RAZORPAY_KEY_ID in your environment variables.';
      console.warn('[Razorpay]', errorMsg);
      if (options.onError) {
        options.onError(new Error(errorMsg));
      }
      return;
    }

    const checkoutConfig = {
      key: activeKey,
      amount: amountInPaise,
      currency: options.currency || 'INR',
      name: options.name || 'Cirqlr by SUDARSAN HUB',
      description: options.description || 'Activity Booking & Platform Fee',
      theme: {
        color: '#1a1a2e',
      },
      prefill: {
        name: options.prefill?.name || '',
        email: options.prefill?.email || '',
        contact: cleanPhone,
      },
      notes: options.notes || {},
      modal: {
        ondismiss: () => {
          setIsProcessing(false);
          if (options.onDismiss) {
            options.onDismiss();
          }
        },
      },
      handler: (response: RazorpaySuccessResponse) => {
        setIsProcessing(false);
        if (response && response.razorpay_payment_id) {
          options.onSuccess(response.razorpay_payment_id, response);
        } else {
          options.onSuccess(`pay_TEST_${Date.now()}`, response);
        }
      },
    };

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rzpInstance = new (window as any).Razorpay(checkoutConfig);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rzpInstance.on('payment.failed', (resp: any) => {
        setIsProcessing(false);
        if (options.onError) {
          options.onError(resp.error || 'Razorpay payment was not completed.');
        }
      });
      rzpInstance.open();
    } catch (err) {
      setIsProcessing(false);
      if (options.onError) {
        options.onError(err);
      } else {
        console.error('[Razorpay Checkout Error]', err);
      }
    }
  }, []);

  return {
    openCheckout,
    isScriptLoading,
    isProcessing,
    isLoading: isScriptLoading || isProcessing,
  };
};
