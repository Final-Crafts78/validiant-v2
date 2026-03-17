# Validiant Phase 1 — Detailed 30 Mini-Phases Implementation Plan (V7 Principal Architect Final)

*This implementation plan completely deconstructs the initial 15 mini-phases into 30 incredibly detailed, rigorous, and highly configurable micro-phases. Every step is built on the philosophy of Elite/Enterprise grade SaaS: no hardcoding, zero compromises, edge-compatible security, full role-based access control (RBAC & ABAC), forensic-grade auditing, and buttery smooth client-side performance. It incorporates all 23 initial structural gap corrections, the 11 extended customizability corrections, the 19 Enterprise UI/Theming corrections, the 12 deep implementation specifications, the 7 polish configurations, AND the final 5 Principal Architect compliance edits.*

## 🔶 FOUNDATION: SCHEMA, AUTH & ROLES (Mini-Phases 1–5)

### 🔷 Mini-Phase 1: Edge-Native Core Authentication & Foundational Schema
**Objective:** Establish the primary schemas, strict edge hashing, and day-one audit chain integrity.
- **Database Schema (`users` table):** Create the primary user identity model. Supports UUIDv4 primary keys, `email`, nullable `passwordHash` (for social/SAML), `googleId`, `githubId`, global `status` ('active' | 'suspended'), and strict `created_at`/`updated_at`. Add `preferences` JSONB column.
- **Cryptographic Audit Log Engine:** Create `activityLogs` table immediately. Must include `userAgent` (text), `appVersion` (varchar), and `prevHash` (varchar 64). Implement the hash chain write logic now (compute `SHA-256` of `prevHash + newRowContent` on insert) to ensure Day 1 forensic integrity for all platform activities.
- **Edge-Native Hashing:** Implement `hashPassword` and `verifyPassword` using the native **Web Crypto API (PBKDF2)**. *Never* use `bcryptjs` as it causes V8 CPU timeout crashes on Cloudflare.
- **Stateless JWT Engine:** Implement `jose` for access token (15-min TTL) and refresh token (7-day TTL). Ensure access tokens contain `sub`, `role`, `orgId` (if active), and `permissionsVersion`.
- **Session Security:** Implement **Cloudflare KV** for refresh token denylists (instant revocation on logout/password change). Key: `denylist:refreshToken:{tokenHash}`, value: `"1"`, TTL: token expiry.
- **User Preference Specification:** Export `UserPreferencesSchema`. Defines `theme`, `sidebarCollapsed`, `caseListDensity`, `timezone`, `dateFormat`, `timeFormat`, `defaultCaseView`, accessibility toggles (`reduceMotion`, `highContrast`, `fontSize`), keyboard map (`commandPaletteShortcut`, `keyboardShortcutOverrides`), `recentItems` (array max 10 LIFO), `columnConfig` (table states), and `notificationConfig` (sound, soundVolume, soundType, desktopPush, urgentFlash, showPreviewInBell).

### 🔷 Mini-Phase 2: Passwordless & Advanced Authentication (OAuth + FIDO2)
**Objective:** Add elite consumer/enterprise auth methods to reduce friction.
- **OAuth 2.0 Integration:** Implement Google and GitHub login using the `arctic` library. Handle cross-subdomain state with secure, `HttpOnly`, `SameSite=Lax` cookies.
- **FIDO2 / WebAuthn (Passkeys):** Implement `@simplewebauthn/server` for hardware security keys and FaceID/TouchID. Follow existing `passkeyCredentials` table implementation.
- **Account Linking Flow:** Ensure OAuth or Passkey connections can be seamlessly attached to an existing email/password account inside the User Profile.

### 🔷 Mini-Phase 3: Global Platform Roles & Feature Flags
**Objective:** Establish the immutable base layer of access control and progressive deployment.
- **Platform Role Schema:** Define the immutable `users.role` enum at the system level: `user`, `admin`, `superadmin`. This governs platform-wide control (billing, instance config), *not* organization control.
- **Permission Constant Base:** Build `packages/shared/src/permissions.ts`. Define the strict `PermissionKey` type containing all 32+ available actions (e.g., `org:read`, `task:verify`, `task:delete`, `kyc:approve`).
- **Middleware Infrastructure:** Create a generic reusable Hono middleware factory `requirePermission(action: PermissionKey)` which validates against the claims inside the verified Edge JWT without database lookups.
- **Unified Feature Flags:** Create `packages/shared/src/feature-flags.ts` defining boolean flags (`BOARD_VIEW`, `EMAIL_NOTIFICATIONS`, `BGV_PARTNER_INBOUND`). Feature resolution order: 1) Check `orgSettings.enabledFeatures` (true) or `orgSettings.disabledFeatures` (false) first. 2) Fall back to global KV flag (`featureflags:global:{flag}`) reading `{ enabled, enabledOrgIds }`. Implement `canFeature(flag, orgSettings)` helper applying this specific hierarchy.

