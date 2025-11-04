// 초대 링크 데이터 확인
const { Pool } = require('pg');
require('dotenv').config();

const pool = process.env.DATABASE_URL 
    ? new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    })
    : new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 5432,
        database: process.env.DB_NAME || 'memo_app',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || '',
    });

async function checkInvites() {
    console.log('===== 초대 링크 데이터 확인 =====\n');
    
    try {
        const client = await pool.connect();
        
        // 초대 링크 목록
        const invites = await client.query(`
            SELECT 
                gi.id,
                gi.invite_code,
                g.name AS group_name,
                u.username AS created_by,
                gi.expires_at,
                gi.max_uses,
                gi.current_uses,
                gi.is_active,
                gi.created_at
            FROM group_invites gi
            JOIN groups g ON gi.group_id = g.id
            JOIN users u ON gi.created_by = u.id
            ORDER BY gi.created_at DESC
        `);
        
        console.log(`🔗 초대 링크 수: ${invites.rows.length}개\n`);
        
        invites.rows.forEach((invite, index) => {
            console.log(`${index + 1}. 초대 링크`);
            console.log(`   📝 그룹: ${invite.group_name}`);
            console.log(`   🔑 코드: ${invite.invite_code}`);
            console.log(`   👤 생성자: ${invite.created_by}`);
            console.log(`   📊 사용: ${invite.current_uses}/${invite.max_uses || '무제한'}`);
            console.log(`   ⏰ 만료: ${new Date(invite.expires_at).toLocaleString('ko-KR')}`);
            console.log(`   ✅ 활성: ${invite.is_active ? '예' : '아니오'}`);
            console.log(`   🔗 URL: http://localhost:3000/invite/${invite.invite_code}`);
            console.log();
        });
        
        client.release();
        
        console.log('====================================');
        console.log('✅ 초대 링크 데이터 확인 완료!');
        console.log('====================================');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ 오류:', error.message);
        process.exit(1);
    }
}

checkInvites();

