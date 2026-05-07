import { Resend } from "resend";

const FROM = "info@bitora.it";
const CC_ALWAYS = process.env.NOTIFY_CC_EMAIL ?? "";

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
  cc?: string | string[];
};

export async function sendEmail(input: SendEmailInput) {
  const c = client();
  const from = input.from ?? FROM;

  // Merge CC: sempre includi CC_ALWAYS
  const ccList: string[] = [];
  if (input.cc) {
    const extra = Array.isArray(input.cc) ? input.cc : [input.cc];
    ccList.push(...extra);
  }
  if (CC_ALWAYS && !ccList.includes(CC_ALWAYS)) ccList.push(CC_ALWAYS);

  if (!c) {
    console.log("[email:noop] would send", { to: input.to, subject: input.subject, cc: ccList });
    return { id: "noop" };
  }
  const res = await c.emails.send({
    from,
    to: input.to,
    cc: ccList,
    subject: input.subject,
    text: input.text ?? "",
    html: input.html,
    replyTo: input.replyTo,
  });
  if (res.error) throw new Error(res.error.message);
  return { id: res.data?.id ?? "" };
}

