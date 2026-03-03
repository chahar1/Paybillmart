
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwhwwjdoiaqtohxmpecy.supabase.co';
const supabaseAdminKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aHd3amRvaWFxdG9oeG1wZWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkyNzExMCwiZXhwIjoyMDgyNTAzMTEwfQ.ShxnAeJOF1RUeheypRL-hHnV7WmfIjQo6r5oe3oq8y0';

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function checkSchema() {
    console.log('Checking recharges columns...');
    const { data, error } = await supabase.from('recharges').select('*').limit(1);
    if (data && data.length > 0) {
        console.log('Columns:', Object.keys(data[0]));
    } else {
        console.log('No data to check columns.');
    }
}

checkSchema();
