const express = require('express');
const axios = require('axios');
const qs = require('qs');
const crypto = require('crypto');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function normalizeNumber(raw) {
  let number = raw.replace(/\D/g, '');
  if (number.startsWith('09')) return '+63' + number.slice(1);
  if (number.startsWith('9') && number.length === 10) return '+63' + number;
  if (number.startsWith('63') && number.length === 12) return '+' + number;
  if (number.startsWith('+63') && number.length === 13) return number;
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

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.post('/send', async (req, res) => {
  const { number, message } = req.body;

  if (!number || !message) {
    return res.json({ success: false, error: 'Please provide number and message.' });
  }

  const normalized = normalizeNumber(number);
  if (!normalized) {
    return res.json({ success: false, error: 'Invalid number format (09xxxxxxxxx) or (+63xxxxxxxxxx).' });
  }

  const suffix = '-freed0m';
  const credits = '\n\nThis message is from FREE TEXT PH, officially developed by Marjhun Baylon.\nVisit:https://freetextph.up.railway.app/';
  const finalMessage = message.endsWith(suffix) ? `${message}${credits}` : `${message} ${suffix}${credits}`;

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
    url: 'https://sms.m2techtronix.com/v13/sms.php',
    headers: {
      'User-Agent': randomUserAgent(),
      'Connection': 'Keep-Alive',
      'Accept-Encoding': 'gzip',
      'Content-Type': 'application/x-www-form-urlencoded',
      'Accept-Charset': 'UTF-8'
    },
    data: postData
  };

  try {
    const response = await axios.request(config);
    res.json({ success: true, message: 'SMS SENDED SUCCESSFULLY', data: response.data });
  } catch (err) {
    res.json({ success: false, error: err.response?.data || err.message });
  }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
