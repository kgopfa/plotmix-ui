import type { Metadata } from "next";
import RegisterForm from './register-form';

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your account to start learning with instant, on-demand explanations.",
};

export default function Register() {
  return <RegisterForm />;
}
