let accessToken = null; // 이 모듈의 스코프 내 메모리에 토큰을 저장합니다 🧠


//Access Token을 메모리에 저장합니다.
export function saveToken(token) {
    accessToken = token;
    console.log("Access Token 저장 완료.");
}

export function getToken() {
    return accessToken;
}

//저장된 Access Token을 지웁니다 (로그아웃 효과).
export function clearToken() {
    accessToken = null;
    console.log("Access Token 삭제 (로그아웃).");
}

//현재 사용자가 로그인 상태인지 확인합니다 (Access Token 존재 여부).
export function isLoggedIn() {
    return accessToken !== null;
}