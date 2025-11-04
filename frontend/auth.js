// 인증 관리 스크립트

// API 기본 URL 설정
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : '/api';
}

// 토큰 저장/조회/삭제
function saveToken(token) {
    localStorage.setItem('authToken', token);
}

function getToken() {
    return localStorage.getItem('authToken');
}

function removeToken() {
    localStorage.removeItem('authToken');
}

function saveUser(user) {
    localStorage.setItem('currentUser', JSON.stringify(user));
}

function getUser() {
    const userData = localStorage.getItem('currentUser');
    return userData ? JSON.parse(userData) : null;
}

function removeUser() {
    localStorage.removeItem('currentUser');
}

// 인증된 요청을 위한 헤더
function getAuthHeaders() {
    const token = getToken();
    return {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
    };
}

// 로그인 상태 확인
function isLoggedIn() {
    return !!getToken();
}

// 화면 전환
function showAuthScreen() {
    document.getElementById('authScreen').style.display = 'flex';
    document.getElementById('appScreen').style.display = 'none';
}

function showAppScreen() {
    document.getElementById('authScreen').style.display = 'none';
    document.getElementById('appScreen').style.display = 'block';
    
    // 사용자 정보 표시
    const user = getUser();
    if (user) {
        document.getElementById('currentUser').textContent = user.username;
    }
    
    // 메모 로드
    if (typeof loadMemos === 'function') {
        loadMemos();
    }
    
    // 그룹 로드
    if (typeof loadGroups === 'function') {
        loadGroups();
    }
    
    // 저장된 초대 링크 확인
    const pendingInvite = sessionStorage.getItem('pendingInvite');
    if (pendingInvite) {
        sessionStorage.removeItem('pendingInvite');
        // 약간의 지연 후 처리 (DOM이 준비될 때까지)
        setTimeout(() => {
            window.history.pushState({}, '', `/invite/${pendingInvite}`);
            handleInviteLink();
        }, 500);
    }
}

// 회원가입
async function register(username, email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '회원가입에 실패했습니다.');
        }
        
        saveToken(data.token);
        saveUser(data.user);
        
        return data;
    } catch (error) {
        throw error;
    }
}

// 로그인
async function login(email, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '로그인에 실패했습니다.');
        }
        
        saveToken(data.token);
        saveUser(data.user);
        
        return data;
    } catch (error) {
        throw error;
    }
}

// 로그아웃
function logout() {
    removeToken();
    removeUser();
    showAuthScreen();
}

// 초대 링크 처리
async function handleInviteLink() {
    const path = window.location.pathname;
    const inviteMatch = path.match(/\/invite\/([a-f0-9]+)/);
    
    if (inviteMatch) {
        const inviteCode = inviteMatch[1];
        
        // 로그인되어 있는지 확인
        if (!isLoggedIn()) {
            // 로그인 필요 메시지
            alert('초대 링크를 사용하려면 먼저 로그인해주세요.');
            // 초대 코드를 세션에 저장
            sessionStorage.setItem('pendingInvite', inviteCode);
            showAuthScreen();
            return;
        }
        
        try {
            // 초대 정보 조회
            const inviteInfo = await getInviteInfo(inviteCode);
            
            if (confirm(`"${inviteInfo.groupName}" 그룹에 가입하시겠습니까?\n\n${inviteInfo.groupDescription || ''}`)) {
                const result = await acceptInvite(inviteCode);
                alert(`${result.group.name} 그룹에 가입되었습니다! 🎉`);
                
                // 그룹 목록 새로고침
                if (typeof loadGroups === 'function') {
                    await loadGroups();
                }
                
                // 초대 링크 제거하고 홈으로
                window.history.pushState({}, '', '/');
            } else {
                // 취소한 경우 홈으로
                window.history.pushState({}, '', '/');
            }
        } catch (error) {
            alert(error.message);
            window.history.pushState({}, '', '/');
        }
    }
}

// DOM 로드 후 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    // 초기 화면 설정
    if (isLoggedIn()) {
        showAppScreen();
        // 초대 링크 확인
        handleInviteLink();
    } else {
        showAuthScreen();
    }
    
    // 로그인 폼
    const loginBtn = document.getElementById('loginBtn');
    if (loginBtn) {
        loginBtn.addEventListener('click', async () => {
            const email = document.getElementById('loginEmail').value.trim();
            const password = document.getElementById('loginPassword').value;
            
            if (!email || !password) {
                alert('이메일과 비밀번호를 입력해주세요.');
                return;
            }
            
            try {
                loginBtn.disabled = true;
                loginBtn.textContent = '로그인 중...';
                
                await login(email, password);
                showAppScreen();
                
                // 입력 필드 초기화
                document.getElementById('loginEmail').value = '';
                document.getElementById('loginPassword').value = '';
            } catch (error) {
                alert(error.message);
            } finally {
                loginBtn.disabled = false;
                loginBtn.textContent = '로그인';
            }
        });
    }
    
    // 엔터키로 로그인
    const loginPassword = document.getElementById('loginPassword');
    if (loginPassword) {
        loginPassword.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                loginBtn.click();
            }
        });
    }
    
    // 회원가입 폼
    const registerBtn = document.getElementById('registerBtn');
    if (registerBtn) {
        registerBtn.addEventListener('click', async () => {
            const username = document.getElementById('registerUsername').value.trim();
            const email = document.getElementById('registerEmail').value.trim();
            const password = document.getElementById('registerPassword').value;
            const passwordConfirm = document.getElementById('registerPasswordConfirm').value;
            
            if (!username || !email || !password || !passwordConfirm) {
                alert('모든 필드를 입력해주세요.');
                return;
            }
            
            if (password !== passwordConfirm) {
                alert('비밀번호가 일치하지 않습니다.');
                return;
            }
            
            if (password.length < 6) {
                alert('비밀번호는 최소 6자 이상이어야 합니다.');
                return;
            }
            
            try {
                registerBtn.disabled = true;
                registerBtn.textContent = '가입 중...';
                
                await register(username, email, password);
                showAppScreen();
                
                // 입력 필드 초기화
                document.getElementById('registerUsername').value = '';
                document.getElementById('registerEmail').value = '';
                document.getElementById('registerPassword').value = '';
                document.getElementById('registerPasswordConfirm').value = '';
            } catch (error) {
                alert(error.message);
            } finally {
                registerBtn.disabled = false;
                registerBtn.textContent = '회원가입';
            }
        });
    }
    
    // 폼 전환
    const showRegisterBtn = document.getElementById('showRegisterBtn');
    const showLoginBtn = document.getElementById('showLoginBtn');
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    
    if (showRegisterBtn) {
        showRegisterBtn.addEventListener('click', (e) => {
            e.preventDefault();
            loginForm.style.display = 'none';
            registerForm.style.display = 'block';
        });
    }
    
    if (showLoginBtn) {
        showLoginBtn.addEventListener('click', (e) => {
            e.preventDefault();
            registerForm.style.display = 'none';
            loginForm.style.display = 'block';
        });
    }
    
    // 로그아웃 버튼
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            if (confirm('로그아웃하시겠습니까?')) {
                logout();
            }
        });
    }
});

