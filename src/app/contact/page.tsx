'use client';

import { useState } from 'react';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { navigation } from '@/data/shared-navigation';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import { Mail, MessageSquare } from 'lucide-react';

export default function ContactPage() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'feature'>('feedback');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setFeedbackSubmitting(true);
    try {
      // TODO: Replace with actual API endpoint
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: feedbackType,
          message: message.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim(),
        }),
      });

      if (response.ok) {
        setFirstName('');
        setLastName('');
        setEmail('');
        setMessage('');
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 5000);
      }
    } catch (error) {
      console.error('Failed to submit feedback:', error);
    } finally {
      setFeedbackSubmitting(false);
    }
  };

  return (
    <>
      <NavigationSidebar navigation={navigation} />

      <main className="lg:pl-20">
        <div className="relative isolate bg-white">
          <div className="mx-auto grid max-w-7xl grid-cols-1 lg:grid-cols-2">
            {/* Left side - Contact info */}
            <div className="relative px-6 pt-24 pb-20 sm:pt-32 lg:static lg:px-8 lg:py-48">
              <div className="mx-auto max-w-xl lg:mx-0 lg:max-w-lg">
                <div className="absolute inset-y-0 left-0 -z-10 w-full overflow-hidden bg-gray-100 ring-1 ring-gray-900/10 lg:w-1/2">
                  <svg
                    aria-hidden="true"
                    className="absolute inset-0 size-full mask-[radial-gradient(100%_100%_at_top_right,white,transparent)] stroke-gray-200"
                  >
                    <defs>
                      <pattern
                        x="100%"
                        y={-1}
                        id="83fd4e5a-9d52-42fc-97b6-718e5d7ee527"
                        width={200}
                        height={200}
                        patternUnits="userSpaceOnUse"
                      >
                        <path d="M130 200V.5M.5 .5H200" fill="none" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" strokeWidth={0} className="fill-white" />
                    <svg x="100%" y={-1} className="overflow-visible fill-gray-50">
                      <path d="M-470.5 0h201v201h-201Z" strokeWidth={0} />
                    </svg>
                    <rect fill="url(#83fd4e5a-9d52-42fc-97b6-718e5d7ee527)" width="100%" height="100%" strokeWidth={0} />
                  </svg>
                  <div
                    aria-hidden="true"
                    className="absolute top-[calc(100%-13rem)] -left-56 hidden transform-gpu blur-3xl lg:top-[calc(50%-7rem)] lg:left-[max(-14rem,calc(100%-59rem))]"
                  >
                    <div
                      style={{
                        clipPath:
                          'polygon(74.1% 56.1%, 100% 38.6%, 97.5% 73.3%, 85.5% 100%, 80.7% 98.2%, 72.5% 67.7%, 60.2% 37.8%, 52.4% 32.2%, 47.5% 41.9%, 45.2% 65.8%, 27.5% 23.5%, 0.1% 35.4%, 17.9% 0.1%, 27.6% 23.5%, 76.1% 2.6%, 74.1% 56.1%)',
                      }}
                      className="aspect-1155/678 w-[72.1875rem] bg-gradient-to-br from-[#80caff] to-[#4f46e5] opacity-10"
                    />
                  </div>
                </div>

                <h2 className="text-4xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-5xl">
                  Get in <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">touch</span>
                </h2>
                <p className="mt-6 text-lg leading-8 text-gray-600">
                  We'd love to hear from you! Share your feedback, request features, or just say hello. Your input helps us build something amazing.
                </p>

                <dl className="mt-10 space-y-4 text-base font-medium leading-7 text-gray-600">
                  <div className="flex gap-x-4">
                    <dt className="flex-none">
                      <span className="sr-only">Email</span>
                      <EnvelopeIcon aria-hidden="true" className="h-7 w-6 text-indigo-500" />
                    </dt>
                    <dd>
                      <a href="mailto:team@getplotmix.com" className="hover:text-indigo-900">
                        team@getplotmix.com
                      </a>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Right side - Form */}
            <form onSubmit={handleFeedbackSubmit} className="px-6 pt-12 pb-24 sm:pb-32 lg:px-8 lg:py-24">
              <div className="mx-auto max-w-xl lg:mr-0 lg:max-w-lg">
                {/* Success Message */}
                {submitSuccess && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-md">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                        </svg>
                      </div>
                      <p className="text-sm text-green-800 font-medium">
                        Thank you for your feedback! We'll get back to you soon.
                      </p>
                    </div>
                  </div>
                )}

                {/* Feedback Type Toggle */}
                <div className="mb-6 flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('feedback')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      feedbackType === 'feedback'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('feature')}
                    className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      feedbackType === 'feature'
                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Feature Request
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2">
                  <div>
                    <label htmlFor="first-name" className="block text-sm font-semibold text-gray-900">
                      First name
                    </label>
                    <div className="mt-2.5">
                      <input
                        id="first-name"
                        name="first-name"
                        type="text"
                        autoComplete="given-name"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="last-name" className="block text-sm font-semibold text-gray-900">
                      Last name
                    </label>
                    <div className="mt-2.5">
                      <input
                        id="last-name"
                        name="last-name"
                        type="text"
                        autoComplete="family-name"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900">
                      Email
                    </label>
                    <div className="mt-2.5">
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                      />
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="message" className="block text-sm font-semibold text-gray-900">
                      {feedbackType === 'feature' ? 'Feature Request' : 'Message'}
                    </label>
                    <div className="mt-2.5">
                      <textarea
                        id="message"
                        name="message"
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder={feedbackType === 'feature' 
                          ? "Describe the feature you'd like us to build..." 
                          : "Share your feedback, suggestions, or questions..."}
                        required
                        className="block w-full rounded-md bg-white px-3.5 py-2 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-8 flex justify-end">
                  <button
                    type="submit"
                    disabled={!message.trim() || feedbackSubmitting}
                    className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {feedbackSubmitting ? 'Sending...' : 'Send message'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </>
  );
}
