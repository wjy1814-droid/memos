-- 데이터베이스 생성 (이미 존재할 수 있음)
CREATE DATABASE memo_app;

-- memo_app 데이터베이스 연결
\c memo_app

-- memos 테이블 생성
CREATE TABLE IF NOT EXISTS memos (
    id SERIAL PRIMARY KEY,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 테이블 확인
\dt

