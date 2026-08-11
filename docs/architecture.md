# 화면 구조와 동작 설계

## 구성
1. `PropVideoApp`: 촬영 화면과 조회수 증가, 댓글 타이머를 관리하는 클라이언트 화면.
2. `FakeStatusBar`: 선택적으로 노출되는 수정 가능한 촬영용 상태 표시줄.
3. `VideoStage`: 썸네일, 재생 버튼, 재생 시간, 빨간 진행률 표시.
4. `VideoDetails`: 제목, 조회수, 채널, 액션, 고정된 부정적 댓글 표시.
5. `DescriptionSheet`: 제목, 통계, 업로드 시점, 해시태그를 보여주는 하단 설명 창.
6. `SettingsPage`: 시작 숫자, 상태 표시줄, 시간, 배터리, 제목/해시태그, 댓글 내용/조건/지연, 초기화, 전체화면 제어.
7. `prop-settings`: 두 페이지가 공유하는 localStorage 설정 모델과 기본값.

## 상태
- `viewCount`: 현재 조회수.
- `startCount`: 초기화 기준 숫자.
- `showFakeStatusBar`: 가짜 상태 표시줄 표시 여부.
- `fakeTime`, `battery`: 촬영용 표시값.
- `comments[]`: 댓글 ID, 작성자, 내용, 등장 조회수, 지연 초.
- `videoTitle`, `hashtags`, `pausedAtSeconds`, `showPlayButton`: 촬영 화면과 설명 창이 공유하는 영상 정보 및 플레이어 표시 설정.
- 모든 값은 오류 처리된 localStorage 어댑터를 통해 저장한다.

## 이벤트 경계
- 앱 배경/영상/상세 영역의 터치만 조회수를 증가시킨다.
- `button`, `input`, `label`, 설정 패널 내부 이벤트는 전파를 막는다.
- 키보드 Space/Enter는 입력 필드에 포커스가 없을 때만 증가시킨다.
- 하단 프로필 링크는 조회수 증가 이벤트에서 제외하고 `/settings`로 이동한다.
- Fullscreen API 실패 시 화면 내 안내 메시지를 표시한다.
- 댓글은 기준 조회수 도달 즉시 또는 `delaySeconds` 타이머 완료 후 순서대로 나타난다.
- 현재 조회수가 기준 아래로 초기화되면 지연 타이머와 댓글 노출 상태를 함께 초기화한다.
