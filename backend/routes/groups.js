const express = require('express');
const router = express.Router();
const pool = require('../database');
const { authenticateToken } = require('../middleware/auth');

// 모든 그룹 라우트에 인증 필요
router.use(authenticateToken);

// 내 그룹 목록 조회
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT 
                g.id,
                g.name,
                g.description,
                g.owner_id,
                u.username AS owner_name,
                g.created_at,
                gm.role AS my_role,
                (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) AS member_count
            FROM groups g
            JOIN group_members gm ON g.id = gm.group_id
            JOIN users u ON g.owner_id = u.id
            WHERE gm.user_id = $1
            ORDER BY g.created_at DESC
        `, [req.userId]);
        
        res.json({ groups: result.rows });
    } catch (error) {
        console.error('그룹 목록 조회 오류:', error);
        res.status(500).json({ error: '그룹 목록을 불러올 수 없습니다.' });
    }
});

// 그룹 상세 조회
router.get('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        
        // 그룹 정보 조회
        const groupResult = await pool.query(`
            SELECT 
                g.id,
                g.name,
                g.description,
                g.owner_id,
                u.username AS owner_name,
                g.created_at
            FROM groups g
            JOIN users u ON g.owner_id = u.id
            WHERE g.id = $1
        `, [groupId]);
        
        if (groupResult.rows.length === 0) {
            return res.status(404).json({ error: '그룹을 찾을 수 없습니다.' });
        }
        
        // 사용자가 멤버인지 확인
        const memberResult = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberResult.rows.length === 0) {
            return res.status(403).json({ error: '이 그룹에 접근할 권한이 없습니다.' });
        }
        
        // 그룹 멤버 목록 조회
        const membersResult = await pool.query(`
            SELECT 
                gm.id,
                gm.user_id,
                u.username,
                u.email,
                gm.role,
                gm.joined_at
            FROM group_members gm
            JOIN users u ON gm.user_id = u.id
            WHERE gm.group_id = $1
            ORDER BY gm.joined_at ASC
        `, [groupId]);
        
        const group = groupResult.rows[0];
        group.my_role = memberResult.rows[0].role;
        group.members = membersResult.rows;
        
        res.json({ group });
    } catch (error) {
        console.error('그룹 상세 조회 오류:', error);
        res.status(500).json({ error: '그룹 정보를 불러올 수 없습니다.' });
    }
});

// 그룹 생성
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        
        if (!name) {
            return res.status(400).json({ error: '그룹 이름을 입력해주세요.' });
        }
        
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // 그룹 생성
            const groupResult = await client.query(
                'INSERT INTO groups (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *',
                [name, description || '', req.userId]
            );
            
            const group = groupResult.rows[0];
            
            // 생성자를 owner 역할로 멤버에 추가
            await client.query(
                'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
                [group.id, req.userId, 'owner']
            );
            
            await client.query('COMMIT');
            
            res.status(201).json({
                message: '그룹이 생성되었습니다.',
                group
            });
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('그룹 생성 오류:', error);
        res.status(500).json({ error: '그룹 생성에 실패했습니다.' });
    }
});

// 그룹 수정 (owner만 가능)
router.put('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { name, description } = req.body;
        
        // 권한 확인
        const memberResult = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberResult.rows.length === 0 || memberResult.rows[0].role !== 'owner') {
            return res.status(403).json({ error: '그룹을 수정할 권한이 없습니다.' });
        }
        
        const result = await pool.query(
            'UPDATE groups SET name = COALESCE($1, name), description = COALESCE($2, description), updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
            [name, description, groupId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '그룹을 찾을 수 없습니다.' });
        }
        
        res.json({
            message: '그룹이 수정되었습니다.',
            group: result.rows[0]
        });
    } catch (error) {
        console.error('그룹 수정 오류:', error);
        res.status(500).json({ error: '그룹 수정에 실패했습니다.' });
    }
});

// 그룹 삭제 (owner만 가능)
router.delete('/:groupId', async (req, res) => {
    try {
        const { groupId } = req.params;
        
        // 권한 확인
        const memberResult = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberResult.rows.length === 0 || memberResult.rows[0].role !== 'owner') {
            return res.status(403).json({ error: '그룹을 삭제할 권한이 없습니다.' });
        }
        
        await pool.query('DELETE FROM groups WHERE id = $1', [groupId]);
        
        res.json({ message: '그룹이 삭제되었습니다.' });
    } catch (error) {
        console.error('그룹 삭제 오류:', error);
        res.status(500).json({ error: '그룹 삭제에 실패했습니다.' });
    }
});

// 그룹에 멤버 추가 (owner, admin만 가능)
router.post('/:groupId/members', async (req, res) => {
    try {
        const { groupId } = req.params;
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: '추가할 사용자의 이메일을 입력해주세요.' });
        }
        
        // 권한 확인
        const myMemberResult = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (myMemberResult.rows.length === 0 || 
            (myMemberResult.rows[0].role !== 'owner' && myMemberResult.rows[0].role !== 'admin')) {
            return res.status(403).json({ error: '멤버를 추가할 권한이 없습니다.' });
        }
        
        // 추가할 사용자 조회
        const userResult = await pool.query(
            'SELECT id, email, username FROM users WHERE email = $1',
            [email]
        );
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: '해당 이메일의 사용자를 찾을 수 없습니다.' });
        }
        
        const newUser = userResult.rows[0];
        
        // 이미 멤버인지 확인
        const existingMemberResult = await pool.query(
            'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, newUser.id]
        );
        
        if (existingMemberResult.rows.length > 0) {
            return res.status(409).json({ error: '이미 그룹의 멤버입니다.' });
        }
        
        // 멤버 추가
        await pool.query(
            'INSERT INTO group_members (group_id, user_id, role) VALUES ($1, $2, $3)',
            [groupId, newUser.id, 'member']
        );
        
        res.status(201).json({
            message: '멤버가 추가되었습니다.',
            user: newUser
        });
    } catch (error) {
        console.error('멤버 추가 오류:', error);
        res.status(500).json({ error: '멤버 추가에 실패했습니다.' });
    }
});

// 그룹에서 멤버 제거 (owner, admin만 가능)
router.delete('/:groupId/members/:userId', async (req, res) => {
    try {
        const { groupId, userId } = req.params;
        
        // 권한 확인
        const myMemberResult = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (myMemberResult.rows.length === 0 || 
            (myMemberResult.rows[0].role !== 'owner' && myMemberResult.rows[0].role !== 'admin')) {
            return res.status(403).json({ error: '멤버를 제거할 권한이 없습니다.' });
        }
        
        // owner는 제거할 수 없음
        const targetMemberResult = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, userId]
        );
        
        if (targetMemberResult.rows.length === 0) {
            return res.status(404).json({ error: '해당 멤버를 찾을 수 없습니다.' });
        }
        
        if (targetMemberResult.rows[0].role === 'owner') {
            return res.status(400).json({ error: '그룹 소유자는 제거할 수 없습니다.' });
        }
        
        await pool.query(
            'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, userId]
        );
        
        res.json({ message: '멤버가 제거되었습니다.' });
    } catch (error) {
        console.error('멤버 제거 오류:', error);
        res.status(500).json({ error: '멤버 제거에 실패했습니다.' });
    }
});

// 그룹 탈퇴
router.post('/:groupId/leave', async (req, res) => {
    try {
        const { groupId } = req.params;
        
        // owner는 탈퇴할 수 없음
        const memberResult = await pool.query(
            'SELECT role FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberResult.rows.length === 0) {
            return res.status(404).json({ error: '그룹 멤버가 아닙니다.' });
        }
        
        if (memberResult.rows[0].role === 'owner') {
            return res.status(400).json({ error: '그룹 소유자는 탈퇴할 수 없습니다. 그룹을 삭제하거나 소유권을 이전해주세요.' });
        }
        
        await pool.query(
            'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        res.json({ message: '그룹에서 탈퇴했습니다.' });
    } catch (error) {
        console.error('그룹 탈퇴 오류:', error);
        res.status(500).json({ error: '그룹 탈퇴에 실패했습니다.' });
    }
});

module.exports = router;

