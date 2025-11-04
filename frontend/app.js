// 메모 관리 스크립트

// API URL 설정
if (typeof API_BASE_URL === 'undefined') {
    var API_BASE_URL = window.location.hostname === 'localhost' 
        ? 'http://localhost:3000/api' 
        : '/api';
}

const API_URL = API_BASE_URL + '/memos';
let editingMemoId = null;

// 메모 로드
async function loadMemos() {
    try {
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('메모를 불러오는데 실패했습니다.');
        }
        
        const memos = await response.json();
        displayMemos(memos);
    } catch (error) {
        console.error('메모 로드 오류:', error);
        showError('메모를 불러올 수 없습니다.');
    }
}

// 그룹별 메모 로드
async function loadGroupMemos(groupId) {
    if (!groupId) {
        loadMemos();
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/group/${groupId}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('메모를 불러오는데 실패했습니다.');
        }
        
        const memos = await response.json();
        displayMemos(memos);
    } catch (error) {
        console.error('그룹 메모 로드 오류:', error);
        showError('메모를 불러올 수 없습니다.');
    }
}

// 메모 표시
function displayMemos(memos) {
    const memoContainer = document.getElementById('memoContainer');
    
    if (memos.length === 0) {
        memoContainer.innerHTML = '<p class="no-memos">아직 메모가 없습니다. 첫 메모를 작성해보세요!</p>';
        return;
    }
    
    memoContainer.innerHTML = memos.map(memo => `
        <div class="memo-cloud" data-memo-id="${memo.id}">
            <div class="memo-content">
                ${escapeHtml(memo.content)}
            </div>
            ${memo.author_name ? `<div class="memo-author">작성자: ${escapeHtml(memo.author_name)}</div>` : ''}
            <div class="memo-date">${formatDate(memo.created_at)}</div>
            <div class="memo-actions">
                <button class="memo-btn edit-btn" onclick="editMemo(${memo.id}, '${escapeForAttribute(memo.content)}')">수정</button>
                <button class="memo-btn delete-btn" onclick="deleteMemo(${memo.id})">삭제</button>
            </div>
        </div>
    `).join('');
}

// 메모 추가
async function addMemo() {
    const memoInput = document.getElementById('memoInput');
    const content = memoInput.value.trim();
    
    if (!content) {
        alert('메모 내용을 입력해주세요.');
        return;
    }
    
    try {
        const url = currentGroupId 
            ? `${API_URL}/group/${currentGroupId}`
            : API_URL;
        
        const headers = currentGroupId 
            ? getAuthHeaders()
            : { 'Content-Type': 'application/json' };
        
        const response = await fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '메모 생성에 실패했습니다.');
        }
        
        memoInput.value = '';
        
        // 메모 다시 로드
        if (currentGroupId) {
            loadGroupMemos(currentGroupId);
        } else {
            loadMemos();
        }
        
        showSuccess('메모가 추가되었습니다!');
    } catch (error) {
        console.error('메모 추가 오류:', error);
        showError(error.message);
    }
}

// 메모 수정 시작
function editMemo(id, content) {
    editingMemoId = id;
    const memoInput = document.getElementById('memoInput');
    const addBtn = document.getElementById('addMemoBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    memoInput.value = content;
    addBtn.textContent = '수정 완료';
    cancelBtn.style.display = 'inline-block';
    
    memoInput.focus();
    memoInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// 메모 수정 완료
async function updateMemo() {
    const memoInput = document.getElementById('memoInput');
    const content = memoInput.value.trim();
    
    if (!content) {
        alert('메모 내용을 입력해주세요.');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${editingMemoId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content })
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '메모 수정에 실패했습니다.');
        }
        
        cancelEdit();
        
        // 메모 다시 로드
        if (currentGroupId) {
            loadGroupMemos(currentGroupId);
        } else {
            loadMemos();
        }
        
        showSuccess('메모가 수정되었습니다!');
    } catch (error) {
        console.error('메모 수정 오류:', error);
        showError(error.message);
    }
}

// 수정 취소
function cancelEdit() {
    editingMemoId = null;
    const memoInput = document.getElementById('memoInput');
    const addBtn = document.getElementById('addMemoBtn');
    const cancelBtn = document.getElementById('cancelBtn');
    
    memoInput.value = '';
    addBtn.textContent = '메모 추가';
    cancelBtn.style.display = 'none';
}

// 메모 삭제
async function deleteMemo(id) {
    if (!confirm('정말로 이 메모를 삭제하시겠습니까?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || '메모 삭제에 실패했습니다.');
        }
        
        // 메모 다시 로드
        if (currentGroupId) {
            loadGroupMemos(currentGroupId);
        } else {
            loadMemos();
        }
        
        showSuccess('메모가 삭제되었습니다!');
    } catch (error) {
        console.error('메모 삭제 오류:', error);
        showError(error.message);
    }
}

// 날짜 포맷팅
function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return '방금 전';
    if (minutes < 60) return `${minutes}분 전`;
    if (hours < 24) return `${hours}시간 전`;
    if (days < 7) return `${days}일 전`;
    
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML.replace(/\n/g, '<br>');
}

// 속성용 이스케이프
function escapeForAttribute(text) {
    return text.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// 성공 메시지 표시
function showSuccess(message) {
    // 간단한 알림 (필요시 토스트 메시지로 개선 가능)
    console.log('✅', message);
}

// 에러 메시지 표시
function showError(message) {
    console.error('❌', message);
    alert(message);
}

// DOM 로드 후 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    // 메모 추가/수정 버튼
    const addMemoBtn = document.getElementById('addMemoBtn');
    if (addMemoBtn) {
        addMemoBtn.addEventListener('click', () => {
            if (editingMemoId) {
                updateMemo();
            } else {
                addMemo();
            }
        });
    }
    
    // 취소 버튼
    const cancelBtn = document.getElementById('cancelBtn');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', cancelEdit);
    }
    
    // 엔터키로 메모 추가 (Ctrl+Enter)
    const memoInput = document.getElementById('memoInput');
    if (memoInput) {
        memoInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                if (editingMemoId) {
                    updateMemo();
                } else {
                    addMemo();
                }
            }
        });
    }
    
    // 로그인 상태면 메모 로드
    if (isLoggedIn()) {
        loadMemos();
    }
});
