-- Visitor-mined blocks now go straight into the shared `blocks` chain
-- (appended at the tip by the API), so the separate classroom table is gone.
DROP TABLE IF EXISTS classroom_blocks;
