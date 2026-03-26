ALTER TABLE group_memberships ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'MEMBER';

-- Backfill: group creators become admins
UPDATE group_memberships gm
SET role = 'ADMIN'
FROM groups g
WHERE gm.group_id = g.id AND gm.user_id = g.created_by;
