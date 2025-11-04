const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const pool = require('../database');
const { generateToken, authenticateToken } = require('../middleware/auth');

const SALT_ROUNDS = 10;

// 회원가입
router.post('/register', async (req, res) => {
    try {
        const { email, password, username } = req.body;
        
        // 입력 검증
        if (!email || !password || !username) {
            return res.status(400).json({ error: '모든 필드를 입력해주세요.' });
        }
        
        if (password.length < 6) {
            return res.status(400).json({ error: '비밀번호는 최소 6자 이상이어야 합니다.' });
        }
        
        // 이메일 중복 확인
        const existingUser = await pool.query(
            'SELECT id FROM users WHERE email = $1',
            [email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(409).json({ error: '이미 존재하는 이메일입니다.' });
        }
        
        // 비밀번호 해시화
        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
        
        // 사용자 생성
        const result = await pool.query(
            'INSERT INTO users (email, password_hash, username) VALUES ($1, $2, $3) RETURNING id, email, username, created_at',
            [email, passwordHash, username]
        );
        
        const user = result.rows[0];
        
        // JWT 토큰 생성
        const token = generateToken(user.id);
        
        res.status(201).json({
            message: '회원가입이 완료되었습니다.',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                created_at: user.created_at
            },
            token
        });
    } catch (error) {
        console.error('회원가입 오류:', error);
        res.status(500).json({ error: '회원가입에 실패했습니다.' });
    }
});

// 로그인
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        // 입력 검증
        if (!email || !password) {
            return res.status(400).json({ error: '이메일과 비밀번호를 입력해주세요.' });
        }
        
        // 사용자 조회
        const result = await pool.query(
            'SELECT id, email, username, password_hash, created_at FROM users WHERE email = $1',
            [email]
        );
        
        if (result.rows.length === 0) {
            return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }
        
        const user = result.rows[0];
        
        // 비밀번호 검증
        const isValidPassword = await bcrypt.compare(password, user.password_hash);
        
        if (!isValidPassword) {
            return res.status(401).json({ error: '이메일 또는 비밀번호가 올바르지 않습니다.' });
        }
        
        // JWT 토큰 생성
        const token = generateToken(user.id);
        
        res.json({
            message: '로그인 성공!',
            user: {
                id: user.id,
                email: user.email,
                username: user.username,
                created_at: user.created_at
            },
            token
        });
    } catch (error) {
        console.error('로그인 오류:', error);
        res.status(500).json({ error: '로그인에 실패했습니다.' });
    }
});

// 현재 사용자 정보 조회 (인증 필요)
router.get('/me', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, email, username, created_at FROM users WHERE id = $1',
            [req.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: '사용자를 찾을 수 없습니다.' });
        }
        
        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error('사용자 조회 오류:', error);
        res.status(500).json({ error: '사용자 정보를 불러올 수 없습니다.' });
    }
});

// 로그아웃 (클라이언트에서 토큰 삭제하면 됨)
router.post('/logout', (req, res) => {
    res.json({ message: '로그아웃되었습니다.' });
});

module.exports = router;

