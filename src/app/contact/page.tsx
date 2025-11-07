'use client';

import { useState } from 'react';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { navigation } from '@/data/shared-navigation';
import { Mail, MessageSquare, Sparkles } from 'lucide-react';

export default function ContactPage() {
  const [feedback, setFeedback] = useState('');
  const [feedbackType, setFeedbackType] = useState<'feedback' | 'feature'>('feedback');
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleFeedbackSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;

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
          message: feedback.trim(),
        }),
      });

      if (response.ok) {
        setFeedback('');
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
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
          <div className="max-w-4xl mx-auto px-6 py-16">
            {/* Header */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-6 shadow-lg shadow-indigo-500/30">
                <MessageSquare className="w-8 h-8 text-white" strokeWidth={2} />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Get in Touch
              </h1>
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                We'd love to hear from you! Share your feedback, request features, or just say hello. Your input helps us build something amazing.
              </p>
            </div>

            {/* Success Message */}
            {submitSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </div>
                  <p className="text-sm text-green-800 font-medium">
                    Thank you for your feedback! We'll get back to you soon.
                  </p>
                </div>
              </div>
            )}

            {/* Feedback Form */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 mb-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Share Your Thoughts
                  </h2>
                  <p className="text-sm text-gray-600">
                    Help us improve Plotmix
                  </p>
                </div>
              </div>

              <form onSubmit={handleFeedbackSubmit} className="space-y-6">
                {/* Feedback Type Toggle */}
                <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setFeedbackType('feedback')}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      feedbackType === 'feedback'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Feedback
                  </button>
                  <button
                    type="button"
                    onClick={() => setFeedbackType('feature')}
                    className={`flex-1 px-4 py-2.5 text-sm font-medium rounded-md transition-colors ${
                      feedbackType === 'feature'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    Feature Request
                  </button>
                </div>

                {/* Textarea */}
                <div>
                  <label htmlFor="feedback" className="block text-sm font-medium text-gray-700 mb-2">
                    {feedbackType === 'feature' ? 'What feature would you like to see?' : 'What are your thoughts?'}
                  </label>
                  <textarea
                    id="feedback"
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder={feedbackType === 'feature' 
                      ? "Describe the feature you'd like us to build..." 
                      : "Share your feedback, suggestions, or questions..."}
                    rows={8}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm text-gray-900 placeholder-gray-500 resize-none"
                    required
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={!feedback.trim() || feedbackSubmitting}
                  className="w-full px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-semibold rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {feedbackSubmitting ? 'Submitting...' : 'Submit Feedback'}
                </button>
              </form>
            </div>

            {/* Contact Information */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" strokeWidth={2} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900">
                    Other Ways to Reach Us
                  </h2>
                  <p className="text-sm text-gray-600">
                    Prefer email? Send us a message
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <a
                  href="mailto:hello@plotmix.ai"
                  className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                >
                  <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center group-hover:bg-indigo-200 transition-colors">
                    <Mail className="w-5 h-5 text-indigo-600" strokeWidth={2} />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Email Us</p>
                    <p className="text-sm text-gray-600">hello@plotmix.ai</p>
                  </div>
                </a>
              </div>
            </div>

            {/* Early User Message */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Thank you for being an early user of Plotmix. Your feedback helps shape the future of the platform! 🚀
              </p>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

