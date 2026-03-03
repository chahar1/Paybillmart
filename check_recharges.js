
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwhwwjdoiaqtohxmpecy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aHd3amRvaWFxdG9oeG1wZWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MjcxMTAsImV4cCI6MjA4MjUwMzExMH0.ER8sQcVHMHdtgF57r2ooIURdUzkiV4FhQD09JhFtfiI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkRecentRecharges() {
    console.log('Fetching recent recharges...');
    const { data, error } = await supabase
        .from('recharges')
        .select('id, mobile_number, amount, status, api_response, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (error) {
        console.error('Error fetching recharges:', error);
    } else {
        console.log('Recent Recharges:', JSON.stringify(data, null, 2));
    }
}

checkRecentRecharges();
