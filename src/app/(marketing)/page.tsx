import type { Metadata } from "next";
import Link from "next/link";
import { HeroInput } from "@/components/marketing/hero-input";

export const metadata: Metadata = {
  title: "Plotmix — Bring learning to life, never wait for the right tutorial again.",
  description:
    "Plotmix lets you turn your questions into clear, on-demand explanations you can follow, refine, and build on instantly. Bring learning to life — one question at a time.",
};

export default function MarketingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-32 pb-24 px-6 bg-gradient-to-b from-indigo-50 via-white to-purple-50 overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-semibold text-gray-900 sm:text-7xl leading-tight">
            Never wait for the <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              right tutorial
            </span>{' '}
            again.
          </h1>
          <p className="mt-8 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Get instant explanations that grow with your curiosity, clear and personal, always on demand.
          </p>

          <div className="mt-8">
            <HeroInput />
          </div>

          <div className="mt-10 flex justify-center gap-x-4">
            <Link
              href="/register"
              className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold text-lg hover:from-indigo-500 hover:to-pink-500 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Start Learning Free
            </Link>
            <a
              href="#how-it-works"
              className="border border-gray-200 text-gray-900 px-6 py-3 rounded-xl font-semibold text-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
            >
              See How It Works
            </a>
          </div>

          <img
            src="https://tailwindcss.com/plus-assets/img/component-images/project-app-screenshot.png"
            alt="Plotmix example"
            width="2432"
            height="1442"
            className="mt-20 rounded-2xl bg-gray-50 shadow-2xl ring-1 ring-gray-900/10"
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">How Plotmix Works</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-16">
            Learning should be personal. Plotmix builds clear, tailored explanations from your questions — in seconds.
          </p>

          <div className="grid md:grid-cols-3 gap-12 text-left">
            <div className="p-8 rounded-2xl border border-gray-100 hover:shadow-md transition">
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-6 shadow-md">
                <span className="text-white text-2xl">💬</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">1. Ask a question</h3>
              <p className="text-gray-600 leading-relaxed">
                Just type what you want to learn. Plotmix crafts a clear, structured answer around your question — no
                searching or scrolling required.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-gray-100 hover:shadow-md transition">
              <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-6 shadow-md">
                <span className="text-white text-2xl">⚡</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">2. Learn instantly</h3>
              <p className="text-gray-600 leading-relaxed">
                Your explanation is ready in moments — easy to follow, focused on what matters, and made to help it
                stick.
              </p>
            </div>

            <div className="p-8 rounded-2xl border border-gray-100 hover:shadow-md transition">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-xl flex items-center justify-center mb-6 shadow-md">
                <span className="text-white text-2xl">🔁</span>
              </div>
              <h3 className="text-2xl font-bold mb-3">3. Go deeper</h3>
              <p className="text-gray-600 leading-relaxed">
                Ask follow-up questions to refine your understanding — Plotmix adjusts instantly so you can keep
                learning at your own pace.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonial */}
      <section className="relative bg-gray-900 py-24 px-6 sm:px-10 text-center">
        <div className="max-w-4xl mx-auto">
          <p className="text-indigo-400 font-semibold mb-6">What learners are saying</p>
          <blockquote className="text-white text-2xl md:text-3xl font-semibold leading-relaxed">
            "Plotmix feels like having a tutor who never runs out of patience. I finally understand topics I used to
            skip because they looked too hard."
          </blockquote>
          <div className="mt-6 text-gray-400 text-lg font-medium">— Taylor, Computer Science Student</div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">Bring learning to life — starting today.</h2>
          <p className="text-lg md:text-xl text-indigo-100 mb-10">
            Stop waiting for the perfect tutorial. Ask once, understand fully, and keep growing your curiosity with
            Plotmix.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Learning Free
            </Link>
            <Link
              href="/login"
              className="bg-indigo-500/20 text-white px-8 py-4 rounded-xl font-semibold text-lg border-2 border-white/30 hover:bg-indigo-500/30 transition-all duration-200 backdrop-blur-sm"
            >
              Sign In
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