### 🔷 Mini-Phase 4: Multi-Tenant Organization Architecture & Role Migration
**Objective:** Build the logical boundary for enterprise multi-tenancy and correct missing legacy roles.
- **Schema (`organizations`):** Implement `id`, `name`, `slug` (globally unique URL identifier), `industryType` (default: 'bgv'), and an extensible `settings` JSONB column.
- **Schema & Migration (`organization_members`):** Explicitly run a migration to add `manager`, `executive`, `viewer` as valid enum values alongside `owner`, `admin`, `member`. Add nullable `customRoleId: uuid references orgRoles.id` and nullable `invitedById: uuid references users.id`.
- **Workspace State Management:** Build the frontend `workspaceStore` (Zustand). Actions to `setActiveOrg(orgId)` which triggers a `queryClient.removeQueries({ queryKey: ['org', prevOrgId] })` to instantly purge UI stale data when switching contexts.
- **API Resolution:** Update API middleware to parse `X-Org-Id` headers or subdomain resolution to scope every single database query automatically (tenant isolation).

### 🔷 Mini-Phase 5: The Custom Role & ABAC Permission Engine
**Objective:** Give organizations Notion/Linear-level flexibility over user access.
- **System Org Roles (Immutable):** Define the base org roles in code: `owner`, `admin`, `manager`, `executive`, `viewer`. Map each base role directly to a specific array of `PermissionKey`s in a `PERMISSION_MAP` constant.
- **Schema (`orgRoles` table definition):** Create explicit Drizzle table `orgRoles`: `id` (uuid), `organizationId` (uuid FK), `name` (text), `key` (varchar), `description` (text), `inheritsFrom` (varchar), `permissions` (jsonb), `isDefault` (boolean), `createdById` (uuid FK), `createdAt`, `updatedAt`.
- **JWT Permission Injection:** On login or org-switch, the backend resolves the user's role (System or Custom via `customRoleId`), computes the final merged `PermissionKey[]` array, and injects it into the JWT payload.
- **Frontend `can()` Interface:** Create `useWorkspaceStore(s => s.can)` allowing UI components to cleanly do `{can('task:delete') && <DeleteButton />}` with zero API calls.

## 🔶 UI FOUNDATION & STATUS ENGINE (Mini-Phases 6–10)

### 🔷 Mini-Phase 6: "Obsidian Command" Enterprise Theme Architecture & RN Export
**Objective:** Establish the dynamic, white-label visual language (`packages/ui`) for both web and mobile.
- **Multi-Theme Token Source:** Create `packages/config/tokens/tokens.json`. Define distinct `dark` and `light` token sets (surface, text, border, accent, positive, warning, critical). Define an absolute spacing scale (`1`: `4px`, `2`: `8px`, up to `16`: `64px`) and explicit motion timings.
- **Build Pipeline:** Implement a `build:tokens` script that dual-exports `tokens.json`: 1) As `css-vars.css` handling `[data-theme="dark"]` and `prefers-color-scheme`, and 2) As `theme.ts` compatible with `NativeWind`.
- **Theme Flash Prevention:** Expose user preferences via a `userPrefs` cookie. In `apps/web/src/app/layout.tsx`, write a blocking inline `<script dangerouslySetInnerHTML={{...}}/>` inside `<head>` that parses `userPrefs` and sets the `data-theme` and `brandConfig` CSS variables before the DOM paints, guaranteeing zero UI flashes. The `PATCH /api/v1/users/me/preferences` endpoint must explicitly execute `res.cookie('userPrefs', JSON.stringify({theme, brandConfig}), { httpOnly: false, sameSite: 'lax', secure: true, maxAge: 31536000 })` to keep the cookie strictly synced with the DB.
- **Typography Hierarchy:** Implement `Inter` for standard UI, enforce `JetBrains Mono` or `Fira Code` for all IDs, timestamps, and status flags.
- **i18n Architecture Base:** Install `next-intl`. Setup `packages/shared/src/i18n/en.json`. All future strings use `t('key')`—no hardcoded English JSX.

### 🔷 Mini-Phase 7: Accessible Component Library Construction .resolved
**Objective:** Build the atomic elements that consume the Obsidian tokens securely, strictly enforcing WCAG standards.
- **Structural CVA Engine:** Build the complete inventory: `Button`, `Card`, `Badge`, `Avatar`, `Input`, `Skeleton`, `Select`, `MultiSelect`, `DatePicker`, `Textarea`, `Switch`, `FileUploadDropzone`, `ProgressBar`, `Tooltip`, `Modal`, `DataTable`, `Toast`.
- **`DataTable` Virtualization Mandate:** Explicitly define `ColumnDef<TRow>` (requiring `key`, `header`, optional `width`, `sortable`, `hidden`, `pinned`, and custom `render` functions). Crucially, the internals of `DataTable` **must** be built with `@tanstack/react-virtual` from day one so that every table in the application inherently supports 10,000+ row workloads cleanly.
- **Accessibility Mandates:** Focus rings strictly use `--focus-ring` token via `:focus-visible`. Buttons use `aria-busy` for loading. Contrast is validated. Inputs maintain `htmlFor` label linkage. Reduce-motion media queries disable CSS transitions globally.

