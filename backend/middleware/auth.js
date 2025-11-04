// JWT 인증 미들웨어
const jwt = require('jsonwebtoken');

// JWT 비밀 키 (환경 변수에서 가져오거나 기본값 사용)
const JWT_SECRET = process.env.JWT_SECRET || 'memo-app-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d'; // 7일

// JWT 토큰 생성
function generateToken(userId) {
    return jwt.sign({ userId }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// JWT 토큰 검증 미들웨어
function authenticateToken(req, res, next) {
    // 헤더에서 토큰 가져오기
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: '인증 토큰이 필요합니다.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: '유효하지 않은 토큰입니다.' });
        }

        // 토큰에서 사용자 ID 추출하여 request에 저장
        req.userId = decoded.userId;
        next();
    });
}

// 선택적 인증 (토큰이 있으면 검증, 없어도 통과)
function optionalAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
        jwt.verify(token, JWT_SECRET, (err, decoded) => {
            if (!err) {
                req.userId = decoded.userId;
            }
        });
    }
    next();
}

module.exports = {
    JWT_SECRET,
    JWT_EXPIRES_IN,
    generateToken,
    authenticateToken,
    optionalAuth
};

