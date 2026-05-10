-- Upvote tracking tables for posts and comments
CREATE TABLE IF NOT EXISTS post_votes (
  post_id   uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id   uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS comment_votes (
  comment_id uuid NOT NULL REFERENCES comments(id) ON DELETE CASCADE,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (comment_id, user_id)
);

ALTER TABLE post_votes    ENABLE ROW LEVEL SECURITY;
ALTER TABLE comment_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "post_votes_read"   ON post_votes;
DROP POLICY IF EXISTS "post_votes_insert" ON post_votes;
DROP POLICY IF EXISTS "post_votes_delete" ON post_votes;

CREATE POLICY "post_votes_read"   ON post_votes FOR SELECT USING (true);
CREATE POLICY "post_votes_insert" ON post_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "post_votes_delete" ON post_votes FOR DELETE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "comment_votes_read"   ON comment_votes;
DROP POLICY IF EXISTS "comment_votes_insert" ON comment_votes;
DROP POLICY IF EXISTS "comment_votes_delete" ON comment_votes;

CREATE POLICY "comment_votes_read"   ON comment_votes FOR SELECT USING (true);
CREATE POLICY "comment_votes_insert" ON comment_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "comment_votes_delete" ON comment_votes FOR DELETE USING (auth.uid() = user_id);
