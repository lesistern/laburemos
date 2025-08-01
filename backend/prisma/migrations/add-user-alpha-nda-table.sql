-- CreateTable
CREATE TABLE "user_alpha" (
    "id" SERIAL NOT NULL,
    "email" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "device_fingerprint" TEXT NOT NULL,
    "user_agent" TEXT,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nda_version" TEXT NOT NULL DEFAULT '1.0',

    CONSTRAINT "user_alpha_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_alpha_ip_address_device_fingerprint_key" ON "user_alpha"("ip_address", "device_fingerprint");

-- CreateIndex
CREATE INDEX "user_alpha_email_idx" ON "user_alpha"("email");

-- CreateIndex
CREATE INDEX "user_alpha_ip_address_idx" ON "user_alpha"("ip_address");

-- CreateIndex
CREATE INDEX "user_alpha_accepted_at_idx" ON "user_alpha"("accepted_at");