
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwhwwjdoiaqtohxmpecy.supabase.co';
const supabaseAdminKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aHd3amRvaWFxdG9oeG1wZWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkyNzExMCwiZXhwIjoyMDgyNTAzMTEwfQ.ShxnAeJOF1RUeheypRL-hHnV7WmfIjQo6r5oe3oq8y0';

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function checkRecentRecharges() {
    console.log('Fetching last 3 recharges with full details...');
    const { data, error } = await supabase
        .from('recharges')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

    if (error) {
        console.error('Error:', error);
    } else if (data && data.length > 0) {
        console.log('Results:', JSON.stringify(data, null, 2));
    } else {
        console.log('No recharges found in table.');
    }
}

checkRecentRecharges();
