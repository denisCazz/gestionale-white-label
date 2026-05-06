import { Resend } from "resend";

let _client: Resend | null = null;
function client(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  _client ??= new Resend(process.env.RESEND_API_KEY);
  return _client;
}

export type SendEmailInput = {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  from?: string;
  replyTo?: string;
};

export async function sendEmail(input: SendEmailInput) {
  const c = client();
  const from = input.from ?? process.env.EMAIL_FROM ?? "noreply@example.com";
  if (!c) {
    console.log("[email:noop] would send", { to: input.to, subject: input.subject });
    return { id: "noop" };
  }
  const res = await c.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text ?? "",
    html: input.html,
    replyTo: input.replyTo,
  });
  if (res.error) throw new Error(res.error.message);
  return { id: res.data?.id ?? "" };
}
