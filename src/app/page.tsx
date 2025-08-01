
import Link from "next/link";
import { Palette, Clapperboard, MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <header className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/30 mr-4">
              <span className="text-white font-bold text-2xl">P</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900">PlotMix AI</h1>
          </div>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Create stunning visual content with AI-powered design tools and intelligent learning capabilities
          </p>
        </header>

        {/* Main Features Grid */}
        <main className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {/* Editor Card */}
          <Link href="/editor" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="h-12 w-12 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Palette className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Visual Editor</h3>
              <p className="text-gray-600 leading-relaxed">
                Create and animate stunning visual content with our powerful canvas-based editor. 
                Drag, drop, and design with precision.
              </p>
            </div>
          </Link>

          {/* Content Card */}
          <Link href="/content" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="h-12 w-12 bg-gradient-to-r from-fuchsia-500 to-fuchsia-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clapperboard className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">Content Library</h3>
              <p className="text-gray-600 leading-relaxed">
                Browse and manage your visual content library. Watch videos, 
                organize projects, and share with your team.
              </p>
            </div>
          </Link>

          {/* Learn Card */}
          <Link href="/learn" className="group">
            <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100">
              <div className="h-12 w-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <MessageSquare className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">AI Learning</h3>
              <p className="text-gray-600 leading-relaxed">
                Chat with AI to learn new techniques, get design suggestions, 
                and improve your creative workflow.
              </p>
            </div>
          </Link>
        </main>

        {/* Quick Start Section */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
          <p className="text-gray-600 mb-8">Choose your path and start creating amazing content</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              href="/editor"
              className="inline-flex items-center justify-center px-8 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
            >
              Start Creating
            </Link>
            <Link 
              href="/learn"
              className="inline-flex items-center justify-center px-8 py-3 border border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-all duration-200"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
