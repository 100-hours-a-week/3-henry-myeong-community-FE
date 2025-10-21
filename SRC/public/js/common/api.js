import { getToken, clearToken } from './auth.js';

const BASE_URL = 'http://localhost:8080'; 


// 백엔드 API에 요청을 보내는 범용 함수.
// Authorization 헤더 추가 및 기본적인 에러 처리를 담당합니다.

async function request(method, path, body = null) {
    const url = `${BASE_URL}${path}`;
    const headers = {
        'Content-Type': 'application/json',
    };

    const token = getToken(); // auth 모듈에서 토큰 가져오기
    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // 토큰이 있으면 헤더에 추가
    }

    const options = {
        method,
        headers,
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);

        // 특정 에러 코드 처리 (예: 401 Unauthorized - 토큰 만료 등)
        if (response.status === 401) {
            console.error("인증 에러 (401). 토큰을 삭제합니다.");
            clearToken(); // 유효하지 않은 토큰 삭제
            // 필요 시 로그인 페이지로 리디렉션
            // window.location.href = '/login.html';
            throw new Error('인증이 필요하거나 토큰이 만료되었습니다.');
        }

        if (!response.ok) { // 다른 HTTP 에러 처리 (4xx, 5xx)
            let errorData = { message: `HTTP 에러! 상태 코드: ${response.status}` };
            try {
                errorData = await response.json(); // 에러 본문에서 상세 정보 시도
            } catch (e) {
                // JSON 파싱 실패 시 기본 메시지 사용
                console.log(e);
            }
            throw new Error(errorData.message || `HTTP 에러! 상태 코드: ${response.status}`);
        }

        // 204 No Content 처리 (예: 로그아웃 성공)
        if (response.status === 204) {
            return null; // 내용 없는 응답은 null 반환
        }

        // 성공적인 응답 (내용 있음)
        return await response.json();

    } catch (error) {
        console.error('API 요청 실패:', error);
        throw error; // 호출한 함수에서 에러를 처리할 수 있도록 다시 던짐
    }
}


// 인증 관련
export const login = (email, password) => request('POST', '/api/auth', { email, password });
export const logout = () => request('DELETE', '/api/auth');

// 사용자 관련
export const signup = (userData) => request('POST', '/api/users', userData);
export const getUserInfo = () => request('GET', '/api/users/me');
export const updateUserInfo = (userData) => request('PATCH', '/api/users/me', userData);
export const deleteUser = () => request('DELETE', '/api/users/me');

//회원가입 중복 검증
export const checkEmailAvailability = (email) => request('GET', '/api/users/email?email=' + email)
export const checkNicknameAvailability = (nickname) => request('GET', '/api/users/nickname?nickname=' + nickname)

// 게시글 관련
export const getPosts = (cursor = null, size = 20) => {
    const params = new URLSearchParams({ size: size.toString() }); // size를 문자열로 변환
    if (cursor !== null) { // cursor가 null이 아닐 때만 추가
        params.append('cursor', cursor.toString()); // cursor를 문자열로 변환
    }
    return request('GET', `/api/posts?${params.toString()}`);
};
export const getPostDetail = (postId) => request('GET', `/api/posts/${postId}`);
export const createPost = (postData) => request('POST', '/api/posts', postData); // 단순화를 위해 JSON 가정, FormData 필요 시 수정
export const updatePost = (postId, postData) => request('PATCH', `/api/posts/${postId}`, postData);
export const deletePost = (postId) => request('DELETE', `/api/posts/${postId}`);