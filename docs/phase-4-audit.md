# Phase 4 production-readiness audit

## Baseline findings

### High priority

- Client failures are written only to `console.error`, so production errors are
  not aggregated, searchable, or connected to releases.
- The Groups screen used one membership query plus two additional requests for
  every group. The new `get_my_groups_with_previews` RPC makes this one bounded
  request with no more than four images per group.
- Group Detail used one closet query per member. It now loads the visible closet
  items for all members in one request.
- List queries are not paginated. Large closets, groups, and borrowing histories
  can eventually exceed PostgREST's row limit or produce slow screens.

### Medium priority

- Image uploads allow files up to 10 MB and return original public images. There
  is no thumbnail pipeline, responsive image sizing, or CDN transformation
  strategy in the application.
- Invite-code redemption has authentication and database authorization but no
  application-specific attempt limit. Supabase platform limits should be
  confirmed before adding a database limiter.
- There is no synthetic health check or alert for the public website and core
  Supabase requests.
- UI operations have loading states but no standard timeout or retry policy.

### Existing strengths

- Row Level Security scopes application data.
- Group creation and invite redemption are transactional database functions.
- A partial unique index prevents two active borrowers for the same item.
- Common closet, membership, and active-borrow query patterns have indexes.
- CI checks configuration, tests, migrations, and a clean web build.
- Production builds reject staging and privileged Supabase credentials.

## Initial performance targets

- Groups and Group Detail should use a constant number of database requests as
  group count grows.
- First useful data should render within 2 seconds on a typical mobile network.
- User-triggered database operations should complete within 1 second at p95,
  excluding image upload time.
- Production JavaScript errors should be searchable by release and screen.
- Health checks should detect public-site or backend failure within 5 minutes.

## Implemented in the Phase 4 review branch

- Group cards now load through one bounded database function instead of two
  additional requests per group.
- Group Detail loads visible closet items in one bulk request instead of one
  request per member.
- New closet photos are resized to a maximum dimension of 1200 pixels,
  JPEG-compressed, and uploaded with immutable one-year cache metadata.
- My Closet loads 24 records at a time and Borrowed Items loads 20 at a time.
- Client data reads use the locally cached session; database authorization still
  occurs through the signed access token and Row Level Security.
- Groups retain cached screen data while a background request refreshes it.
- Slow client operations emit named duration measurements for a future
  monitoring provider.

Existing full-resolution storage objects are unchanged and require a separate,
carefully tested backfill if they are to be replaced.

## Next decisions

1. Select an error-monitoring provider and configure separate staging and
   production projects. Sentry is compatible with Expo, but it requires a DSN
   and a data-retention/privacy decision before client instrumentation.
2. Add cursor pagination to group-member reads; closet and borrowing-history
   reads now have bounded offset pagination.
3. Backfill smaller variants for existing oversized closet images.
4. Establish authenticated load-test fixtures in staging, then measure group
   listing, group detail, borrow, and return flows.
5. Configure uptime checks and alerts for the production website and a safe
   backend health endpoint.
