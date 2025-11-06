# Render PostgreSQL 데이터베이스 연결 설정

## 📋 연결 정보

### Internal Database URL (권장)
```
postgresql://memo_app_user:SsDLE0ABA2GgmbrzHgEcF21ZEVNNVC5p@dpg-d44oqqv5r7bs73b2kpk0-a/memo_app_ay5t
```

### 개별 환경 변수
```bash
DB_HOST=dpg-d44oqqv5r7bs73b2kpk0-a
DB_PORT=5432
DB_NAME=memo_app_ay5t
DB_USER=memo_app_user
DB_PASSWORD=SsDLE0ABA2GgmbrzHgEcF21ZEVNNVC5p
```

---

## 🚀 Render 배포 설정

### 방법 1: Render 환경 변수 설정

Render 대시보드에서:
1. **서비스** 선택
2. **Environment** 탭 클릭
3. 다음 환경 변수 추가:

```bash
DATABASE_URL=postgresql://memo_app_user:SsDLE0ABA2GgmbrzHgEcF21ZEVNNVC5p@dpg-d44oqqv5r7bs73b2kpk0-a/memo_app_ay5t
NODE_ENV=production
PORT=3000
```

### 방법 2: render.yaml 사용

프로젝트 루트의 `render.yaml` 파일이 자동으로 데이터베이스를 연결합니다.

---

## 🔧 로컬 테스트

로컬에서 Render 데이터베이스에 연결하려면:

1. **backend/.env 파일 생성** (이미 존재하면 수정):

```bash
DATABASE_URL=postgresql://memo_app_user:SsDLE0ABA2GgmbrzHgEcF21ZEVNNVC5p@dpg-d44oqqv5r7bs73b2kpk0-a.singapore-postgres.render.com/memo_app_ay5t
NODE_ENV=production
PORT=3000
```

**⚠️ 주의**: 로컬에서는 **External Database URL**을 사용해야 합니다:
```
postgresql://memo_app_user:SsDLE0ABA2GgmbrzHgEcF21ZEVNNVC5p@dpg-d44oqqv5r7bs73b2kpk0-a.singapore-postgres.render.com/memo_app_ay5t
```

2. **서버 실행**:
```bash
cd backend
npm start
```

---

## ✅ 연결 테스트

Render 데이터베이스 연결을 테스트하려면:

```bash
node backend/test-db-connection.js
```

또는 Render 전용 테스트:

```bash
# 환경 변수를 설정하고
export DATABASE_URL="postgresql://memo_app_user:SsDLE0ABA2GgmbrzHgEcF21ZEVNNVC5p@dpg-d44oqqv5r7bs73b2kpk0-a.singapore-postgres.render.com/memo_app_ay5t"

# 서버 시작
node backend/server.js
```

---

## 🔐 보안 주의사항

- ⚠️ **절대로 이 파일을 Git에 커밋하지 마세요!**
- `.gitignore`에 `RENDER_DATABASE_CONFIG.md` 추가 권장
- 비밀번호와 연결 정보는 환경 변수로만 관리
- 공개 저장소에 업로드 금지

---

## 📊 데이터베이스 정보

- **Provider**: Render PostgreSQL
- **Region**: Singapore
- **Database**: memo_app_ay5t
- **User**: memo_app_user
- **SSL**: Required (자동 적용됨)

---

## 🆘 문제 해결

### 연결 실패 시:

1. **SSL 오류**: Render는 SSL을 요구합니다. `database.js`에서 SSL 설정 확인
2. **타임아웃**: 방화벽이나 네트워크 문제일 수 있습니다
3. **인증 실패**: 비밀번호나 사용자명을 다시 확인

### 로그 확인:
```
✅ PostgreSQL 데이터베이스에 연결되었습니다.
✅ 메모 테이블이 준비되었습니다.
```

이 메시지가 보이면 성공입니다!

