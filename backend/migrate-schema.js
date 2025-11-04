// 데이터베이스 스키마 마이그레이션 스크립트
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// PostgreSQL 연결
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

async function migrateSchema() {
    console.log('===== 데이터베이스 스키마 마이그레이션 =====\n');
    
    try {
        const client = await pool.connect();
        console.log('✅ 데이터베이스 연결 성공!\n');
        
        // schema.sql 파일 읽기
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
        
        console.log('📋 스키마 적용 중...\n');
        
        // SQL 실행
        await client.query(schemaSQL);
        
        console.log('✅ 스키마 적용 완료!\n');
        
        // 테이블 확인
        console.log('📊 생성된 테이블 확인:\n');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        
        console.log('테이블 목록:');
        tablesResult.rows.forEach(row => {
            console.log(`  ✓ ${row.table_name}`);
        });
        
        client.release();
        
        console.log('\n====================================');
        console.log('🎉 마이그레이션 완료!');
        console.log('====================================');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 마이그레이션 실패:', error.message);
        console.error(error);
        process.exit(1);
    }
}

migrateSchema();

