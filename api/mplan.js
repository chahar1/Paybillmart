export default async function handler(req, res) {
    // Enable CORS for the mobile app
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const payload = req.method === 'POST' ? req.body : req.query;
        const { type, operator_code, circle_code, mobile_number } = payload;

        const MPLAN_API_KEY = '86950d2c94bf25613b3e1b5e2a5763f5';

        let url = '';
        if (type === 'plans') {
            url = `https://mplan.in/apiv2/mobileplans?apikey=${MPLAN_API_KEY}&operator_code=${operator_code}&circle_code=${circle_code}`;
        } else if (type === 'roffer') {
            url = `https://mplan.in/apiv2/mobile_roffer?apikey=${MPLAN_API_KEY}&operator_code=${operator_code}&mobile_number=${mobile_number}`;
        } else {
            return res.status(400).json({ error: 'Missing or invalid "type" parameter' });
        }

        console.log(`Proxying MPlan request to: ${url}`);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Accept': 'application/json',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        });

        const data = await response.json();

        // Return data with a JSON content type
        return res.status(200).json(data);

    } catch (error) {
        console.error("MPlan Proxy Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
