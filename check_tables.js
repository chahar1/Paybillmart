
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uwhwwjdoiaqtohxmpecy.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aHd3amRvaWFxdG9oeG1wZWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MjcxMTAsImV4cCI6MjA4MjUwMzExMH0.ER8sQcVHMHdtgF57r2ooIURdUzkiV4FhQD09JhFtfiI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkTables() {
    // List tables in the public schema
    const { data, error } = await supabase.rpc('get_tables'); // Assuming a helper might exist, or just query something known

    // Let's just try to select from a few likely tables
    const tables = ['recharges', 'transactions', 'wallets', 'operators'];
    for (const table of tables) {
        const { count, error } = await supabase.from(table).select('*', { count: 'exact', head: true });
        console.log(`Table ${table}: ${count} rows`, error ? `(Error: ${error.message})` : '');
    }
}

checkTables();
