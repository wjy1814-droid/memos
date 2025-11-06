const { Pool } = require('pg');
require('dotenv').config();

// 환경 변수 확인 로그
console.log('🔍 데이터베이스 환경 변수 확인:');
console.log('DATABASE_URL 존재:', !!process.env.DATABASE_URL);
console.log('DB_HOST:', process.env.DB_HOST || '설정되지 않음');
console.log('DB_NAME:', process.env.DB_NAME || '설정되지 않음');
console.log('DB_USER:', process.env.DB_USER || '설정되지 않음');
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '설정됨' : '설정되지 않음');

// PostgreSQL 연결 풀 생성
// DATABASE_URL 환경 변수가 있으면 우선 사용 (Render/클라우드 배포용)
const pool = process.env.DATABASE_URL 
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        // 클라우드 타입 내부 서비스(postgresql:5432)는 SSL 불필요, 
        // Render 등 외부 서비스는 SSL 사용
        ssl: process.env.DATABASE_URL.includes('postgresql:5432') ? false : {
            rejectUnauthorized: false
        }
    })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'memo_app',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
        // localhost가 아니고 내부 서비스가 아니면 SSL 사용
        ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost' && !process.env.DB_HOST.includes('postgresql') ? {
            rejectUnauthorized: false
        } : false
    });

// 연결 테스트
pool.on('connect', () => {
    console.log('✅ PostgreSQL 데이터베이스에 연결되었습니다.');
});

pool.on('error', (err) => {
    console.error('❌ 데이터베이스 연결 오류:', err);
    console.error('오류 상세:', err.message);
});

// 테이블 초기화 함수
const initializeDatabase = async () => {
    try {
        // 먼저 연결 테스트
        await pool.query('SELECT NOW()');
        console.log('✅ 데이터베이스 연결 테스트 성공!');
        
        const createTableQuery = `
            CREATE TABLE IF NOT EXISTS memos (
                id SERIAL PRIMARY KEY,
                content TEXT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `;
        
        await pool.query(createTableQuery);
        console.log('✅ 메모 테이블이 준비되었습니다.');
    } catch (error) {
        console.error('❌ 데이터베이스 초기화 오류:', error);
        console.error('오류 메시지:', error.message);
        console.error('오류 코드:', error.code);
        
        // 연결 실패 시 재시도 로직
        if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
            console.error('💡 해결 방법:');
            console.error('1. 클라우드 타입에서 PostgreSQL 데이터베이스가 실행 중인지 확인하세요.');
            console.error('2. 환경 변수가 올바르게 설정되었는지 확인하세요.');
            console.error('3. DATABASE_URL 또는 DB_HOST, DB_NAME 등이 설정되어 있어야 합니다.');
        }
    }
};

// 데이터베이스 초기화 실행
initializeDatabase();

module.exports = pool;

