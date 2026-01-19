const http = require('http');
const crypto = require('crypto');

const HMAC_KEY = 'your_hmac_key_here';
const PORT = 5000;

http.createServer((req, res) => {
    if (req.method !== 'POST') {
        res.writeHead(405);
        return res.end('Method Not Allowed');
    }

    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        const signature = req.headers['x-yodeck-signature'] || '';
        const expected = crypto
            .createHmac('sha256', HMAC_KEY)
            .update(body)
            .digest('base64');

        console.log(`Received: ${signature}`);
        console.log(`Expected: ${expected}`);
        console.log(`Body: ${body}`);

        if (signature !== expected) {
            console.log('❌ Invalid signature');
            res.writeHead(401);
            return res.end('Unauthorized');
        }

        console.log('✅ Valid signature');
        res.writeHead(200);
        res.end('OK');
    });
}).listen(PORT, () => console.log(`Listening on port ${PORT}`));
