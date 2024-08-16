const express = require("express");
const puppeteer = require("puppeteer");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 3000;
app.use(cors());

app.get("/fetch-recaptcha", async (req, res) => {
  const url = "https://ktu.edu.in/exam/result";

  try {
    const browser = await puppeteer.launch({
      executablePath:
        process.env.NODE_ENV === "production"
          ? process.env.PUPPETEER_EXECUTABLE_PATH
          : puppeteer.executablePath(),
      args:[
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--single-process',
        '--no-zygote',
    ]
    });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: "networkidle2" });

    const recaptchaURL = await page.evaluate(() => {
      const iframes = document.getElementsByTagName("iframe");
      for (let i = 0; i < iframes.length; i++) {
        const src = iframes[i].src;
        if (src.includes("recaptcha")) {
          return src;
        }
      }
      return null;
    });

    await browser.close();

    res.json({
        anchorUrl: recaptchaURL,
    })
  } catch (error) {
    console.error("Error during reCAPTCHA URL fetching:", error);
    res.status(500).send("An error occurred while fetching reCAPTCHA URL");
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
