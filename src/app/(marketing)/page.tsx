import type { Metadata } from "next";
import Link from "next/link";
import { HeroSection } from "@/components/marketing/hero-section";
import { BookDemoButton } from "@/components/marketing/book-demo-button";

export const metadata: Metadata = {
  title: "Bring learning to life, never wait for the right tutorial again.",
  description:
    "Turn your questions into clear, on-demand explanations you can follow, refine, and build on instantly. Bring learning to life — one question at a time.",
};

export default function MarketingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative pt-28 pb-24 px-6 bg-gradient-to-b from-indigo-50 via-white to-purple-50 bg-dot-pattern overflow-hidden">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-5xl sm:text-7xl font-bold text-gray-900 leading-tight">
            Never wait for the <br className="hidden sm:block" />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              right tutorial
            </span>{" "}
            again.
          </h1>

          <div className="mt-8">
            <HeroSection />
          </div>

          <video
            src={"/marketing/demo.mov"}
            autoPlay
            loop
            muted
            playsInline
            className="mt-12 rounded-2xl bg-gray-50 shadow-2xl ring-1 ring-gray-900/10 w-full max-w-[1200px] h-auto mx-auto"
          />
        </div>
      </section>

      {/* Section 1 — Ask Anything */}
      <section className="py-40 bg-indigo-50 bg-dot-pattern">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-24 px-6 lg:px-8">
          {/* Text (1/3 width) */}
          <div className="w-full md:w-1/3 space-y-8 md:pr-12">
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900">
              Ask anything.
            </h2>
            <p className="text-xl text-gray-800 leading-relaxed">
              Every question becomes a story you can watch, explore, and remember. Learn faster through content that text alone can’t deliver.
            </p>
          </div>

          {/* Image (2/3 width) */}
          <div className="w-full md:w-2/3 flex justify-center">
            <img
              src="/marketing/chatpage.gif"
              alt="Ask a question demo"
              className="rounded-3xl bg-gray-50 shadow-2xl ring-1 ring-gray-900/10 object-contain w-full max-w-[1200px] h-auto"
            />
          </div>
        </div>
      </section>

      {/* Section 2 — Learn in context */}
      <section className="py-40 bg-white bg-dot-pattern">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row-reverse items-center justify-between gap-24 px-6 lg:px-8">
          {/* Text (1/3 width) */}
          <div className="w-full md:w-1/3 space-y-8 md:pl-12">
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900">
              Learn in context.
            </h2>
            <p className="text-xl text-gray-800 leading-relaxed">
              Each explanation grows with you. Ask follow ups, test what you’ve learned, and share your take. Every lesson becomes a conversation that deepens your understanding.
            </p>
          </div>

          {/* Image (2/3 width) */}
          <div className="w-full md:w-2/3 flex justify-center">
            <img
              src="/marketing/contentpage.png"
              alt="Interactive learning demo"
              className="rounded-3xl bg-white shadow-2xl ring-1 ring-gray-900/10 object-contain w-full max-w-[1200px] h-auto"
            />
          </div>
        </div>
      </section>

      {/* Section 3 — Create and refine */}
      <section className="py-40 bg-indigo-50 bg-dot-pattern">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-24 px-6 lg:px-8">
          {/* Text (1/3 width) */}
          <div className="w-full md:w-1/3 space-y-8 md:pr-12">
            <h2 className="text-5xl sm:text-6xl font-bold text-gray-900">
              Design your own.
            </h2>
            <p className="text-xl text-gray-800 leading-relaxed">
              Bring your ideas to life on the canvas. Create scenes, move elements, and shape your story exactly how you want it. Simple to use, made for creativity.
            </p>
          </div>

          {/* Image (2/3 width) */}
          <div className="w-full md:w-2/3 flex justify-center">
            <img
              src="/marketing/designerpage.png"
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
            Ask. Learn. Share. All in one place.
          </h2>
          <p className="text-lg text-indigo-100 mb-10 leading-relaxed">
            Learn at your pace, on demand.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
              href="/login"
              className="bg-white text-indigo-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Start Learning for Free
            </Link>
            <BookDemoButton className="bg-indigo-500/20 text-white px-8 py-4 rounded-xl font-semibold text-lg border-2 border-white/30 hover:bg-indigo-500/30 transition-all duration-200 backdrop-blur-sm disabled:opacity-70 disabled:cursor-not-allowed" />
          </div>
        </div>
      </section>
    </>
  );
}
