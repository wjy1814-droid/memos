// API 테스트 스크립트
const http = require('http');

const BASE_URL = 'http://localhost:3000';

// HTTP 요청 헬퍼 함수
function makeRequest(method, path, data = null, token = null) {
    return new Promise((resolve, reject) => {
        const url = new URL(path, BASE_URL);
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            }
        };

        if (token) {
            options.headers['Authorization'] = `Bearer ${token}`;
        }

        const req = http.request(url, options, (res) => {
            let body = '';
            res.on('data', (chunk) => body += chunk);
            res.on('end', () => {
                try {
                    const result = {
                        status: res.statusCode,
                        data: body ? JSON.parse(body) : null
                    };
                    resolve(result);
                } catch (e) {
                    resolve({
                        status: res.statusCode,
                        data: body,
                        error: 'JSON 파싱 실패'
                    });
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

async function testAPI() {
    console.log('===== API 테스트 시작 =====\n');

    try {
        // 1. 서버 연결 테스트
        console.log('1️⃣  서버 연결 테스트...');
        const healthCheck = await makeRequest('GET', '/api/memos');
        if (healthCheck.status === 200) {
            console.log('   ✅ 서버 연결 성공!');
            console.log(`   📝 개인 메모 개수: ${healthCheck.data.length}개\n`);
        } else {
            console.log('   ❌ 서버 연결 실패:', healthCheck.status, '\n');
        }

        // 2. 회원가입 테스트
        console.log('2️⃣  회원가입 테스트...');
        const testUser = {
            username: '테스트유저',
            email: 'test@example.com',
            password: 'test123456'
        };
        
        const registerResult = await makeRequest('POST', '/api/auth/register', testUser);
        if (registerResult.status === 201) {
            console.log('   ✅ 회원가입 성공!');
            console.log(`   👤 사용자: ${registerResult.data.user.username}`);
            console.log(`   📧 이메일: ${registerResult.data.user.email}`);
            console.log(`   🔑 토큰: ${registerResult.data.token.substring(0, 20)}...\n`);
            
            const token = registerResult.data.token;
            
            // 3. 로그인 테스트
            console.log('3️⃣  로그인 테스트...');
            const loginResult = await makeRequest('POST', '/api/auth/login', {
                email: testUser.email,
                password: testUser.password
            });
            
            if (loginResult.status === 200) {
                console.log('   ✅ 로그인 성공!\n');
            } else {
                console.log('   ❌ 로그인 실패:', loginResult.status, '\n');
            }
            
            // 4. 현재 사용자 정보 조회
            console.log('4️⃣  사용자 정보 조회...');
            const meResult = await makeRequest('GET', '/api/auth/me', null, token);
            if (meResult.status === 200) {
                console.log('   ✅ 사용자 정보 조회 성공!\n');
            } else {
                console.log('   ❌ 사용자 정보 조회 실패:', meResult.status, '\n');
            }
            
            // 5. 그룹 생성 테스트
            console.log('5️⃣  그룹 생성 테스트...');
            const groupData = {
                name: '테스트 그룹',
                description: 'API 테스트용 그룹입니다'
            };
            
            const createGroupResult = await makeRequest('POST', '/api/groups', groupData, token);
            if (createGroupResult.status === 201) {
                console.log('   ✅ 그룹 생성 성공!');
                console.log(`   👥 그룹: ${createGroupResult.data.group.name}`);
                console.log(`   📝 설명: ${createGroupResult.data.group.description}\n`);
                
                const groupId = createGroupResult.data.group.id;
                
                // 6. 그룹 목록 조회
                console.log('6️⃣  그룹 목록 조회...');
                const groupsResult = await makeRequest('GET', '/api/groups', null, token);
                if (groupsResult.status === 200) {
                    console.log('   ✅ 그룹 목록 조회 성공!');
                    console.log(`   📊 내 그룹 수: ${groupsResult.data.groups.length}개\n`);
                } else {
                    console.log('   ❌ 그룹 목록 조회 실패:', groupsResult.status, '\n');
                }
                
                // 7. 그룹 메모 작성
                console.log('7️⃣  그룹 메모 작성...');
                const memoData = {
                    content: '이것은 그룹 메모 테스트입니다!'
                };
                
                const createMemoResult = await makeRequest('POST', `/api/memos/group/${groupId}`, memoData, token);
                if (createMemoResult.status === 201) {
                    console.log('   ✅ 그룹 메모 작성 성공!\n');
                } else {
                    console.log('   ❌ 그룹 메모 작성 실패:', createMemoResult.status, '\n');
                }
                
                // 8. 그룹 메모 조회
                console.log('8️⃣  그룹 메모 조회...');
                const groupMemosResult = await makeRequest('GET', `/api/memos/group/${groupId}`, null, token);
                if (groupMemosResult.status === 200) {
                    console.log('   ✅ 그룹 메모 조회 성공!');
                    console.log(`   📝 그룹 메모 수: ${groupMemosResult.data.length}개\n`);
                } else {
                    console.log('   ❌ 그룹 메모 조회 실패:', groupMemosResult.status, '\n');
                }
            } else {
                console.log('   ❌ 그룹 생성 실패:', createGroupResult.status, '\n');
            }
            
        } else if (registerResult.status === 409) {
            console.log('   ℹ️  이미 존재하는 사용자입니다. (이전 테스트 데이터)\n');
            
            // 기존 사용자로 로그인
            console.log('3️⃣  기존 사용자 로그인 테스트...');
            const loginResult = await makeRequest('POST', '/api/auth/login', {
                email: testUser.email,
                password: testUser.password
            });
            
            if (loginResult.status === 200) {
                console.log('   ✅ 로그인 성공!\n');
                const token = loginResult.data.token;
                
                // 그룹 목록 조회
                console.log('6️⃣  그룹 목록 조회...');
                const groupsResult = await makeRequest('GET', '/api/groups', null, token);
                if (groupsResult.status === 200) {
                    console.log('   ✅ 그룹 목록 조회 성공!');
                    console.log(`   📊 내 그룹 수: ${groupsResult.data.groups.length}개\n`);
                } else {
                    console.log('   ❌ 그룹 목록 조회 실패:', groupsResult.status, '\n');
                }
            }
        } else {
            console.log('   ❌ 회원가입 실패:', registerResult.status);
            console.log('   오류:', registerResult.data, '\n');
        }

        console.log('====================================');
        console.log('🎉 API 테스트 완료!');
        console.log('====================================');
        
    } catch (error) {
        console.error('\n❌ 테스트 중 오류 발생:', error.message);
    }
    
    process.exit(0);
}

// 테스트 실행
testAPI();

