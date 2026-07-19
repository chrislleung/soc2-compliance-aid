PRAGMA foreign_keys=OFF;

CREATE TABLE IF NOT EXISTS "Connector" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "provider" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "lastSyncedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "ComplianceControl" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "currentStatus" TEXT NOT NULL,
    "lastEvaluatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "EvidenceItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectorId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "collectedAt" DATETIME NOT NULL,
    "expiresAt" DATETIME,
    "metadata" JSONB NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EvidenceItem_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Employee" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "employmentStatus" TEXT NOT NULL,
    "sourceSystem" TEXT NOT NULL,
    "hasAwsAccess" BOOLEAN NOT NULL,
    "hasAzureAccess" BOOLEAN NOT NULL,
    "hasGithubAccess" BOOLEAN NOT NULL,
    "startDate" DATETIME NOT NULL,
    "terminationDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "Policy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "version" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "requiresAcknowledgement" BOOLEAN NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "PolicyAcknowledgement" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "employeeId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersion" TEXT NOT NULL,
    "acknowledgedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "PolicyAcknowledgement_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "PolicyAcknowledgement_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "Policy" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "RiskAssessment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "likelihood" TEXT NOT NULL,
    "impact" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "mitigation" TEXT,
    "status" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

CREATE TABLE IF NOT EXISTS "SyncRun" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "connectorId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL,
    "completedAt" DATETIME,
    "error" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SyncRun_connectorId_fkey" FOREIGN KEY ("connectorId") REFERENCES "Connector" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "_ComplianceControlToEvidenceItem" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ComplianceControlToEvidenceItem_A_fkey" FOREIGN KEY ("A") REFERENCES "ComplianceControl" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ComplianceControlToEvidenceItem_B_fkey" FOREIGN KEY ("B") REFERENCES "EvidenceItem" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Connector_provider_key" ON "Connector"("provider");
CREATE UNIQUE INDEX IF NOT EXISTS "ComplianceControl_code_key" ON "ComplianceControl"("code");
CREATE INDEX IF NOT EXISTS "EvidenceItem_connectorId_idx" ON "EvidenceItem"("connectorId");
CREATE INDEX IF NOT EXISTS "EvidenceItem_collectedAt_idx" ON "EvidenceItem"("collectedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "Employee_email_key" ON "Employee"("email");
CREATE INDEX IF NOT EXISTS "Employee_employmentStatus_idx" ON "Employee"("employmentStatus");
CREATE INDEX IF NOT EXISTS "Employee_sourceSystem_idx" ON "Employee"("sourceSystem");
CREATE UNIQUE INDEX IF NOT EXISTS "Policy_name_version_key" ON "Policy"("name", "version");
CREATE INDEX IF NOT EXISTS "PolicyAcknowledgement_policyId_idx" ON "PolicyAcknowledgement"("policyId");
CREATE UNIQUE INDEX IF NOT EXISTS "PolicyAcknowledgement_employeeId_policyId_policyVersion_key" ON "PolicyAcknowledgement"("employeeId", "policyId", "policyVersion");
CREATE INDEX IF NOT EXISTS "SyncRun_connectorId_idx" ON "SyncRun"("connectorId");
CREATE INDEX IF NOT EXISTS "SyncRun_provider_idx" ON "SyncRun"("provider");
CREATE INDEX IF NOT EXISTS "SyncRun_startedAt_idx" ON "SyncRun"("startedAt");
CREATE UNIQUE INDEX IF NOT EXISTS "_ComplianceControlToEvidenceItem_AB_unique" ON "_ComplianceControlToEvidenceItem"("A", "B");
CREATE INDEX IF NOT EXISTS "_ComplianceControlToEvidenceItem_B_index" ON "_ComplianceControlToEvidenceItem"("B");

PRAGMA foreign_keys=ON;
