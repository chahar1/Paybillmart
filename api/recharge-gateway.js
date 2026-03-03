
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { action, provider } = req.query;
    console.log(`Gateway Request: provider=${provider}, action=${action}`);

    if (provider === 'sankalppe') {
        const API_TOKEN = '6c6a1aed-cb15-4d29-8c85-2ce5bca3c57a';
        const BASE_URL = 'https://sankalppe.com/Api/Service';

        if (!API_TOKEN) {
            console.error("SANKALPPE_API_TOKEN is missing");
            return res.status(500).json({ error: "Server Configuration Error", detail: "SANKALPPE_API_TOKEN is not set" });
        }

        try {
            let url = '';

            const ERROR_CODES = {
                "0": "No Error, Request is processed!",
                "1": "Authentication Failed!",
                "2": "Invalid Request!",
                "3": "Invalid Mobile Number!",
                "4": "Invalid Amount!",
                "5": "Invalid Operator!",
                "6": "Internal Server Error!",
                "7": "User Not Exists",
                "9": "Insufficient API Balance",
                "16": "Duplicate Request!",
                "17": "User Not Active!",
                "18": "Invalid Request From IP",
                "19": "Invalid Request Id",
                "20": "Invalid Data",
                "21": "Frequent Request. Retry After Some time.",
                "22": "Invalid Request-Id (max 30 digits allowed)",
                "26": "No record found"
            };

            switch (action) {
                case 'recharge':
                    const { mobile, amount, operator_code, request_id } = req.query;
                    url = `${BASE_URL}/Recharge2?ApiToken=${API_TOKEN}&MobileNo=${mobile}&Amount=${amount}&pId=${operator_code}&RefTxnId=${request_id}`;
                    break;

                case 'bill-fetch':
                    const { bill_no, operator, fetch_request_id, acno, acoth } = req.query;
                    url = `${BASE_URL}/BillFetch?at=${API_TOKEN}&num=${bill_no}&op=${operator}&rq=${fetch_request_id}&acno=${acno || ''}&acoth=${acoth || ''}&amt=1`;
                    break;

                case 'bill-pay':
                    const { pay_num, pay_amount, pay_operator, pay_request_id, pay_acno, pay_acoth } = req.query;
                    url = `${BASE_URL}/BillPay?at=${API_TOKEN}&op=${pay_operator}&num=${pay_num}&amt=${pay_amount}&rq=${pay_request_id}&acno=${pay_acno || ''}&acoth=${pay_acoth || ''}`;
                    break;

                case 'status':
                    const { ref_id } = req.query;
                    url = `https://sankalppe.com/Api/service/statuscheck?ApiToken=${API_TOKEN}&RefTxnId=${ref_id}`;
                    break;

                case 'balance':
                    url = `${BASE_URL}/Balance?at=${API_TOKEN}`;
                    break;

                case 'complaint':
                    const { rq, remark } = req.query;
                    url = `${BASE_URL}/complaint?at=${API_TOKEN}&rq=${rq}&rm=${remark}`;
                    break;

                default:
                    return res.status(400).json({ error: 'Invalid action' });
            }

            console.log(`Hitting SankalpPe API: ${url}`);
            const response = await fetch(url);
            const data = await response.json();

            // Enrich the message if an error code is present
            if (data.ERRORCODE && ERROR_CODES[data.ERRORCODE.toString()]) {
                data.ERROR_NAME = ERROR_CODES[data.ERRORCODE.toString()];
                if (data.STATUS !== 1) {
                    data.MESSAGE = `${data.MESSAGE || 'Error'}: ${data.ERROR_NAME}`;
                }
            }

            return res.status(200).json(data);

        } catch (error) {
            console.error("Gateway Exception:", error);
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(400).json({ error: 'Unsupported provider' });
}