### 🔷 Mini-Phase 8: Workspace Shell & Org-Scoped URL Architecture .resolved
**Objective:** Deploy the persistent navigational engine and correct URL hierarchy.
- **URL Architecture:** Enforce `/[orgSlug]/dashboard`, `/[orgSlug]/tasks`, and `/[orgSlug]/tasks/[caseId]` routing. Root dynamic route segment dictates tenant isolation. No flat `/dashboard` structures.
- **Layout Grid Definition:** Create the Next.js `[orgSlug]/dashboard/layout.tsx` enforcing the CSS Grid: `Rail (64px) | Sidebar (240px, collapsible via preference) | Main Canvas (1fr)`.
- **Dynamic Context Sidebar:** Create a `useSidebarContent()` React portal hook. The sidebar renders specific content per route (e.g., Quick Filters on Tasks, Route Sub-nav on Settings, Date Pickers on Analytics).
- **The Configurable Command Rail:** Build the fixed 64px left nav. Render items conditionally via `can()` permission checks **AND** the `orgSettings.navigationConfig` (e.g., `showAnalytics`, `showImport`, and dynamic labels).
- **Brand Flash Prevention:** Ensure that org-switching serializes the active org's `brandConfig` into the `userPrefs` cookie alongside the theme choice, rendering custom borders/accents gracefully without layout shift via the phase 6 inline script.

### 🔷 Mini-Phase 9: The Contextual BGV Status Engine & Migration
**Objective:** Build a backend state machine decoupled from display labels and fix legacy strings.
- **Schema Migration:** Add `statusKey: text.notNull().default('UNASSIGNED')`. Write migration script transforming legacy strings: `'Unassigned' -> 'UNASSIGNED'`, `'In Progress' -> 'IN_PROGRESS'`. Ensure ALL app code writes to `statusKey`.
- **System Behavior Keys:** Define immutable keys: `UNASSIGNED`, `ASSIGNED`, `IN_PROGRESS`, `PENDING_REVIEW`, `VERIFIED`, `REJECTED`, `ON_HOLD`, `CANCELLED`.
- **Role-Gated Transition Verification:** Implement `getValidTransitions(currentStatusKey, orgSettings, userRoleKey)`. This function computes all downstream targets from the matrix, checks `allowedRoles` arrays, and outputs solely the transitions the active user is legally allowed to execute, returning rich metadata (`color`, `icon`, `requiresNote`). It intentionally omits `allowedRoles` from the return payload since the filtering has already been enforced.
- **Custom Intermediate Statuses:** Allow `org.settings.customStatuses` insertions including `insertAfter`, `color` (contrast validated), `icon`, and `requiresNote`.

### 🔷 Mini-Phase 10: Organizational Settings Architecture (The Enterprise Config Hub)
**Objective:** Create the massively typed configuration object that governs all tenant behavior, achieving true Enterprise customizability.
- **Zod Schema:** Define and export `OrgSettingsSchema` from `packages/shared/src/org-settings.ts`. Both the API and frontend Settings Form consume this safely.
- **White-Label Branding Config:** Define `brandConfig` (accentPrimary, logoUrl, faviconUrl, displayName, loginPageHeroText). Overrides UI tokens dynamically on load.
- **SLA Engine Configuration:** Define `slaCalcMode` ('calendar' | 'business_hours'), `slaAtRiskThresholdPercent` (default 20, range 5-50), `businessHours` (timezone, workDays, start/end), `orgHolidays`, and `slaExcludeHolidays`.
- **Feature Flag Visibility:** Add `enabledFeatures: FeatureFlag[]` and `disabledFeatures: FeatureFlag[]` to govern all org-specific platform capabilities (e.g., replacing manual boolean fields like `boardViewEnabled`).
- **Audit Retention Config:** Define `auditLogRetentionDays` (default 365, governs Phase 28 cron).
- **Case Reference Config:** Define `caseRefFormat` (prefix, includeYear, paddingLength, separator) used by the Postgres atomic sequence generator.
- **Priority System Config:** Define `priorityConfig` (enabled, and levels containing key, label, color, slaMultiplier). Replaces hardcoded priority enums.
- **Rejection Config:** Define `rejectionReasons` (id, label, requiresNote) and `allowFreeformRejection`.
- **Navigation Config:** Define `navigationConfig` (showAnalytics, showImport, casesLabel, analyticsLabel).
- **Email/Notification Policies:** Define `emailNotificationsEnabled`, `emailConfig`, and `notificationPolicy` (defaults by role).
- **Analytics KPIs/CSV Templates:** Define `analyticsKpiConfig` and `csvImportTemplates`.

