// 그룹 관리 스크립트

let currentGroupId = null;
let allGroups = [];

// 그룹 목록 로드
async function loadGroups() {
    try {
        const response = await fetch(`${API_BASE_URL}/groups`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('그룹 목록을 불러올 수 없습니다.');
        }
        
        const data = await response.json();
        allGroups = data.groups || [];
        displayGroups(allGroups);
    } catch (error) {
        console.error('그룹 로드 오류:', error);
    }
}

// 그룹 목록 표시
function displayGroups(groups) {
    const groupsList = document.getElementById('groupsList');
    
    if (!groups || groups.length === 0) {
        groupsList.innerHTML = '<p class="no-groups">아직 참여한 그룹이 없습니다.</p>';
        return;
    }
    
    groupsList.innerHTML = groups.map(group => `
        <div class="group-item ${currentGroupId === group.id ? 'active' : ''}" data-group-id="${group.id}">
            <div class="group-info">
                <h4>${escapeHtml(group.name)}</h4>
                <p>${escapeHtml(group.description || '')}</p>
                <span class="group-meta">
                    ${group.my_role === 'owner' ? '👑 ' : ''}
                    멤버 ${group.member_count}명
                </span>
            </div>
        </div>
    `).join('');
    
    // 그룹 클릭 이벤트
    document.querySelectorAll('.group-item').forEach(item => {
        item.addEventListener('click', () => {
            const groupId = parseInt(item.dataset.groupId);
            selectGroup(groupId);
        });
    });
}

// 그룹 선택
async function selectGroup(groupId) {
    currentGroupId = groupId;
    
    // 그룹 목록에서 활성화 표시
    document.querySelectorAll('.group-item').forEach(item => {
        item.classList.toggle('active', parseInt(item.dataset.groupId) === groupId);
    });
    
    // 그룹 정보 표시
    const group = allGroups.find(g => g.id === groupId);
    if (group) {
        const groupInfo = document.getElementById('currentGroupInfo');
        groupInfo.style.display = 'block';
        document.getElementById('currentGroupName').textContent = group.name;
        document.getElementById('currentGroupDesc').textContent = group.description || '';
        
        // owner가 아니면 그룹 관리 버튼 숨기기
        const manageBtn = document.getElementById('manageGroupBtn');
        if (manageBtn) {
            manageBtn.style.display = group.my_role === 'owner' ? 'inline-block' : 'none';
        }
        
        // owner는 나가기 버튼 숨기기
        const leaveBtn = document.getElementById('leaveGroupBtn');
        if (leaveBtn) {
            leaveBtn.style.display = group.my_role === 'owner' ? 'none' : 'inline-block';
        }
    }
    
    // 그룹 사이드바 닫기 (모바일)
    closeSidebar();
    
    // 그룹의 메모 로드
    if (typeof loadGroupMemos === 'function') {
        loadGroupMemos(groupId);
    }
}

// 그룹 생성
async function createGroup(name, description) {
    try {
        const response = await fetch(`${API_BASE_URL}/groups`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, description })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '그룹 생성에 실패했습니다.');
        }
        
        // 그룹 목록 새로고침
        await loadGroups();
        
        // 새로 만든 그룹 선택
        selectGroup(data.group.id);
        
        return data;
    } catch (error) {
        throw error;
    }
}

// 그룹 정보 수정
async function updateGroup(groupId, name, description) {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
            method: 'PUT',
            headers: getAuthHeaders(),
            body: JSON.stringify({ name, description })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '그룹 수정에 실패했습니다.');
        }
        
        await loadGroups();
        return data;
    } catch (error) {
        throw error;
    }
}

// 그룹 삭제
async function deleteGroup(groupId) {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '그룹 삭제에 실패했습니다.');
        }
        
        currentGroupId = null;
        document.getElementById('currentGroupInfo').style.display = 'none';
        await loadGroups();
        loadMemos(); // 개인 메모로 돌아가기
        
        return data;
    } catch (error) {
        throw error;
    }
}

