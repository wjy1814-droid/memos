// 초대 테이블 생성 스크립트
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
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

async function createInviteTable() {
    console.log('===== 초대 테이블 생성 =====\n');
    
    try {
        const client = await pool.connect();
        console.log('✅ 데이터베이스 연결 성공!\n');
        
        // SQL 파일 읽기
        const sqlPath = path.join(__dirname, 'add-invite-table.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📋 초대 테이블 생성 중...\n');
        
        // SQL 실행
        await client.query(sql);
        
        console.log('✅ 초대 테이블 생성 완료!\n');
        
        // 테이블 확인
        const result = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'group_invites' 
            ORDER BY ordinal_position;
        `);
        
        console.log('📊 생성된 컬럼:');
        result.rows.forEach(col => {
            console.log(`   ✓ ${col.column_name} (${col.data_type})`);
        });
        
        client.release();
        
        console.log('\n====================================');
        console.log('🎉 초대 테이블 생성 완료!');
        console.log('====================================');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 오류 발생:', error.message);
        console.error(error);
        process.exit(1);
    }
}

createInviteTable();

