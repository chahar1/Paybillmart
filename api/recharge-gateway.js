
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

            switch (action) {
                case 'recharge':
                    const { mobile, amount, operator_code, request_id } = req.query;
                    url = `${BASE_URL}/Recharge2?ApiToken=${API_TOKEN}&MobileNo=${mobile}&Amount=${amount}&pId=${operator_code}&RefTxnId=${request_id}`;
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
            return res.status(200).json(data);

        } catch (error) {
            return res.status(500).json({ error: error.message });
        }
    }

    return res.status(400).json({ error: 'Unsupported provider' });
}
