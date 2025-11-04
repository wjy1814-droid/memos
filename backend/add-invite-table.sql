-- 그룹 초대 링크 테이블 생성

CREATE TABLE IF NOT EXISTS group_invites (
    id SERIAL PRIMARY KEY,
    group_id INTEGER REFERENCES groups(id) ON DELETE CASCADE,
    invite_code VARCHAR(50) UNIQUE NOT NULL,
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP,
    max_uses INTEGER DEFAULT NULL,
    current_uses INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_group_invites_code ON group_invites(invite_code);
CREATE INDEX IF NOT EXISTS idx_group_invites_group_id ON group_invites(group_id);

-- 완료 메시지
SELECT '✅ group_invites 테이블이 생성되었습니다!' AS status;

