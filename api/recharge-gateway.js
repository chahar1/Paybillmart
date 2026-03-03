
/**
 * SankalpPe Recharge Gateway — Vercel Serverless Function
 *
 * All recharge API calls use GET requests.
 * SankalpPe OpId must be a NUMERIC value (source_id from operators.metadata).
 *
 * STATUS codes from SankalpPe:
 *   1 = Success
 *   2 = Processing / Pending (operator timeout)
 *   3+ = Failed
 */

const SANKALPPE_TOKEN = '6c6a1aed-cb15-4d29-8c85-2ce5bca3c57a';
const SANKALPPE_BASE = 'https://sankalppe.com/Api/Service';

const ERROR_CODES = {
    "0": "Request processed successfully",
    "1": "Authentication Failed",
    "2": "Invalid Request",
    "3": "Invalid Mobile Number",
    "4": "Invalid Amount",
    "5": "Invalid Operator",
    "6": "Internal Server Error",
    "7": "User Not Exists",
    "9": "Insufficient API Balance",
    "10": "Request Failed",
    "16": "Duplicate Request",
    "17": "User Not Active",
    "18": "Invalid Request From IP",
    "19": "Invalid Request Id",
    "20": "Invalid Data",
    "21": "Frequent Request — Retry After Some Time",
    "22": "Invalid Request-Id (max 30 digits allowed)",
    "26": "No Record Found",
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const provider = req.query.provider || 'sankalppe';
    const action = req.query.action;

    if (!action) {
        return res.status(200).send(`
            <h1>Paybil Recharge Gateway</h1>
            <p>Usage: <code>/api/recharge-gateway?action=balance&provider=sankalppe</code></p>
            <p>Available actions: recharge, balance, status, bill-fetch, bill-pay, complaint</p>
        `);
    }

    console.log(`[Gateway] provider=${provider} action=${action}`);

    if (provider !== 'sankalppe') {
        return res.status(400).json({ error: 'Unsupported provider. Use provider=sankalppe' });
    }

    try {
        let url = '';

        switch (action) {

            case 'recharge': {
                // Required params: mobile, amount, op_id (NUMERIC source_id), request_id
                const { mobile, amount, op_id, request_id } = req.query;

                if (!mobile || !amount || !op_id || !request_id) {
                    return res.status(400).json({
                        error: 'Missing required parameters: mobile, amount, op_id, request_id'
                    });
                }

                url = `${SANKALPPE_BASE}/Recharge2?ApiToken=${SANKALPPE_TOKEN}&MobileNo=${mobile}&Amount=${amount}&OpId=${op_id}&RefTxnId=${request_id}`;
                break;
            }

            case 'balance': {
                url = `${SANKALPPE_BASE}/Balance?at=${SANKALPPE_TOKEN}`;
                break;
            }

            case 'status': {
                const { ref_id } = req.query;
                if (!ref_id) {
                    return res.status(400).json({ error: 'Missing required parameter: ref_id' });
                }
                url = `${SANKALPPE_BASE}/statuscheck?ApiToken=${SANKALPPE_TOKEN}&RefTxnId=${ref_id}`;
                break;
            }

            case 'bill-fetch': {
                const { bill_no, bill_operator, request_id, acno, acoth } = req.query;
                if (!bill_no || !bill_operator) {
                    return res.status(400).json({ error: 'Missing required parameters: bill_no, bill_operator' });
                }
                url = `${SANKALPPE_BASE}/BillFetch?at=${SANKALPPE_TOKEN}&num=${bill_no}&op=${bill_operator}&rq=${request_id || Date.now()}&acno=${acno || ''}&acoth=${acoth || ''}&amt=1`;
                break;
            }

            case 'bill-pay': {
                const { pay_num, pay_amount, pay_operator, pay_request_id, pay_acno, pay_acoth } = req.query;
                if (!pay_num || !pay_amount || !pay_operator || !pay_request_id) {
                    return res.status(400).json({ error: 'Missing required parameters for bill-pay' });
                }
                url = `${SANKALPPE_BASE}/BillPay?at=${SANKALPPE_TOKEN}&op=${pay_operator}&num=${pay_num}&amt=${pay_amount}&rq=${pay_request_id}&acno=${pay_acno || ''}&acoth=${pay_acoth || ''}`;
                break;
            }

            case 'complaint': {
                const { rq, remark } = req.query;
                if (!rq) {
                    return res.status(400).json({ error: 'Missing required parameter: rq' });
                }
                url = `${SANKALPPE_BASE}/complaint?at=${SANKALPPE_TOKEN}&rq=${rq}&rm=${remark || ''}`;
                break;
            }

            default:
                return res.status(400).json({ error: `Unknown action: ${action}` });
        }

        console.log(`[SankalpPe] GET ${url}`);
        const response = await fetch(url);
        const data = await response.json();

        // Enrich error code description
        const errCode = data.ERRORCODE?.toString();
        if (errCode && ERROR_CODES[errCode]) {
            data.ERROR_NAME = ERROR_CODES[errCode];
            if (data.STATUS?.toString() !== '1') {
                data.MESSAGE = data.MESSAGE
                    ? `${data.MESSAGE} — ${data.ERROR_NAME}`
                    : data.ERROR_NAME;
            }
        }

        console.log(`[SankalpPe] Response:`, JSON.stringify(data));
        return res.status(200).json(data);

    } catch (error) {
        console.error('[Gateway Error]:', error);
        return res.status(500).json({ error: error.message });
    }
}
