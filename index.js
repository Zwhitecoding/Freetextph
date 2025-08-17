const express = require('express');
const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const path = require('path');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

const CONFIG = {
  SMS_API_URL: 'https://sms.m2techtronix.com/v13/sms.php',
  MESSAGE_SUFFIX: '-freed0m',
  MESSAGE_CREDITS: '\n\nThis is a free text, officially developed by Marjhun Baylon.',
  RATE_LIMIT: {
    windowMs: 60 * 1000,
    max: 20,
  }
};

app.use(helmet());
app.use(rateLimit(CONFIG.RATE_LIMIT));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function normalizeNumber(raw) {
  if (!raw) return null;
  let number = raw.replace(/\D/g, '');
  if (/^09\d{9}$/.test(number)) return '+63' + number.slice(1);
  if (/^9\d{9}$/.test(number)) return '+63' + number;
  if (/^63\d{10}$/.test(number)) return '+' + number;
  if (/^\+63\d{10}$/.test(number)) return number;
  return null;
}

function generateDeviceId() {
  return crypto.randomBytes(8).toString('hex');
}

function randomUserAgent() {
  const agents = [
    'Dalvik/2.1.0 (Linux; Android 10; TECNO KE5 Build/QP1A.190711.020)',
    'Dalvik/2.1.0 (Linux; Android 11; Infinix X6810 Build/RP1A.200720.011)',
    'Dalvik/2.1.0 (Linux; Android 12; itel L6506 Build/SP1A.210812.016)',
    'Dalvik/2.1.0 (Linux; Android 14; TECNO KL4 Build/UP1A.231005.007)'
  ];
  return agents[Math.floor(Math.random() * agents.length)];
}

function buildMessage(message) {
  const { MESSAGE_SUFFIX, MESSAGE_CREDITS } = CONFIG;
  return message.endsWith(MESSAGE_SUFFIX) 
    ? `${message}${MESSAGE_CREDITS}` 
    : `${message} ${MESSAGE_SUFFIX}${MESSAGE_CREDITS}`;
}

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post('/send', async (req, res, next) => {
  try {
    const { number, message } = req.body;

    if (!number || !message) {
      return res.json({ success: false, error: 'Please provide number and message.' });
    }

    const normalized = normalizeNumber(number);
    if (!normalized) {
      return res.json({ success: false, error: 'Invalid number format (09xxxxxxxxx) or (+63xxxxxxxxxx).' });
    }

    const finalMessage = buildMessage(message);

    const payload = [
      'free.text.sms',
      '412',
      normalized,
      'DEVICE',
      'fjsx9-G7QvGjmPgI08MMH0:APA91bGcxiqo05qhojnIdWFYpJMHAr45V8-kdccEshHpsci6UVaxPH4X4I57Mr6taR6T4wfsuKFJ_T-PBcbiWKsKXstfMyd6cwdqwmvaoo7bSsSJeKhnpiM',
      finalMessage,
      ''
    ];

    const postData = qs.stringify({
      humottaee: 'Processing',
      '$Oj0O%K7zi2j18E': JSON.stringify(payload),
      device_id: generateDeviceId()
    });

    const config = {
      method: 'POST',
      url: CONFIG.SMS_API_URL,
      headers: {
        'User-Agent': randomUserAgent(),
        'Connection': 'Keep-Alive',
        'Accept-Encoding': 'gzip',
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept-Charset': 'UTF-8'
      },
      data: postData
    };

    const response = await axios.request(config);
    res.json({ 
      success: true, 
      message: 'SMS sent successfully ✅\n\nThank you for using this service - Marjhun Baylon', 
      data: response.data 
    });

  } catch (err) {
    next(err);
  }
});

app.use((err, req, res, next) => {
  console.error('Unexpected Error:', err.message);
  res.status(500).json({ success: false, error: 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
