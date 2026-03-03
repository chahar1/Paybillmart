
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwhwwjdoiaqtohxmpecy.supabase.co';
const supabaseAdminKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aHd3amRvaWFxdG9oeG1wZWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkyNzExMCwiZXhwIjoyMDgyNTAzMTEwfQ.ShxnAeJOF1RUeheypRL-hHnV7WmfIjQo6r5oe3oq8y0';

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function checkFunctions() {
    console.log('Checking for sankalppe_recharge function...');
    const { data, error } = await supabase.rpc('sankalppe_recharge', {
        p_mobile: '1234567890',
        p_amount: '10',
        p_operator_code: 'TEST',
        p_request_id: 'CHECK_EXISTENCE'
    });

    if (error) {
        console.error('RPC Error:', error.message);
        if (error.message.includes('function') && error.message.includes('not found')) {
            console.log('The function sankalppe_recharge does NOT exist.');
        }
    } else {
        console.log('RPC Succeeded (at least the function exists):', data);
    }
}

checkFunctions();