## 🔶 DATA ARCHITECTURE & INTEGRATION HUB (Mini-Phases 11–15)

### 🔷 Mini-Phase 11: The Verification Type Schema Engine
**Objective:** Architecture the extensible core of the BGV product with full EAV/Versioning support.
- **Table Definition (`verificationTypes`):** Drizzle definition: `id`, `organizationId` (FK), `code`, `name`, `slaOverrideHours`, `isActive`, `fieldSchema` (jsonb), and index on `(organizationId, isActive)`.
- **Table Definition (`fieldSchemaVersions`):** Add versioning table. Columns: `id`, `verificationTypeId` (FK), `version`, `fieldSchema` (jsonb snapshot), `createdById`, `createdAt`.
- **Field Definitions:** 
  - Each `FieldDefinition` possesses: `id`, `key`, `label`, `type`, `isRequired`, `conditionalOn`.
  - **Role Visibility:** Define `visibleTo: OrgRoleKey[]` and `editableBy: OrgRoleKey[]`.
  - **Upload Config:** If type is 'photo' | 'document', define `uploadConfig`: `allowedMimeTypes`, `maxFileSizeMb`, `maxFiles`, `requireGeoTag`, `requireLiveCapture`, `watermarkEnabled`.
- **Global `tasks` Migration:** Add schema footprint for metadata (EAV lookups).

### 🔷 Mini-Phase 12: Generic Case Data Storage (EAV Pattern)
**Objective:** Store infinite custom fields safely without altering database tables.
- **Table Definition (`caseFieldValues`):** Drizzle definition: `id`, `taskId` (uuid FK), `fieldKey` (text), `filledBy` (uuid FK). Typed value columns: `valueText`, `valueNumber`, `valueDate`, `valueBoolean`, `valueJson` (for multi-select/GPS), and `uploadedFiles`. Include critical index: `index('cfv_task_field_idx').on(taskId, fieldKey)`.
- **Table Definition (`caseDocumentUploads`):** Drizzle definition: `id`, `taskId` (uuid FK), `fieldKey` (text), `fileName`, `fileUrl`, `mimeType`, `fileSize`, `uploadedBy` (FK), `status`, `uploadHash`, `tampered` (boolean), and `geoTag` (jsonb).

### 🔷 Mini-Phase 13: BGV Partner Connectivity & Outbound Mapping
**Objective:** Enable native webhooks without new code.
- **Table Definition (`bgvPartners`):** Drizzle definition: `id`, `organizationId` (FK), `partnerKey`, `name`, `logoUrl`, `inboundApiToken` (hashed), `outboundApiKey` (encrypted), `isActive`. Adds `webhookSigningSecret` (encrypted), `allowedIps`, and `rateLimit`.
- **AES-256-GCM Encryption Architecture:** Explicitly define the at-rest encryption engine for `outboundApiKey` and `webhookSigningSecret`. Use Cloudflare's `crypto.subtle` executing `AES-256-GCM`. The Data Encryption Key (DEK) is securely stored inside Cloudflare KV, never hardcoded in the worker repository.
- **Table Definition (`outboundDeliveryLogs`):** Drizzle definition: `id`, `taskId` (FK), `partnerId` (FK), `triggerStatus`, `payloadSent`, `responseStatus`, `responseBody`, `attemptNumber`, `deliveredAt`, `failedAt`, `error`, `createdAt`.
- **Outbound Service Manager:** Assemble the mapped payload defined in `verificationTypes.outboundMappings`. Execute the outbound webhook, handle 3-attempt exponential backoff, record directly to `outboundDeliveryLogs`.

### 🔷 Mini-Phase 14: Secure Inbound BGV Pipeline (Partner Push)
**Objective:** Allow BGV partners to automatically inject cases into Validiant securely.
- **Dedicated Inbound Endpoint:** `POST /api/v1/inbound/:partnerKey/cases`.
- **Enterprise Security Wrapper:** Enforce HMAC-SHA256 signature verification via `X-Signature` header against the decrypted `webhookSigningSecret`. Implement IP allowlist checking. Implement KV-based rate limiting per partner (`ratelimit:inbound:{partnerKey}:{min}`).
- **Atomic Case References:** Define a unique sequence `org_{orgId}_case_seq START 1` mapped inside transactions representing `tasks.caseId`. Implement an explicit `UNIQUE(organizationId, caseId)` SQL constraint on the `tasks` table. 
- **Collision Handling:** If an inbound webhook hits a duplicate `caseId` violation, reject with `409 Conflict`, offering the existing `taskId` so the partner can gracefully route a follow-up patch.  
- **Auto-Resolution:** Map the incoming `"check_type"` to the internal `VerificationType.code`. Instantiate new tasks gracefully. Log `CASE_RECEIVED_FROM_PARTNER` on the audit trail.

