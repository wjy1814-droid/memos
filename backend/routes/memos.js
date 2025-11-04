const express = require('express');
const router = express.Router();
const pool = require('../database');
const { authenticateToken } = require('../middleware/auth');

// 그룹별 메모 조회 (인증 필요)
router.get('/group/:groupId', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        
        // 사용자가 그룹 멤버인지 확인
        const memberResult = await pool.query(
            'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberResult.rows.length === 0) {
            return res.status(403).json({ error: '이 그룹에 접근할 권한이 없습니다.' });
        }
        
        // 그룹의 메모 조회
        const result = await pool.query(`
            SELECT 
                m.*,
                u.username AS author_name
            FROM memos m
            LEFT JOIN users u ON m.user_id = u.id
            WHERE m.group_id = $1
            ORDER BY m.created_at DESC
        `, [groupId]);
        
        res.json(result.rows);
    } catch (error) {
        console.error('메모 조회 오류:', error);
        res.status(500).json({ error: '메모를 불러올 수 없습니다.' });
    }
});

// 모든 메모 조회 (개인 메모 - group_id가 NULL인 것들)
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM memos WHERE group_id IS NULL ORDER BY created_at DESC'
        );
        res.json(result.rows);
    } catch (error) {
        console.error('메모 조회 오류:', error);
        res.status(500).json({ error: '메모를 불러올 수 없습니다.' });
    }
});

// 특정 메모 조회
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            'SELECT * FROM memos WHERE id = $1',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('메모 조회 오류:', error);
        res.status(500).json({ error: '메모를 불러올 수 없습니다.' });
    }
});

// 메모 생성 (그룹용 - 인증 필요)
router.post('/group/:groupId', authenticateToken, async (req, res) => {
    try {
        const { groupId } = req.params;
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: '메모 내용을 입력해주세요.' });
        }
        
        // 사용자가 그룹 멤버인지 확인
        const memberResult = await pool.query(
            'SELECT id FROM group_members WHERE group_id = $1 AND user_id = $2',
            [groupId, req.userId]
        );
        
        if (memberResult.rows.length === 0) {
            return res.status(403).json({ error: '이 그룹에 메모를 작성할 권한이 없습니다.' });
        }
        
        const result = await pool.query(
            'INSERT INTO memos (content, group_id, user_id) VALUES ($1, $2, $3) RETURNING *',
            [content.trim(), groupId, req.userId]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('메모 생성 오류:', error);
        res.status(500).json({ error: '메모를 생성할 수 없습니다.' });
    }
});

// 메모 생성 (개인 메모)
router.post('/', async (req, res) => {
    try {
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: '메모 내용을 입력해주세요.' });
        }
        
        const result = await pool.query(
            'INSERT INTO memos (content) VALUES ($1) RETURNING *',
            [content.trim()]
        );
        
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('메모 생성 오류:', error);
        res.status(500).json({ error: '메모를 생성할 수 없습니다.' });
    }
});

// 메모 수정
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { content } = req.body;
        
        if (!content || content.trim() === '') {
            return res.status(400).json({ error: '메모 내용을 입력해주세요.' });
        }
        
        const result = await pool.query(
            'UPDATE memos SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
            [content.trim(), id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
        }
        
        res.json(result.rows[0]);
    } catch (error) {
        console.error('메모 수정 오류:', error);
        res.status(500).json({ error: '메모를 수정할 수 없습니다.' });
    }
});

// 메모 삭제
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const result = await pool.query(
            'DELETE FROM memos WHERE id = $1 RETURNING *',
            [id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '메모를 찾을 수 없습니다.' });
        }
        
        res.json({ 
            message: '메모가 삭제되었습니다.',
            memo: result.rows[0]
        });
    } catch (error) {
        console.error('메모 삭제 오류:', error);
        res.status(500).json({ error: '메모를 삭제할 수 없습니다.' });
    }
});

module.exports = router;

