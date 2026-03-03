
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwhwwjdoiaqtohxmpecy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aHd3amRvaWFxdG9oeG1wZWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MjcxMTAsImV4cCI6MjA4MjUwMzExMH0.ER8sQcVHMHdtgF57r2ooIURdUzkiV4FhQD09JhFtfiI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkPolicies() {
    // We can't easily check policies via JS client, but we can try to insert a dummy record
    console.log('Testing insert into recharges...');
    const { data, error } = await supabase.from('recharges').insert({
        user_id: 'dummy-id', // This might fail if user_id is a UUID or has FK constraints
        service_id: 'dummy-service',
        amount: 10,
        status: 'failed'
    });

    if (error) {
        console.log('Insert failed (as expected possibly):', error.message);
    } else {
        console.log('Insert succeeded! RLS might be open or we are authenticated.');
    }
}

checkPolicies();
