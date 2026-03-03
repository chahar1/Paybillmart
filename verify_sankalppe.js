// Quick verification: check that operators table has metadata.source_id for mobile prepaid operators
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://uwhwwjdoiaqtohxmpecy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aHd3amRvaWFxdG9oeG1wZWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkyNzExMCwiZXhwIjoyMDgyNTAzMTEwfQ.ShxnAeJOF1RUeheypRL-hHnV7WmfIjQo6r5oe3oq8y0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    console.log('\n=== Checking Mobile Prepaid Operators & source_id ===\n');

    const { data, error } = await supabase
        .from('operators')
        .select('id, name, code, metadata, is_active')
        .order('display_order')
        .limit(20);

    if (error) {
        console.error('❌ Error fetching operators:', error.message);
        return;
    }

    for (const op of data) {
        const sourceId = op.metadata?.source_id;
        const status = sourceId ? '✅' : '❌ NO source_id';
        console.log(`${status}  [${op.code}] ${op.name}  → OpId: ${sourceId ?? 'MISSING'} | active: ${op.is_active}`);
    }

    console.log('\n=== Testing SankalpPe Balance via Edge Function ===\n');

    const resp = await fetch(
        `${SUPABASE_URL}/functions/v1/paybil-proxy`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${SUPABASE_KEY}`,
            },
            body: JSON.stringify({ type: 'sankalppe', action: 'balance' }),
        }
    );

    const result = await resp.json();
    console.log('Balance API response:', JSON.stringify(result, null, 2));

    if (result.STATUS?.toString() === '1') {
        console.log('\n✅ SankalpPe API is live and authenticated!');
    } else {
        console.warn('\n⚠️  Balance check returned non-success. Check token or IP whitelist.');
        console.log('Response:', result);
    }
}

main().catch(console.error);