### 🔷 Mini-Phase 15: CSV Import Engine & Smart Mapping
**Objective:** Enterprise-grade bulk ingestion that is typed and strongly validated.
- **Smart Column Detection & Templates:** Check `orgSettings.csvImportTemplates`. Render a "Select Template" dropdown for Ops managers to instantly restore mapping rules for recurring imports. Offer a "Save as Template" post-mapping.
- **Validation Pass Structuring:** Define exact Typescript return interfaces for the validator: `CsvValidationResult` containing `totalRows`, `validRows`, arrays of `CsvRowWarning` and `CsvRowError` (with explicit `rowData` and `message`), plus a `preview` payload of `TaskCsvRow[]`. Render this specific shape in the UI.
- **Batch Processing:** Insert approved mapped rows into `tasks` table with `statusKey: 'UNASSIGNED'` via Drizzle transactions to ensure bulk atomic safety. Write all custom field combinations explicitly to `caseFieldValues`.

## 🔶 CORE WORKFLOW & MEDIA ENGINE (Mini-Phases 16–20)

### 🔷 Mini-Phase 16: The Case Command Center (Detail View)
**Objective:** Build the unified reactive workspace `[orgSlug]/tasks/[caseId]`.
- **Skeleton & Error States:** Explicitly implement `CaseDetailSkeleton` mirroring the two-column layout with exact height blocks. Implement Error Boundaries: `CaseNotFound`, `CasePermissionDenied`, and `CaseDeleted`.
- **Layout:** Implement the two-column grid (`60% Left / 40% Right`). Left contains dynamic forms/media; right contains action panel, timeline, and comment thread.
- **SLA Header:** Construct the immutable case header with dynamic SLA progress ring/bar mapping to (`on_track`, `at_risk`, `breached`) computed natively via the `slaCalcMode` business hours logic.
- **Role-Gated Dynamic Field Rendering:** Parse the `fieldSchema` snapshot. Strict validation: only render components if `can(user.role, field.visibleTo)` is true. Entirely omit sensitive fields for unprivileged users. Bind to `caseFieldValues` data.

### 🔷 Mini-Phase 17: Case Action Panel & Transition Matrix Enforcement
**Objective:** The right-hand column controls the lifecycle of the case safely.
- **Role-Gated Actions:** Render buttons conditionally strictly utilizing the predefined output of `getValidTransitions()`.
- **Transition Guard:** Implement UI blocking against illegal state transitions (enforcing `bgv-status.ts` rules, including dynamically loaded custom statuses, ensuring colors/icons match config). 
- **Validation Blocks:** Do not allow status change to `PENDING_REVIEW` if any `isRequired` dynamic field is empty. Render inline missing field list.
- **Configurable Rejection Modal:** When an Admin invokes `REJECT`, render the radio list from `orgSettings.rejectionReasons`. Demand a free text note only if `requiresNote` is true, or if `allowFreeformRejection` is selected. Save the entire `{ reasonId, reasonLabel, note }` JSONB payload to the DB.

### 🔷 Mini-Phase 18: Queue Management (Cases List & Filters)
**Objective:** The primary operational dashboard `/[orgSlug]/tasks` for admins.
- **View Toggle:** Implement `[≡ Table] [⊞ Board]` switch. Board view acts as a Kanban governed by checking `canFeature('BOARD_VIEW', orgSettings)`. Show explicitly colored status columns.
- **Role Context Switch:** If `role == executive`, hide "Assignee" filters and strip UI down to "My Queue". If `admin`, show entire org workload.
- **SearchParam Routing:** Bind all filter chips (Status, Assignee, Priority, etc.) directy to the URL query string (`?status=VERIFIED&assignee=123`). This enables shareable, bookmarkable queue states. Priority column rendering honors `orgSettings.priorityConfig`.
- **Persistent Table Settings:** Implement drag-and-drop column reordering and visibility toggles natively via the `ColumnDef<TRow>` spec. Serialize and save preferences securely to `users.preferences.columnConfig` server-side (not localStorage) so a manager's layout persists across all devices.

### 🔷 Mini-Phase 19: The Power Layer (Bulk Operations)
**Objective:** Eliminate repetitive manual tasks for Operations Managers.
- **Selection State:** Implement robust checkbox logic across the virtualized table (supporting shift-click range selection).
- **The Bulk Action Bar:** Slide up a persistent Toast bar when `selectedCount > 0`.
- **Bulk Assignment:** Pop an Avatar-list Modal. Apply the chosen executive ID to all selected rows via a single `PATCH /api/v1/tasks/bulk-assign` Drizzle transaction.
- **Bulk Status Matrix Check:** `PATCH /api/v1/tasks/bulk-status` must run the `getValidTransitions()` checks *per row*. Returns `{ succeeded: string[], failed: { caseId: string, reason: string }[], summary: string }`. The bulk bar renders this exact summary inline.

