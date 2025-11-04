# ☁️ 구름 메모장 - 메모 공유 앱

사용자 인증과 그룹 기능을 갖춘 실시간 메모 공유 애플리케이션입니다.

## ✨ 주요 기능

### 🔐 사용자 인증
- **회원가입/로그인**: JWT 기반 보안 인증
- **비밀번호 암호화**: bcrypt를 사용한 안전한 비밀번호 저장
- **세션 관리**: 자동 로그인 유지

### 👥 그룹 관리
- **그룹 생성**: 자신만의 메모 공유 그룹 만들기
- **멤버 관리**: 이메일로 멤버 초대 및 제거
- **역할 구분**: 그룹 소유자(owner), 관리자(admin), 멤버(member)
- **그룹 설정**: 그룹 이름 및 설명 수정
- **그룹 탈퇴**: 일반 멤버는 자유롭게 탈퇴 가능

### 📝 메모 기능
- **개인 메모**: 로그인 없이도 사용 가능한 개인 메모
- **그룹 메모**: 그룹 멤버만 볼 수 있는 공유 메모
- **실시간 작성**: 메모 작성 즉시 반영
- **메모 수정/삭제**: 작성한 메모 편집 가능
- **작성자 표시**: 그룹 메모에는 작성자 이름 표시
- **구름 디자인**: 아름다운 구름 모양의 메모 카드

### 🎨 UI/UX
- **반응형 디자인**: 모바일, 태블릿, 데스크톱 최적화
- **하늘 테마**: 편안한 하늘색 그라디언트 배경
- **부드러운 애니메이션**: 메모 추가/삭제 시 자연스러운 효과
- **직관적인 인터페이스**: 사용하기 쉬운 UI 디자인

## 🛠 기술 스택

### 백엔드
- **Node.js** + **Express.js**: 서버 프레임워크
- **PostgreSQL**: 데이터베이스
- **JWT**: 토큰 기반 인증
- **bcrypt**: 비밀번호 암호화
- **CORS**: 크로스 오리진 요청 처리

### 프론트엔드
- **Vanilla JavaScript**: 순수 자바스크립트
- **HTML5** + **CSS3**: 마크업 및 스타일링
- **Responsive Design**: 반응형 웹 디자인

## 📦 설치 및 실행

### 1. 사전 요구사항
- Node.js (v14 이상)
- PostgreSQL (v12 이상)
- npm 또는 yarn

### 2. 데이터베이스 설정

```bash
# PostgreSQL 접속
psql -U postgres

# 데이터베이스 생성
CREATE DATABASE memo_app;

# 접속 종료
\q
```

### 3. 프로젝트 설치

```bash
# 백엔드 디렉토리로 이동
cd backend

# 의존성 설치
npm install

# 환경 변수 설정
# backend/.env 파일을 생성하고 아래 내용 입력:
DB_HOST=localhost
DB_PORT=5432
DB_NAME=memo_app
DB_USER=postgres
DB_PASSWORD=your_password_here
PORT=3000
JWT_SECRET=your-secret-key-here

# 데이터베이스 스키마 생성
node migrate-schema.js
```

### 4. 서버 실행

```bash
# 개발 모드 (nodemon)
npm run dev

# 프로덕션 모드
npm start
```

서버가 실행되면 브라우저에서 `http://localhost:3000` 접속

## 📚 API 문서

### 인증 API

#### 회원가입
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "홍길동",
  "email": "hong@example.com",
  "password": "password123"
}
```

#### 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "hong@example.com",
  "password": "password123"
}
```

#### 현재 사용자 정보
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### 그룹 API

#### 내 그룹 목록
```http
GET /api/groups
Authorization: Bearer {token}
```

#### 그룹 생성
```http
POST /api/groups
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "팀 프로젝트",
  "description": "프로젝트 관련 메모"
}
```

#### 그룹 상세 정보
```http
GET /api/groups/:groupId
Authorization: Bearer {token}
```

#### 그룹 수정
```http
PUT /api/groups/:groupId
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "새 이름",
  "description": "새 설명"
}
```

#### 그룹 삭제
```http
DELETE /api/groups/:groupId
Authorization: Bearer {token}
```

#### 멤버 추가
```http
POST /api/groups/:groupId/members
Authorization: Bearer {token}
Content-Type: application/json

{
  "email": "member@example.com"
}
```

#### 멤버 제거
```http
DELETE /api/groups/:groupId/members/:userId
Authorization: Bearer {token}
```

#### 그룹 탈퇴
```http
POST /api/groups/:groupId/leave
Authorization: Bearer {token}
```

