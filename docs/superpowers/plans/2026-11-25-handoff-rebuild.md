# ProductiveME 화면 재구축 및 API 연결 계획

첨부 SPEC과 화면 캡처를 제품 설계 기준으로 사용한다. 현재 기준은 로컬 커밋 `2d94c73`이다. 화면은 React/Vite/TypeScript로 재구성하고 Fastify, 기존 Sync, Core, OpenAPI 클라이언트를 유지한다. 배포 시에도 웹에서 같은 출처의 `/api`로 접근하도록 한다. 현재 개발 프록시는 `/api`를 제거하므로 Fastify 라우트에는 이 접두사를 중복 추가하지 않는다.

기존 조회를 브라우저에서 조합하면 첫 화면을 빨리 연결할 수 있지만 주간 상태 규칙이 여러 화면에 복제된다. 전체 백엔드를 먼저 교체하면 디자인 검토가 늦어진다. 추천안은 **새 화면 셸을 먼저 검증하고, 기존 조회를 재사용하면서 화면별로 필요한 서버 계약만 추가**하는 것이다.

## 리뷰 반영과 구현 순서

- 첫 PR은 새 상단바·Home·읽기 전용 Registry다. 기존 Review 진입과 초안 생성, 도메인 진입을 유지한다. 핸드오프 01·11을 1280px와 모바일에서 비교하고 실제 API의 정상·빈 상태·오류를 검증한다. 모달/드로어는 실제 쓰기 기능과 함께 추가한다.
- 이후 순서는 소스 건강·실제 Retry → 쓰기 저장 기반과 Task → Home의 주간 상태 및 Review 이력 → Plan·Life·Finance 쓰기 → Settings와 통합 검증이다. Registry 등록·제거는 API와 Sync의 공통 저장 계약을 확정한 뒤 연결한다.
- Compose의 registry와 API 스냅샷 마운트는 읽기 전용이다. 쓰기 단계에서 원본과 스냅샷을 갱신할 프로세스, 영속 볼륨, YAML 가져오기와 재시작 후 복구를 검증한다. Retry는 실제 Sync 실행 주체에 연결하고 브라우저 조회 재시도와 구분한다.
- Review 저장 전 주·월, 시간대, 기간 경계가 화면과 Task, AI 초안에서 일치하도록 정한다. 기존 저장 초안과 확정 이력은 같은 출처에서 읽어 원본을 보존하며 중복 없이 이전한다.
- Task 삭제·주 이동과 슬롯 연결 해제는 한 쓰기로 처리한다. Undo는 원래 Task와 아직 비어 있는 배정을 복원한다. 슬롯이 이미 사용 중이면 기존 배정을 유지하고 Task 복원 결과를 알린다. 외부 소스 장애는 ProductiveME 서버 연결 끊김과 구분한다.

## 단계와 완료 기준

