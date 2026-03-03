import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://uwhwwjdoiaqtohxmpecy.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aHd3amRvaWFxdG9oeG1wZWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjkyNzExMCwiZXhwIjoyMDgyNTAzMTEwfQ.ShxnAeJOF1RUeheypRL-hHnV7WmfIjQo6r5oe3oq8y0';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function main() {
    // ── 1. Check operators have source_id ──────────────────────────────────
    console.log('\n=== Mobile Prepaid Operators (checking source_id in metadata) ===\n');

    const { data: ops, error: opsErr } = await supabase
        .from('operators')
        .select('id, name, code, metadata, is_active')
        .order('display_order')
        .limit(30);

    if (opsErr) {
        console.error('❌ Error fetching operators:', opsErr.message);
    } else {
        let missing = 0;
        for (const op of ops) {
            const sourceId = op.metadata?.source_id;
            const icon = sourceId ? '✅' : '❌';
            if (!sourceId) missing++;
            console.log(`${icon} [${op.code}] ${op.name}  → OpId: ${sourceId ?? 'MISSING'} | active: ${op.is_active}`);
        }
        if (missing > 0) {
            console.warn(`\n⚠️  ${missing} operators are missing source_id in metadata!`);
            console.warn('   Run populate_operators.sql in Supabase to fix this.\n');
        } else {
            console.log('\n✅ All checked operators have source_id in metadata.\n');
        }
    }

    // ── 2. Live Balance check via Edge Function ────────────────────────────
    console.log('=== Testing SankalpPe Balance (via paybil-proxy edge function) ===\n');

    const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV3aHd3amRvaWFxdG9oeG1wZWN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY5MjcxMTAsImV4cCI6MjA4MjUwMzExMH0.ER8sQcVHMHdtgF57r2ooIURdUzkiV4FhQD09JhFtfiI';

    const resp = await fetch(`${SUPABASE_URL}/functions/v1/paybil-proxy`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ANON_KEY}`,
        },
        body: JSON.stringify({ type: 'sankalppe', action: 'balance' }),
    });

    const result = await resp.json();
    console.log('Raw response:', JSON.stringify(result, null, 2));

    if (result.STATUS?.toString() === '1') {
        console.log('\n✅ SankalpPe API is LIVE and authenticated! Balance:', result.BALANCE ?? result.WALLETBAL ?? 'N/A');
    } else if (result.ERRORCODE) {
        console.warn('\n⚠️  SankalpPe returned error code', result.ERRORCODE, ':', result.MESSAGE || result.ERROR_NAME);
        console.warn('   This may be an IP whitelist issue. The Supabase Edge Function IP needs to be whitelisted at SankalpPe.');
    } else {
        console.warn('\n⚠️  Unexpected response — check proxy deployment or token.');
    }
}

main().catch(console.error);
