# 화면 구조와 동작 설계

## 구성
1. `PropVideoApp`: 조회수와 설정 상태를 관리하는 단일 클라이언트 화면.
2. `FakeStatusBar`: 선택적으로 노출되는 수정 가능한 촬영용 상태 표시줄.
3. `VideoStage`: 썸네일, 재생 버튼, 재생 시간, 빨간 진행률 표시.
4. `VideoDetails`: 제목, 조회수, 채널, 액션, 고정된 부정적 댓글 표시.
5. `ControlPanel`: 시작 숫자, 상태 표시줄 모드, 시간, 배터리, 초기화, 전체화면 제어.

## 상태
- `viewCount`: 현재 조회수.
- `startCount`: 초기화 기준 숫자.
- `showFakeStatusBar`: 가짜 상태 표시줄 표시 여부.
- `fakeTime`, `battery`: 촬영용 표시값.
- 모든 값은 오류 처리된 localStorage 어댑터를 통해 저장한다.

## 이벤트 경계
- 앱 배경/영상/상세 영역의 터치만 조회수를 증가시킨다.
- `button`, `input`, `label`, 설정 패널 내부 이벤트는 전파를 막는다.
- 키보드 Space/Enter는 입력 필드에 포커스가 없을 때만 증가시킨다.
- Fullscreen API 실패 시 화면 내 안내 메시지를 표시한다.

