import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendPasswordResetEmail = async (email: string, token: string) => {
  
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3001";
  const resetLink = `${baseUrl}/reset-password?token=${token}`;

  try {
    const data = await resend.emails.send({
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to: email,
      subject: "Reset your Postslify password",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Reset Password Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password for your Postslify account.</p>
          <p>Click the button below to set a new password:</p>
          <a href="${resetLink}" style="display: inline-block; background-color: #2563EB; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin: 16px 0;">Reset Password</a>
          <p>If you didn't request this, you can safely ignore this email.</p>
          <p>This link will expire in 1 hour.</p>
          <p>Best regards,<br>The Postslify Team</p>
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
};