1. **새 화면 셸**. `apps/web/src/App.tsx`, `components/TopBar.tsx`, `styles/tokens.ts`에서 Home·Plan·Review·Registry, 상단 Settings, Home에서 도메인 진입을 구성한다. Home과 읽기 전용 Registry를 먼저 연결하고 미구현 동작은 비활성화한다. 후속 모달/드로어에는 Esc, 포커스 트랩 및 복귀, 640px 미만 바텀 시트를 적용한다. 핸드오프 01·11과 1280px 및 좁은 화면 비교. 고정 날짜·데모 토글·프로토타입 저장 로직은 제품 코드에 도입하지 않는다.
2. **Registry와 건강 상태**. `apps/api/src/app.ts`, `snapshots.ts`, `apps/sync/src/`를 확장한다. 기존 `GET /registry`로 초기 목록을 제공하고, 이후 `GET /sources`에서 최신 시도와 마지막 정상 조회 시각을 제공한다. 기존 YAML 등록 설정은 초기 입력으로 유지하고, 등록 쓰기를 도입하는 단계에서 API와 Sync가 함께 읽는 단일 저장소로 전환한다. 현재 API는 registry를 시작 시 읽으므로 재시작 없이 반영되는지 확인한다. Retry는 실제 단일 소스 실행 결과로 상태를 갱신하고, 최초 미수집·오류·복구를 구분한다. 등록 테스트는 지원하는 커넥터 유형부터 구현하며, 폴더는 허용 루트, 원격 연결은 지원 목적지와 자격증명 범위를 서버에서 검증한다. 제거는 연결 설정만 제거한다. 검증은 재시작 없는 반영과 실패 이후 마지막 정상 시각 보존이다.
3. **Home·도메인 읽기**. 기존 `/domains`, `/signals`, `/snapshots?domain=…`로 동기화, 추천 행동과 최근 활동을 먼저 연결한다. 기존 `/domains`의 건강도는 유지한다. Task 저장이 생긴 뒤 `GET /home?week=…` 및 `GET /domains/:id?week=…`에 주간 계획 상태·이유·완료 수와 액션을 추가한다. `BLOCKED → OVERLOADED → NEGLECTED → ATTENTION → ON TRACK` 순서는 서버에서 한 번 계산한다. 초기 진행 바는 소스 동기화율로 명시하고, 주간 완료율이 생기면 별도 값으로 표시한다. Career의 분야/게시 상태, Personal Data 정리율·용량과 Finance 지출·자산 구성은 실제 수집 계약이 확정될 때까지 빈 상태다. 테스트에서 장애와 cap 초과가 겹치면 BLOCKED가 우선한다.
4. **공유 저장과 Task·Review**. 신규 도메인 규칙과 타입은 `packages/core`, HTTP 계약은 Fastify 스키마와 생성한 `packages/api-client` 타입에 둔다. 쓰기 상태는 API가 소유하는 로컬 SQLite를 제안한다. 수집 스냅샷 JSON은 유지한다. Task CRUD와 이월을 먼저 연결하고, cap 초과는 409 CAP_EXCEEDED, 명시적 재시도만 강행한다. ISO 월요일 기준 주와 날짜 검증을 서버에 두고, UI의 pdata는 API의 personal-data에 매핑한다. 기존 `POST /reviews`는 초안 생성이므로 보존하고, 저장·목록·상세는 `/review-entries`로 분리한다. 기존 브라우저 초안과 아카이브는 서버 저장 전 중복 없는 일회성 가져오기를 제공한다. 월간 달력·Undo·빠른 추가는 같은 Task 데이터를 사용한다. Notion 내보내기는 대상과 형식이 확정된 뒤 추가한다. 검증은 중복 이월 방지, 서버 재시작 뒤 리뷰 이력 유지, 초안 호출 호환이다.
5. **Plan·Life·Finance 쓰기**. `/weeks/:week/plan`과 `/weeks/:week/life`는 같은 슬롯의 계획 데이터를 공유한다. 보호 시간 변경과 슬롯 변경은 한 트랜잭션으로 처리하고 기존 슬롯을 침범하지 않는다. Task는 같은 주에서 한 슬롯에만 연결한다. 계획 잠금은 명세에 따라 우선 표시와 토글이다. Finance 자산 기록은 `/finance/snapshots`로 분리하고, 합계 계산과 현재 주의 연결된 snapshot task 완료를 원자적으로 처리한다. 복수 후보는 명시적 task ID로 구분한다. Career Publish는 글과 task의 연결 및 실제 게시 권한·대상이 정해진 뒤 연결한다. 검증은 Plan과 Life의 양방향 반영, 보호 슬롯 충돌과 중복 배정 방지, Finance 저장 실패 시 task 상태 보존이다.
6. **Settings와 통합 검증**. Settings는 리뷰 기본 모드를 API 저장에 연결한다. 외부 소스 장애 중에도 ProductiveME API가 살아 있으면 Task를 서버에 저장한다. ProductiveME API 자체가 끊길 때의 오프라인 큐·재동기화는 충돌 정책을 정한 뒤 도입한다. 각 화면의 로딩·빈 상태·오류·키보드 조작을 검증한다. 단계마다 관련 API/컴포넌트 테스트와 브라우저 화면 비교를 수행하고, 통합 전에 `pnpm test`, `pnpm typecheck`, `pnpm lint`, `git diff --check`를 실행한다.

첫 구현 단위는 1단계의 새 상단바와 Home/읽기 전용 Registry 연결이다. 새 화면 계약이 확정되면 동일한 셸 위에 쓰기 기능을 붙인다.
