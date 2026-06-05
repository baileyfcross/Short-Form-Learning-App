CREATE (:User {
  id: 'admin-seed',
  email: 'admin@example.com',
  displayName: 'Admin Learner',
  passwordHash: '$2a$12$replaceWithGeneratedHash',
  roles: ['admin'],
  subjects: ['Science', 'History'],
  createdAt: datetime()
});

CREATE (:Source {
  id: 'source-nasa',
  title: 'NASA Science',
  url: 'https://science.nasa.gov/',
  sourceType: 'trusted_public_source',
  publisher: 'NASA',
  reliabilityScore: 92
});

MATCH (u:User {id: 'admin-seed'})
CREATE (m:Material {
  id: 'material-cell-biology',
  title: 'Cell Biology Foundations',
  description: 'Seeded example material metadata. The file itself belongs in object storage.',
  mediaType: 'pdf',
  subject: 'Science',
  tags: ['biology', 'cells'],
  objectKey: 'seed/cell-biology.pdf',
  sourceUrl: '/objects/seed/cell-biology.pdf',
  isPublic: false,
  processingStatus: 'processed',
  uploadDate: datetime(),
  reliabilityScore: 70
})
CREATE (u)-[:USER_UPLOADED_MATERIAL]->(m)
CREATE (s:Snippet {
  id: 'snippet-cell-membrane',
  title: 'Cell Membranes Are Selective',
  subject: 'Science',
  tags: ['biology', 'cells'],
  summary: 'Cell membranes act as selective barriers, controlling what enters and leaves the cell.',
  transcript: 'Cell membranes are built from phospholipids and proteins that help regulate transport.',
  contentType: 'text',
  confidenceScore: 82,
  reliabilityScore: 74,
  moderationStatus: 'approved',
  verificationStatus: 'partially_verified',
  isPublic: true,
  createdAt: datetime()
})
CREATE (m)-[:MATERIAL_GENERATED_SNIPPET]->(s);