### 🔷 Mini-Phase 20: Forensic Geo-Tag Engine & Device Metadata
**Objective:** Prove irrefutably *where* and *when* an executive took a photograph.
- **Browser API Extractor:** Hook `navigator.geolocation.getCurrentPosition()`. On file select, capture `lat`, `lng`, `accuracy` (meters), `userAgent`, and `UTC timestamp`. Write securely to `activityLogs`.
- **Server Math (Haversine):** Upon upload confirmation, if task has target coordinates, the API calculates distance to the geo-tag. If distance > `task.gpsDeviationThresholdMeters`, append the `outside_range` flag.
- **Watermarking UX:** If `watermarkEnabled` config is true, burn coordinates/timestamp natively onto the image. Case Detail UI securely renders evidence metadata natively.

## 🔶 PERFORMANCE, SEARCH & REAL-TIME (Mini-Phases 21–25)

### 🔷 Mini-Phase 21: The Forensic Media Upload Pipeline (Presigned URLs & Tamper Verification)
**Objective:** Handle large binary uploads at the Edge without crashing Cloudflare Workers.
- **Architecture Correction:** Never stream binaries through the Worker RAM. Instead, create `POST /api/v1/cases/:caseId/files` as a **presigned URL generator**.
- **Field Schema Verification:** Worker strictly validates `fileSizeMb`, `mimeType`, `requireLiveCapture`, etc., against the `FieldDefinition.uploadConfig` bound to that specific case's verfication type.
- **Cryptographic Hash Flow:**
  1. Client calls generator endpoint with `{ fieldDefinitionId, fileName, fileSize, mimeType, geoTag }`.
  2. Worker validates request, generates a **Supabase Storage presigned PUT URL**.
  3. Worker pre-creates the `caseDocumentUploads` row with `status: 'pending'`.
  4. Client computes `SHA-256` array buffer of the file locally (`crypto.subtle.digest`).
  5. Client uploads directly to Supabase Storage bypassing the Worker.
  6. Client calls `POST /api/v1/cases/:caseId/files/:fileId/confirm` passing their `uploadHash`.
  7. Worker validates size/hash. **Crucially: for files > 2MB, offload the server-side Supabase fetch and SHA-256 verification to a Cloudflare Queue consumer** to bypass the 30s Worker CPU limit. The confirm endpoint instantly returns `202 Accepted` with `status: 'verifying'`. The Queue async job updates the row to `uploaded` (valid) or `tampered` (mismatch), then fires the SSE broadcast. If tampered, a Priority `urgent` `DOCUMENT_TAMPERED` notification is dispatched to Org Admins.

### 🔷 Mini-Phase 22: The "Command Palette" (⌘K) Global Search
**Objective:** Deliver power-user navigation speed (Linear/Superhuman style).
- **Global Shortcuts Engine:** Define explicitly `MOD+K` for command palette, `MOD+A` select all, `N` new case, and map theme toggles. Build `useKeyboardShortcut` hook to manage bindings securely, checking `userPreferences.keyboardShortcutOverrides` for personal mappings.
- **Zustand State Hook:** Implement a lightweight `useCommandPalette` hook controlling the modal overlay via a React Portal outside the Next.js boundary.
- **Tri-Mode Architecture:** 
  - *Mode 1 (Navigation):* Pure client-side fuzzy search across Pages & Recent Cases. Triggers a read from `userPreferences.recentItems` array persisted locally (LIFO max 10 cache).
  - *Mode 2 (Search `case:`):* Hits `GET /api/v1/search` debounced at 200ms for global DB lookup.
  - *Mode 3 (Action `do:`):* Executes contextual functions (`> assign case`, `> import csv`) gated by `permissions[]`.
- **Keyboard Shortcuts:** Tie `↑`/`↓` for selection, `Enter` for execution, `Tab` for autocomplete, and `Escape` for dismissal.

### 🔷 Mini-Phase 23: Settings Hub & Invitation Architecture
**Objective:** Build the management UI for Custom Roles, Branding, and the Invitation flow.
- **Unsaved State Protections:** Wrap settings forms in `react-hook-form` tracking `isDirty`. If `isDirty`, show sticky "Unsaved Changes" toast and intercept navigation attempts with `useBeforeUnload` prompt. Destructive schema changes pop a strict confirmation modal.
- **Sub-Navigation Structure:** Implement `Settings -> General | Branding | Members | Case Config | Integrations | Audit`. 
- **Branding Settings UI:** Expose the `brandConfig` properties: Custom `logoUrl` (presigned upload), display name, subtext lines, and a "Reset Branding" fallback. The explicit **Accent color picker** dynamically validates WCAG AA contrast (4.5:1) against both `--surface-base` in dark mode AND light mode simultaneously. Renders two explicit badges inline: `Dark ✓ 7.2:1` and `Light ✓ 5.1:1` to guarantee the white-label works everywhere.
- **Role Builder Interface:** Create the matrix UI listing all 32 `PermissionKey`s grouped by category. Allow cloning a system role and overriding specific toggles. Save via `POST /api/v1/organizations/:orgId/roles`.
- **Invitation Flow & Compliance:** Implement link-based flow (no email in Phase 1). Admin creates invite via UI -> token generated in `organizationInvitations` -> Admin copies magic link. On load of the magic link, explicitly present the Data Processing Agreement (DPA) and Terms of Service. Capture acceptance into a new `tosAcceptedAt` timestamp in `organization_members`. Add `mentions: jsonb` to comments.

