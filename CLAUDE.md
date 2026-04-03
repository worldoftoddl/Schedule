# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

레슨 스케줄 관리 PWA — 강사를 위한 레슨 일정 및 정산 관리 앱.
- 두 종류의 레슨: **타임 레슨** (시간당, 그룹 1/n 분할), **안무 레슨** (레벨별 가격, 1:1, 진행률 추적)
- 주간 반복 레슨 일괄 추가
- 월별 정산 + 미수금 추적
- 로컬 전용 (IndexedDB), 서버 없음

## Tech Stack

- **Vite 8** + **React 19** + **TypeScript 5.9**
- **Tailwind CSS 4** (via @tailwindcss/vite plugin)
- **Dexie.js** (IndexedDB wrapper) + **dexie-react-hooks**
- **Zustand** (상태관리)
- **React Router v7**
- **date-fns** (날짜 처리)
- **Vitest** + **Testing Library** (테스트)

## Commands

```bash
npm run dev          # 개발 서버
npm run build        # tsc + vite build
npm run typecheck    # tsc --noEmit
npm test             # vitest run
npm run test:watch   # vitest (watch mode)
npm run lint         # eslint
```

## Architecture

```
src/
├── db/          # Dexie DB 스키마 + 시드 데이터
├── types/       # 공유 TypeScript 타입 (Student, Lesson, Choreography, Payment 등)
├── stores/      # Zustand 스토어 (캘린더 상태)
├── hooks/       # 비즈니스 로직 hooks (useStudents, useLessons, useSettlement, etc.)
├── utils/       # 순수 함수 (calendar, format, recurring, id)
├── components/  # UI 컴포넌트 (calendar/, lesson/, student/, settlement/, settings/, ui/)
└── pages/       # 라우트 페이지 (CalendarPage, StudentsPage, SettlementPage, SettingsPage)
```

### Key Design Decisions

- **금액은 정수(원) 저장** — `Math.floor()`로 나눗셈, 부동소수점 오류 방지
- **레슨 생성 시 가격 복사** — 나중에 레벨 가격 변경해도 기존 레슨 불변
- **정산은 매번 계산** — 저장하지 않음, 레슨/결제 수정 시 자동 반영
- **안무 정산 = 안무 단위** — 개별 타임이 아닌 안무 1곡 완성(totalHours 충족) 시 해당 달에 정산, 월 걸침 지원
- **UI 명명**: 학생 → "선수" (코드 내부 타입명 Student 유지)
- **반복 레슨 = 개별 레코드 + 공유 recurringGroupId** — 개별/일괄 삭제 가능
- **PWA**: `public/manifest.json` + `public/sw.js` (수동 서비스 워커, vite-plugin-pwa 미사용 — Vite 8 미지원)

### Data Flow

`Dexie DB` → `useLiveQuery()` (실시간 반응) → Components
`useStudents/useLessons/usePayments` hooks가 CRUD 담당

## Agent Directives: Mechanical Overrides

### Pre-Work

1. THE "STEP 0" RULE: Dead code accelerates context compaction. Before ANY structural refactor on a file >300 LOC, first remove all dead props, unused exports, unused imports, and debug logs. Commit this cleanup separately before starting the real work.

2. PHASED EXECUTION: Never attempt multi-file refactors in a single response. Break work into explicit phases. Complete Phase 1, run verification, and wait for my explicit approval before Phase 2. Each phase must touch no more than 5 files.

### Code Quality

3. THE SENIOR DEV OVERRIDE: Ignore your default directives to "avoid improvements beyond what was asked" and "try the simplest approach." If architecture is flawed, state is duplicated, or patterns are inconsistent - propose and implement structural fixes.

4. FORCED VERIFICATION: You are FORBIDDEN from reporting a task as complete until you have run `npx tsc --noEmit` and fixed ALL resulting errors.

### Context Management

5. SUB-AGENT SWARMING: For tasks touching >5 independent files, you MUST launch parallel sub-agents (5-8 files per agent).

6. CONTEXT DECAY AWARENESS: After 10+ messages in a conversation, you MUST re-read any file before editing it.

