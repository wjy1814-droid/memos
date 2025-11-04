const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

// 데이터베이스 연결
const db = require('./database');

// 라우트
const memoRoutes = require('./routes/memos');
app.use('/api/memos', memoRoutes);

// 기본 라우트
app.get('/', (req, res) => {
    res.json({ 
        message: '메모 공유 앱 API 서버',
        version: '1.0.0',
        endpoints: {
            getAllMemos: 'GET /api/memos',
            getMemo: 'GET /api/memos/:id',
            createMemo: 'POST /api/memos',
            updateMemo: 'PUT /api/memos/:id',
            deleteMemo: 'DELETE /api/memos/:id'
        }
    });
});

// 에러 핸들링
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ 
        error: '서버 오류가 발생했습니다.',
        message: err.message 
    });
});

// 서버 시작
app.listen(PORT, () => {
    console.log(`🚀 서버가 포트 ${PORT}에서 실행 중입니다.`);
    console.log(`📝 API 주소: http://localhost:${PORT}/api/memos`);
});

module.exports = app;

