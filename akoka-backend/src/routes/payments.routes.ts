import { Router, Request, Response } from 'express';
import { Transaction, Payment } from '../db/models/index.js';
import { AuthRequest, requireAuth } from '../middleware/auth.js';
import { createCheckoutSession, confirmPayment } from '../services/paymentEngine.js';
import { parseTransaction } from '../services/transactionEngine.js';

export const paymentsRouter = Router();

// POST /payments/checkout
paymentsRouter.post('/checkout', requireAuth, async (req: AuthRequest, res: Response) => {
	try {
		const { transaction_id, return_url } = req.body;

		if (!transaction_id || !return_url) {
			res.status(400).json({ error: 'transaction_id and return_url are required.' });
			return;
		}

		const doc = await Transaction.findById(transaction_id);
		if (!doc) {
			res.status(404).json({ error: 'Transaction not found.' });
			return;
		}

		const tx = await parseTransaction(doc, req.user!.id);

		if (tx.buyer_id !== req.user!.id) {
			res.status(403).json({ error: 'Only the designated buyer can initiate payment for this agreement.' });
			return;
		}

		if (tx.status !== 'agreed') {
			res.status(400).json({
				error: 'Payment can only be initiated after both parties have accepted the agreement terms.'
			});
			return;
		}

		const session = await createCheckoutSession(tx, return_url);
		res.json(session);
	} catch (error) {
		console.error('Checkout error:', error);
		res.status(500).json({ error: error instanceof Error ? error.message : 'Could not initialize checkout session.' });
	}
});

// GET /payments/:paymentId
paymentsRouter.get('/:paymentId', async (req: Request, res: Response) => {
	try {
		const payment = await Payment.findById(req.params.paymentId);
		if (!payment) {
			res.status(404).json({ error: 'Payment record not found.' });
			return;
		}

		res.json({
			id: payment.id,
			transaction_id: payment.transaction_id,
			status: payment.status,
			amount: Number(payment.amount),
			currency: payment.currency
		});
	} catch (error) {
		console.error('Error fetching payment status:', error);
		res.status(500).json({ error: 'Could not fetch payment status.' });
	}
});

// GET /payments/simulate-checkout
paymentsRouter.get('/simulate-checkout', (req: Request, res: Response) => {
	const { payment_id, return_url, amount } = req.query;

	if (!payment_id || !return_url) {
		res.status(400).send('Missing payment_id or return_url parameters.');
		return;
	}

	const safeReturnUrl = String(return_url);
	const targetPaymentId = String(payment_id);
	const formattedAmount = Number(amount || 0).toLocaleString();

	res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Simulated Payment Sandbox • AKOKA UNILAG</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #0f172a;
      color: #f8fafc;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
    }
    .card {
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      max-width: 440px;
      width: 100%;
      padding: 32px;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
      text-align: center;
    }
    .badge {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      font-size: 11px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 999px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 20px;
    }
    .amount {
      font-size: 36px;
      font-weight: 900;
      color: #38bdf8;
      margin: 12px 0 24px;
    }
    .details {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 12px;
      padding: 16px;
      text-align: left;
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 24px;
    }
    .details div {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .details div:last-child {
      margin-bottom: 0;
    }
    .details strong {
      color: #f1f5f9;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 14px;
      background: #0284c7;
      color: white;
      font-weight: 700;
      font-size: 15px;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      text-decoration: none;
      transition: background 0.2s;
      box-sizing: border-box;
    }
    .btn:hover {
      background: #0369a1;
    }
    .btn-cancel {
      display: block;
      margin-top: 12px;
      background: transparent;
      color: #94a3b8;
      font-size: 13px;
      text-decoration: none;
    }
    .btn-cancel:hover {
      color: #f1f5f9;
    }
    .notice {
      font-size: 11px;
      color: #64748b;
      margin-top: 20px;
      line-height: 1.5;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">Simulated Checkout • Hackathon Demo</div>
    <h1 style="font-size: 20px; margin: 0; font-weight: 800;">AKOKA Protected Payment</h1>
    <p style="font-size: 13px; color: #94a3b8; margin-top: 6px;">Provider escrow simulator linked to agreement</p>
    
    <div class="amount">₦${formattedAmount}</div>

    <div class="details">
      <div><span>Payment ID:</span> <strong>${targetPaymentId}</strong></div>
      <div><span>Gateway Engine:</span> <strong>BMONI Nigeria API (Simulated)</strong></div>
      <div><span>Currency:</span> <strong>NGN</strong></div>
      <div><span>Environment:</span> <strong>Sandbox / Prototype</strong></div>
    </div>

    <form method="POST" action="/api/payments/complete-simulation">
      <input type="hidden" name="payment_id" value="${targetPaymentId}">
      <input type="hidden" name="return_url" value="${safeReturnUrl}">
      <button type="submit" class="btn">Simulate Successful Payment & Return</button>
    </form>

    <a href="${safeReturnUrl}" class="btn-cancel">Return to Agreement without paying</a>

    <p class="notice">
      DEMO NOTICE: In this prototype, no real funds are transferred or held. Upon approval, the backend securely marks this payment intent as succeeded and redirects back to the documented agreement.
    </p>
  </div>
</body>
</html>
	`);
});

// POST /payments/complete-simulation
paymentsRouter.post('/complete-simulation', async (req: Request, res: Response) => {
	try {
		const { payment_id, return_url } = req.body;

		if (!payment_id || !return_url) {
			res.status(400).send('Missing payment_id or return_url.');
			return;
		}

		await confirmPayment(String(payment_id));

		const redirectUrl = new URL(String(return_url));
		redirectUrl.searchParams.set('payment_id', String(payment_id));

		res.redirect(303, redirectUrl.toString());
	} catch (error) {
		console.error('Simulation completion error:', error);
		res.status(500).send('Could not complete simulated payment.');
	}
});