### 🔷 Mini-Phase 24: Enterprise Architecture & DB Optimization
**Objective:** Engineer "Buttery Smooth" performance metrics and codify the infrastructure.
- **Data Layer Declaration:** Explicitly commit to document `apps/api/README.md`: Neon Serverless for PostgreSQL, Supabase Storage for Files, Cloudflare KV for caching/counters, DO for real-time.
- **Cursor Pagination:** Rebuild `GET /api/v1/tasks` using explicit cursor limits, ripping out `OFFSET` entirely to guarantee O(log N) DB lookups at scale.
- **TanStack Key Factory:** Centralize query keys in `src/lib/query-keys.ts` (`const casesKeys = { all, detail(id) }`) to ensure cache invalidation is surgically precise.
- **Optimistic UIs:** Wrap all state changes (status updates, assignments) in TanStack `onMutate`. Change the DOM instantly, and revert `onError` if the API rejects.

### 🔷 Mini-Phase 25: The Server-Sent Events (SSE) Real-Time Engine 
**Objective:** Eradicate manual page refreshes across the entire application securely stringed by organization.
- **Per-Org DO Pattern:** Define `OrgRealtimeRoom` Durable Object. Each org gets exactly *one* globally consistent DO instance via `env.REALTIME_ROOMS.idFromName(orgId)`.
- **Connection Registry & Hibernation:** Open `GET /api/v1/realtime/stream`. Validate JWT and proxy the connection to the specific DO instance internal WebSocket endpoint. The DO maintains `Map<userId, Set<WebSocket>>` internally. When Cloudflare cleanly hibernates the idle DO, it wipes the `Map`. Write explicit reconnection listener inside the client `EventSource` wrapper to immediately re-poll `/stream` upon disconnect. In the DO `fetch` handler, defensively reconstruct the `Map` from the newly arriving HTTP upgrade requests rather than assuming the persistence of the Map between ticks.
- **Broadcasting Engine:** Create `broadcastToOrg(orgId, event)`. Fire this inline during any mutation (e.g., task assigned). 
- **Client Invalidation:** On the frontend, `EventSource` listens for `CASE_UPDATED`. If the payload touches a cached item, trigger `queryClient.invalidateQueries` silently.

## 🔶 INTELLIGENCE, AUDITING & MOBILE FIELD APP (Mini-Phases 26–30)

### 🔷 Mini-Phase 26: Unified Notification & SLA Alert Service
**Objective:** Operational awareness system that replaces email noise with targeted in-app alerts.
- **Sensory Processing Rules:** Read `userPreferences.notificationConfig`. Play `new Audio('/sounds/{soundType}.mp3')` only if prior browser interaction exists. Cycle document title for urgent flashing, and prompt Browser Notification API capabilities.
- **Notifications Schema Correction:** Add missing columns to Drizzle migration: `orgId` (uuid FK), `priority` (varchar), `actionUrl` (text), `metadata` (jsonb), `groupKey` (varchar), `isGrouped` (boolean). Alias `content` to `body` in the TS type layer.
- **SLA Cron Trigger:** Create a Cloudflare Cron (`apps/api/src/workers/sla-monitor.ts`) firing every 5 minutes. Query cases where `NOW() > computed_sla_deadline - (orgSettings.slaAtRiskThresholdPercent)` and `slaAtRiskNotified == false`. Uses the advanced business hours utility if configured.
- **Action Generation:** When breached, insert a record into `notifications` (Priority: `urgent`) and fire `broadcastToOrg()`.
- **Notification Center UI:** Build the Command Rail bell popover. Group identical bursts utilizing the new `isGrouped` key. Sort by priority (`urgent` > `high` > `normal`).
- **Pulsing Indicator:** Trigger a CSS `@keyframes ring-pulse` on the bell icon if any unread `urgent` notification exists.

### 🔷 Mini-Phase 27: The Materialized Analytics Engine
**Objective:** Replace slow O(N) dashboard scans with O(1) instantaneous metric reads.
- **Analytics Drill-Down Routing:** Clicks on specific KPI cards route seamlessly to the Queue with explicit URL search parameters pre-filtering the result (e.g. click Rejection Rate routes to `?statusKey=REJECTED&period=this_week`).
- **Snapshot Table Schema (`orgAnalyticsSnapshots`):** A summary table storing JSONBs for all aggregate numbers.
- **KPI Configuration Matrix:** System explicitly selects which KPIs to compute and render based entirely upon the org's `analyticsKpiConfig.visibleKpis` setting. `primaryKpi` is featured as the top-left cardinal statistic.
- **Rollup Cron:** Create a 15-minute cron that aggregates the live `tasks` table and upserts the current snapshot for every active org.
- **Live KV Counters:** Use Cloudflare KV to maintain ultra-fast intra-cron counters (e.g., `cases_completed_today_org_123`).
- **Dashboard UI (`/[orgSlug]/analytics`):** Render Sparklines using raw SVG paths (no heavy charting libraries). Use lightweight `recharts` strictly for the Donut and Stacked Bar workload charts.

