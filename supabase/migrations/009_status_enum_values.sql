-- Add pending_delete and archived to the content_status enum
-- pending_delete: user requested deletion, awaiting admin approval
-- archived:       admin-hidden, not visible to public but restorable

alter type content_status add value if not exists 'pending_delete';
alter type content_status add value if not exists 'archived';
