// 모든 테이블 확인 스크립트
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

async function checkAllTables() {
    console.log('===== 전체 테이블 확인 =====\n');
    
    try {
        const client = await pool.connect();
        console.log('✅ 데이터베이스 연결 성공!\n');
        
        // 1. 모든 테이블 목록
        console.log('📋 생성된 테이블 목록:');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        
        const tableNames = tablesResult.rows.map(row => row.table_name);
        tableNames.forEach(name => {
            console.log(`  ✓ ${name}`);
        });
        console.log();
        
        // 2. users 테이블
        if (tableNames.includes('users')) {
            const usersCount = await client.query('SELECT COUNT(*) FROM users');
            console.log('👤 users 테이블:');
            console.log(`   - 사용자 수: ${usersCount.rows[0].count}명`);
            
            const usersColumns = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'users' 
                ORDER BY ordinal_position;
            `);
            console.log('   - 컬럼:', usersColumns.rows.map(c => c.column_name).join(', '));
            console.log();
        }
        
        // 3. groups 테이블
        if (tableNames.includes('groups')) {
            const groupsCount = await client.query('SELECT COUNT(*) FROM groups');
            console.log('👥 groups 테이블:');
            console.log(`   - 그룹 수: ${groupsCount.rows[0].count}개`);
            
            const groupsColumns = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'groups' 
                ORDER BY ordinal_position;
            `);
            console.log('   - 컬럼:', groupsColumns.rows.map(c => c.column_name).join(', '));
            console.log();
        }
        
        // 4. group_members 테이블
        if (tableNames.includes('group_members')) {
            const membersCount = await client.query('SELECT COUNT(*) FROM group_members');
            console.log('🤝 group_members 테이블:');
            console.log(`   - 멤버십 수: ${membersCount.rows[0].count}개`);
            
            const membersColumns = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'group_members' 
                ORDER BY ordinal_position;
            `);
            console.log('   - 컬럼:', membersColumns.rows.map(c => c.column_name).join(', '));
            console.log();
        }
        
        // 5. memos 테이블
        if (tableNames.includes('memos')) {
            const memosCount = await client.query('SELECT COUNT(*) FROM memos');
            const personalMemosCount = await client.query('SELECT COUNT(*) FROM memos WHERE group_id IS NULL');
            const groupMemosCount = await client.query('SELECT COUNT(*) FROM memos WHERE group_id IS NOT NULL');
            
            console.log('📝 memos 테이블:');
            console.log(`   - 전체 메모: ${memosCount.rows[0].count}개`);
            console.log(`   - 개인 메모: ${personalMemosCount.rows[0].count}개`);
            console.log(`   - 그룹 메모: ${groupMemosCount.rows[0].count}개`);
            
            const memosColumns = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'memos' 
                ORDER BY ordinal_position;
            `);
            console.log('   - 컬럼:', memosColumns.rows.map(c => c.column_name).join(', '));
            console.log();
        }
        
        // 6. 외래 키 관계 확인
        console.log('🔗 외래 키 관계:');
        const foreignKeys = await client.query(`
            SELECT
                tc.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table_name,
                ccu.column_name AS foreign_column_name 
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
                ON tc.constraint_name = kcu.constraint_name
                AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
                ON ccu.constraint_name = tc.constraint_name
                AND ccu.table_schema = tc.table_schema
            WHERE tc.constraint_type = 'FOREIGN KEY'
            ORDER BY tc.table_name, kcu.column_name;
        `);
        
        foreignKeys.rows.forEach(fk => {
            console.log(`   ✓ ${fk.table_name}.${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`);
        });
        console.log();
        
        client.release();
        
        console.log('====================================');
        console.log('🎉 데이터베이스 구조 확인 완료!');
        console.log('====================================');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 오류 발생:', error.message);
        console.error(error);
        process.exit(1);
    }
}

checkAllTables();

