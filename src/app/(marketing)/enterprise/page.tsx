import type { Metadata } from "next";
import Link from "next/link";
import { HeroSection } from "@/components/marketing/hero-section";

export const metadata: Metadata = {
  title: "For Teams — Scale expertise, one question at a time.",
  description:
    "Empower your organization with instant, on-demand learning. Help teams capture, explain, and share knowledge faster — all in one place.",
};

export default function EnterprisePage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-24 px-6 bg-gradient-to-b from-indigo-50 via-white to-purple-50 bg-dot-pattern overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 leading-tight">
            Empower your team to <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              learn, adapt, and scale
            </span>
            .
          </h1>

          <div className="mt-8">
            <HeroSection />
          </div>

          <img
            src="https://tailwindcss.com/plus-assets/img/component-images/project-app-screenshot.png"
            alt="Plotmix Enterprise Platform"
            width="2432"
            height="1442"
            className="mt-12 rounded-2xl bg-gray-50 shadow-2xl ring-1 ring-gray-900/10 w-full max-w-[1200px] h-auto mx-auto"
          />
        </div>
      </section>

      {/* Section 1 — Capture Team Knowledge */}
      <section className="py-40 bg-indigo-50 bg-dot-pattern">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-24 px-6 lg:px-8">
          {/* Text (1/3 width) */}
          <div className="w-full md:w-1/3 space-y-8 md:pr-12">
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900">
              Capture knowledge effortlessly.
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              When someone asks a question, Plotmix creates a clear, reusable explanation —
              turning tribal knowledge into a searchable resource that grows with your team.
            </p>
            <p className="text-indigo-600 font-semibold text-lg">
              From one answer to shared understanding.
            </p>
          </div>

          {/* Image (2/3 width) */}
          <div className="w-full md:w-2/3 flex justify-center">
            <img
              src="https://tailwindcss.com/plus-assets/img/component-images/project-app-screenshot.png"
              alt="Team collaboration example"
              className="rounded-3xl bg-gray-50 shadow-2xl ring-1 ring-gray-900/10 object-contain w-full max-w-[1200px] h-auto"
            />
          </div>
        </div>
      </section>

      {/* Section 2 — Learn with context */}
      <section className="py-40 bg-white bg-dot-pattern">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center justify-between gap-24 px-6 lg:px-8">
          {/* Text (1/3 width) */}
          <div className="w-full md:w-1/3 space-y-8 md:pl-12">
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900">
              Give every learner context.
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Every answer comes with structured reasoning and dynamic explanations — so your
              teams don’t just memorize, they understand. Perfect for onboarding, support, and
              continuous skill growth.
            </p>
            <p className="text-indigo-600 font-semibold text-lg">
              Scalable clarity for every role.
            </p>
          </div>

          {/* Image (2/3 width) */}
          <div className="w-full md:w-2/3 flex justify-center">
            <img
              src="https://tailwindcss.com/plus-assets/img/component-images/project-app-screenshot.png"
              alt="Interactive learning demo"
              className="rounded-3xl bg-white shadow-2xl ring-1 ring-gray-900/10 object-contain w-full max-w-[1200px] h-auto"
            />
          </div>
        </div>
      </section>

      {/* Section 3 — Train and Create */}
      <section className="py-40 bg-indigo-50 bg-dot-pattern">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-24 px-6 lg:px-8">
          {/* Text (1/3 width) */}
          <div className="w-full md:w-1/3 space-y-8 md:pr-12">
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900">
              Train, customize, and share.
            </h2>
            <p className="text-xl text-gray-600 leading-relaxed">
              Turn your internal insights into interactive, branded learning experiences.
              Create modules, add visuals, and refine the message — all from one place.
            </p>
            <p className="text-indigo-600 font-semibold text-lg">
              Empower every expert to teach effortlessly.
            </p>
          </div>

          {/* Image (2/3 width) */}
          <div className="w-full md:w-2/3 flex justify-center">
            <img
              src="https://tailwindcss.com/plus-assets/img/component-images/project-app-screenshot.png"
              alt="Design editor demo"
              className="rounded-3xl bg-gray-50 shadow-2xl ring-1 ring-gray-900/10 object-contain w-full max-w-[1200px] h-auto"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-white mb-6">
            Scale expertise. Accelerate learning.
          </h2>
          <p className="text-lg text-indigo-100 mb-10 leading-relaxed">
            Bring institutional knowledge to life with Plotmix. Help every team move faster,
            learn better, and stay aligned — one question at a time.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
