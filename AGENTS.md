# Full-Stack Engineering Architecture Guidelines for AI Assistants

This document governs coding standards, file organization, and architectural decisions across backend, web, and mobile projects. All AI agents and pair-programming assistants must strictly follow these rules.

---

## ⚡ Global Package Manager Policy

* **STRICTLY ALWAYS USE pnpm**: For all Node.js and TypeScript ecosystems (NestJS, Next.js, monorepos, and tooling scripts), always use pnpm (pnpm install, pnpm add <pkg>, pnpm add -D <pkg>, pnpm <script>, pnpm dlx <cmd>).
* ❌ **NEVER** run or propose 
pm or yarn commands unless explicitly instructed by the user.

---

## 1. Backend: NestJS & TypeORM Architecture

* **Service as Orchestrator**: Services strictly orchestrate database transactions, repository queries, high-level workflow coordination, and dependency injection. Never write God Object services.
* **Extract Helpers into src/modules/<feat>/helpers/<name>.helper.ts when**:
  1. Service exceeds **400–600 lines** or handles $>3$ distinct workflows.
  2. Pure business math (pricing, taxes, commissions, diffs).
  3. Deep regex/parsing (barcode formatting, token extraction).
  4. Low-level probes (SSRF IP checks, DNS, crypto keys).
  5. Zero-mock unit testing (*.helper.spec.ts without mocking NestJS DI or TypeORM).
* **Pure Utilities**: Stateless, domain-agnostic functions in src/common/utils/<name>.util.ts.
* **TypeORM Safety**:
  * Multi-table writes **must** use dataSource.transaction().
  * Avoid N+1 queries (leftJoinAndSelect / elations).
  * synchronize: false in production; use migrations (pnpm migration:run).
* **REST & DTOs**:
  * All inputs validated via DTOs and ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }).
  * Unified JSON response wrappers via TransformInterceptor and HttpExceptionFilter.
* **Security & Observability**:
  * Validate ConfigModule on boot using Joi/Zod to crash immediately if required secrets are absent.
  * Always enable helmet(), explicit CORS whitelist, and @nestjs/throttler on sensitive routes.
  * Implement liveness/readiness probes with @nestjs/terminus (TypeOrmHealthIndicator) and invoke pp.enableShutdownHooks().

---

## 2. Web: Next.js & React Architecture

* **Security BFF (Backend for Frontend)**:
  * ❌ **NEVER** store JWT access or refresh tokens in localStorage or JavaScript-readable cookies.
  * Store tokens in encrypted **HttpOnly, Secure, SameSite=Strict** cookies in Next.js Server Actions or Route Handlers.
  * Next.js server unwraps the cookie and attaches Authorization: Bearer <token> to private downstream NestJS calls.
  * Keep all third-party private API keys (Stripe, OpenAI, AWS) on the server runtime; never expose with NEXT_PUBLIC_.
* **Pages as Route Coordinators**: Keep page.tsx under **100–150 lines**. A page sets up layouts and metadata, but delegates rendering to domain components.
* **RSC First**: Keep pages and layouts as React Server Components. Push 'use client' down to the leaves (interactive buttons, dropdowns, inputs).
* **Data Fetching & Caching**:
  * Data fetching is dynamic by default. Use use cache or unstable_cache for explicit caching.
  * Trigger on-demand revalidation (evalidateTag(), evalidatePath()) in Server Actions.
  * Unwrap promises in Client Components using React's native use() hook without heavy client fetch libraries.
* **Schema Separation**: Form validation schemas live in src/lib/validators/<domain>.validator.ts using Zod. Never inline validation rules in JSX. Always re-parse input using safeParse() in Server Actions.
* **Stateful Modal Isolation**: Modals maintaining multi-step input or async state must be separate components or use Intercepting/Parallel routes (@modal).
* **Custom Hooks**: Encapsulate cross-cutting logic (RBAC, confirmation dialogs, SSE streams) in src/hooks/.
* **Performance & Core Web Vitals**: Zero layout shift with 
ext/font/google; always set priority and sizes on 
ext/image.

---

## 3. Mobile: Flutter & Riverpod Architecture

* **Feature-First Layout**: Group code under lib/features/<domain>/ with presentation/, providers/, data/, and domain/. Never directly import internal presentation widgets across features.
* **Decoupled Core Infrastructure**: Keep Dio client, native MethodChannel bridges, and secure storage in lib/core/.
* **Riverpod Code Generation & AsyncNotifier**:
  * Use @riverpod annotations and AsyncNotifier for async state and mutations.
  * Always use AsyncValue.guard(() => ...) for automatic error catching.
  * Read providers in mutation callbacks via ef.read(); watch state in uild() via ef.watch().
* **Declarative Routing (go_router)**: Centralize auth guards and redirect logic in pp_router.dart. Use ShellRoute for persistent bottom navigation.
* **Widget Granularity**: Keep uild() methods under **100 lines**. Extract layout blocks into dedicated StatelessWidget / ConsumerWidget classes (not private _buildHelper() methods) to optimize rebuilds. Use const constructors aggressively.
* **Zero-Widget Unit Testing**: Test business logic notifiers in pure Dart unit tests using ProviderContainer without pumping widgets.

---

## 4. How to Update Guidelines

When new patterns, performance improvements, or architectural decisions are made:
* Update the relevant guides in docs/nestjs/, docs/nextjs/, or docs/flutter/.
* Update the corresponding skill in .agents/skills/.
* Update this AGENTS.md file to keep all rules synchronized.
