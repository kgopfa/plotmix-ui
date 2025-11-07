import type { Metadata } from "next";
import { Suspense } from "react";
import RegisterForm from './register-form';

export const metadata: Metadata = {
  title: "Create Account",
  description: "Create your account to start learning with instant, on-demand explanations.",
};

export default function Register() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-white">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 bg-indigo-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      }
    >
      <RegisterForm />
    </Suspense>
  );
}