// 그룹 탈퇴
async function leaveGroup(groupId) {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/leave`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '그룹 탈퇴에 실패했습니다.');
        }
        
        currentGroupId = null;
        document.getElementById('currentGroupInfo').style.display = 'none';
        await loadGroups();
        loadMemos(); // 개인 메모로 돌아가기
        
        return data;
    } catch (error) {
        throw error;
    }
}

// 그룹 상세 정보 로드
async function loadGroupDetails(groupId) {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}`, {
            headers: getAuthHeaders()
        });
        
        if (!response.ok) {
            throw new Error('그룹 정보를 불러올 수 없습니다.');
        }
        
        const data = await response.json();
        return data.group;
    } catch (error) {
        throw error;
    }
}

// 멤버 추가
async function addMember(groupId, email) {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '멤버 추가에 실패했습니다.');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// 멤버 제거
async function removeMember(groupId, userId) {
    try {
        const response = await fetch(`${API_BASE_URL}/groups/${groupId}/members/${userId}`, {
            method: 'DELETE',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '멤버 제거에 실패했습니다.');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// 초대 링크 생성
async function createInviteLink(groupId) {
    try {
        const response = await fetch(`${API_BASE_URL}/invites/create`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ groupId })
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '초대 링크 생성에 실패했습니다.');
        }
        
        return data.invite;
    } catch (error) {
        throw error;
    }
}

// 초대 링크로 그룹 가입
async function acceptInvite(inviteCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/invites/${inviteCode}/accept`, {
            method: 'POST',
            headers: getAuthHeaders()
        });
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '그룹 가입에 실패했습니다.');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// 초대 링크 정보 조회
async function getInviteInfo(inviteCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/invites/${inviteCode}`);
        
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || '초대 링크 조회에 실패했습니다.');
        }
        
        return data;
    } catch (error) {
        throw error;
    }
}

// HTML 이스케이프
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 사이드바 열기/닫기
function openSidebar() {
    document.getElementById('groupsSidebar').classList.add('open');
}

function closeSidebar() {
    document.getElementById('groupsSidebar').classList.remove('open');
}

