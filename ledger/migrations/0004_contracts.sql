-- Add contract_deployment to transaction_type enum
ALTER TYPE "transaction_type" ADD VALUE 'contract_deployment';

-- Create contracts table
CREATE TABLE IF NOT EXISTS "contracts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"source_code" text NOT NULL,
	"version" varchar(20) DEFAULT '1.0.0' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"deployed_in_block" bigint NOT NULL,
	"deployment_tx_id" uuid NOT NULL,
	"description" text,
	"metadata" jsonb,
	"code_hash" varchar(64) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);

-- Add foreign key
ALTER TABLE "contracts" ADD CONSTRAINT "contracts_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS "idx_contracts_owner" ON "contracts"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_contracts_block" ON "contracts"("deployed_in_block");
CREATE INDEX IF NOT EXISTS "idx_contracts_code_hash" ON "contracts"("code_hash");
