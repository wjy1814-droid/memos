const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const pool = require('../database');
const { authenticateToken } = require('../middleware/auth');

// 초대 코드 생성 함수
function generateInviteCode() {
    return crypto.randomBytes(8).toString('hex'); // 16자리 랜덤 코드
}

// 그룹 초대 링크 생성 (인증 필요)
router.post('/create', authenticateToken, async (req, res) => {
    try {
        const { groupId, expiresIn, maxUses } = req.body;
        
        if (!groupId) {
            return res.status(400).json({ error: '그룹 ID가 필요합니다.' });
        }
        
        // 권한 확인 (owner 또는 admin만 초대 링크 생성 가능)
        const memberResult = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberResult.rows.length === 0) {
            return res.status(403).json({ error: '이 그룹에 접근할 권한이 없습니다.' });
        }
        
        const role = memberResult.rows[0].role;
        if (role !== 'owner' && role !== 'admin') {
            return res.status(403).json({ error: '초대 링크를 생성할 권한이 없습니다.' });
        }
        
        // 초대 코드 생성
        let inviteCode = generateInviteCode();
        
        // 중복 체크 (매우 드물지만)
        let exists = true;
        while (exists) {
            const checkResult = await pool.query(
                'SELECT id FROM group_invites WHERE invite_code = $1',
                [inviteCode]
            );
            if (checkResult.rows.length === 0) {
                exists = false;
            } else {
                inviteCode = generateInviteCode();
            }
        }
        
        // 만료 시간 계산 (기본: 7일)
        let expiresAt = null;
        if (expiresIn) {
            expiresAt = new Date(Date.now() + expiresIn * 1000);
        } else {
            expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7일
        }
        
        // 초대 링크 생성
        const result = await pool.query(
            `INSERT INTO group_invites 
            (group_id, invite_code, created_by, expires_at, max_uses, current_uses, is_active) 
            VALUES ($1, $2, $3, $4, $5, 0, true) 
            RETURNING *`,
            [groupId, inviteCode, req.userId, expiresAt, maxUses || null]
        );
        
        const invite = result.rows[0];
        
        // 그룹 정보도 함께 반환
        const groupResult = await pool.query(
            'SELECT name, description FROM groups WHERE id = $1',
            [groupId]
        );
        
        res.status(201).json({
            message: '초대 링크가 생성되었습니다.',
            invite: {
                id: invite.id,
                inviteCode: invite.invite_code,
                inviteUrl: `/invite/${invite.invite_code}`,
                fullUrl: `${req.protocol}://${req.get('host')}/invite/${invite.invite_code}`,
                expiresAt: invite.expires_at,
                maxUses: invite.max_uses,
                group: groupResult.rows[0]
            }
        });
    } catch (error) {
        console.error('초대 링크 생성 오류:', error);
        res.status(500).json({ error: '초대 링크 생성에 실패했습니다.' });
    }
});

// 초대 링크 정보 조회
router.get('/:inviteCode', async (req, res) => {
    try {
        const { inviteCode } = req.params;
        
        const result = await pool.query(`
            SELECT 
                gi.*,
                g.name AS group_name,
                g.description AS group_description,
                u.username AS created_by_name
            FROM group_invites gi
            JOIN groups g ON gi.group_id = g.id
            JOIN users u ON gi.created_by = u.id
            WHERE gi.invite_code = $1
        `, [inviteCode]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '유효하지 않은 초대 링크입니다.' });
        }
        
        const invite = result.rows[0];
        
        // 유효성 검사
        if (!invite.is_active) {
            return res.status(400).json({ error: '비활성화된 초대 링크입니다.' });
        }
        
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            return res.status(400).json({ error: '만료된 초대 링크입니다.' });
        }
        
        if (invite.max_uses && invite.current_uses >= invite.max_uses) {
            return res.status(400).json({ error: '사용 횟수가 초과된 초대 링크입니다.' });
        }
        
        res.json({
            valid: true,
            groupId: invite.group_id,
            groupName: invite.group_name,
            groupDescription: invite.group_description,
            createdBy: invite.created_by_name,
            expiresAt: invite.expires_at,
            remainingUses: invite.max_uses ? invite.max_uses - invite.current_uses : null
        });
    } catch (error) {
        console.error('초대 링크 조회 오류:', error);
        res.status(500).json({ error: '초대 링크 조회에 실패했습니다.' });
    }
});