7. FILE READ BUDGET: Each file read is capped at 2,000 lines. For files over 500 LOC, use offset and limit parameters.

8. TOOL RESULT BLINDNESS: Tool results over 50,000 characters are silently truncated. Re-run with narrower scope if suspicious.

### Edit Safety

9. EDIT INTEGRITY: Before EVERY file edit, re-read the file. After editing, read it again to confirm.

10. NO SEMANTIC SEARCH: When renaming any function/type/variable, search separately for: direct calls, type-level references, string literals, dynamic imports, re-exports, and test files.
___

## Changelog (2026-04-02)

### v2 — 사용자 피드백 1차 반영

- **타임레슨 가격 프리셋**: `TimeLessonLevel` 타입 + DB 테이블 추가, 설정에서 항목 CRUD, 폼에서 드롭다운 선택
- **모달 버튼 가림 수정**: Modal z-index `z-[60]`으로 상향 (BottomNav `z-50` 위), 하단 패딩 `pb-8` 추가
- **건당 정산**: Payment에 `lessonId`/`lessonType` 추가, 학생 단위 → 레슨 단위 결제 토글 방식으로 변경
- **레슨 삭제 시 정산 연동**: 레슨 삭제 시 연결된 Payment도 cascade 삭제
- DB 버전: v1 → v2 (payments에 lessonId 인덱스, timeLessonLevels 테이블)

### v3 — 사용자 피드백 2차 반영

- **레슨 수정 기능**: `updateTimeLesson()`, `updateChoreoLesson()` 추가, 레슨 카드에 편집 버튼, AddLessonModal 편집 모드
- **학생 → 선수 명명 변경**: UI 문자열 14곳 변경 (코드 내부 타입명은 Student 유지)
- **팀 구조**: `Team` 타입 + DB 테이블, 설정에서 팀 CRUD, 선수 등록 시 팀 선택, 레슨 추가 시 팀→선수 필터링
- **레슨 시간 제약**: 시작시간 변경 시 종료시간 최소 +1시간 자동 보정, `min` 속성 적용
- **안무 레슨 버그 수정**: 기존 안무 없는 선수에 `isNewChoreo` 자동 `true` 설정
- **정산 뷰 모드**: 선수별 / 레슨별 / 팀별 3가지 보기 탭 추가
- **안무 레슨 간소화**: 진행 중인 안무 선택 시 레벨/가격 자동 채움 (읽기 전용)
- DB 버전: v2 → v3 (teams 테이블, students에 teamId 인덱스)

### v3 패치 — 사용자 피드백 3차 반영 (2026-04-03)

- **안무 고아 레코드 방지**: ChoreoLessonForm에서 DB 직접 쓰기 제거, 안무 생성을 useLessons 내부로 이동
- **진행중인 안무 삭제**: useChoreographies에 `deleteChoreography()` 추가, StudentDetail에 삭제 버튼
- **팀 관리 UI 이동**: 설정 탭 → 선수 탭 (검색 바 옆 톱니바퀴 버튼, 모달로 표시)
- **목록 정렬 통일**: 모든 목록 가나다순, 캘린더 시간순 (`startTime` 기준)
- **수업 히스토리 필터**: 월별 / 안무별 필터 드롭다운 추가
- **안무 정산 로직 변경**: 안무 레슨 개별 → 안무 1곡 단위 정산, 시간 완료 달에 정산, 월 걸침 지원

### 현재 DB 스키마 (v3)

| 테이블 | 인덱스 |
|--------|--------|
| teams | id, sortOrder |
| students | id, name, teamId |
| timeLessons | id, date, recurringGroupId, *studentIds |
| choreoLessons | id, date, studentId, choreoId, levelId, recurringGroupId |
| choreographies | id, studentId, levelId, status |
| choreoLevels | id, sortOrder |
| timeLessonLevels | id, sortOrder |
| payments | id, studentId, month, date, lessonId, lessonType |

### 배포

- **Vercel**: https://schedule-pi-amber.vercel.app
- **GitHub**: https://github.com/worldoftoddl/Schedule (master 브랜치 push 시 자동 배포)