-- Add block_height column
ALTER TABLE "transactions" ADD COLUMN "block_height" bigint;

-- Drop old block_id column
ALTER TABLE "transactions" DROP COLUMN "block_id";
