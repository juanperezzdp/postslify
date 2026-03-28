import { Resend } from "resend";
import { promises as fs } from "node:fs";
import path from "node:path";
import type { WelcomeEmailContent, WelcomeEmailLocale } from "@/types/mail";

const resend = new Resend(process.env.RESEND_API_KEY);
const fallbackPublicBaseUrl = "https://www.postslify.com";
const resetEmailFrom =
  process.env.RESET_EMAIL_FROM || "Postslify <resetpassword@postslify.com>";
const welcomeEmailFrom =
  process.env.WELCOME_EMAIL_FROM || "Postslify <info@postslify.com>";

const resolvePublicBaseUrl = () => {
  const configuredUrl =
    process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || fallbackPublicBaseUrl;

  try {
    return new URL(configuredUrl).origin;
  } catch {
    return fallbackPublicBaseUrl;
  }
};
const welcomeEmailContentByLocale: Record<WelcomeEmailLocale, WelcomeEmailContent> = {
  en: {
    preheader: "Welcome to Postslify. Create and schedule LinkedIn content faster.",
    subject: "Welcome to Postslify!",
    heading: "Welcome to the Postslify community, {name}!",
    intro:
      "Unleash your LinkedIn growth with your all-in-one AI content platform. Build posts in minutes, keep your voice, and publish with consistency.",
    ctaText: "Create something amazing",
    appreciation:
      "We really appreciate your support and can’t wait to help you scale your personal brand with less effort.",
    supportLine: "Need help? Check our FAQ or message us directly.",
    contactLabel: "Contact",
    contactEmail: "support@postslify.com",
    legal:
      "You are receiving this email because you signed up for a Postslify account.",
  },
  es: {
    preheader:
      "Bienvenido a Postslify. Crea y programa contenido para LinkedIn más rápido.",
    subject: "¡Bienvenido a Postslify!",
    heading: "¡Bienvenido a la comunidad de Postslify, {name}!",
    intro:
      "Impulsa tu crecimiento en LinkedIn con tu plataforma todo en uno con IA. Crea publicaciones en minutos, mantiene tu estilo y publica con constancia.",
    ctaText: "Crea algo increíble",
    appreciation:
      "Apreciamos mucho tu confianza y queremos ayudarte a escalar tu marca personal con menos esfuerzo.",
    supportLine: "¿Necesitas ayuda? Revisa nuestras FAQ o escríbenos directamente.",
    contactLabel: "Contacto",
    contactEmail: "support@postslify.com",
    legal:
      "Recibes este correo porque creaste una cuenta en Postslify.",
  },
};

const resetEmailContentByLocale: Record<
  WelcomeEmailLocale,
  {
    subject: string;
    title: string;
    greeting: string;
    message: string;
    cta: string;
    ignore: string;
    expires: string;
    regards: string;
  }
