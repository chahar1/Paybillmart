
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwhwwjdoiaqtohxmpecy.supabase.co';
const supabaseAdminKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aHd3amRvaWFxdG9oeG1wZWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkyNzExMCwiZXhwIjoyMDgyNTAzMTEwfQ.ShxnAeJOF1RUeheypRL-hHnV7WmfIjQo6r5oe3oq8y0';

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function checkSchema() {
    // We can query information_schema to see FK details
    const { data, error } = await supabase.rpc('get_table_schema', { p_table_name: 'wallets' });
    // If we don't have this RPC, we can try a raw query if we have a way...
    // Let's try to find if we have a generic query RPC
}

async function getFkDetails() {
    const { data, error } = await supabase.from('wallets').select('*').limit(1);
    console.log('Wallets columns:', data ? Object.keys(data[0] || {}) : 'No data');
}

getFkDetails();
