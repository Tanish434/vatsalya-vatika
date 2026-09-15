import type { VercelRequest, VercelResponse } from '@vercel/node';
import nodemailer from 'nodemailer';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ success: false, message: 'Method Not Allowed' });
    return;
  }

  try {
    const { title, description, metadata = {} } = req.body || {};

    const emailHost = process.env.EMAIL_HOST || 'smtp.gmail.com';
    const emailPort = parseInt(process.env.EMAIL_PORT || '587', 10);
    const emailUser = process.env.EMAIL_USER || 'shivamindian65@gmail.com';
    const emailPass = process.env.EMAIL_PASS || 'qmba ihsf ifcq euni';
    const emailTo = process.env.EMAIL_TO || 'monuvatika@gmail.com';

    if (!emailUser || !emailPass) {
      console.warn('[Email Alert] Skipping — emailUser or emailPass not configured');
      res.status(200).json({ success: false, message: 'Email credentials not configured' });
      return;
    }

    const transporter = nodemailer.createTransport({
      host: emailHost,
      port: emailPort,
      secure: emailPort === 465,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    const now = new Date().toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    });

    let emailHtml = `
      <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 8px; max-width: 600px; margin: 0 auto; background-color: #fcfcfc;">
        <h2 style="color: #ea580c; margin-top: 0;">🔔 Vatsalya Vatika Alert: ${title || 'New Notification'}</h2>
        <p style="font-size: 15px; color: #333; line-height: 1.5;">${description || 'A new event occurred on the website.'}</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
        <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666; width: 120px;">Time:</td>
            <td style="padding: 6px 0; color: #111;">${now}</td>
          </tr>
    `;

    if (metadata.amount) {
      emailHtml += `
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666;">Amount:</td>
            <td style="padding: 6px 0; color: #ea580c; font-weight: bold; font-size: 16px;">₹${Number(metadata.amount).toLocaleString('en-IN')}</td>
          </tr>
      `;
    }

    if (metadata.name) {
      emailHtml += `
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666;">Name:</td>
            <td style="padding: 6px 0; color: #111;">${metadata.name}</td>
          </tr>
      `;
    }

    if (metadata.email) {
      emailHtml += `
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666;">Email:</td>
            <td style="padding: 6px 0; color: #111;">${metadata.email}</td>
          </tr>
      `;
    }

    if (metadata.phone) {
      emailHtml += `
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666;">Phone:</td>
            <td style="padding: 6px 0; color: #111;">${metadata.phone}</td>
          </tr>
      `;
    }

    if (metadata.purpose) {
      emailHtml += `
          <tr>
            <td style="padding: 6px 0; font-weight: bold; color: #666;">Purpose:</td>
            <td style="padding: 6px 0; color: #111;">${metadata.purpose}</td>
          </tr>
      `;
    }

    emailHtml += `
        </table>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 15px 0;" />
        <p style="font-size: 12px; color: #888; margin-bottom: 0;">This alert was generated automatically from the Vatsalya Vatika Ashram Portal.</p>
      </div>
    `;

    await transporter.sendMail({
      from: `"Vatsalya Vatika Portal" <${emailUser}>`,
      to: emailTo,
      subject: `🔔 Ashram Alert: ${title || 'New Notification'}`,
      html: emailHtml
    });

    res.status(200).json({ success: true, message: 'Email alert sent successfully' });
  } catch (err: any) {
    console.error('[Email Alert Error]:', err?.message || err);
    res.status(500).json({ success: false, error: err?.message || 'Failed to send alert' });
  }
}
