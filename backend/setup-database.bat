@echo off
chcp 65001 >nul
echo =====================================
echo 메모 앱 데이터베이스 설정
echo =====================================
echo.
echo PostgreSQL 비밀번호를 입력하세요: asdasd12
echo.
pause
echo.
echo 데이터베이스 설정 중...
"C:\Program Files\PostgreSQL\18\bin\psql.exe" -U postgres -f setup-db.sql
echo.
echo 완료! 아무 키나 눌러 종료하세요.
pause

