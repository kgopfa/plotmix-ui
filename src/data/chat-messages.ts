export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp?: string;
}

export const shardedCounterChat: ChatMessage[] = [
  {
    id: '1',
    message: 'I need to implement a sharded counter for high-traffic scenarios. Can you help me design it?',
    isUser: true,
    timestamp: '2:30 PM'
  },
  {
    id: '2',
    message: 'A sharded counter is perfect for high-traffic scenarios! The basic idea is to split a single counter into multiple shards to reduce contention. Each shard can be incremented independently, and you sum them up when you need the total.',
    isUser: false,
    timestamp: '2:31 PM'
  },
  {
    id: '3',
    message: 'How many shards should I use? And what about consistency?',
    isUser: true,
    timestamp: '2:32 PM'
  },
  {
    id: '4',
    message: 'For shard count, a good rule of thumb is 2-4x the number of CPU cores. More shards = less contention but more overhead. For consistency, you\'ll get eventual consistency - the sum might be slightly off during concurrent updates, but it will converge to the correct value.',
    isUser: false,
    timestamp: '2:33 PM'
  },
  {
    id: '5',
    message: 'What if I need strong consistency?',
    isUser: true,
    timestamp: '2:34 PM'
  },
  {
    id: '6',
    message: 'For strong consistency, you\'d need distributed transactions or a consensus protocol like Paxos/Raft. But that defeats the purpose of sharding for performance. Consider if you really need strong consistency - often eventual consistency with proper error handling is sufficient for counters.',
    isUser: false,
    timestamp: '2:35 PM'
  }
]; 