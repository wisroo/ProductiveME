# ProductiveME 글꼴과 텍스트 규칙

화면을 수정하기 전에 이 문서와 [디자인 토큰](../apps/web/src/styles/tokens.ts), [폰트 로딩 설정](../apps/web/index.html)을 확인한다.

| 위치 | 글꼴 | 적용 |
| --- | --- | --- |
| 다크 테마 제목·로고 | Space Grotesk | `.hf`, 시스템 산세리프 폴백 |
| 라이트 테마 제목·로고 | Newsreader | `.hf`, Georgia·serif 폴백 |
| 본문·기본 UI | Public Sans | 시스템 산세리프 폴백 |
| 날짜·상태·기술 라벨 | JetBrains Mono | monospace 폴백 |
| Plan 주간 목표 입력과 플레이스홀더 | Space Grotesk 500, 15px | 두 테마 동일. 플레이스홀더 색은 `--muted` |
| Review 요약·초안·이력의 실제 사용자 텍스트 | Public Sans | Apple SD Gothic Neo → Malgun Gothic → Noto Sans CJK KR → sans-serif |

- 공통 제목은 `--hfont`를 사용한다. 개별 화면에서 제목 글꼴을 고정하는 코드를 추가하기 전 두 테마를 확인한다.
- 입력값과 플레이스홀더는 같은 글꼴을 사용하고 색으로 구분한다. 읽을 문장이나 사용자 입력 전체에 모노스페이스를 적용하지 않는다.
- 한글 요약과 긴 사용자 텍스트를 좁은 화면에서도 확인한다. 단어 경계를 우선하고, 긴 토큰만 칸의 폭에 맞춰 줄바꿈한다.
- 외부 폰트를 로드하지 못하는 경우에도 시스템 폴백으로 읽을 수 있어야 한다. 화면 변경 시 다크·라이트 및 모바일에서 확인한다.
