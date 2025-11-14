--
-- Database Schema
-- Generated on: 2025-11-14T08:36:13.100Z
-- Database: SQLite
--

PRAGMA foreign_keys = ON;

-- Table: chats
CREATE TABLE "chats" (
  "id" VARCHAR NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "deletedAt" DATETIME,
  "userId" VARCHAR NOT NULL,
  "description" TEXT,
  "llmModelId" VARCHAR NOT NULL,
  "status" TEXT DEFAULT 'active',
  "streamingStatus" TEXT DEFAULT 'idle',
  "systemPrompt" TEXT,
  "tags" JSON,
  "title" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("llmModelId") REFERENCES "llm_models" ("id")
);

-- Index: IDX_chat_status_updatedAt
CREATE INDEX "IDX_chat_status_updatedAt" ON "chats" ("status", "updatedAt");

-- Index: IDX_chat_updatedAt
CREATE INDEX "IDX_chat_updatedAt" ON "chats" ("updatedAt");

-- Index: IDX_chat_status
CREATE INDEX "IDX_chat_status" ON "chats" ("status");

-- Index: IDX_chat_llmModelId
CREATE INDEX "IDX_chat_llmModelId" ON "chats" ("llmModelId");


-- Table: connections
CREATE TABLE "connections" (
  "id" VARCHAR NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "deletedAt" DATETIME,
  "userId" VARCHAR NOT NULL,
  "apiKey" TEXT NOT NULL,
  "baseUrl" TEXT NOT NULL,
  "customHeaders" JSON,
  "kind" TEXT DEFAULT 'OPENAI',
  "models" JSON,
  "name" TEXT NOT NULL,
  "provider" TEXT,
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);

-- Index: IDX_connection_userId
CREATE INDEX "IDX_connection_userId" ON "connections" ("userId");


-- Table: embedding_content_chunks
CREATE TABLE "embedding_content_chunks" (
  "id" VARCHAR NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "deletedAt" DATETIME,
  "userId" VARCHAR NOT NULL,
  "chunkHash" TEXT NOT NULL,
  "chunkId" TEXT NOT NULL,
  "chunkIndex" INTEGER NOT NULL,
  "embeddedAt" DATETIME,
  "embeddingContentId" VARCHAR NOT NULL,
  "error" TEXT,
  "lanceDbId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("embeddingContentId") REFERENCES "embedding_contents" ("id")
);

-- Index: IDX_embeddingcontentchunk_embeddingContentId_status
CREATE INDEX "IDX_embeddingcontentchunk_embeddingContentId_status" ON "embedding_content_chunks" ("embeddingContentId", "status");

-- Index: IDX_embeddingcontentchunk_embeddingContentId_chunkIndex
CREATE INDEX "IDX_embeddingcontentchunk_embeddingContentId_chunkIndex" ON "embedding_content_chunks" ("embeddingContentId", "chunkIndex");

-- Index: IDX_embeddingcontentchunk_chunkIndex
CREATE INDEX "IDX_embeddingcontentchunk_chunkIndex" ON "embedding_content_chunks" ("chunkIndex");

-- Index: IDX_embeddingcontentchunk_status
CREATE INDEX "IDX_embeddingcontentchunk_status" ON "embedding_content_chunks" ("status");

-- Index: IDX_embeddingcontentchunk_embeddingContentId
CREATE INDEX "IDX_embeddingcontentchunk_embeddingContentId" ON "embedding_content_chunks" ("embeddingContentId");

-- Index: IDX_embeddingcontentchunk_chunkId
CREATE INDEX "IDX_embeddingcontentchunk_chunkId" ON "embedding_content_chunks" ("chunkId");

-- Index: IDX_embeddingcontentchunk_userId
CREATE INDEX "IDX_embeddingcontentchunk_userId" ON "embedding_content_chunks" ("userId");


-- Table: embedding_contents
CREATE TABLE "embedding_contents" (
  "id" VARCHAR NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "deletedAt" DATETIME,
  "userId" VARCHAR NOT NULL,
  "contentHash" TEXT NOT NULL,
  "contentId" TEXT NOT NULL,
  "contentType" TEXT NOT NULL,
  "embeddingModelId" VARCHAR NOT NULL,
  "error" TEXT,
  "metadata" JSON,
  "name" TEXT DEFAULT 'Untitled Content',
  "status" TEXT NOT NULL,
  "fileId" VARCHAR,
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("embeddingModelId") REFERENCES "embedding_models" ("id"),
  FOREIGN KEY ("fileId") REFERENCES "files" ("id")
);

