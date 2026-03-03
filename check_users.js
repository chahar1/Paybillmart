
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwhwwjdoiaqtohxmpecy.supabase.co';
const supabaseAdminKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aHd3amRvaWFxdG9oeG1wZWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkyNzExMCwiZXhwIjoyMDgyNTAzMTEwfQ.ShxnAeJOF1RUeheypRL-hHnV7WmfIjQo6r5oe3oq8y0';

const supabase = createClient(supabaseUrl, supabaseAdminKey);

async function checkUsersTable() {
    const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });
    console.log(`Table users: ${count} rows`, error ? `(Error: ${error.message})` : '');

    if (!error && count > 0) {
        const { data } = await supabase.from('users').select('id, email, phone').limit(5);
        console.log('Users Sample:', data);
    }
}

checkUsersTable();
