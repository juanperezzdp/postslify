export interface LoginInputs {
  email: string;
  password: string;
}

export interface RegisterInputs {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ForgotPasswordInputs {
  email: string;
}

export interface ResetPasswordInputs {
  password: string;
  confirmPassword: string;
}
