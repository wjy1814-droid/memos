const express = require('express');
const router = express.Router();
const pool = require('../database');

// 모든 메모 조회
router.get('/', async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM memos ORDER BY created_at DESC'
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

// 메모 생성
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

