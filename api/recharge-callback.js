import { createClient } from '@supabase/supabase-js';

/**
 * SankalpPe Recharge Callback Handler
 *
 * SankalpPe calls this URL when a recharge status changes.
 * Register this URL in SankalpPe dashboard as:
 *   https://<your-vercel-domain>/api/recharge-callback
 *
 * SankalpPe sends a GET request with these query params:
 *   STATUS     — 1=Success, 2=Processing, 3=Failed
 *   OPTXNID    — Operator's transaction ID (only on success)
 *   YOURREQID  — Your original RefTxnId (maps to recharges.api_txn_id)
 *   TXNNO      — SankalpPe's internal order ID
 *
 * IMPORTANT: This endpoint MUST return HTTP 200 with plain text "OK".
 * Any other response causes SankalpPe to retry the callback.
 */
export default async function handler(req, res) {
    // Always respond 200 to SankalpPe so it doesn't keep retrying
    res.setHeader('Content-Type', 'text/plain');

    const { STATUS, OPTXNID, YOURREQID, TXNNO } = req.query;

    console.log('[Callback] Incoming SankalpPe callback:', { STATUS, OPTXNID, YOURREQID, TXNNO });

    if (!YOURREQID || !STATUS) {
        console.warn('[Callback] Missing STATUS or YOURREQID — ignoring');
        return res.status(200).send('OK');
    }

    try {
        const supabase = createClient(
            'https://uwhwwjdoiaqtohxmpecy.supabase.co',
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error('[Callback] CRITICAL: SUPABASE_SERVICE_ROLE_KEY not set on Vercel.');
            return res.status(200).send('OK'); // Still return 200 to stop retries
        }

        // Map SankalpPe STATUS to our internal status
        // 1 = Success, 2 = Processing/Pending, 3+ = Failed
        const statusStr = STATUS.toString();
        let finalStatus = 'processing';
        if (statusStr === '1') finalStatus = 'success';
        else if (statusStr !== '2') finalStatus = 'failed'; // 3, 4, etc. = failed

        // Find the recharge record
        const { data: recharge, error: fetchError } = await supabase
            .from('recharges')
            .select('id, user_id, amount, status, api_txn_id')
            .eq('api_txn_id', YOURREQID)
            .maybeSingle();

        if (fetchError || !recharge) {
            console.warn(`[Callback] No recharge found for YOURREQID=${YOURREQID}`);
            return res.status(200).send('OK');
        }

        console.log(`[Callback] Found recharge ${recharge.id}, current_status=${recharge.status} → new_status=${finalStatus}`);

        // ── Refund logic ────────────────────────────────────────────────────
        // Only refund if:
        //   • New status is "failed"
        //   • Previous status was NOT already "failed" (avoid double-refund)
        //   • Previous status was NOT "success" (can't refund a successful recharge)
        const shouldRefund =
            finalStatus === 'failed' &&
            recharge.status !== 'failed' &&
            recharge.status !== 'success';

        if (shouldRefund) {
            console.log(`[Callback] Refunding ₹${recharge.amount} to user ${recharge.user_id}`);
            const { error: refundError } = await supabase.rpc('credit_wallet', {
                p_user_id: recharge.user_id,
                p_amount: recharge.amount,
                p_description: 'Refund: Recharge Failed (Provider Update)',
                p_metadata: {
                    recharge_id: recharge.id,
                    provider_status: STATUS,
                    provider_txn_id: OPTXNID || null,
                    sankalppe_order_id: TXNNO || null,
                }
            });
            if (refundError) {
                console.error('[Callback] Refund failed:', refundError.message);
            } else {
                console.log(`[Callback] Refund successful for recharge ${recharge.id}`);
            }
        }

        // ── Update the recharge record ──────────────────────────────────────
        const { error: updateError } = await supabase
            .from('recharges')
            .update({
                status: finalStatus,
                api_txn_id: OPTXNID || TXNNO || recharge.api_txn_id,
                api_response: {
                    callback: true,
                    STATUS,
                    OPTXNID: OPTXNID || null,
                    TXNNO: TXNNO || null,
                    YOURREQID,
                    received_at: new Date().toISOString(),
                },
                updated_at: new Date().toISOString(),
            })
            .eq('id', recharge.id);

        if (updateError) {
            console.error('[Callback] Failed to update recharge:', updateError.message);
        } else {
            console.log(`[Callback] Recharge ${recharge.id} updated to status: ${finalStatus}`);
        }

        return res.status(200).send('OK');

    } catch (error) {
        console.error('[Callback] Exception:', error.message);
        // Still return 200 — if we return 500, SankalpPe will retry indefinitely
        return res.status(200).send('OK');
    }
}
