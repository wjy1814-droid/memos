// Render PostgreSQL 간단 연결 테스트
const { Pool } = require('pg');

console.log('🔄 Render PostgreSQL 연결 테스트 시작...\n');

const pool = new Pool({
    connectionString: 'postgresql://memo_app_user:SsDLE0ABA2GgmbrzHgEcF21ZEVNNVC5p@dpg-d44oqqv5r7bs73b2kpk0-a.singapore-postgres.render.com/memo_app_ay5t',
    ssl: {
        rejectUnauthorized: false
    }
});

async function test() {
    try {
        console.log('📡 연결 시도 중...');
        const result = await pool.query('SELECT NOW(), version()');
        
        console.log('\n✅ 연결 성공!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('⏰ 서버 시간:', result.rows[0].now);
        console.log('📊 PostgreSQL 버전:', result.rows[0].version.split(',')[0]);
        
        // 테이블 확인
        const tables = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        
        console.log('\n📋 테이블 목록:');
        if (tables.rows.length === 0) {
            console.log('   (테이블 없음)');
        } else {
            tables.rows.forEach(t => console.log('   -', t.table_name));
        }
        
        // memos 테이블 확인
        const memosExists = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'memos'
            )
        `);
        
        if (memosExists.rows[0].exists) {
            const count = await pool.query('SELECT COUNT(*) FROM memos');
            console.log('\n📝 메모 개수:', count.rows[0].count, '개');
        } else {
            console.log('\n⚠️  memos 테이블이 없습니다. 생성 중...');
            await pool.query(`
                CREATE TABLE memos (
                    id SERIAL PRIMARY KEY,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            console.log('✅ memos 테이블 생성 완료!');
        }
        
        console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('🎉 Render PostgreSQL 정상 작동!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
        
    } catch (error) {
        console.error('\n❌ 연결 실패!');
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.error('오류:', error.message);
        console.error('코드:', error.code);
        
        if (error.code === 'ENOTFOUND') {
            console.error('\n💡 호스트를 찾을 수 없습니다. 인터넷 연결을 확인하세요.');
        } else if (error.code === '28P01') {
            console.error('\n💡 인증 실패. 비밀번호를 확인하세요.');
        }
        
        console.error('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
    } finally {
        await pool.end();
    }
}

test();

