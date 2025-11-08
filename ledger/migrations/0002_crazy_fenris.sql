ALTER TYPE "transaction_type" ADD VALUE 'user_creation';--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "amount" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ALTER COLUMN "currency_code" DROP NOT NULL;