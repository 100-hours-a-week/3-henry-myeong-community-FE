// /js/pages/index.js
import { getPosts, getUserInfo } from '/js/common/api.js';
import { isLoggedIn, getToken } from '/js/common/auth.js';

const postListContainer = document.getElementById('post-list');
const loadingIndicator = document.getElementById('loading-indicator');
const userProfileImg = document.getElementById('user-profile-img');

let currentCursor = null; // 다음 페이지 요청에 사용할 커서
let isLoading = false;    // 중복 로딩 방지 플래그
let hasNextPage = true;   // 다음 페이지 존재 여부


// 숫자 포맷팅 (1000 이상 -> K)
function formatCount(count) {
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count;
}

// 날짜/시간 포맷팅 (yyyy-mm-dd hh:mm:ss)
function formatDateTime(isoString) {
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

// 게시글 카드 HTML 생성
function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.dataset.postId = post.postId;

    const likeCountFormatted = formatCount(post.likeCount || 0);
    const commentCountFormatted = formatCount(post.commentCount || 0);
    const viewCountFormatted = formatCount(post.viewCount || 0);
    const createdAtFormatted = formatDateTime(post.createdAt);
    const authorProfile = post.author.profileImageUrl || '/images/default-profile.png';

    card.innerHTML = `
        <h3>${post.title}</h3>
        <div class="post-meta">
            <span>좋아요 ${likeCountFormatted}</span>
            <span>댓글 ${commentCountFormatted}</span>
            <span>조회수 ${viewCountFormatted}</span>
            <span>${createdAtFormatted}</span>
        </div>
        <div class="post-author">
            <img src="${authorProfile}" alt="${post.author.nickname} 프로필">
            <span>${post.author.nickname}</span>
        </div>
    `;

    // 카드 클릭 시 상세 페이지 이동 이벤트 추가
    card.addEventListener('click', () => {
        window.location.href = `/post-detail.html?postId=${post.postId}`;
    });

    return card;
}

// --- Header Update ---
// async function updateUserProfileHeader() {
//     if (isLoggedIn()) {
//         try {
//             const userInfoResponse = await getUserInfo(); // 내 정보 API 호출
//             if (userInfoResponse && userInfoResponse.data) {
//                 userProfileImg.src = userInfoResponse.data.profileImageUrl || '/images/default-profile.png';
//                 userProfileImg.alt = `${userInfoResponse.data.nickname} 프로필`;
//             }
//         } catch (error) {
//             console.error("사용자 정보 로딩 실패:", error);
//             // 에러 발생 시 기본 이미지 유지
//         }
//     } else {
//         // 로그인 안 한 경우, 로그인 버튼 등으로 대체 (선택 사항)
//         // 예: userProfileImg.parentElement.innerHTML = '<a href="/login.html">로그인</a>';
//     }
// }

// --- Data Loading & Infinite Scroll ---

// 게시글 로드 함수
async function loadPosts() {
    if (isLoading || !hasNextPage) return; // 로딩 중이거나 다음 페이지 없으면 중단

    isLoading = true;
    loadingIndicator.style.display = 'block';

    try {
        const response = await getPosts(currentCursor); // api.js 함수 호출

        if (response && response.data && response.data.posts) {
            response.data.posts.forEach(post => {
                const card = createPostCard(post);
                postListContainer.appendChild(card);
            });

            // 다음 요청을 위한 커서 및 상태 업데이트
            currentCursor = response.data.cursor.nextCursor;
            hasNextPage = response.data.cursor.hasNext;

            if (!hasNextPage) {
                loadingIndicator.textContent = '모든 게시글을 불러왔습니다.';
            }
        } else {
            hasNextPage = false; 
             loadingIndicator.textContent = '게시글을 불러오는데 실패했습니다.';
        }

    } catch (error) {
        console.error("게시글 로딩 실패:", error);
        loadingIndicator.textContent = '게시글 로딩 중 오류 발생.';
        hasNextPage = false; // 에러 발생 시 로딩 중단
    } finally {
        isLoading = false;
        if (hasNextPage) {
            loadingIndicator.style.display = 'none'; // 다음 페이지 있으면 숨김
        }
    }
}

// Intersection Observer 설정 (스크롤 감지)
const observer = new IntersectionObserver((entries) => {
    // 로딩 인디케이터(loadingIndicator)가 화면에 보이면 다음 페이지 로드
    if (entries[0].isIntersecting && hasNextPage) {
        loadPosts();
    }
}, { threshold: 0.8 }); // 인디케이터가 80% 보일 때 감지


// 페이지 로드 시 초기 작업
document.addEventListener('DOMContentLoaded', () => {
    updateUserProfileHeader(); // 헤더 업데이트
    loadPosts(); // 첫 페이지 게시글 로드
    observer.observe(loadingIndicator); // 스크롤 감지 시작
});