### 🔷 Mini-Phase 28: Forensic Audit Log & Compliance Export
**Objective:** The non-negotiable feature for Enterprise procurement (SOC2 readiness).
- **Audit Retention Engine:** Deploy a nightly cron job trimming `activityLogs` based entirely on `orgSettings.auditLogRetentionDays` config. Log the purge task explicitly as `AUDIT_LOG_PURGED`. 
- **Audit Table UI (`/[orgSlug]/settings/audit`):** Gated strictly to `owner`, `admin`, `manager`.
- **Data Rendering:** Render absolute timestamps (no relative "2 mins ago" here). Extract the `oldValue` vs `newValue` JSONB diff and render it conceptually like a Git diff.
- **Cryptographic Hash Chain:** The infrastructure established in Phase 1 computes `prevHash` automatically. Display a `⚠ Integrity Check Failed` flag on the UI if checking any chronologically adjacent records detects a mismatch constraint failure (signifying direct malicious DB tampering).  
- **Compliance Export:** Implement `task:export_audit` allowing a raw CSV dump of the raw log data for external auditors.

### 🔷 Mini-Phase 29: Executive Mobile App Foundation (Expo / React Native)
**Objective:** A purpose-built, zero-distraction iOS/Android app strictly for the `executive` field role.
- **Architecture (`apps/mobile`):** Initialize Expo SDK 52 with Expo Router. Share `packages/shared` types/schemas.  
- **Dynamic Brand Application:** Leverage a `useBrandStore` Zustand architecture. Pull the custom `brandConfig` and apply dynamic CSS value overrides via `StyleSheet` natively across tabs, explicitly avoiding runtime swaps on `NativeWind` config arrays.
- **Authentication:** Use `expo-secure-store` to hold the Edge JWT and Refresh Token (never `AsyncStorage`). Implement `expo-local-authentication` (FaceID/TouchID) as a convenience unlock wrapping the secure token.
- **Token Refresh Interceptor:** Specify the Axios/Fetch interceptor in `packages/shared/src/api-client.ts` that catches 401s, silently calls the `/auth/refresh` endpoint using the stored `refreshToken`, stores the new `accessToken`, and retries the original request. Without this, field workers lose form state.
- **Offline Context:** Integrate `react-native-mmkv` to handle blazing-fast local caching of assigned case data for offline viewing.

### 🔷 Mini-Phase 30: Mobile Field Capture & Offline Sync Queue
**Objective:** The core BGV loop: Data entry and media capture in poor network conditions.
- **Offline Sync Connectivity UX:** Introduce a 32px amber "Offline" persistent banner above tabs when network is lost. Show "⟳ Syncing..." and progress numbers upon reconnection until fully flushed.
- **Case Rendering:** Render the `fieldSchema` dynamically in React Native. Use `expo-document-picker` and OS-native `@react-native-community/datetimepicker`. Obeys global roles via `visibleTo` limits.
- **PhotoCaptureField Component:** Build a highly specific camera UI showing live GPS accuracy `📍 Accuracy: 12m`. Block or warn if GPS > 100m or if `requireLiveCapture` is true on the field schema.
- **The Sync Queue:** If offline during "Submit for Review", serialize the payload and local `file://` cache URIs into MMKV. 
- **Auto-Recovery:** Monitor `@react-native-community/netinfo`. Upon reconnection, silently loop the queue, obtaining presigned URLs from Edge API, uploading photos, confirming client-side hashes against the backend, completing the task, purging the cache, and firing a success Haptic feedback.

---
**Implementation Strategy Note:** 
*This True Final Master V7 roadmap contains every exact logic mechanism, compliance rule, enterprise UI edge-case, asynchronous workaround (Cloudflare Queues), cryptographic layer (AES-256-GCM / SHA-256 chaining), system state recovery (DO hibernation), and rigorous component restriction mandated by the fully consolidated 75+ point Principal Architect audit. It is designed to safely guide executing engineers through sequence-breaking traps. Phases 1-5 build the uncompromised data/security foundation; 6-10 establish the UI system, URLs, and exhaustive enterprise settings matrix; 11-15 build the exact integration/schema engines; 16-20 build the core daily workflows; 21-25 optimize and push real-time data efficiently; and 26-30 cap off with analytics, auditing, and the resilient native mobile field app.* 