// 모달 열기/닫기
function openModal(modalId) {
    document.getElementById(modalId).classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

// DOM 로드 후 이벤트 리스너 설정
document.addEventListener('DOMContentLoaded', () => {
    // 내 그룹 버튼
    const myGroupsBtn = document.getElementById('myGroupsBtn');
    if (myGroupsBtn) {
        myGroupsBtn.addEventListener('click', () => {
            openSidebar();
        });
    }
    
    // 사이드바 닫기
    const closeSidebarBtn = document.getElementById('closeSidebarBtn');
    if (closeSidebarBtn) {
        closeSidebarBtn.addEventListener('click', () => {
            closeSidebar();
        });
    }
    
    // 그룹 생성 버튼
    const createGroupBtn = document.getElementById('createGroupBtn');
    if (createGroupBtn) {
        createGroupBtn.addEventListener('click', () => {
            openModal('createGroupModal');
        });
    }
    
    // 그룹 생성 확인
    const confirmCreateGroupBtn = document.getElementById('confirmCreateGroupBtn');
    if (confirmCreateGroupBtn) {
        confirmCreateGroupBtn.addEventListener('click', async () => {
            const name = document.getElementById('newGroupName').value.trim();
            const description = document.getElementById('newGroupDesc').value.trim();
            
            if (!name) {
                alert('그룹 이름을 입력해주세요.');
                return;
            }
            
            try {
                confirmCreateGroupBtn.disabled = true;
                confirmCreateGroupBtn.textContent = '생성 중...';
                
                await createGroup(name, description);
                
                // 입력 필드 초기화
                document.getElementById('newGroupName').value = '';
                document.getElementById('newGroupDesc').value = '';
                
                closeModal('createGroupModal');
                alert('그룹이 생성되었습니다!');
            } catch (error) {
                alert(error.message);
            } finally {
                confirmCreateGroupBtn.disabled = false;
                confirmCreateGroupBtn.textContent = '만들기';
            }
        });
    }
    
    // 초대 링크 버튼
    const inviteLinkBtn = document.getElementById('inviteLinkBtn');
    if (inviteLinkBtn) {
        inviteLinkBtn.addEventListener('click', async () => {
            if (!currentGroupId) return;
            
            try {
                inviteLinkBtn.disabled = true;
                inviteLinkBtn.textContent = '생성 중...';
                
                const invite = await createInviteLink(currentGroupId);
                
                // 링크를 입력 필드에 표시
                document.getElementById('inviteLinkInput').value = invite.fullUrl;
                
                // 모달 열기
                openModal('inviteLinkModal');
            } catch (error) {
                alert(error.message);
            } finally {
                inviteLinkBtn.disabled = false;
                inviteLinkBtn.textContent = '🔗 초대';
            }
        });
    }
    
    // 초대 링크 복사 버튼
    const copyInviteLinkBtn = document.getElementById('copyInviteLinkBtn');
    if (copyInviteLinkBtn) {
        copyInviteLinkBtn.addEventListener('click', async () => {
            const linkInput = document.getElementById('inviteLinkInput');
            
            try {
                // 클립보드에 복사
                await navigator.clipboard.writeText(linkInput.value);
                
                // 버튼 텍스트 변경
                const originalText = copyInviteLinkBtn.textContent;
                copyInviteLinkBtn.textContent = '✅ 복사 완료!';
                copyInviteLinkBtn.style.background = '#4CAF50';
                
                setTimeout(() => {
                    copyInviteLinkBtn.textContent = originalText;
                    copyInviteLinkBtn.style.background = '';
                }, 2000);
                
                alert('초대 링크가 복사되었습니다!\n카카오톡이나 문자로 친구에게 보내보세요! 📱');
            } catch (error) {
                // 클립보드 API를 사용할 수 없는 경우
                linkInput.select();
                document.execCommand('copy');
                alert('초대 링크가 복사되었습니다!');
            }
        });
    }
    
    // 그룹 관리 버튼
    const manageGroupBtn = document.getElementById('manageGroupBtn');
    if (manageGroupBtn) {
        manageGroupBtn.addEventListener('click', async () => {
            if (!currentGroupId) return;
            
            try {
                const group = await loadGroupDetails(currentGroupId);
                
                // 그룹 정보 입력
                document.getElementById('editGroupName').value = group.name;
                document.getElementById('editGroupDesc').value = group.description || '';
                
                // 멤버 목록 표시
                displayMembers(group.members);
                
                openModal('manageGroupModal');
            } catch (error) {
                alert(error.message);
            }
        });
    }
    
    // 그룹 정보 수정
    const updateGroupBtn = document.getElementById('updateGroupBtn');
    if (updateGroupBtn) {
        updateGroupBtn.addEventListener('click', async () => {
            const name = document.getElementById('editGroupName').value.trim();
            const description = document.getElementById('editGroupDesc').value.trim();
            
            if (!name) {
                alert('그룹 이름을 입력해주세요.');
                return;
            }
            
            try {
                updateGroupBtn.disabled = true;
                updateGroupBtn.textContent = '저장 중...';
                
                await updateGroup(currentGroupId, name, description);
                
                // 현재 그룹 정보 업데이트
                document.getElementById('currentGroupName').textContent = name;
                document.getElementById('currentGroupDesc').textContent = description;
                
                alert('그룹 정보가 수정되었습니다.');
            } catch (error) {
                alert(error.message);
            } finally {
                updateGroupBtn.disabled = false;
                updateGroupBtn.textContent = '저장';
            }
        });
    }
    
    // 멤버 추가
    const addMemberBtn = document.getElementById('addMemberBtn');
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', async () => {
            const email = document.getElementById('addMemberEmail').value.trim();
            
            if (!email) {
                alert('이메일을 입력해주세요.');
                return;
            }
            
            try {
                addMemberBtn.disabled = true;
                addMemberBtn.textContent = '추가 중...';
                
                await addMember(currentGroupId, email);
                
                // 입력 필드 초기화
                document.getElementById('addMemberEmail').value = '';
                
                // 멤버 목록 새로고침
                const group = await loadGroupDetails(currentGroupId);
                displayMembers(group.members);
                
                alert('멤버가 추가되었습니다.');
            } catch (error) {
                alert(error.message);
            } finally {
                addMemberBtn.disabled = false;
                addMemberBtn.textContent = '멤버 추가';
            }
        });
    }
    
    // 그룹 삭제
    const deleteGroupBtn = document.getElementById('deleteGroupBtn');
    if (deleteGroupBtn) {
        deleteGroupBtn.addEventListener('click', async () => {
            if (!confirm('정말로 이 그룹을 삭제하시겠습니까? 모든 메모가 삭제됩니다.')) {
                return;
            }
            
            try {
                deleteGroupBtn.disabled = true;
                deleteGroupBtn.textContent = '삭제 중...';
                
                await deleteGroup(currentGroupId);
                
                closeModal('manageGroupModal');
                alert('그룹이 삭제되었습니다.');
            } catch (error) {
                alert(error.message);
            } finally {
                deleteGroupBtn.disabled = false;
                deleteGroupBtn.textContent = '그룹 삭제';
            }
        });
    }
    
    // 그룹 탈퇴
    const leaveGroupBtn = document.getElementById('leaveGroupBtn');
    if (leaveGroupBtn) {
        leaveGroupBtn.addEventListener('click', async () => {
            if (!confirm('이 그룹에서 나가시겠습니까?')) {
                return;
            }
            
            try {
                await leaveGroup(currentGroupId);
                alert('그룹에서 탈퇴했습니다.');
            } catch (error) {
                alert(error.message);
            }
        });
    }
    
    // 모달 닫기 버튼
    document.querySelectorAll('.modal-close').forEach(btn => {
        btn.addEventListener('click', function() {
            const modal = this.closest('.modal');
            if (modal) {
                modal.classList.remove('show');
            }
        });
    });
    
    // 모달 바깥쪽 클릭 시 닫기
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
});

