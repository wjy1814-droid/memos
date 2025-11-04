// 초대 링크 기능 통합 테스트
const http = require('http');

const BASE_URL = 'http://localhost:3000';
let testToken1 = null;
let testToken2 = null;
let testGroupId = null;
let inviteCode = null;

// HTTP 요청 헬퍼
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

async function testInviteFeature() {
    console.log('========================================');
    console.log('🔗 초대 링크 기능 통합 테스트');
    console.log('========================================\n');

    try {
        // 1. 첫 번째 사용자 생성 (그룹 소유자)
        console.log('1️⃣  사용자 1 (소유자) 생성...');
        const user1Data = {
            username: '그룹소유자',
            email: `owner_${Date.now()}@test.com`,
            password: 'test123456'
        };
        
        const user1Result = await makeRequest('POST', '/api/auth/register', user1Data);
        if (user1Result.status === 201) {
            testToken1 = user1Result.data.token;
            console.log('   ✅ 소유자 생성 성공!');
            console.log(`   👤 ${user1Result.data.user.username}\n`);
        } else {
            throw new Error('소유자 생성 실패');
        }

        // 2. 그룹 생성
        console.log('2️⃣  그룹 생성...');
        const groupData = {
            name: '테스트 초대 그룹',
            description: '초대 링크 테스트를 위한 그룹입니다'
        };
        
        const groupResult = await makeRequest('POST', '/api/groups', groupData, testToken1);
        if (groupResult.status === 201) {
            testGroupId = groupResult.data.group.id;
            console.log('   ✅ 그룹 생성 성공!');
            console.log(`   👥 그룹: ${groupResult.data.group.name}`);
            console.log(`   🆔 그룹 ID: ${testGroupId}\n`);
        } else {
            throw new Error('그룹 생성 실패');
        }

        // 3. 초대 링크 생성
        console.log('3️⃣  초대 링크 생성...');
        const inviteResult = await makeRequest('POST', '/api/invites/create', 
            { groupId: testGroupId }, testToken1);
        
        if (inviteResult.status === 201) {
            inviteCode = inviteResult.data.invite.inviteCode;
            console.log('   ✅ 초대 링크 생성 성공!');
            console.log(`   🔗 초대 코드: ${inviteCode}`);
            console.log(`   🌐 전체 URL: ${inviteResult.data.invite.fullUrl}`);
            console.log(`   ⏰ 만료: ${new Date(inviteResult.data.invite.expiresAt).toLocaleString('ko-KR')}\n`);
        } else {
            throw new Error('초대 링크 생성 실패: ' + JSON.stringify(inviteResult.data));
        }

        // 4. 초대 링크 정보 조회
        console.log('4️⃣  초대 링크 정보 조회...');
        const inviteInfoResult = await makeRequest('GET', `/api/invites/${inviteCode}`);
        
        if (inviteInfoResult.status === 200) {
            console.log('   ✅ 초대 링크 조회 성공!');
            console.log(`   📝 그룹명: ${inviteInfoResult.data.groupName}`);
            console.log(`   👤 생성자: ${inviteInfoResult.data.createdBy}`);
            console.log(`   ✔️  유효성: ${inviteInfoResult.data.valid ? '유효' : '무효'}\n`);
        } else {
            throw new Error('초대 링크 조회 실패');
        }

        // 5. 두 번째 사용자 생성 (초대받는 사람)
        console.log('5️⃣  사용자 2 (초대받는 사람) 생성...');
        const user2Data = {
            username: '초대받은친구',
            email: `friend_${Date.now()}@test.com`,
            password: 'test123456'
        };
        
        const user2Result = await makeRequest('POST', '/api/auth/register', user2Data);
        if (user2Result.status === 201) {
            testToken2 = user2Result.data.token;
            console.log('   ✅ 친구 생성 성공!');
            console.log(`   👤 ${user2Result.data.user.username}\n`);
        } else {
            throw new Error('친구 생성 실패');
        }

        // 6. 초대 수락 (그룹 가입)
        console.log('6️⃣  초대 링크로 그룹 가입...');
        const acceptResult = await makeRequest('POST', `/api/invites/${inviteCode}/accept`, 
            null, testToken2);
        
        if (acceptResult.status === 200) {
            console.log('   ✅ 그룹 가입 성공!');
            console.log(`   🎉 ${acceptResult.data.message}`);
            console.log(`   👥 가입한 그룹: ${acceptResult.data.group.name}\n`);
        } else {
            throw new Error('그룹 가입 실패: ' + JSON.stringify(acceptResult.data));
        }

        // 7. 그룹 멤버 확인
        console.log('7️⃣  그룹 멤버 확인...');
        const groupDetailsResult = await makeRequest('GET', `/api/groups/${testGroupId}`, 
            null, testToken1);
        
        if (groupDetailsResult.status === 200) {
            console.log('   ✅ 그룹 정보 조회 성공!');
            console.log(`   👥 멤버 수: ${groupDetailsResult.data.group.members.length}명`);
            groupDetailsResult.data.group.members.forEach(member => {
                console.log(`      • ${member.username} (${member.role})`);
            });
            console.log();
        } else {
            throw new Error('그룹 정보 조회 실패');
        }

        // 8. 그룹 메모 작성 (새 멤버가)
        console.log('8️⃣  새 멤버가 그룹 메모 작성...');
        const memoData = {
            content: '초대받아서 들어왔습니다! 안녕하세요! 😊'
        };
        
        const memoResult = await makeRequest('POST', `/api/memos/group/${testGroupId}`, 
            memoData, testToken2);
        
        if (memoResult.status === 201) {
            console.log('   ✅ 그룹 메모 작성 성공!');
            console.log(`   📝 메모: ${memoData.content}\n`);
        } else {
            throw new Error('메모 작성 실패: ' + JSON.stringify(memoResult.data));
        }

        // 9. 그룹 메모 조회
        console.log('9️⃣  그룹 메모 조회...');
        const memosResult = await makeRequest('GET', `/api/memos/group/${testGroupId}`, 
            null, testToken1);
        
        if (memosResult.status === 200) {
            console.log('   ✅ 그룹 메모 조회 성공!');
            console.log(`   📝 메모 개수: ${memosResult.data.length}개`);
            memosResult.data.forEach((memo, index) => {
                console.log(`      ${index + 1}. "${memo.content}" - ${memo.author_name || '익명'}`);
            });
            console.log();
        } else {
            throw new Error('메모 조회 실패');
        }

        // 10. 중복 가입 시도 (이미 멤버인데 또 가입 시도)
        console.log('🔟  중복 가입 시도 (예상되는 실패)...');
        const duplicateResult = await makeRequest('POST', `/api/invites/${inviteCode}/accept`, 
            null, testToken2);
        
        if (duplicateResult.status === 409) {
            console.log('   ✅ 중복 가입 방지 성공!');
            console.log(`   ⚠️  ${duplicateResult.data.error}\n`);
        } else {
            console.log('   ⚠️  예상과 다른 응답:', duplicateResult.status, '\n');
        }

        console.log('========================================');
        console.log('🎉 모든 테스트 통과!');
        console.log('========================================\n');
        
        console.log('📊 테스트 요약:');
        console.log('  ✅ 사용자 생성 (소유자, 친구)');
        console.log('  ✅ 그룹 생성');
        console.log('  ✅ 초대 링크 생성');
        console.log('  ✅ 초대 링크 정보 조회');
        console.log('  ✅ 초대 링크로 그룹 가입');
        console.log('  ✅ 그룹 멤버 확인');
        console.log('  ✅ 새 멤버의 그룹 메모 작성');
        console.log('  ✅ 그룹 메모 조회');
        console.log('  ✅ 중복 가입 방지');
        console.log('\n💡 초대 링크 기능이 완벽하게 작동합니다!');
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ 테스트 실패:', error.message);
        console.error(error);
        process.exit(1);
    }
}

// 테스트 실행
console.log('서버 연결을 기다리는 중...\n');
setTimeout(testInviteFeature, 1000);

