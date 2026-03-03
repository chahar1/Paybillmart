
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
);

export default async function handler(req, res) {
    // URL: http://yourdomainname/api/recharge-callback?STATUS=[1/2/3]&OPTXNID=OOO&YOURREQID=RRR
    const { STATUS, OPTXNID, YOURREQID } = req.query;

    console.log(`Callback received: STATUS=${STATUS}, REQID=${YOURREQID}, OPTXNID=${OPTXNID}`);

    if (!YOURREQID || !STATUS) {
        return res.status(400).send("Missing parameters");
    }

    try {
        // Status: 1 = SUCCESS, 2 = Processing, 3 = FAILED
        let finalStatus = 'processing';
        if (STATUS === '1') finalStatus = 'success';
        if (STATUS === '3') finalStatus = 'failed';

        // Update the recharge record
        const { data: recharge, error: fetchError } = await supabase
            .from('recharges')
            .select('*')
            .eq('api_txn_id', YOURREQID)
            .single();

        if (fetchError || !recharge) {
            return res.status(404).send("Recharge not found");
        }

        // If it was failed, and we changed to failed, we need to refund (if not already handled)
        if (finalStatus === 'failed' && recharge.status !== 'failed') {
            await supabase.rpc('credit_wallet', {
                p_user_id: recharge.user_id,
                p_amount: recharge.amount,
                p_description: `Refund: Recharge Failed (Callback)`,
                p_metadata: { recharge_id: recharge.id, callback_status: STATUS }
            });
        }

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
        console.error("Callback Processing Error:", error);
        return res.status(500).send("Internal Server Error");
    }
}
