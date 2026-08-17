import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const from = process.env.EMAIL_FROM ?? "Leave Booking <leave@example.com>";

export async function sendEmail(to: string, subject: string, text: string) {
  if (!resend) {
    console.log(`[email:dev] to=${to} subject="${subject}"\n${text}\n`);
    return;
  }

  try {
    await resend.emails.send({ from, to, subject, text });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}
