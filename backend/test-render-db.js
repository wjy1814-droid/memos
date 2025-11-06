// Render PostgreSQL 연결 테스트 스크립트
const { Pool } = require('pg');

// Render PostgreSQL 연결 정보 (External URL 사용)
const pool = new Pool({
    connectionString: 'postgresql://memo_app_user:SsDLE0ABA2GgmbrzHgEcF21ZEVNNVC5p@dpg-d44oqqv5r7bs73b2kpk0-a.singapore-postgres.render.com/memo_app_ay5t',
    ssl: {
        rejectUnauthorized: false
    }
});

async function testConnection() {
    console.log('╔════════════════════════════════════════════╗');
    console.log('║     Render PostgreSQL 연결 테스트          ║');
    console.log('╚════════════════════════════════════════════╝\n');
    
    console.log('📋 연결 정보:');
    console.log('   호스트: dpg-d44oqqv5r7bs73b2kpk0-a.singapore-postgres.render.com');
    console.log('   데이터베이스: memo_app_ay5t');
    console.log('   사용자: memo_app_user');
    console.log('   SSL: 활성화\n');

    try {
        // 1. 연결 테스트
        console.log('1️⃣  PostgreSQL 서버 연결 시도...');
        const client = await pool.connect();
        console.log('   ✅ Render PostgreSQL 서버 연결 성공!\n');

        // 2. 데이터베이스 버전 확인
        console.log('2️⃣  PostgreSQL 버전 확인...');
        const versionResult = await client.query('SELECT version()');
        console.log('   ✅ 버전:', versionResult.rows[0].version.split(',')[0], '\n');

        // 3. 현재 시간 확인
        console.log('3️⃣  서버 시간 확인...');
        const timeResult = await client.query('SELECT NOW()');
        console.log('   ✅ 서버 시간:', timeResult.rows[0].now, '\n');

        // 4. 데이터베이스 정보 확인
        console.log('4️⃣  데이터베이스 정보 확인...');
        const dbResult = await client.query('SELECT current_database(), current_user');
        console.log('   ✅ 데이터베이스:', dbResult.rows[0].current_database);
        console.log('   ✅ 사용자:', dbResult.rows[0].current_user, '\n');

        // 5. 테이블 존재 여부 확인
        console.log('5️⃣  memos 테이블 존재 여부 확인...');
        const tableResult = await client.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_schema = 'public'
                AND table_name = 'memos'
            );
        `);
        
        if (tableResult.rows[0].exists) {
            console.log('   ✅ memos 테이블이 존재합니다.\n');
            
            // 6. 테이블 구조 확인
            console.log('6️⃣  memos 테이블 구조 확인...');
            const columnsResult = await client.query(`
                SELECT column_name, data_type, character_maximum_length
                FROM information_schema.columns
                WHERE table_name = 'memos'
                ORDER BY ordinal_position;
            `);
            console.log('   ✅ 테이블 컬럼:');
            columnsResult.rows.forEach(col => {
                const length = col.character_maximum_length ? `(${col.character_maximum_length})` : '';
                console.log(`      - ${col.column_name}: ${col.data_type}${length}`);
            });
            console.log();
            
            // 7. 데이터 개수 확인
            console.log('7️⃣  저장된 메모 개수 확인...');
            const countResult = await client.query('SELECT COUNT(*) FROM memos');
            console.log(`   ✅ 현재 저장된 메모: ${countResult.rows[0].count}개\n`);
            
            // 8. 최근 메모 확인 (있다면)
            if (parseInt(countResult.rows[0].count) > 0) {
                console.log('8️⃣  최근 메모 확인 (최대 3개)...');
                const memosResult = await client.query(`
                    SELECT id, LEFT(content, 50) as content, created_at
                    FROM memos
                    ORDER BY created_at DESC
                    LIMIT 3;
                `);
                console.log('   ✅ 최근 메모:');
                memosResult.rows.forEach(memo => {
                    const preview = memo.content.length > 50 ? memo.content + '...' : memo.content;
                    console.log(`      [${memo.id}] ${preview}`);
                    console.log(`          작성: ${new Date(memo.created_at).toLocaleString('ko-KR')}`);
                });
                console.log();
            }
        } else {
            console.log('   ⚠️  memos 테이블이 존재하지 않습니다.');
            console.log('   💡 테이블을 생성합니다...\n');
            
            // 테이블 생성
            console.log('6️⃣  memos 테이블 생성...');
            await client.query(`
                CREATE TABLE IF NOT EXISTS memos (
                    id SERIAL PRIMARY KEY,
                    content TEXT NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('   ✅ memos 테이블이 생성되었습니다!\n');
        }

        // 9. 테스트 메모 작성 및 삭제
        console.log('9️⃣  데이터베이스 쓰기 테스트...');
        const testContent = `Render 테스트 메모 - ${new Date().toISOString()}`;
        const insertResult = await client.query(
            'INSERT INTO memos (content) VALUES ($1) RETURNING id, content, created_at',
            [testContent]
        );
        console.log('   ✅ 테스트 메모 작성 성공!');
        console.log(`      ID: ${insertResult.rows[0].id}`);
        console.log(`      내용: ${insertResult.rows[0].content}\n`);
        
        console.log('🔟  테스트 메모 삭제...');
        await client.query('DELETE FROM memos WHERE id = $1', [insertResult.rows[0].id]);
        console.log('   ✅ 테스트 메모 삭제 완료!\n');

        client.release();
        
        console.log('╔════════════════════════════════════════════╗');
        console.log('║          🎉 모든 테스트 통과! 🎉          ║');
        console.log('╠════════════════════════════════════════════╣');
        console.log('║  Render PostgreSQL이 정상 작동 중입니다   ║');
        console.log('║  메모 앱을 사용할 준비가 완료되었습니다!  ║');
        console.log('╚════════════════════════════════════════════╝');
        
        process.exit(0);
    } catch (error) {
        console.error('\n╔════════════════════════════════════════════╗');
        console.error('║              ❌ 오류 발생!                ║');
        console.error('╚════════════════════════════════════════════╝\n');
        console.error('🔴 오류 코드:', error.code);
        console.error('🔴 오류 메시지:', error.message);
        
        console.log('\n💡 해결 방법:');
        if (error.code === 'ECONNREFUSED') {
            console.log('   ❌ 데이터베이스 서버에 연결할 수 없습니다.');
            console.log('   ✅ Render에서 PostgreSQL 서비스가 실행 중인지 확인하세요.');
            console.log('   ✅ 네트워크 연결을 확인하세요.');
        } else if (error.code === '28P01') {
            console.log('   ❌ 인증(비밀번호)이 실패했습니다.');
            console.log('   ✅ Render의 PostgreSQL 비밀번호를 다시 확인하세요.');
        } else if (error.code === '3D000') {
            console.log('   ❌ 데이터베이스가 존재하지 않습니다.');
            console.log('   ✅ 데이터베이스 이름을 확인하세요.');
        } else if (error.message && error.message.includes('SSL')) {
            console.log('   ❌ SSL 연결 문제입니다.');
            console.log('   ✅ SSL 설정을 확인하세요.');
        } else if (error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
            console.log('   ❌ 호스트를 찾을 수 없거나 연결 시간이 초과되었습니다.');
            console.log('   ✅ 호스트 주소를 확인하세요.');
            console.log('   ✅ 인터넷 연결을 확인하세요.');
        } else {
            console.log('   ❌ 예상치 못한 오류입니다.');
            console.log('   ✅ 연결 정보를 다시 확인하세요.');
        }
        console.log('\n📋 상세 오류:');
        console.error(error);
        
        process.exit(1);
    } finally {
        await pool.end();
    }
}

console.log('\n💻 Render PostgreSQL 데이터베이스 연결을 테스트합니다...\n');
testConnection();

