// /js/common/layout.js
import { isLoggedIn, clearToken } from './auth.js'; // auth.js 경로 확인
import { getUserInfo } from './api.js';      // api.js 경로 확인

// HTML 조각 파일을 가져와 지정된 요소에 삽입하는 함수 
async function loadComponent(url, elementId) {
    const placeholder = document.getElementById(elementId);
    if (!placeholder) {
        console.error(`Placeholder element with ID '${elementId}' not found.`);
        return;
    }
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Failed to fetch ${url}: ${response.status}`);
        }
        const html = await response.text();
        placeholder.innerHTML = html;
    } catch (error) {
        console.error(`Error loading component ${url}:`, error);
        placeholder.innerHTML = `<p style="color:red;">${elementId} 로딩 실패</p>`;
    }
}

/**
 * 헤더의 사용자 프로필 및 인증 상태 UI 업데이트
 */
async function updateHeaderAuthState() {
    const profileImgElement = document.getElementById('user-profile-img');
    const authStatusElement = document.getElementById('auth-status'); // 헤더에 추가한 요소

    if (!profileImgElement || !authStatusElement) return; // 요소 없으면 중단

    if (isLoggedIn()) {
        try {
            const userInfoResponse = await getUserInfo();
            if (userInfoResponse && userInfoResponse.data) {
                profileImgElement.src = userInfoResponse.data.profileImageUrl || '/images/default-profile.png';
                profileImgElement.alt = `${userInfoResponse.data.nickname} 프로필`;
                // 로그아웃 버튼 추가
                authStatusElement.innerHTML = `<button id="logout-button">로그아웃</button>`;
                // 로그아웃 버튼 이벤트 리스너 추가 (import logout 필요)
                document.getElementById('logout-button')?.addEventListener('click', async () => {
                    try {
                        // import { logout } from './api.js'; 필요
                        await logout(); // api.js의 logout 함수 호출
                        clearToken(); // 로컬 토큰 삭제
                        window.location.href = '/login.html'; // 로그인 페이지로 이동
                    } catch (error) {
                        console.error('Logout failed:', error);
                        alert('로그아웃 중 오류가 발생했습니다.');
                    }
                });

            } else { throw new Error("User info data missing"); }
        } catch (error) {
            console.error("User info loading failed:", error);
            profileImgElement.src = '/images/default-profile.png';
            profileImgElement.alt = '프로필 오류';
            authStatusElement.innerHTML = '<a href="/login.html">로그인</a>'; // 로그인 링크 표시
            if (error.message.includes('401')) { clearToken(); } // 토큰 만료 시 삭제
        }
    } else {
        // 비로그인 상태 UI
        profileImgElement.src = '/images/default-profile.png';
        profileImgElement.alt = '로그인 필요';
        authStatusElement.innerHTML = '<a href="/login.html">로그인</a>';
    }
}

//페이지 레이아웃 초기화 함수
async function initializeLayout() {
    // 헤더와 푸터를 동시에 로드
    await Promise.all([
        loadComponent('/_header.html', 'header-placeholder'),
        loadComponent('/_footer.html', 'footer-placeholder')
    ]);

    // 헤더 로드가 완료된 후 인증 상태 업데이트
    await updateHeaderAuthState();

    // 페이지별로 뒤로가기 버튼 동적 추가 (예시: post-detail 페이지)
    if (window.location.pathname.startsWith('/post-detail')) {
        const headerLeft = document.querySelector('.header-left');
        if(headerLeft && !document.getElementById('back-button')) { // 중복 추가 방지
            const backButton = document.createElement('a');
            backButton.id = 'back-button';
            backButton.className = 'back-button';
            backButton.innerHTML = '&lt;';
            backButton.style.cursor = 'pointer'; // 클릭 가능 표시
            backButton.onclick = () => history.back();
            headerLeft.insertBefore(backButton, headerLeft.firstChild); // 로고 앞에 삽입
        }
    }
}

// 스크립트 로드 시 레이아웃 초기화 실행
initializeLayout();