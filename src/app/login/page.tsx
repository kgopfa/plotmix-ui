import type { Metadata } from "next";
import LoginForm from './login-form';

export const metadata: Metadata = {
  title: "Sign In",
  description: "Sign in to your account to start learning with instant, on-demand explanations.",
};

export default function Login() {
  return <LoginForm />;
}
