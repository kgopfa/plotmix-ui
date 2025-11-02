import type { Metadata } from "next";
import Link from "next/link";
import { HeroInput } from "@/components/marketing/hero-input";

export const metadata: Metadata = {
  title: "Plotmix Enterprise — Turn knowledge into lasting understanding.",
  description:
    "Empower your team with Plotmix — create, share, and adapt on-demand explanations that scale across your organization.",
};

export default function OrganizationsPage() {
  return (
    <>
      <section className="relative pt-32 pb-24 px-6 bg-gradient-to-b from-indigo-50 via-white to-purple-50 overflow-hidden">
        <div aria-hidden="true" className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2 rotate-[30deg]
                  bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30
                  sm:left-[calc(50%-30rem)] sm:w-[80rem]"
          />
        </div>

        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl font-semibold text-gray-900 sm:text-7xl leading-tight">
            Empower your team with <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              knowledge that scales
            </span>
          </h1>

          <p className="mt-8 text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-loose">
            Plotmix helps teams learn faster and stay aligned by turning questions into clear, shared explanations — all
            in one place.
          </p>

          <div className="mt-12">
            <HeroInput />
          </div>

          <div className="mt-10 flex justify-center gap-x-6">
            <Link
              href="/contact-sales"
              className="bg-gradient-to-r from-indigo-600 to-pink-600 text-white px-6 py-3 rounded-xl font-semibold text-lg flex items-center justify-center hover:from-indigo-500 hover:to-pink-500 shadow-lg hover:shadow-xl transition-all duration-200"
            >
              Talk to Sales
            </Link>
            <a
              href="#how-it-works"
              className="border border-gray-200 text-gray-900 px-7 py-3.5 rounded-xl font-semibold text-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all duration-200"
            >
              See How It Works
            </a>
          </div>

          <img
            src="https://tailwindcss.com/plus-assets/img/component-images/project-app-screenshot.png"
            alt="Plotmix for Teams"
            width="2432"
            height="1442"
            className="mt-20 rounded-2xl bg-gray-50 shadow-2xl ring-1 ring-gray-900/10"
          />
        </div>

        <div
          aria-hidden="true"
          className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
        >
          <div
            className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[40rem] -translate-x-1/2
                  bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30
                  sm:left-[calc(50%+36rem)] sm:w-[80rem]"
          />
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-28 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">How Plotmix Helps Teams Learn</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-20 leading-relaxed">
            From onboarding to continuous learning, Plotmix lets your team ask, understand, and share knowledge —
            without meetings or manual training.
          </p>

          <div className="grid md:grid-cols-3 gap-14 text-left">
            <div className="p-10 rounded-2xl border border-gray-100 hover:shadow-md transition">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mb-8 shadow-md">
                <span className="text-white text-3xl">💡</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Capture questions easily</h3>
              <p className="text-gray-600 leading-loose">
                Team members can ask questions anytime. Plotmix turns them into concise explanations that can be shared
                across teams.
              </p>
            </div>

            <div className="p-10 rounded-2xl border border-gray-100 hover:shadow-md transition">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center mb-8 shadow-md">
                <span className="text-white text-3xl">📘</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Build shared understanding</h3>
              <p className="text-gray-600 leading-loose">
                Explanations stay updated as your team grows — no more stale docs or one-off training sessions.
              </p>
            </div>

            <div className="p-10 rounded-2xl border border-gray-100 hover:shadow-md transition">
              <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-indigo-600 rounded-xl flex items-center justify-center mb-8 shadow-md">
                <span className="text-white text-3xl">🚀</span>
              </div>
              <h3 className="text-2xl font-bold mb-4">Scale knowledge effortlessly</h3>
              <p className="text-gray-600 leading-loose">
                Plotmix grows with your organization — helping every new hire or cross-functional team learn faster and
                more effectively.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-28 px-6 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-8">Why organizations choose Plotmix</h2>
          <p className="text-lg md:text-xl text-gray-600 max-w-2xl mx-auto mb-20 leading-relaxed">
            Make learning measurable, efficient, and engaging — so knowledge sticks, and productivity grows.
          </p>

          <div className="grid md:grid-cols-3 gap-12 text-left">
            <div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-600">🕒 Save time and costs</h3>
              <p className="text-gray-600 leading-loose">
                Reduce repetitive explanations and onboarding time with self-updating knowledge content.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-600">📈 Continuous improvement</h3>
              <p className="text-gray-600 leading-loose">
                Insights help you identify where teams struggle — so you can close learning gaps faster.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-semibold mb-3 text-indigo-600">🤝 Consistent messaging</h3>
              <p className="text-gray-600 leading-loose">
                Everyone learns from the same clear, accurate sources — reducing confusion and mistakes.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-28 px-6 text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-8">
            Empower your organization to learn as one.
          </h2>
          <p className="text-lg md:text-xl text-indigo-100 mb-12 leading-relaxed">
            From onboarding to product training, Plotmix helps your teams learn faster, stay aligned, and grow together.
          </p>
          <div className="flex flex-col sm:flex-row gap-5 justify-center">
            <Link
              href="/contact-sales"
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Contact Sales
            </Link>
            <Link
              href="/demo"
              className="bg-indigo-500/20 text-white px-8 py-4 rounded-xl font-semibold text-lg border-2 border-white/30 hover:bg-indigo-500/30 transition-all duration-200 backdrop-blur-sm"
            >
              Book a Demo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
