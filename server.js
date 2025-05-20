// server.js - Secure Mailgun Proxy for Chatbot Lead Submission
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/', (_req, res) => res.send('Harris Homes Mailgun Proxy is live'));

app.post('/chat-lead', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const mailgunRes = await fetch(`https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`, {
      method: 'POST',
      headers: {
        Authorization: 'Basic ' + Buffer.from(`api:${process.env.MAILGUN_API_KEY}`).toString('base64'),
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        from: `Harris Homes Bot <bot@${process.env.MAILGUN_DOMAIN}>`,
        to: process.env.FORWARD_TO_EMAIL,
        subject: 'New Lead from Harris Homes Chatbot',
        text: `Name: ${name}\nEmail: ${email}\n\n${message}`
      })
    });

    if (!mailgunRes.ok) {
      const errorText = await mailgunRes.text();
      return res.status(500).json({ error: 'Mailgun error', details: errorText });
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Mailgun proxy error:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
