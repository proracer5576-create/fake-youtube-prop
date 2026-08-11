# 화면 구조와 동작 설계

## 구성
1. `PropVideoApp`: 촬영 화면과 조회수 증가, 댓글 타이머를 관리하는 클라이언트 화면.
2. `FakeStatusBar`: 선택적으로 노출되는 수정 가능한 촬영용 상태 표시줄.
3. `VideoStage`: 썸네일, 재생 버튼, 재생 시간, 빨간 진행률 표시.
4. `VideoDetails`: 제목, 조회수, 채널, 액션, 고정된 부정적 댓글 표시.
5. `DescriptionSheet`: 제목, 통계, 업로드 시점, 해시태그를 보여주는 하단 설명 창.
6. `SettingsPage`: 시작 숫자, 상태 표시줄, 시간, 배터리, 제목/해시태그, 댓글 내용/조건/지연, 초기화, 전체화면 제어.
7. `prop-settings`: 두 페이지가 공유하는 localStorage 설정 모델과 기본값.
8. `deploy-pages.yml`: 정적 Next.js 빌드 산출물을 GitHub Pages에 자동 배포하는 워크플로우.
9. `scripts/build-standalone.mjs`: 썸네일을 data URL로 인라인해 한 파일짜리 촬영 앱을 생성하는 빌드 도구.
10. `standalone/viewtube-prop.html`: 브라우저에서 직접 여는 오프라인 촬영용 최종 산출물.

## 상태
- `viewCount`: 현재 조회수.
- `startCount`: 초기화 기준 숫자.
- `showFakeStatusBar`: 가짜 상태 표시줄 표시 여부.
- `fakeTime`, `battery`: 촬영용 표시값.
- `comments[]`: 댓글 ID, 작성자, 내용, 등장 조회수, 지연 초.
- `videoTitle`, `hashtags`, `pausedAtSeconds`, `showPlayButton`: 촬영 화면과 설명 창이 공유하는 영상 정보 및 플레이어 표시 설정.
- `likeCount`, `dislikeCount`: 촬영 화면 액션 버튼과 설명 창이 공유하는 반응 수치.
- 모든 값은 오류 처리된 localStorage 어댑터를 통해 저장한다.

## 이벤트 경계
- 앱 배경/영상/상세 영역의 터치만 조회수를 증가시킨다.
- `button`, `input`, `label`, 설정 패널 내부 이벤트는 전파를 막는다.
- 키보드 Space/Enter는 입력 필드에 포커스가 없을 때만 증가시킨다.
- 하단 프로필 링크는 조회수 증가 이벤트에서 제외하고 `/settings`로 이동한다.
- Fullscreen API 실패 시 화면 내 안내 메시지를 표시한다.
- 댓글은 기준 조회수 도달 즉시 또는 `delaySeconds` 타이머 완료 후 순서대로 나타난다.
- 현재 조회수가 기준 아래로 초기화되면 지연 타이머와 댓글 노출 상태를 함께 초기화한다.
- 45회·97회 빠른 초기화는 `startCount`와 `viewCount`를 원자적으로 같은 값으로 변경한다.

## 영상 진행률 표시 경계
- 썸네일·음영은 16:9 영상 상자 안에 유지한다.
- 진행률 원 마커는 영상 하단 밖으로 돌출 렌더링하며, 영상 상자 아래 8px 여백이 해당 영역을 예약한다.
- 웹 촬영 화면과 단일 HTML 촬영 화면에 같은 간격 규칙을 적용한다.

## 배포 분기
- 일반 개발/렌더링 검증: Vinext 개발 서버와 `build:sites` 빌드 사용.
- Vercel: 표준 `next build --webpack`과 루트 경로 사용.
- GitHub Pages: `GITHUB_PAGES=true`에서 정적 export와 `/fake-youtube-prop` base path 사용.
- 공개 자산은 `NEXT_PUBLIC_BASE_PATH`를 통해 두 환경에서 같은 컴포넌트 코드를 사용한다.

## 빌드 명령 책임
- `build`: Vercel이 자동 실행하는 표준 Next.js 프로덕션 빌드.
- `build:sites`: 기존 Vinext/Sites 산출물과 렌더링 테스트용 빌드.
- `build:pages`: GitHub Pages용 정적 export 빌드.
- `build:standalone`: 인터넷 없이 여는 단일 HTML 생성.

## 단일 HTML 상태 구조
- `film`과 `settings` 두 화면을 한 DOM 안에서 전환한다.
- 기존 v2 localStorage 모델과 같은 필드 구조를 사용해 웹 버전과 연출값을 맞춘다.
- 댓글 타이머는 조회수 기준 이하로 초기화하면 취소·숨김 처리하고 다시 기준에 도달할 때 재시작한다.
