'use strict';

const path = require('path');
const axios = require('axios');
const multer = require('multer');
const XLSX = require('xlsx');

const Question = require('../models/Question');
const Answer = require('../models/Answer');

// WhatsApp API config (set these in .env)
const METAURL = process.env.METAURL || 'https://graph.facebook.com/v22.0/';
const WABA_TOKEN = process.env.TOKEN; // required
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID; // required

// Multer (in-memory)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// ───────────────────────────────────────────────────────────────────────────────
// Helpers to send WA messages (same style as your chatbot’s askQuestion)
// ───────────────────────────────────────────────────────────────────────────────
function truncate(s, max) {
  if (!s) return '';
  s = String(s);
  return s.length > max ? s.slice(0, max) : s;
}

async function sendText(to, body) {
  try {
    await axios.post(
      `${METAURL}${PHONE_NUMBER_ID}/messages?access_token=${WABA_TOKEN}`,
      { messaging_product: 'whatsapp', to, text: { body } },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('sendText error:', e.response?.data || e.message);
    throw e;
  }
}

async function sendImage(to, link, caption) {
  if (!link) return;
  try {
    await axios.post(
      `${METAURL}${PHONE_NUMBER_ID}/messages?access_token=${WABA_TOKEN}`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'image',
        image: { link, caption: caption?.slice(0, 1024) || undefined },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (e) {
    console.error('sendImage error:', e.response?.data || e.message);
    throw e;
  }
}

async function askFirstQuestion(to, q) {
  const captionText = [q.caption, q.question].filter(Boolean).join('\n\n');

  // Send image first (if any)
  if (q.image?.url) {
    await sendImage(to, q.image.url, captionText);
  }

  if (q.answerType === 'options' && Array.isArray(q.options) && q.options.length) {
    const BODY_TEXT = truncate(q.question, 1024);
    const HEADER_TEXT = truncate(q.caption || 'Select one', 60);

    // chunk options into groups of 10
    for (let i = 0; i < q.options.length; i += 10) {
      const chunk = q.options.slice(i, i + 10);

      const rows = chunk.map((opt) => {
        const id = String(opt);
        const t = truncate(opt, 24);
        const rem = String(opt).slice(t.length).trim();
        const desc = rem ? truncate(rem, 60) : undefined;
        const row = { id, title: t };
        if (desc) row.description = desc;
        return row;
      });

      const payload = {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'list',
          header: { type: 'text', text: HEADER_TEXT },
          body: { text: BODY_TEXT },
          action: {
            button: 'View options',
            sections: [{ title: 'Options', rows }],
          },
        },
      };

      await axios.post(
        `${METAURL}${PHONE_NUMBER_ID}/messages?access_token=${WABA_TOKEN}`,
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );
    }
    return;
  }

  if (q.answerType === 'boolean') {
    await axios.post(
      `${METAURL}${PHONE_NUMBER_ID}/messages?access_token=${WABA_TOKEN}`,
      {
        messaging_product: 'whatsapp',
        to,
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: truncate(q.question, 1024) },
          action: {
            buttons: [
              { type: 'reply', reply: { id: 'ans_yes', title: 'Yes' } },
              { type: 'reply', reply: { id: 'ans_no', title: 'No' } },
            ],
          },
        },
      },
      { headers: { 'Content-Type': 'application/json' } }
    );
    return;
  }

  // text/number: if no image, include full text; else follow-up prompt
  if (!q.image?.url) {
    await sendText(to, captionText);
  } else {
    await sendText(to, 'Please reply with your answer.');
  }
}

// small wait to be gentler on WA rate limits
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ───────────────────────────────────────────────────────────────────────────────
// Controller: GET /api/campaign/sample  -> Download sample Excel
// ───────────────────────────────────────────────────────────────────────────────
async function downloadSampleTemplate(req, res) {
  try {
    const wb = XLSX.utils.book_new();
    const rows = [
      { phoneNumber: '919999888877', userName: 'Optional Name' },
      { phoneNumber: '917878787878', userName: '' },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'phones');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    const filename = `campaign_template_${Date.now()}.xlsx`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    return res.status(200).send(buf);
  } catch (err) {
    console.error('downloadSampleTemplate error:', err);
    return res.status(500).json({ message: 'Failed to generate template', success: false, error: true });
  }
}

// ───────────────────────────────────────────────────────────────────────────────
// Controller: POST /api/campaign/upload (multipart) -> send first question
// Body: file: .xlsx/.xls/.csv with column "phoneNumber" (userName optional)
// ───────────────────────────────────────────────────────────────────────────────
async function uploadAndSend(req, res) {
  try {
    if (!WABA_TOKEN || !PHONE_NUMBER_ID) {
      return res.status(500).json({
        message: 'WhatsApp credentials missing (TOKEN / PHONE_NUMBER_ID).',
        success: false,
        error: true,
      });
    }

    // Check questions
    const allQs = await Question.find().sort({ order: 1 }).exec();
    if (!allQs.length) {
      return res.status(400).json({ message: 'No questions defined.', success: false, error: true });
    }
    const firstQ = allQs[0];

    // Parse excel
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({ message: 'File is required.', success: false, error: true });
    }

    const wb = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = wb.SheetNames[0];
    const sheet = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(sheet, { defval: '' });

    // Extract phones
    const rawPhones = rows
      .map((r) => ({
        phoneNumber: String(r.phoneNumber || r.Phone || r['phone'] || '').replace(/\D+/g, ''),
        userName: String(r.userName || r['name'] || r['Name'] || '').trim(),
      }))
      .filter((r) => r.phoneNumber);

    // Deduplicate
    const seen = new Set();
    const phones = [];
    for (const r of rawPhones) {
      if (!seen.has(r.phoneNumber)) {
        seen.add(r.phoneNumber);
        phones.push(r);
      }
    }

    if (!phones.length) {
      return res.status(400).json({ message: 'No valid phone numbers found.', success: false, error: true });
    }

    const report = { total: phones.length, sent: 0, created: 0, errors: [] };

    // Send sequentially (simple throttling)
    for (const { phoneNumber, userName } of phones) {
      try {
        // Upsert Answer doc (only create if not exists)
        let doc = await Answer.findOne({ phoneNumber }).exec();
        if (!doc) {
          doc = await Answer.create({
            phoneNumber,
            userName: userName || '',
            responses: [],
            adminViewed: false,
            mailStatus: false,
          });
          report.created += 1;
        }

        // Send first question
        await askFirstQuestion(phoneNumber, firstQ);
        report.sent += 1;

        // Gentle delay (adjust as needed)
        // 150ms is conservative; if you need heavier throughput, consider queues
        await sleep(150);
      } catch (err) {
        console.error(`Error sending to ${phoneNumber}:`, err.response?.data || err.message);
        report.errors.push({ phoneNumber, error: err.response?.data || err.message });
        // continue
        await sleep(100);
      }
    }

    return res.json({ message: 'Campaign processed', success: true, error: false, data: report });
  } catch (err) {
    console.error('uploadAndSend error:', err);
    return res.status(500).json({ message: err.message || 'Failed', success: false, error: true });
  }
}

// Expose multer middleware to routes
const uploadMiddleware = upload.single('file');

module.exports = {
  downloadSampleTemplate,
  uploadAndSend,
  uploadMiddleware,
};
