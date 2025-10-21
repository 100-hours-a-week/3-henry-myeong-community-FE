
const TOKEN_KEY = 'accessToken'; // sessionStorage에 사용할 키 이름

/**
 * Access Token을 sessionStorage에 저장합니다.
 * @param {string} token - 서버로부터 받은 Access Token.
 */
export function saveToken(token) {
    sessionStorage.setItem(TOKEN_KEY, token); // ✅ sessionStorage에 저장
    console.log("Access Token saved to sessionStorage.");
}

/**
 * sessionStorage에서 Access Token을 가져옵니다.
 * @returns {string | null} Access Token 또는 없으면 null.
 */
export function getToken() {
    return sessionStorage.getItem(TOKEN_KEY); // ✅ sessionStorage에서 읽기
}

/**
 * sessionStorage에서 Access Token을 삭제합니다.
 */
export function clearToken() {
    sessionStorage.removeItem(TOKEN_KEY); // ✅ sessionStorage에서 삭제
    console.log("Access Token cleared from sessionStorage (logged out).");
}

/**
 * sessionStorage에 토큰이 있는지 확인하여 로그인 상태를 판단합니다.
 * @returns {boolean} 토큰이 있으면 true, 없으면 false.
 */
export function isLoggedIn() {
    return sessionStorage.getItem(TOKEN_KEY) !== null; // ✅ sessionStorage 확인
}