// 멤버 목록 표시
function displayMembers(members) {
    const membersList = document.getElementById('membersList');
    const currentUser = getUser();
    
    if (!members || members.length === 0) {
        membersList.innerHTML = '<p class="no-members">멤버가 없습니다.</p>';
        return;
    }
    
    membersList.innerHTML = members.map(member => `
        <div class="member-item">
            <div class="member-info">
                <strong>${escapeHtml(member.username)}</strong>
                ${member.role === 'owner' ? '<span class="badge">👑 소유자</span>' : ''}
                ${member.role === 'admin' ? '<span class="badge">관리자</span>' : ''}
                <br>
                <small>${escapeHtml(member.email)}</small>
            </div>
            ${member.role !== 'owner' && member.user_id !== currentUser.id ? 
                `<button class="btn btn-small btn-danger" onclick="handleRemoveMember(${member.user_id})">제거</button>` : 
                ''}
        </div>
    `).join('');
}

// 멤버 제거 핸들러
async function handleRemoveMember(userId) {
    if (!confirm('이 멤버를 제거하시겠습니까?')) {
        return;
    }
    
    try {
        await removeMember(currentGroupId, userId);
        
        // 멤버 목록 새로고침
        const group = await loadGroupDetails(currentGroupId);
        displayMembers(group.members);
        
        alert('멤버가 제거되었습니다.');
    } catch (error) {
        alert(error.message);
    }
}