// 초대 링크로 그룹 가입 (인증 필요)
router.post('/:inviteCode/accept', authenticateToken, async (req, res) => {
    try {
        const { inviteCode } = req.params;
        
        const result = await pool.query(`
            SELECT * FROM group_invites
            WHERE invite_code = $1
        `, [inviteCode]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '유효하지 않은 초대 링크입니다.' });
        }
        
        const invite = result.rows[0];
        
        // 유효성 검사
        if (!invite.is_active) {
            return res.status(400).json({ error: '비활성화된 초대 링크입니다.' });
        }
        
        if (invite.expires_at && new Date(invite.expires_at) < new Date()) {
            return res.status(400).json({ error: '만료된 초대 링크입니다.' });
        }
        
        if (invite.max_uses && invite.current_uses >= invite.max_uses) {
            return res.status(400).json({ error: '사용 횟수가 초과된 초대 링크입니다.' });
        }
        
        // 이미 그룹 멤버인지 확인
        const memberCheck = await pool.query(
            'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
            [invite.group_id, req.userId]
        );
        
        if (memberCheck.rows.length > 0) {
            return res.status(409).json({ error: '이미 이 그룹의 멤버입니다.' });
        }
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 그룹 멤버 추가
            await client.query(
                'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
                [invite.group_id, req.userId, 'member']
            );
            
            // 사용 횟수 증가
            await client.query(
                'UPDATE group_invites SET current_uses = current_uses + 1 WHERE id = $1',
                [invite.id]
            );
            
            await client.query('COMMIT');
            
            // 그룹 정보 조회
            const groupResult = await client.query(
                'SELECT * FROM groups WHERE id = $1',
                [invite.group_id]
            );
            
            res.json({
                message: '그룹에 가입되었습니다!',
                group: groupResult.rows[0]
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('그룹 가입 오류:', error);
        res.status(500).json({ error: '그룹 가입에 실패했습니다.' });
    }
});

// 그룹의 초대 링크 목록 조회 (인증 필요)
router.get('/group/:groupId', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        
        // 권한 확인
        const memberResult = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberResult.rows.length === 0) {
            return res.status(403).json({ error: '이 그룹에 접근할 권한이 없습니다.' });
        }
        
        const role = memberResult.rows[0].role;
        if (role !== 'owner' && role !== 'admin') {
            return res.status(403).json({ error: '초대 링크를 조회할 권한이 없습니다.' });
        }
        
        const result = await pool.query(`
            SELECT 
                gi.*,
                u.username AS created_by_name
            FROM group_invites gi
            JOIN users u ON gi.created_by = u.id
            WHERE gi.group_id = $1
            ORDER BY gi.created_at DESC
        `, [groupId]);
        
        res.json({ invites: result.rows });
    } catch (error) {
        console.error('초대 링크 목록 조회 오류:', error);
        res.status(500).json({ error: '초대 링크 목록 조회에 실패했습니다.' });
    }
});

// 초대 링크 비활성화 (인증 필요)
router.delete('/:inviteCode', authenticateToken, async (req, res) => {
    try {
        const { inviteCode } = req.params;
        
        const inviteResult = await pool.query(
            'SELECT * FROM group_invites WHERE invite_code = $1',
            [inviteCode]
        );
        
        if (inviteResult.rows.length === 0) {
            return res.status(404).json({ error: '초대 링크를 찾을 수 없습니다.' });
        }
        
        const invite = inviteResult.rows[0];
        
        // 권한 확인
        const memberResult = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [invite.group_id, req.userId]
        );
        
        if (memberResult.rows.length === 0 || 
            (memberResult.rows[0].role !== 'owner' && memberResult.rows[0].role !== 'admin')) {
            return res.status(403).json({ error: '초대 링크를 삭제할 권한이 없습니다.' });
        }
        
        await pool.query(
            'UPDATE group_invites SET is_active = false WHERE invite_code = $1',
            [inviteCode]
        );
        
        res.json({ message: '초대 링크가 비활성화되었습니다.' });
    } catch (error) {
        console.error('초대 링크 삭제 오류:', error);
        res.status(500).json({ error: '초대 링크 삭제에 실패했습니다.' });
    }
});

module.exports = router;

