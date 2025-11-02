export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400 py-16 px-6">
      <div className="max-w-6xl mx-auto text-center">
        <div className="flex justify-center items-center mb-6 space-x-3">
          <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 rounded-xl flex items-center justify-center">
            <span className="text-white font-bold text-lg">P</span>
          </div>
          <span className="text-xl font-bold text-white">Plotmix</span>
        </div>
        <p className="max-w-md mx-auto text-sm mb-8">
          Get explanations made for you — instantly and clearly. Bring learning to life, never wait for the right
          tutorial again.
        </p>
        <div className="flex justify-center space-x-8 text-sm">
          <a href="#" className="hover:text-white transition">
            Privacy
          </a>
          <a href="#" className="hover:text-white transition">
            Terms
          </a>
          <a href="#" className="hover:text-white transition">
            Support
          </a>
        </div>
        <p className="text-xs mt-8 text-gray-500">© 2025 Plotmix. All rights reserved.</p>
      </div>
    </footer>
  )
}