-- Index: IDX_embeddingcontent_userId_status
CREATE INDEX "IDX_embeddingcontent_userId_status" ON "embedding_contents" ("userId", "status");

-- Index: IDX_embeddingcontent_contentId_contentType
CREATE INDEX "IDX_embeddingcontent_contentId_contentType" ON "embedding_contents" ("contentId", "contentType");

-- Index: IDX_embeddingcontent_status
CREATE INDEX "IDX_embeddingcontent_status" ON "embedding_contents" ("status");

-- Index: IDX_embeddingcontent_contentType
CREATE INDEX "IDX_embeddingcontent_contentType" ON "embedding_contents" ("contentType");

-- Index: IDX_embeddingcontent_contentId
CREATE INDEX "IDX_embeddingcontent_contentId" ON "embedding_contents" ("contentId");

-- Index: IDX_embeddingcontent_userId
CREATE INDEX "IDX_embeddingcontent_userId" ON "embedding_contents" ("userId");


-- Table: embedding_models
CREATE TABLE "embedding_models" (
  "id" VARCHAR NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "deletedAt" DATETIME,
  "userId" VARCHAR NOT NULL,
  "connectionId" VARCHAR NOT NULL,
  "contextLength" INTEGER NOT NULL,
  "default" BOOLEAN DEFAULT 0,
  "dimension" INTEGER NOT NULL,
  "maxBatchSize" INTEGER DEFAULT 32,
  "modelIdentifier" TEXT NOT NULL,
  "name" TEXT,
  "systemPrompt" TEXT,
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("connectionId") REFERENCES "connections" ("id")
);

-- Index: IDX_embeddingmodel_connectionId
CREATE INDEX "IDX_embeddingmodel_connectionId" ON "embedding_models" ("connectionId");

-- Index: IDX_embeddingmodel_userId
CREATE INDEX "IDX_embeddingmodel_userId" ON "embedding_models" ("userId");


-- Table: files
CREATE TABLE "files" (
  "id" VARCHAR NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "deletedAt" DATETIME,
  "userId" VARCHAR NOT NULL,
  "extension" TEXT NOT NULL,
  "fileHash" TEXT DEFAULT '<empty>',
  "filename" TEXT NOT NULL,
  "fileSize" INTEGER DEFAULT 0,
  "fileType" TEXT DEFAULT 'other',
  "fullPath" TEXT NOT NULL,
  "metadata" JSON,
  "mimeType" TEXT DEFAULT 'application/octet-stream',
  "status" TEXT DEFAULT 'pending',
  "ownerId" TEXT,
  "ownerType" TEXT,
  "mkTime" INTEGER DEFAULT 0,
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);

-- Index: IDX_file_fileType_createdAt
CREATE INDEX "IDX_file_fileType_createdAt" ON "files" ("fileType", "createdAt");

-- Index: IDX_file_fileType
CREATE INDEX "IDX_file_fileType" ON "files" ("fileType");

-- Index: IDX_file_fileHash
CREATE INDEX "IDX_file_fileHash" ON "files" ("fileHash");


-- Table: jobs
CREATE TABLE "jobs" (
  "id" VARCHAR NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "deletedAt" DATETIME,
  "userId" VARCHAR NOT NULL,
  "completedAt" DATETIME,
  "dedupeKey" TEXT,
  "error" TEXT,
  "nextRetryAt" DATETIME,
  "parameters" JSON NOT NULL,
  "priority" INTEGER DEFAULT 0,
  "queuedAt" DATETIME,
  "result" JSON,
  "retryCount" INTEGER DEFAULT 0,
  "scheduledAt" DATETIME,
  "startedAt" DATETIME,
  "status" TEXT DEFAULT 'PENDING',
  "targetId" TEXT NOT NULL,
  "timeoutMS" INTEGER DEFAULT 300000,
  "type" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users" ("id")
);

-- Index: IDX_76d494a3c5009428606a4dea04
CREATE INDEX "IDX_76d494a3c5009428606a4dea04" ON "jobs" ("status", "queuedAt");

-- Index: IDX_dd4d18f81c0a9ba900a9502ecf
CREATE INDEX "IDX_dd4d18f81c0a9ba900a9502ecf" ON "jobs" ("nextRetryAt");

-- Index: IDX_20ae324fe515977851739a96fe
CREATE INDEX "IDX_20ae324fe515977851739a96fe" ON "jobs" ("targetId", "type");