> = {
  en: {
    subject: "Reset your Postslify password",
    title: "Reset Password Request",
    greeting: "Hello,",
    message: "We received a request to reset your password for your Postslify account.",
    cta: "Reset Password",
    ignore: "If you didn't request this, you can safely ignore this email.",
    expires: "This link will expire in 1 hour.",
    regards: "Best regards,<br>The Postslify Team",
  },
  es: {
    subject: "Restablece tu contraseña de Postslify",
    title: "Solicitud para restablecer contraseña",
    greeting: "Hola,",
    message: "Recibimos una solicitud para restablecer la contraseña de tu cuenta de Postslify.",
    cta: "Restablecer contraseña",
    ignore: "Si no solicitaste este cambio, puedes ignorar este correo con seguridad.",
    expires: "Este enlace expirará en 1 hora.",
    regards: "Saludos,<br>El equipo de Postslify",
  },
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

const readPublicAssetAsBase64 = async (filename: string) => {
  const filePath = path.join(process.cwd(), "public", filename);
  return fs.readFile(filePath, { encoding: "base64" });
};

export async function sendPasswordResetEmail(
  email: string,
  token: string,
  locale: WelcomeEmailLocale = "en",
) {
  const publicBaseUrl = resolvePublicBaseUrl();
  const safeLocale: WelcomeEmailLocale = locale === "es" ? "es" : "en";
  const content = resetEmailContentByLocale[safeLocale];
  const resetLink = `${publicBaseUrl}/${safeLocale}/reset-password?token=${token}`;

  try {
    const data = await resend.emails.send({
      from: resetEmailFrom,
      to: email,
      subject: content.subject,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>${content.title}</h2>
          <p>${content.greeting}</p>
          <p>${content.message}</p>
          <p>${safeLocale === "es" ? "Haz clic en el botón para crear una nueva contraseña:" : "Click the button below to set a new password:"}</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">${content.cta}</a>
          <p>${content.ignore}</p>
          <p>${content.expires}</p>
          <p>${content.regards}</p>
        </div>
      `,
    });
    
    if (data.error) {
      console.error("Resend API Error:", data.error);
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}

export async function sendWelcomeEmail(
  email: string,
  name?: string,
  locale: WelcomeEmailLocale = "en",
) {
  const content = welcomeEmailContentByLocale[locale];
  const displayName = escapeHtml(name?.trim() || (locale === "es" ? "creador/a" : "creator"));
  const publicBaseUrl = resolvePublicBaseUrl();
  const appUrl = `${publicBaseUrl}/${locale}`;
  const logoUrl = `${publicBaseUrl}/logo-ico.png`;
  const heroImageUrl = `${publicBaseUrl}/emailwelcome.png`;
  const [logoContent, heroContent] = await Promise.all([
    readPublicAssetAsBase64("logo-ico.png").catch(() => null),
    readPublicAssetAsBase64("emailwelcome.png").catch(() => null),
  ]);
  const attachments = [
    logoContent
      ? {
          content: logoContent,
          filename: "logo-ico.png",
          contentType: "image/png",
          contentId: "welcome-logo",
        }
      : null,
    heroContent
      ? {
          content: heroContent,
          filename: "emailwelcome.png",
          contentType: "image/png",
          contentId: "welcome-hero",
        }
      : null,
  ].filter((attachment) => attachment !== null);
  const logoSrc = logoContent ? "cid:welcome-logo" : logoUrl;
  const heroSrc = heroContent ? "cid:welcome-hero" : heroImageUrl;
  const heading = content.heading.replace("{name}", displayName);

  try {
    const data = await resend.emails.send({
      from: welcomeEmailFrom,
      to: email,
      subject: content.subject,
      attachments,
      html: `
        <style>
          :root { color-scheme: light only; supported-color-schemes: light; }
          .postslify-card, .postslify-card td { background-color: #ffffff !important; }
          [data-ogsc] .postslify-card, [data-ogsc] .postslify-card td { background-color: #ffffff !important; }
          [data-ogsb] .postslify-card, [data-ogsb] .postslify-card td { background-color: #ffffff !important; }
        </style>
        <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${content.preheader}</div>
        <div style="background:#f9fcff;margin:0;padding:0;width:100%;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
            <tr>
              <td align="center" bgcolor="#ffffff" style="padding:24px 12px;background:#ffffff !important;background-color:#ffffff !important;">
                <table role="presentation" width="640" cellpadding="0" cellspacing="0" bgcolor="#ffffff" class="postslify-card" style="width:100%;max-width:640px;border-collapse:collapse;background:#ffffff !important;background-color:#ffffff !important;border-radius:16px;overflow:hidden;border:1px solid #d1d5db;box-shadow:0 20px 35px 10px rgba(155, 157, 161, 0.3);">
                  <tr>
                    <td style="padding:32px 34px 8px 34px;">
                      <img src="${logoSrc}" alt="Postslify logo" width="72" style="display:block;border:0;outline:none;text-decoration:none;height:auto;max-width:72px;">
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 34px 0 34px;font-family:Helvetica, Arial, sans-serif;color:#1e3a8a;">
                      <h1 style="margin:0 0 18px 0;font-size:46px;line-height:1.14;font-weight:800;letter-spacing:-0.03em;">${heading}</h1>
                      <p style="margin:0;font-size:22px;line-height:1.5;color:#1d4ed8;">${content.intro}</p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:28px 34px 0 34px;">
                      <img src="${heroSrc}" alt="Postslify welcome" width="520" style="display:block;border:0;outline:none;text-decoration:none;width:100%;max-width:520px;height:auto;">
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:28px 34px 26px 34px;">
                      <a href="${appUrl}" style="display:inline-block;background:#3b82f6;color:#ffffff;text-decoration:none;font-family:Helvetica, Arial, sans-serif;font-size:30px;font-weight:700;line-height:1;padding:22px 44px;border-radius:999px;letter-spacing:-0.02em;">
                        ${content.ctaText}
                      </a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:0 34px;">
                      <hr style="border:0;border-top:1px solid #e5e7eb;margin:0;">
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:26px 34px 18px 34px;font-family:Helvetica, Arial, sans-serif;color:#1e3a8a;">
                      <p style="margin:0 0 14px 0;font-size:18px;line-height:1.55;font-weight:600;">${content.appreciation}</p>
                      <p style="margin:0 0 8px 0;font-size:18px;line-height:1.55;">${content.supportLine}</p>
                      <p style="margin:0;font-size:18px;line-height:1.55;font-weight:700;">
                        ${content.contactLabel}: <a href="mailto:${content.contactEmail}" style="color:#1d4ed8;text-decoration:none;">${content.contactEmail}</a>
                      </p>
                    </td>
                  </tr>
                  <tr>
                    <td align="center" style="padding:10px 34px 22px 34px;">
                      <a href="https://www.linkedin.com/company/postslify-saas/" style="display:inline-block;margin:0 6px;width:36px;height:36px;border-radius:999px;background:#2563eb;color:#ffffff;font-family:Arial,sans-serif;font-size:16px;font-weight:700;line-height:36px;text-align:center;text-decoration:none;">in</a>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:18px 24px 20px 24px;background:#dbeafe;font-family:Helvetica, Arial, sans-serif;color:#1e3a8a;text-align:center;">
                      <p style="margin:0 0 8px 0;font-size:14px;line-height:1.5;">© ${new Date().getFullYear()} Postslify. ${content.legal}</p>
                      <p style="margin:0;font-size:14px;line-height:1.5;">Postslify · ${locale === "es" ? "Todos los derechos reservados" : "All rights reserved"}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </div>
      `,
    });

    if (data.error) {
      console.error("Resend API Error:", data.error);
      return { success: false, error: data.error };
    }

    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    return { success: false, error };
  }
}
