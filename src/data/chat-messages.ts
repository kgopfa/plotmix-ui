export interface ChatMessage {
  id: string;
  message: string;
  isUser: boolean;
  timestamp?: string;
}

export interface TranscriptSegment {
  id: string;
  timestamp: string;
  text: string;
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

export const betterStackMonitoringTranscript: TranscriptSegment[] = [
  {
    id: '1',
    timestamp: '0:00',
    text: "Let's have a look how basic monitoring works in better stack. We have a few options for creating the monitor. Firstly, we can use the toggle down menu here and shortcut to creating the monitor that you need."
  },
  {
    id: '2',
    timestamp: '0:10',
    text: "Otherwise, you can go ahead and click the button here. Here, you can choose from all the different monitoring options to check your services."
  },
  {
    id: '3',
    timestamp: '0:16',
    text: "You can choose the basic unavailability monitors and include the URL that you'd like to check. You can choose keyword monitors, simply fill out the URL and the keyword that you are looking to find, or not find on the page."
  },
  {
    id: '4',
    timestamp: '0:28',
    text: "You can also choose ping monitors or even transaction monitors, like the playwrights scenarios. With the playwrights scenarios, you get to write the script that you are expecting to run, and if the scenario doesn't run the way it should, you will get alerted."
  },
  {
    id: '5',
    timestamp: '0:41',
    text: "Once you have your monitoring choice selected, the next step is selecting the on-call escalation. For this video, we're looking at the simple escalation and whether you'd like to receive a call, an SMS, email, or a push notification."
  },
  {
    id: '6',
    timestamp: '0:52',
    text: "If you'd like to see how you can configure your escalation further, I'd recommend watching the advance escalation video. In the advanced settings, you'll have the options to set up the check frequency of the monitor, confirmation periods, domain expiration, SSL expiration, and also any recurring maintenance"
  },
  {
    id: '7',
    timestamp: '1:06',
    text: "windows. Please watch the advanced monitors configuration for more details on these. Once you're ready, go ahead and create the monitor."
  },
  {
    id: '8',
    timestamp: '1:12',
    text: "Once you have your monitor created, you'll get an overview with the response time chart for all of the regions from which you are checking the monitor, how long the monitor has been up, the last check, and any number of incidents that it experienced."
  },
  {
    id: '9',
    timestamp: '1:23',
    text: "at the bottom of the overview, you'll see the availability chart and you'll be able to calculate the availability of the particular monitor for a specific time period."
  },
  {
    id: '10',
    timestamp: '1:32',
    text: "If needed, you can also zoom in on any data spikes in your response times, zoom in and debug even in more detail."
  },
  {
    id: '11',
    timestamp: '1:37',
    text: "If you'd like to reconfigure an already existing monitor, you can do that easily through here and you'll see the same settings as I just showed you."
  },
  {
    id: '12',
    timestamp: '1:44',
    text: "All of your monitors will then pop up in the main monitor's tab here where you'll be able to move them to a different group."
  },
  {
    id: '13',
    timestamp: '1:52',
    text: "Pause or unpause all at once and organize exactly as you need. Thanks for watching."
  }
]; 