-- Index: IDX_dc6f555dc06b89ce79ca00685b
CREATE INDEX "IDX_dc6f555dc06b89ce79ca00685b" ON "jobs" ("status", "type");

-- Index: IDX_79ae682707059d5f7655db4212
CREATE INDEX "IDX_79ae682707059d5f7655db4212" ON "jobs" ("userId");


-- Table: llm_models
CREATE TABLE "llm_models" (
  "id" VARCHAR NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "deletedAt" DATETIME,
  "userId" VARCHAR NOT NULL,
  "capabilities" TEXT NOT NULL,
  "connectionId" VARCHAR NOT NULL,
  "contextLength" INTEGER NOT NULL,
  "default" BOOLEAN,
  "modelIdentifier" TEXT NOT NULL,
  "name" TEXT,
  "systemPrompt" TEXT,
  "temperature" INTEGER NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("connectionId") REFERENCES "connections" ("id")
);

-- Index: IDX_llmmodel_connectionId
CREATE INDEX "IDX_llmmodel_connectionId" ON "llm_models" ("connectionId");


-- Table: message_versions
CREATE TABLE "message_versions" (
  "id" VARCHAR NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "deletedAt" DATETIME,
  "userId" VARCHAR NOT NULL,
  "content" TEXT NOT NULL,
  "contextMetadata" JSON,
  "contextTokens" INTEGER,
  "generationTime" INTEGER,
  "isRegenerated" BOOLEAN DEFAULT 0,
  "llmModelId" VARCHAR NOT NULL,
  "messageId" VARCHAR,
  "parentVersionId" VARCHAR,
  "status" TEXT DEFAULT 'pending',
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("llmModelId") REFERENCES "llm_models" ("id"),
  FOREIGN KEY ("messageId") REFERENCES "messages" ("id"),
  FOREIGN KEY ("parentVersionId") REFERENCES "message_versions" ("id")
);

-- Index: IDX_messageversion_llmModelId_createdAt
CREATE INDEX "IDX_messageversion_llmModelId_createdAt" ON "message_versions" ("llmModelId", "createdAt");

-- Index: IDX_messageversion_messageId_createdAt
CREATE INDEX "IDX_messageversion_messageId_createdAt" ON "message_versions" ("messageId", "createdAt");

-- Index: IDX_messageversion_createdAt
CREATE INDEX "IDX_messageversion_createdAt" ON "message_versions" ("createdAt");

-- Index: IDX_messageversion_llmModelId
CREATE INDEX "IDX_messageversion_llmModelId" ON "message_versions" ("llmModelId");

-- Index: IDX_messageversion_messageId
CREATE INDEX "IDX_messageversion_messageId" ON "message_versions" ("messageId");


-- Table: messages
CREATE TABLE "messages" (
  "id" VARCHAR NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "deletedAt" DATETIME,
  "userId" VARCHAR NOT NULL,
  "chatId" VARCHAR NOT NULL,
  "currentVersionId" VARCHAR NOT NULL,
  "llmModelId" VARCHAR,
  "role" TEXT NOT NULL,
  FOREIGN KEY ("userId") REFERENCES "users" ("id"),
  FOREIGN KEY ("chatId") REFERENCES "chats" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  FOREIGN KEY ("currentVersionId") REFERENCES "message_versions" ("id"),
  FOREIGN KEY ("llmModelId") REFERENCES "llm_models" ("id")
);

-- Index: IDX_message_chatId_createdAt
CREATE INDEX "IDX_message_chatId_createdAt" ON "messages" ("chatId", "createdAt");

-- Index: IDX_message_createdAt
CREATE INDEX "IDX_message_createdAt" ON "messages" ("createdAt");

-- Index: IDX_message_chatId
CREATE INDEX "IDX_message_chatId" ON "messages" ("chatId");


-- Table: users
CREATE TABLE "users" (
  "id" VARCHAR NOT NULL PRIMARY KEY,
  "createdAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "updatedAt" DATETIME NOT NULL DEFAULT (datetime('now')),
  "deletedAt" DATETIME,
  "name" VARCHAR(255) NOT NULL,
  "username" VARCHAR(100) NOT NULL,
  "password" VARCHAR NOT NULL,
  "sessionKey" VARCHAR,
  "metadata" JSON
);

-- Index: IDX_user_sessionKey
CREATE INDEX "IDX_user_sessionKey" ON "users" ("sessionKey");

-- Index: IDX_user_username
CREATE INDEX "IDX_user_username" ON "users" ("username");

