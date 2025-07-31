'use client';

import { useState } from 'react';
import { NavigationSidebar } from '@/components/shared/navigation-sidebar';
import { navigation } from '@/data/shared-navigation';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function ContentPage() {
  const [activeTab, setActiveTab] = useState('Chat');

  return (
    <>
      <NavigationSidebar navigation={navigation} />

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:right-0 lg:z-50 lg:flex lg:w-1/7 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-l border-gray-200 bg-white px-6">
          {/* Horizontal tabs */}
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setActiveTab('Chat')}
              className={classNames(
                activeTab === 'Chat'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'flex-1 whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm'
              )}
            >
              Chat
            </button>
            <button
              onClick={() => setActiveTab('Sections')}
              className={classNames(
                activeTab === 'Sections'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
                'flex-1 whitespace-nowrap py-2 px-3 border-b-2 font-medium text-sm'
              )}
            >
              Sections
            </button>
          </div>

          {/* Tab content */}
          <div className="flex-1">
            {activeTab === 'Chat' && (
              <div className="space-y-4">
                <div className="space-y-3">
                  {/* User message */}
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white rounded-lg px-3 py-2 max-w-xs">
                      <p className="text-sm">I need to implement a sharded counter for high-traffic scenarios. Can you help me design it?</p>
                    </div>
                  </div>

                  {/* LLM response */}
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2 max-w-xs">
                      <p className="text-sm">A sharded counter is perfect for high-traffic scenarios! The basic idea is to split a single counter into multiple shards to reduce contention. Each shard can be incremented independently, and you sum them up when you need the total.</p>
                    </div>
                  </div>

                  {/* User follow-up */}
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white rounded-lg px-3 py-2 max-w-xs">
                      <p className="text-sm">How many shards should I use? And what about consistency?</p>
                    </div>
                  </div>

                  {/* LLM response */}
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2 max-w-xs">
                      <p className="text-sm">For shard count, a good rule of thumb is 2-4x the number of CPU cores. More shards = less contention but more overhead. For consistency, you&apos;ll get eventual consistency - the sum might be slightly off during concurrent updates, but it will converge to the correct value.</p>
                    </div>
                  </div>

                  {/* User follow-up */}
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white rounded-lg px-3 py-2 max-w-xs">
                      <p className="text-sm">What if I need strong consistency?</p>
                    </div>
                  </div>

                  {/* LLM response */}
                  <div className="flex justify-start">
                    <div className="bg-gray-100 text-gray-900 rounded-lg px-3 py-2 max-w-xs">
                      <p className="text-sm">For strong consistency, you&apos;d need distributed transactions or a consensus protocol like Paxos/Raft. But that defeats the purpose of sharding for performance. Consider if you really need strong consistency - often eventual consistency with proper error handling is sufficient for counters.</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'Sections' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">Sections</div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">0:00</span>
                      <span className="text-gray-700">Introduction to Sharded Counters</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">0:15</span>
                      <span className="text-gray-700">Why Use Sharding for High Traffic</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">0:32</span>
                      <span className="text-gray-700">Basic Sharded Counter Architecture</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">0:48</span>
                      <span className="text-gray-700">Shard Selection Strategies</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">1:05</span>
                      <span className="text-gray-700">Consistency Trade-offs</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">1:22</span>
                      <span className="text-gray-700">Performance Benchmarks</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">1:38</span>
                      <span className="text-gray-700">Implementation Example</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sm cursor-pointer hover:bg-gray-50 px-2 py-1 rounded">
                      <span className="text-gray-400 font-mono">1:55</span>
                      <span className="text-gray-700">Best Practices & Conclusion</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="lg:pl-20 lg:pr-1/7">
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900">Content</h1>
          </div>
        </div>
      </main>
    </>
  );
}
