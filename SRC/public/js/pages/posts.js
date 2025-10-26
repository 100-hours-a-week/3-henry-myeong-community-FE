// /js/pages/index.js
import { getPosts, getUserInfo } from '/js/common/api.js';
import { isLoggedIn, getToken } from '/js/common/auth.js';
import { formatCount, formatDateTime, updateUserProfileHeader } from '../common/common.js';

const postListContainer = document.getElementById('post-list');
const loadingIndicator = document.getElementById('loading-indicator');
const userProfileImg = document.getElementById('user-profile-img');

let currentCursor = null; // 다음 페이지 요청에 사용할 커서
let isLoading = false;    // 중복 로딩 방지 플래그
let hasNextPage = true;   // 다음 페이지 존재 여부


// 게시글 카드 HTML 생성
function createPostCard(post) {
    const card = document.createElement('div');
    card.className = 'post-card';
    card.dataset.postId = post.postId;

    const likeCountFormatted = formatCount(post.likeCount || 0);
    const commentCountFormatted = formatCount(post.commentCount || 0);
    const viewCountFormatted = formatCount(post.viewCount || 0);
    const createdAtFormatted = formatDateTime(post.createdAt);
    // const authorProfile = post.author.profileImageUrl || '/images/default-profile.png';
    const authorProfile = '/images/default-profile.png';

    card.innerHTML = `
        <h3>${post.title}</h3>
        <div class="post-meta">
            <span>좋아요 ${likeCountFormatted}</span>
            <span>댓글 ${commentCountFormatted}</span>
            <span>조회수 ${viewCountFormatted}</span>
            <span>${createdAtFormatted}</span>
        </div>
        <div class="post-author">
            <img src="${authorProfile}" alt="${post.user.nickname} 프로필">
            <span>${post.user.nickname}</span>
        </div>
    `;

    // 카드 클릭 시 상세 페이지 이동 이벤트 추가
    card.addEventListener('click', () => {
        window.location.href = `/post-detail.html?postid=${post.postId}`;
    });

    return card;
}

// --- Data Loading & Infinite Scroll ---

// 게시글 로드 함수// 게시글 로드 함수
async function loadPosts() {
    // 로딩 중이거나 다음 페이지 없으면 중단 (hasNextPage가 false면 여기서 걸러짐)
    if (isLoading || !hasNextPage) {
        // 만약 hasNextPage가 이미 false인데 이 함수가 호출된 경우 (예: 스크롤 감지 오류)
        // 로딩 인디케이터에 마지막 메시지를 표시하고 종료할 수 있음
        if (!hasNextPage) {
             loadingIndicator.textContent = '모든 게시글을 불러왔습니다.';
             loadingIndicator.style.display = 'block'; // 메시지 보이도록 유지
        }
        return;
    }

    isLoading = true;
    loadingIndicator.style.display = 'block';
    loadingIndicator.textContent = '더 많은 게시글을 불러오는 중...'; // 로딩 시작 메시지

    try {
        const response = await getPosts(currentCursor); // api.js 함수 호출

        if (response && response.data && response.data.cursor && Array.isArray(response.data.postList)) {
            const posts = response.data.postList;
            const cursorInfo = response.data.cursor;

            if (posts.length > 0) {
                // 게시글이 있으면 카드 생성 및 추가
                posts.forEach(post => {
                    const card = createPostCard(post);
                    postListContainer.appendChild(card);
                });
                // 다음 커서 업데이트
                currentCursor = cursorInfo.nextCursor;
            } else {
                // ✅ 게시글 배열은 받았지만 비어있는 경우 (예: 첫 페이지인데 글이 하나도 없을 때)
                currentCursor = null; // 커서 업데이트 없음
                 if(postListContainer.children.length === 0) { // 만약 아예 처음부터 글이 없었다면
                     loadingIndicator.textContent = '표시할 게시글이 없습니다.';
                 } else { // 이전 페이지까지는 글이 있었던 경우
                     loadingIndicator.textContent = '게시글이 더 없습니다.';
                 }
            }

            // 다음 페이지 존재 여부 업데이트
            hasNextPage = cursorInfo.hasNext;

            if (!hasNextPage && posts.length > 0) {
                // ✅ 이번 응답이 마지막 페이지였음을 명시
                loadingIndicator.textContent = '모든 게시글을 불러왔습니다.';
            }

        } else {
            // ✅ API 응답 구조가 예상과 다를 때 (서버 오류 또는 형식 변경)
            console.error("잘못된 API 응답 형식:", response);
            loadingIndicator.textContent = '게시글 데이터를 불러오는데 실패했습니다.';
            hasNextPage = false; // 더 이상 로드 시도 안 함
        }

    } catch (error) {
        // ✅ API 호출 자체가 실패했을 때 (네트워크 오류, 4xx/5xx 에러 등)
        console.error("게시글 로딩 실패:", error);
        loadingIndicator.textContent = `게시글 로딩 중 오류 발생: ${error.message}`;
        hasNextPage = false; // 에러 발생 시 로딩 중단
    } finally {
        isLoading = false;
        // ✅ 로딩 인디케이터 관리: 다음 페이지가 없거나 로딩 중 에러 메시지가 표시되어야 하는 경우 숨기지 않음
        if (hasNextPage) {
            loadingIndicator.style.display = 'none';
        } else {
             // 마지막 페이지 메시지나 에러 메시지가 보이도록 유지
             loadingIndicator.style.display = 'block';
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
    // updateUserProfileHeader(); // 헤더 업데이트
    loadPosts(); // 첫 페이지 게시글 로드
    observer.observe(loadingIndicator); // 스크롤 감지 시작
});