import './marketing.css'
import Header from './components/Header'
import Footer from './components/Footer'

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-white text-gray-900 min-h-screen">
      <Header />
      <main className="overflow-x-hidden">{children}</main>
      <Footer />
    </div>
  )
}

