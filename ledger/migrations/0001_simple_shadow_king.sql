CREATE TABLE IF NOT EXISTS "blocks" (
	"height" bigint PRIMARY KEY NOT NULL,
	"hash" varchar(64) NOT NULL,
	"previous_hash" varchar(64) NOT NULL,
	"timestamp" timestamp NOT NULL,
	"producer" uuid NOT NULL,
	"tx_count" numeric(10) DEFAULT '0' NOT NULL,
	"state_root" varchar(64) NOT NULL,
	"tx_root" varchar(64),
	"gas_used" bigint DEFAULT 0 NOT NULL,
	"gas_limit" bigint NOT NULL,
	"metadata" jsonb,
	"signature" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"finalized_at" timestamp,
	CONSTRAINT "blocks_hash_unique" UNIQUE("hash")
);
