-- CreateTable
CREATE TABLE "ExampleRecord" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "state" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExampleRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioCommandExecution" (
    "id" TEXT NOT NULL,
    "scenarioKey" TEXT NOT NULL,
    "commandId" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "commandEnvelope" JSONB NOT NULL,
    "workflowRunRef" JSONB NOT NULL,
    "workflowStepRef" JSONB NOT NULL,
    "commandIdentityHash" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "receipt" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioCommandExecution_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OwnerIntegrationOutbox" (
    "id" TEXT NOT NULL,
    "scenarioKey" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "eventSchemaVersion" INTEGER NOT NULL,
    "scenarioRelease" JSONB NOT NULL,
    "ownerEventRef" JSONB NOT NULL,
    "subjectRefs" JSONB NOT NULL,
    "actorRef" JSONB NOT NULL,
    "purpose" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "traceId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "dispatchedAt" TIMESTAMP(3),
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerIntegrationOutbox_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OwnerIntegrationOutbox_owner_event_namespace_check"
      CHECK ("eventType" ~ '^example\.[a-z0-9][a-z0-9._-]*$'),
    CONSTRAINT "OwnerIntegrationOutbox_owner_event_ref_v1_check"
      CHECK ("ownerEventRef"->>'schema_version' = '1'),
    CONSTRAINT "OwnerIntegrationOutbox_subject_refs_array_check"
      CHECK (jsonb_typeof("subjectRefs") = 'array'),
    CONSTRAINT "OwnerIntegrationOutbox_actor_ref_v1_check"
      CHECK ("actorRef"->>'schema_version' = '1')
);

-- CreateTable
CREATE TABLE "OwnerIntegrationInbox" (
    "id" TEXT NOT NULL,
    "scenarioKey" TEXT NOT NULL,
    "hostEventId" TEXT NOT NULL,
    "hostEventType" TEXT NOT NULL,
    "eventSchemaVersion" INTEGER NOT NULL,
    "scenarioRelease" JSONB NOT NULL,
    "ownerEventRef" JSONB NOT NULL,
    "subjectRefs" JSONB NOT NULL,
    "actorRef" JSONB NOT NULL,
    "ownerTargetRef" JSONB NOT NULL,
    "purpose" TEXT NOT NULL,
    "correlationId" TEXT NOT NULL,
    "traceId" TEXT,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "failureCode" TEXT,
    "attemptCount" INTEGER NOT NULL DEFAULT 0,
    "nextAttemptAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OwnerIntegrationInbox_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "OwnerIntegrationInbox_owner_event_ref_v1_check"
      CHECK ("ownerEventRef"->>'schema_version' = '1'),
    CONSTRAINT "OwnerIntegrationInbox_owner_target_ref_v1_check"
      CHECK ("ownerTargetRef"->>'schema_version' = '1'),
    CONSTRAINT "OwnerIntegrationInbox_subject_refs_array_check"
      CHECK (jsonb_typeof("subjectRefs") = 'array'),
    CONSTRAINT "OwnerIntegrationInbox_actor_ref_v1_check"
      CHECK ("actorRef"->>'schema_version' = '1')
);

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioCommandExecution_commandId_key" ON "ScenarioCommandExecution"("commandId");

-- CreateIndex
CREATE INDEX "ScenarioCommandExecution_scenarioKey_status_createdAt_idx" ON "ScenarioCommandExecution"("scenarioKey", "status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioCommandExecution_scenarioKey_idempotencyKey_key" ON "ScenarioCommandExecution"("scenarioKey", "idempotencyKey");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerIntegrationOutbox_eventId_key" ON "OwnerIntegrationOutbox"("eventId");

-- CreateIndex
CREATE INDEX "OwnerIntegrationOutbox_scenarioKey_dispatchedAt_nextAttempt_idx" ON "OwnerIntegrationOutbox"("scenarioKey", "dispatchedAt", "nextAttemptAt");

-- CreateIndex
CREATE UNIQUE INDEX "OwnerIntegrationInbox_hostEventId_key" ON "OwnerIntegrationInbox"("hostEventId");

-- CreateIndex
CREATE INDEX "OwnerIntegrationInbox_scenarioKey_processedAt_nextAttemptAt_idx" ON "OwnerIntegrationInbox"("scenarioKey", "processedAt", "nextAttemptAt");
