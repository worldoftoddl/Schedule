# 레슨 스케줄 관리

강사를 위한 레슨 일정 및 정산 관리 PWA.

**배포**: https://schedule-pi-amber.vercel.app

## 주요 기능

- **월간 캘린더** — 레슨 일정을 한눈에 확인, 날짜별 레슨 상세
- **타임 레슨** — 시간당 과금, 그룹 레슨 시 1/n 자동 분할
- **안무 레슨** — 레벨별 가격, 1:1, 진행률 추적 (안무 1곡 = 1건 정산)
- **선수 & 팀 관리** — 팀별 선수 그룹핑, 레슨 추가 시 팀→선수 필터
- **주간 반복** — 이번 달 같은 요일 일괄 레슨 추가
- **월별 정산** — 선수별 / 레슨별 / 팀별 3가지 뷰, 건당 결제 토글
- **안무 정산** — 안무 완성 시(시간 충족) 해당 달에 정산, 월 걸침 지원
- **수업 히스토리** — 월별, 안무별 필터링
- **데이터 백업** — JSON 내보내기/가져오기
- **PWA** — 아이폰/안드로이드 홈 화면에 추가하여 앱처럼 사용

## 기술 스택

- Vite 8 + React 19 + TypeScript 5.9
- Tailwind CSS 4
- Dexie.js (IndexedDB) + dexie-react-hooks
- Zustand (상태관리)
- React Router v7
- Vitest (테스트)

## 개발

```bash
npm install
npm run dev          # 개발 서버 (http://localhost:5173)
npm run build        # 프로덕션 빌드
npm run typecheck    # 타입 체크
npm test             # 테스트 실행
```

## 배포

GitHub `master` 브랜치에 push하면 Vercel에서 자동 빌드 & 배포.
