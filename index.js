const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const querystring = require('querystring');
const cors = require('cors');

const app = express();
const PORT = 3000;
app.use(cors());

app.get('/fetch-recaptcha', async (req, res) => {
    const url = 'https://ktu.edu.in/exam/result';

    try {
        const browser = await puppeteer.launch({
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox', '--headless']
        });
        const page = await browser.newPage();

        await page.goto(url, { waitUntil: 'networkidle2' });

        const recaptchaURL = await page.evaluate(() => {
            const iframes = document.getElementsByTagName('iframe');
            for (let i = 0; i < iframes.length; i++) {
                const src = iframes[i].src;
                if (src.includes('recaptcha')) {
                    return src;
                }
            }
            return null;
        });

        await browser.close();

        if (recaptchaURL) {
            const anchorr = recaptchaURL;
            const keysite = anchorr.split('k=')[1].split('&')[0];
            const var_co = anchorr.split('co=')[1].split('&')[0];
            const var_v = anchorr.split('v=')[1].split('&')[0];

            try {
                const response = await axios.get(anchorr);
                const r1 = response.data;
                const token1 = r1.split('recaptcha-token" value="')[1].split('">')[0];

                const payload = {
                    "v": var_v,
                    "reason": "q",
                    "c": token1,
                    "k": keysite,
                    "co": var_co,
                    "hl": "en",
                    "size": "invisible"
                };

                const bypassResponse = await axios.post(`https://www.google.com/recaptcha/api2/reload?k=${keysite}`, querystring.stringify(payload));
                const r2 = bypassResponse.data;
                const token2 = r2.split('"rresp","')[1]?.split('"')[0] || 'null';

                res.json({
                    anchorUrl: recaptchaURL,
                    xToken: token2,
                });
            } catch (error) {
                console.error('Error during reCAPTCHA bypass:', error);
                res.status(500).send('An error occurred during reCAPTCHA bypass');
            }
        } else {
            res.status(404).send('reCAPTCHA URL not found');
        }
    } catch (error) {
        console.error('Error during reCAPTCHA URL fetching:', error);
        res.status(500).send('An error occurred while fetching reCAPTCHA URL');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
