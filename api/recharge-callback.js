import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    const { STATUS, OPTXNID, YOURREQID } = req.query;

    console.log('Incoming Callback:', { STATUS, OPTXNID, YOURREQID });

    if (!YOURREQID || !STATUS) {
        return res.status(400).json({ error: "Missing required query parameters: STATUS and YOURREQID" });
    }

    try {
        const supabaseUrl = 'https://uwhwwjdoiaqtohxmpecy.supabase.co';
        const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseServiceRoleKey) {
            console.error("Critical: SUPABASE_SERVICE_ROLE_KEY is missing on Vercel.");
            return res.status(500).json({ error: "Configuration Error: SUPABASE_SERVICE_ROLE_KEY not set on Vercel Dashboard." });
        }

        const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

        // Map status: 1 = SUCCESS, 2 = Processing, 3 = FAILED
        let finalStatus = 'processing';
        if (STATUS === '1') finalStatus = 'success';
        else if (STATUS === '3') finalStatus = 'failed';

        // Update the recharge record by searching for the Ref ID
        const { data: recharge, error: fetchError } = await supabase
            .from('recharges')
            .select('*')
            .eq('api_txn_id', YOURREQID)
            .single();

        if (fetchError || !recharge) {
            console.warn(`No recharge found for YOURREQID: ${YOURREQID}`);
            return res.status(404).json({ error: "Recharge record not found for the provided YOURREQID", ref: YOURREQID });
        }

        // Handle Refund for failed recharge if status changes to failed
        if (finalStatus === 'failed' && recharge.status !== 'failed') {
            console.log(`Refunding user ${recharge.user_id} for failed recharge ${recharge.id}`);
            await supabase.rpc('credit_wallet', {
                p_user_id: recharge.user_id,
                p_amount: recharge.amount,
                p_description: `Refund for Failed Recharge (Provider Sync)`,
                p_metadata: { recharge_id: recharge.id, provider_status: STATUS, provider_txn_id: OPTXNID }
            });
        }

        // Update the record with actual status and provider TXN ID
        const { error: updateError } = await supabase
            .from('recharges')
            .update({
                status: finalStatus,
                api_txn_id: OPTXNID || recharge.api_txn_id,
                updated_at: new Date().toISOString()
            })
            .eq('id', recharge.id);

        if (updateError) throw updateError;

        return res.status(200).send("OK");

    } catch (error) {
        console.error("Recharge Callback Exception:", error);
        return res.status(500).json({ error: "Internal processing failure", message: error.message });
    }
}
