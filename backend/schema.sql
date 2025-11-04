-- ========================================
-- 메모 공유 앱 데이터베이스 스키마
-- 사용자 인증 및 그룹 기능 추가
-- ========================================

-- 1. 사용자 테이블
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    username VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. 그룹 테이블
CREATE TABLE IF NOT EXISTS groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. 그룹 멤버십 테이블
CREATE TABLE IF NOT EXISTS group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(group_id, user_id)
);

-- 4. 메모 테이블 수정 (기존 테이블에 컬럼 추가)
-- 기존 memos 테이블이 있다면 컬럼 추가
DO $$ 
BEGIN
    -- group_id 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='memos' AND column_name='group_id') THEN
        ALTER TABLE memos ADD COLUMN group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE;
    END IF;
    
    -- user_id 컬럼 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='memos' AND column_name='user_id') THEN
        ALTER TABLE memos ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 5. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_memos_group_id ON memos(group_id);
CREATE INDEX IF NOT EXISTS idx_memos_user_id ON memos(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 6. 유용한 뷰 생성
CREATE OR REPLACE VIEW group_members_view AS
SELECT 
    gm.id,
    gm.group_id,
    g.name AS group_name,
    gm.user_id,
    u.username,
    u.email,
    gm.role,
    gm.joined_at
FROM group_members gm
JOIN groups g ON gm.group_id = g.id
JOIN users u ON gm.user_id = u.id;

-- 완료 메시지
SELECT 'Database schema created successfully!' AS status;

