import type { WelcomeEmailLocale } from "@/types/mail";

export interface LoginInputs {
  email: string;
  password: string;
}

export interface RegisterInputs {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
  locale?: WelcomeEmailLocale;
}

export interface ForgotPasswordInputs {
  email: string;
  locale?: WelcomeEmailLocale;
}

export interface ResetPasswordInputs {
  password: string;
  confirmPassword: string;
}
