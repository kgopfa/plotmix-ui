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
  },
  {
    id: '7',
    message: 'Can you show me a simple implementation example?',
    isUser: true,
    timestamp: '2:36 PM'
  },
  {
    id: '8',
    message: 'Here\'s a basic Java implementation:\n\n```java\npublic class ShardedCounter {\n    private final AtomicLong[] shards;\n    \n    public ShardedCounter(int shardCount) {\n        this.shards = new AtomicLong[shardCount];\n        for (int i = 0; i < shardCount; i++) {\n            shards[i] = new AtomicLong(0);\n        }\n    }\n    \n    public void increment() {\n        int shardIndex = Thread.currentThread().hashCode() % shards.length;\n        shards[shardIndex].incrementAndGet();\n    }\n    \n    public long getCount() {\n        long sum = 0;\n        for (AtomicLong shard : shards) {\n            sum += shard.get();\n        }\n        return sum;\n    }\n}```',
    isUser: false,
    timestamp: '2:37 PM'
  },
  {
    id: '9',
    message: 'That looks good! What about handling failures?',
    isUser: true,
    timestamp: '2:38 PM'
  },
  {
    id: '10',
    message: 'Great question! For failure handling, you have several options:\n\n1. **Replication**: Each shard can be replicated across multiple nodes\n2. **Checkpointing**: Periodically save the sum to persistent storage\n3. **Recovery**: On restart, rebuild shards from logs or checkpoints\n4. **Graceful degradation**: If some shards fail, continue with remaining ones\n\nThe key is to design for the failure modes you expect in your environment.',
    isUser: false,
    timestamp: '2:39 PM'
  },
  {
    id: '11',
    message: 'How do I choose the right sharding strategy?',
    isUser: true,
    timestamp: '2:40 PM'
  },
  {
    id: '12',
    message: 'The sharding strategy depends on your access patterns:\n\n- **Hash-based**: Good for uniform distribution, but can cause hotspots\n- **Range-based**: Good for range queries, but can lead to uneven distribution\n- **Round-robin**: Simple but may not distribute load evenly\n- **Consistent hashing**: Good for dynamic scaling, handles node failures well\n\nFor counters specifically, hash-based sharding is usually the best choice.',
    isUser: false,
    timestamp: '2:41 PM'
  },
  {
    id: '13',
    message: 'What about monitoring and metrics?',
    isUser: true,
    timestamp: '2:42 PM'
  },
  {
    id: '14',
    message: 'Essential metrics for sharded counters include:\n\n- **Per-shard counts**: Monitor individual shard values\n- **Update rates**: Track increments per shard\n- **Contention**: Measure lock wait times\n- **Distribution**: Ensure even load across shards\n- **Error rates**: Monitor failed increments\n- **Latency**: Track time to increment and time to get total\n\nUse these to tune your shard count and detect issues early.',
    isUser: false,
    timestamp: '2:43 PM'
  },
  {
    id: '15',
    message: 'This is really helpful! Any final tips?',
    isUser: true,
    timestamp: '2:44 PM'
  },
  {
    id: '16',
    message: 'Here are some final tips:\n\n1. **Start simple**: Begin with a small number of shards and scale up\n2. **Test thoroughly**: Load test with realistic traffic patterns\n3. **Monitor everything**: Set up alerts for unusual patterns\n4. **Plan for growth**: Design for 10x your current load\n5. **Document decisions**: Keep track of why you chose specific parameters\n6. **Have a rollback plan**: Be ready to revert if issues arise\n\nRemember, sharded counters are a trade-off between performance and complexity. Make sure the performance gain is worth the added complexity for your use case!',
    isUser: false,
    timestamp: '2:45 PM'
  }
]; 