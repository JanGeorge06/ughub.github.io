# UGC Hub Admin Console

Static web admin console for the UGC Hub Supabase project.

## URL

After GitHub Pages publishes the latest commit:

https://jangeorge06.github.io/ughub.github.io/admin/

## Authorization

The page requires Supabase email/password authentication and checks public.admin_roles for the signed-in user's admin or moderator role.

Assign the first administrator from Supabase SQL Editor:

    insert into public.admin_roles (user_id, role)
    select id, 'admin'
    from auth.users
    where email = 'YOUR_ADMIN_EMAIL'
    on conflict (user_id) do update set role = excluded.role;

Add moderators the same way with 'moderator'.

Do not put a service-role key in the browser. The browser only uses the normal publishable/anon key.

## Moderation

- Users: block/unblock accounts and remove profile photos.
- Campaigns: inspect, remove, and restore campaigns.
- Applications: inspect application messages and remove/restore them.
- Moderation actions are recorded in public.moderation_actions.
- Blocking uses Supabase Auth's admin ban API through the admin-moderation Edge Function.
- Removed campaigns/applications are soft-deleted so audit history is retained.
- Public app campaign/application repositories filter moderated content.

## Backend

Database migration: supabase/migrations/20260922170000_ugc_hub_admin_moderation.sql

Privileged moderation endpoint: supabase/functions/admin-moderation/index.ts

The Edge Function has JWT verification enabled and checks the caller against admin_roles before using the service role internally.
