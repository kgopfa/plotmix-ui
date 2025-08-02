export interface ComponentItem {
  id: string;
  name: string;
  category: 'cloud' | 'database' | 'infrastructure' | 'client' | 'media' | 'shapes' | 'storage' | 'communication' | 'ui';
  path: string;
  tags: string[];
  description?: string;
}

export const componentLibrary: ComponentItem[] = [
  // Cloud Services
  {
    id: 'aws',
    name: 'AWS',
    category: 'cloud',
    path: '/components/aws.svg',
    tags: ['aws', 'cloud', 'amazon', 'provider'],
    description: 'Amazon Web Services logo'
  },
  {
    id: 'aws-ec2',
    name: 'AWS EC2',
    category: 'cloud',
    path: '/components/aws-ec2.svg',
    tags: ['aws', 'ec2', 'compute', 'instance'],
    description: 'AWS Elastic Compute Cloud'
  },
  {
    id: 'aws-s3-logo',
    name: 'AWS S3',
    category: 'cloud',
    path: '/components/aws-s3-logo.svg',
    tags: ['aws', 's3', 'storage', 'bucket'],
    description: 'AWS Simple Storage Service'
  },
  {
    id: 'aws-dynamodb',
    name: 'AWS DynamoDB',
    category: 'database',
    path: '/components/aws-dynamodb.svg',
    tags: ['aws', 'dynamodb', 'database', 'nosql'],
    description: 'AWS DynamoDB NoSQL database'
  },
  {
    id: 'azure-blob-storage',
    name: 'Azure Blob Storage',
    category: 'cloud',
    path: '/components/azure-blob-storage.svg',
    tags: ['azure', 'blob', 'storage', 'microsoft'],
    description: 'Microsoft Azure Blob Storage'
  },
  {
    id: 'cloud-protected',
    name: 'Protected Cloud',
    category: 'cloud',
    path: '/components/cloud-protected.svg',
    tags: ['cloud', 'security', 'protected', 'shield'],
    description: 'Protected cloud icon'
  },
  {
    id: 'cloud-success',
    name: 'Cloud Success',
    category: 'cloud',
    path: '/components/cloud-success.svg',
    tags: ['cloud', 'success', 'check', 'verified'],
    description: 'Cloud success indicator'
  },
  {
    id: 'cloud-upload',
    name: 'Cloud Upload',
    category: 'cloud',
    path: '/components/cloud-upload.svg',
    tags: ['cloud', 'upload', 'sync', 'transfer'],
    description: 'Cloud upload icon'
  },

  // Databases
  {
    id: 'database',
    name: 'Database',
    category: 'database',
    path: '/components/database.svg',
    tags: ['database', 'db', 'storage', 'data'],
    description: 'Generic database icon'
  },
  {
    id: 'mysql',
    name: 'MySQL',
    category: 'database',
    path: '/components/mysql.svg',
    tags: ['mysql', 'database', 'sql', 'relational'],
    description: 'MySQL relational database'
  },
  {
    id: 'postgresql',
    name: 'PostgreSQL',
    category: 'database',
    path: '/components/postgresql.svg',
    tags: ['postgresql', 'postgres', 'database', 'sql', 'relational'],
    description: 'PostgreSQL relational database'
  },
  {
    id: 'microsoft-sql-server',
    name: 'SQL Server',
    category: 'database',
    path: '/components/microsoft-sql-server.svg',
    tags: ['sql-server', 'microsoft', 'database', 'sql', 'relational'],
    description: 'Microsoft SQL Server'
  },
  {
    id: 'oracle',
    name: 'Oracle',
    category: 'database',
    path: '/components/oracle.svg',
    tags: ['oracle', 'database', 'sql', 'relational'],
    description: 'Oracle Database'
  },
  {
    id: 'mongodb',
    name: 'MongoDB',
    category: 'database',
    path: '/components/mongodb.svg',
    tags: ['mongodb', 'database', 'nosql', 'document'],
    description: 'MongoDB NoSQL database'
  },
  {
    id: 'redis',
    name: 'Redis',
    category: 'database',
    path: '/components/redis.svg',
    tags: ['redis', 'cache', 'database', 'nosql', 'key-value'],
    description: 'Redis in-memory data store'
  },
  {
    id: 'apache-cassandra',
    name: 'Apache Cassandra',
    category: 'database',
    path: '/components/apache-cassandra.svg',
    tags: ['cassandra', 'apache', 'database', 'nosql', 'distributed'],
    description: 'Apache Cassandra distributed database'
  },
  {
    id: 'riak',
    name: 'Riak',
    category: 'database',
    path: '/components/riak.svg',
    tags: ['riak', 'database', 'nosql', 'distributed'],
    description: 'Riak distributed NoSQL database'
  },
  {
    id: 'dbs-hbase',
    name: 'HBase',
    category: 'database',
    path: '/components/dbs-hbase.svg',
    tags: ['hbase', 'database', 'nosql', 'big-data'],
    description: 'Apache HBase NoSQL database'
  },
  {
    id: 'dbs-couchbase',
    name: 'Couchbase',
    category: 'database',
    path: '/components/dbs-couchbase.svg',
    tags: ['couchbase', 'database', 'nosql', 'document'],
    description: 'Couchbase NoSQL database'
  },

  // Infrastructure & DevOps
  {
    id: 'kubernetes',
    name: 'Kubernetes',
    category: 'infrastructure',
    path: '/components/kubernetes.svg',
    tags: ['kubernetes', 'k8s', 'container', 'orchestration'],
    description: 'Kubernetes container orchestration'
  },
  {
    id: 'docker',
    name: 'Docker',
    category: 'infrastructure',
    path: '/components/docker.svg',
    tags: ['docker', 'container', 'virtualization'],
    description: 'Docker container platform'
  },
  {
    id: 'load-balancer',
    name: 'Load Balancer',
    category: 'infrastructure',
    path: '/components/load-balancer.svg',
    tags: ['load-balancer', 'traffic', 'distribution', 'network'],
    description: 'Load balancer for traffic distribution'
  },
  {
    id: 'api-gateway',
    name: 'API Gateway',
    category: 'infrastructure',
    path: '/components/api-gateway.svg',
    tags: ['api-gateway', 'api', 'gateway', 'microservices'],
    description: 'API Gateway for microservices'
  },
  {
    id: 'rabbitmq',
    name: 'RabbitMQ',
    category: 'infrastructure',
    path: '/components/rabbitmq.svg',
    tags: ['rabbitmq', 'message-queue', 'messaging', 'amqp'],
    description: 'RabbitMQ message broker'
  },
  {
    id: 'memcached',
    name: 'Memcached',
    category: 'infrastructure',
    path: '/components/memcached.svg',
    tags: ['memcached', 'cache', 'memory', 'distributed'],
    description: 'Memcached distributed memory caching'
  },

  // Monitoring & Tools
  {
    id: 'datadog',
    name: 'Datadog',
    category: 'infrastructure',
    path: '/components/datadog.svg',
    tags: ['datadog', 'monitoring', 'observability', 'apm'],
    description: 'Datadog monitoring and analytics'
  },
  {
    id: 'grafana',
    name: 'Grafana',
    category: 'infrastructure',
    path: '/components/grafana.svg',
    tags: ['grafana', 'monitoring', 'visualization', 'metrics'],
    description: 'Grafana monitoring and visualization'
  },
  {
    id: 'github',
    name: 'GitHub',
    category: 'infrastructure',
    path: '/components/github.svg',
    tags: ['github', 'git', 'version-control', 'repository'],
    description: 'GitHub code repository'
  },

  // Client & Media
  {
    id: 'client-computer',
    name: 'Computer Client',
    category: 'client',
    path: '/components/client-computer.svg',
    tags: ['computer', 'desktop', 'client', 'device'],
    description: 'Desktop computer client'
  },
  {
    id: 'client-mobile',
    name: 'Mobile Client',
    category: 'client',
    path: '/components/client-mobile.svg',
    tags: ['mobile', 'phone', 'client', 'device'],
    description: 'Mobile phone client'
  },
  {
    id: 'video-media',
    name: 'Video Media',
    category: 'media',
    path: '/components/video-media.svg',
    tags: ['video', 'media', 'streaming', 'content'],
    description: 'Video media content'
  },
  {
    id: 'images',
    name: 'Images',
    category: 'media',
    path: '/components/images.svg',
    tags: ['images', 'media', 'photos', 'content'],
    description: 'Image media content'
  },
  {
    id: 'packet-message',
    name: 'Message Packet',
    category: 'infrastructure',
    path: '/components/packet-message.svg',
    tags: ['message', 'packet', 'communication', 'data'],
    description: 'Message packet for communication'
  },

  // Shapes
  {
    id: 'cube',
    name: 'Cube',
    category: 'shapes',
    path: '/components/cube.svg',
    tags: ['cube', '3d', 'shape', 'geometry'],
    description: '3D cube shape'
  },

  // Native Components
  {
    id: 'cpu',
    name: 'CPU',
    category: 'infrastructure',
    path: '/components/native/cpu.png',
    tags: ['cpu', 'processor', 'hardware', 'compute'],
    description: 'Central Processing Unit'
  },
  {
    id: 'gpu',
    name: 'GPU',
    category: 'infrastructure',
    path: '/components/native/gpu.png',
    tags: ['gpu', 'graphics', 'hardware', 'compute'],
    description: 'Graphics Processing Unit'
  },
  {
    id: 'ram',
    name: 'RAM',
    category: 'infrastructure',
    path: '/components/native/ram.png',
    tags: ['ram', 'memory', 'hardware', 'storage'],
    description: 'Random Access Memory'
  },
  {
    id: 'server',
    name: 'Server',
    category: 'infrastructure',
    path: '/components/native/server.png',
    tags: ['server', 'hardware', 'compute', 'hosting'],
    description: 'Server hardware'
  },
  {
    id: 'pc',
    name: 'PC',
    category: 'client',
    path: '/components/native/pc.png',
    tags: ['pc', 'computer', 'desktop', 'client'],
    description: 'Personal Computer'
  },
  {
    id: 'laptop',
    name: 'Laptop',
    category: 'client',
    path: '/components/native/laptop.png',
    tags: ['laptop', 'computer', 'portable', 'client'],
    description: 'Laptop computer'
  },
  {
    id: 'phone',
    name: 'Phone',
    category: 'client',
    path: '/components/native/phone.png',
    tags: ['phone', 'mobile', 'device', 'client'],
    description: 'Mobile phone'
  },
  {
    id: 'database-native',
    name: 'Database',
    category: 'database',
    path: '/components/native/database.png',
    tags: ['database', 'storage', 'data', 'db'],
    description: 'Database storage'
  },
  {
    id: 'cloud-native',
    name: 'Cloud',
    category: 'cloud',
    path: '/components/native/cloud.png',
    tags: ['cloud', 'storage', 'computing'],
    description: 'Cloud computing'
  },
  {
    id: 'bucket',
    name: 'Bucket',
    category: 'storage',
    path: '/components/native/bucket.png',
    tags: ['bucket', 'storage', 'container'],
    description: 'Storage bucket'
  },
  {
    id: 'box',
    name: 'Box',
    category: 'storage',
    path: '/components/native/box.png',
    tags: ['box', 'container', 'storage'],
    description: 'Storage box'
  },
  {
    id: 'boxes',
    name: 'Boxes',
    category: 'storage',
    path: '/components/native/boxes.png',
    tags: ['boxes', 'containers', 'storage', 'multiple'],
    description: 'Multiple storage boxes'
  },
  {
    id: 'cdn',
    name: 'CDN',
    category: 'infrastructure',
    path: '/components/native/CDN.png',
    tags: ['cdn', 'content-delivery', 'network', 'distribution'],
    description: 'Content Delivery Network'
  },
  {
    id: 'message',
    name: 'Message',
    category: 'communication',
    path: '/components/native/message.png',
    tags: ['message', 'communication', 'notification'],
    description: 'Message/notification'
  },
  {
    id: 'envelope',
    name: 'Envelope',
    category: 'communication',
    path: '/components/native/envelope.png',
    tags: ['envelope', 'email', 'communication'],
    description: 'Email envelope'
  },
  {
    id: 'folder',
    name: 'Folder',
    category: 'storage',
    path: '/components/native/folder.png',
    tags: ['folder', 'directory', 'storage', 'file-management'],
    description: 'File folder'
  },
  {
    id: 'bulb',
    name: 'Bulb',
    category: 'ui',
    path: '/components/native/bulb.png',
    tags: ['bulb', 'light', 'idea', 'ui'],
    description: 'Light bulb/idea'
  },
  {
    id: 'gears',
    name: 'Gears',
    category: 'infrastructure',
    path: '/components/native/gears.png',
    tags: ['gears', 'settings', 'configuration', 'mechanical'],
    description: 'Settings/configuration gears'
  },
  {
    id: 'cylinder',
    name: 'Cylinder',
    category: 'storage',
    path: '/components/native/cylinder.png',
    tags: ['cylinder', 'storage', 'container', '3d'],
    description: 'Cylindrical storage container'
  }
];

// Helper functions
export const getComponentsByCategory = (category: ComponentItem['category']) => {
  return componentLibrary.filter(component => component.category === category);
};

export const searchComponents = (query: string) => {
  const lowercaseQuery = query.toLowerCase();
  return componentLibrary.filter(component => 
    component.name.toLowerCase().includes(lowercaseQuery) ||
    component.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery)) ||
    component.description?.toLowerCase().includes(lowercaseQuery)
  );
};

export const getAllCategories = () => {
  return [...new Set(componentLibrary.map(component => component.category))];
}; 