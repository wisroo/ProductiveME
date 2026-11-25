# ProductiveME 개발 규칙

`develop`은 일상 개발과 통합의 기준 브랜치다. `main`은 검증된 릴리스와 운영 배포의 기준이다. GitHub의 기본 브랜치도 `develop`으로 설정한다.

## 브랜치

| 용도 | 이름 | 시작점 | PR 대상 |
| --- | --- | --- | --- |
| 기능·수정·문서·개발환경 | `feat/<task>`, `fix/<task>`, `docs/<task>`, `chore/<task>` | 최신 `origin/develop` | `develop` |
| Codex 작업 | `codex/productiveme-<task>` | 최신 `origin/develop` | `develop` |
| 정식 릴리스 | `develop` | 통합 브랜치 | `main` |
| 운영 긴급 수정 | `hotfix/<task>` | 최신 `origin/main` | `main` |
| 긴급 수정 반영 | `main` | 운영 브랜치 | `develop` |

`<task>`는 소문자와 숫자를 하이픈으로 구분한 작업명으로 쓴다. 예: `feat/source-health`, `codex/productiveme-handoff-rebuild`. 브랜치 하나에서 검토 가능한 목표 하나를 다룬다. 커밋 메시지는 `feat(web): add source filters`처럼 변경 의도를 짧게 적는다.

작업 전 `git fetch origin`과 `git status --short --branch`로 기준과 작업 트리를 확인한다. 기존 미커밋 변경이 있으면 보존하고 작업 범위를 확인한다. 자동화는 필요할 때 Draft PR을 열고, 브랜치 기준과 병합 여부는 `origin/develop`을 기준으로 확인한다.

## PR과 리뷰

- 제목과 본문에 문제, 변경 후 동작, 검증 결과를 적는다. 화면 변경에는 캡처와 주요 동작을, API·저장소 변경에는 호환성, 데이터 이전 및 롤백 조건을 포함한다. 실행하지 않은 검증은 구분해 적는다.
- 작업 중이거나 검증이 남아 있으면 Draft PR로 연다. 검토 요청 전 `pnpm lint`, `pnpm typecheck`, `pnpm test`, `git diff --check`를 실행한다. 웹 변경은 `pnpm --filter @productiveme/web build`와 관련 화면을 확인한다.
- 리뷰는 사용자 동작과 회귀, API 계약, 데이터 보존, 보안 및 운영 영향을 확인한다. 피드백을 해결하고 최신 커밋의 CI `ci`, `docker-smoke`가 통과한 상태에서 병합한다. 승인 후 동작에 영향을 주는 변경이 추가되면 다시 검토한다.
- 사람이 작성한 PR은 가능하면 다른 사람이 리뷰한다. 단독 운영에서는 저장소 소유자가 자체 검토 결과와 검증을 확인한다. Codex가 만든 PR은 소유자가 검토하고 병합을 결정한다.

## 병합

- `develop`과 `main`은 PR을 통해 변경한다. 직접 push와 force push를 금지한다. 기능 PR은 **Squash merge**, 브랜치 간 릴리스·긴급 수정 반영 PR은 **Merge commit**을 사용해 통합 이력을 유지한다.
- 저장소 소유자가 병합한다. Codex는 소유자의 명시적 승인 없이 병합하거나 운영 배포하지 않는다. 병합 후 임시 작업 브랜치를 정리한다.
- 운영 긴급 수정이 `main`에 들어가면 `main → develop` PR을 열어 빠진 변경을 반영한다. 다음 릴리스 전에 두 브랜치의 수정이 일치하는지 확인한다.
- GitHub 관리자 설정에서 기본 브랜치를 `develop`으로 지정하고, 양쪽 브랜치에 PR 필수, `ci`와 `docker-smoke` 통과, force push·삭제 금지를 적용한다. 단독 운영에서 작성자 승인 제한으로 막히지 않도록 필수 독립 리뷰 수는 실제 리뷰 인원에 맞춘다.

## 릴리스와 배포

1. `develop → main` PR에 릴리스 범위, 설정 변경, 데이터 이전 여부와 롤백 방법을 적는다. 소유자가 리뷰하고 CI 통과 후 병합한다.
2. 배포할 `main`의 정확한 커밋과 이전 정상 버전을 기록한다. 저장 형식이 바뀌면 배포 전에 영속 데이터를 백업하고 이전 버전의 읽기 호환성을 확인한다.
3. 소유자의 승인 후 [README의 Docker Compose 절차](README.md#run-the-local-containers)에 따라 Wyse에 배포한다. 배포 후 `/healthz`, 실제 조회 API, 관련 화면을 확인하고 Sync나 리뷰 생성이 바뀌었다면 해당 흐름도 확인한다.
4. 문제가 있으면 기록한 이전 정상 버전으로 되돌린다. 저장 형식이 호환되지 않으면 검토한 복원 절차를 사용한다. 복구 후 상태와 원인을 릴리스 PR에 남기고 필요하면 revert 또는 hotfix PR을 연다.

현재 CI는 검증만 수행한다. 배포는 별도로 승인하는 수동 작업이다.
