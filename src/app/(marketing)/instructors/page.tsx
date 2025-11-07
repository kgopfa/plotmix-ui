import type { Metadata } from "next";
import Link from "next/link";
import { HeroSection } from "@/components/marketing/hero-section";
import { BookDemoButton } from "@/components/marketing/book-demo-button";

export const metadata: Metadata = {
  title: "For Learning Designers — Create faster, teach better.",
  description:
    "Plotmix helps instructional designers and learning experts turn ideas into dynamic, reusable learning content without the bloat or steep learning curves. Create, refine, and collaborate — all in one place.",
};

export default function DesignersPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-24 px-6 bg-gradient-to-b from-indigo-50 via-white to-purple-50 bg-dot-pattern overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 leading-tight">
            Everything you need to <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              build better courses
            </span>
          </h1>


          <div className="mt-8">
            <HeroSection />
          </div>

          <img
            src="https://tailwindcss.com/plus-assets/img/component-images/project-app-screenshot.png"
            alt="Plotmix for Teams"
            width="2432"
            height="1442"
            className="mt-12 rounded-2xl bg-gray-50 shadow-2xl ring-1 ring-gray-900/10 w-full max-w-[1200px] h-auto mx-auto"
          />
        </div>
      </section>

      {/* Section 1 — Build without the bloat */}
      <section className="py-40 bg-indigo-50 bg-dot-pattern">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-24 px-6 lg:px-8">
          <div className="w-full md:w-1/3 space-y-8 md:pr-12">
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900">
              Build without the bloat.
            </h2>
            <p className="text-xl text-gray-800 leading-relaxed">
              Skip the clunky tools and endless menus. Create interactive lessons, branching scenarios, or explainers in minutes with a workspace that feels intuitive from the start.
            </p>
            <p className="text-indigo-600 font-semibold text-lg">
              Create faster, teach better.
            </p>
          </div>

          <div className="w-full md:w-2/3 flex justify-center">
            <img
              src="/marketing/chatpage.gif"
              alt="Course creation interface"
              className="rounded-3xl bg-gray-50 shadow-2xl ring-1 ring-gray-900/10 object-contain w-full max-w-[1200px] h-auto"
            />
          </div>
        </div>
      </section>

      {/* Section 2 — Everything in one place */}
      <section className="py-40 bg-white bg-dot-pattern">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center justify-between gap-24 px-6 lg:px-8">
          <div className="w-full md:w-1/3 space-y-8 md:pl-12">
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900">
              Everything in one place.
            </h2>
            <p className="text-xl text-gray-800 leading-relaxed">
              Stop juggling tools for writing, visuals, and animation. Plan, design, and publish all from one platform that connects your workflow from concept to delivery.
            </p>
            <p className="text-indigo-600 font-semibold text-lg">
              Fewer tabs, more time to teach.
            </p>
          </div>

          <div className="w-full md:w-2/3 flex justify-center">
            <img
              src="/marketing/contentpage.png"
              alt="Unified workspace"
              className="rounded-3xl bg-white shadow-2xl ring-1 ring-gray-900/10 object-contain w-full max-w-[1200px] h-auto"
            />
          </div>
        </div>
      </section>

      {/* Section 3 — Share and collaborate */}
      <section className="py-40 bg-indigo-50 bg-dot-pattern">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-24 px-6 lg:px-8">
          <div className="w-full md:w-1/3 space-y-8 md:pr-12">
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900">
              Share and collaborate.
            </h2>
            <p className="text-xl text-gray-800 leading-relaxed">
              Work with subject matter experts or other creators in real time. Review, comment, and refine lessons together — no exports, no version chaos, just shared progress.
            </p>
            <p className="text-indigo-600 font-semibold text-lg">
              Designed for teams that teach together.
            </p>
          </div>

          <div className="w-full md:w-2/3 flex justify-center">
            <img
              src="/marketing/designerpage.png"
              alt="Collaboration tools"
              className="rounded-3xl bg-gray-50 shadow-2xl ring-1 ring-gray-900/10 object-contain w-full max-w-[1200px] h-auto"
            />
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-32 px-6 text-center bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-5xl font-bold text-white mb-6">
            Create smarter. Teach beautifully.
          </h2>
          <p className="text-lg text-indigo-100 mb-10 leading-relaxed">
            Build engaging courses without the complexity. One platform for planning, design, and delivery.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Creating Free
            </Link>
            <BookDemoButton className="bg-indigo-500/20 text-white px-8 py-4 rounded-xl font-semibold text-lg border-2 border-white/30 hover:bg-indigo-500/30 transition-all duration-200 backdrop-blur-sm disabled:opacity-70 disabled:cursor-not-allowed" />
          </div>
        </div>
      </section>
    </>
  );
}
