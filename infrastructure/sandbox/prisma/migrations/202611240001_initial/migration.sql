-- CreateTable
CREATE TABLE "Obligation" (
    "id" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "customer" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "paid" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Obligation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExternalOperation" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "reference" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExternalOperation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Obligation_provider_reference_key" ON "Obligation"("provider", "reference");

-- CreateIndex
CREATE UNIQUE INDEX "ExternalOperation_externalId_key" ON "ExternalOperation"("externalId");