### 메모 API

#### 개인 메모 조회
```http
GET /api/memos
```

#### 그룹 메모 조회
```http
GET /api/memos/group/:groupId
Authorization: Bearer {token}
```

#### 메모 생성 (개인)
```http
POST /api/memos
Content-Type: application/json

{
  "content": "메모 내용"
}
```

#### 메모 생성 (그룹)
```http
POST /api/memos/group/:groupId
Authorization: Bearer {token}
Content-Type: application/json

{
  "content": "메모 내용"
}
```

#### 메모 수정
```http
PUT /api/memos/:id
Content-Type: application/json

{
  "content": "수정된 내용"
}
```

#### 메모 삭제
```http
DELETE /api/memos/:id
```

## 🗄 데이터베이스 구조

### users 테이블
- `id`: 사용자 고유 ID (PRIMARY KEY)
- `email`: 이메일 (UNIQUE)
- `password_hash`: 암호화된 비밀번호
- `username`: 사용자 이름
- `created_at`: 가입 일시
- `updated_at`: 수정 일시

### groups 테이블
- `id`: 그룹 고유 ID (PRIMARY KEY)
- `name`: 그룹 이름
- `description`: 그룹 설명
- `owner_id`: 소유자 ID (FOREIGN KEY → users.id)
- `created_at`: 생성 일시
- `updated_at`: 수정 일시

### group_members 테이블
- `id`: 멤버십 고유 ID (PRIMARY KEY)
- `group_id`: 그룹 ID (FOREIGN KEY → groups.id)
- `user_id`: 사용자 ID (FOREIGN KEY → users.id)
- `role`: 역할 (owner/admin/member)
- `joined_at`: 가입 일시

### memos 테이블
- `id`: 메모 고유 ID (PRIMARY KEY)
- `content`: 메모 내용
- `group_id`: 그룹 ID (FOREIGN KEY → groups.id, NULL 가능)
- `user_id`: 작성자 ID (FOREIGN KEY → users.id, NULL 가능)
- `created_at`: 작성 일시
- `updated_at`: 수정 일시

## 🚀 배포

### Render 배포

1. Render.com에 로그인
2. New → Web Service 선택
3. GitHub 저장소 연결
4. 환경 변수 설정:
   - `DATABASE_URL`: PostgreSQL 연결 URL
   - `JWT_SECRET`: JWT 비밀 키
5. 자동 배포 시작

자세한 내용은 `RENDER_DEPLOYMENT.md` 참조

## 📱 사용 방법

### 1. 회원가입/로그인
- 처음 방문 시 로그인 화면이 표시됩니다
- 회원가입 버튼을 클릭하여 계정을 만듭니다
- 이메일과 비밀번호로 로그인합니다

### 2. 개인 메모 작성
- 로그인 후 바로 개인 메모를 작성할 수 있습니다
- 메모 입력란에 내용을 입력하고 "메모 추가" 클릭
- Ctrl+Enter로 빠른 추가 가능

### 3. 그룹 만들기
- 상단의 "내 그룹" 버튼 클릭
- "새 그룹 만들기" 버튼 클릭
- 그룹 이름과 설명 입력

### 4. 멤버 초대
- 그룹을 선택하고 "그룹 관리" 버튼 클릭
- 멤버 관리 섹션에서 이메일 입력
- "멤버 추가" 버튼 클릭

### 5. 그룹 메모 작성
- 그룹 목록에서 원하는 그룹 선택
- 메모를 작성하면 해당 그룹의 모든 멤버가 볼 수 있습니다

## 🔒 보안

- **비밀번호 암호화**: bcrypt로 안전하게 해시화
- **JWT 토큰**: 7일 유효기간
- **SQL Injection 방지**: 파라미터화된 쿼리 사용
- **XSS 방지**: HTML 이스케이프 처리
- **CORS 설정**: 허용된 도메인만 접근 가능

## 🎯 향후 개발 계획

- [ ] 메모 검색 기능
- [ ] 메모 태그 기능
- [ ] 파일 첨부 기능
- [ ] 실시간 알림 (WebSocket)
- [ ] 메모 색상 커스터마이징
- [ ] 메모 정렬 옵션
- [ ] 다크 모드
- [ ] 소셜 로그인 (Google, GitHub)

## 📄 라이선스

MIT License

## 👤 개발자

**woo**
- Email: wjy1814@gmail.com
- GitHub: [https://github.com/woo](https://github.com/woo)

## 🙏 기여

이슈 및 풀 리퀘스트는 언제나 환영합니다!

---

Made with ❤️ and ☁️
