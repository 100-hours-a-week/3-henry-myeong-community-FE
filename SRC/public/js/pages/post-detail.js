import {
    getPostDetail,
    getUserInfo,
    deletePost,
    likePost,     
    unlikePost,   
    createComment,
    updateComment,
    deleteComment,
    getComments
} from '/js/common/api.js';
import { isLoggedIn, clearToken } from '/js/common/auth.js';
import { formatCount, formatDateTime, updateUserProfileHeader } from '../common/common.js';

// --- DOM Elements ---
const postTitle = document.getElementById('post-title');
const postAuthorProfile = document.getElementById('post-author-profile');
const postAuthorNickname = document.getElementById('post-author-nickname');
const postCreatedAt = document.getElementById('post-created-at');
const postActions = document.getElementById('post-actions');
const postContent = document.getElementById('post-content');
const likeCountSpan = document.getElementById('like-count');
const viewCountSpan = document.getElementById('view-count');
const commentCountDisplay = document.getElementById('comment-count-display');
const likeButton = document.getElementById('like-button');
const commentCountHeader = document.getElementById('comment-count');
const commentForm = document.getElementById('comment-form');
const commentInput = document.getElementById('comment-content-input');
const commentSubmitButton = document.getElementById('comment-submit-button');
const commentList = document.getElementById('comment-list');
const userProfileImg = document.getElementById('user-profile-img');
const backButton = document.getElementById('back-button');
const commentLoadingIndicator = document.getElementById('comment-loading-indicator'); 


// Modal Elements
const modalOverlay = document.getElementById('confirmation-modal');
const modalMessage = document.getElementById('modal-message');
const modalConfirmButton = document.getElementById('modal-confirm-button');
const modalCancelButton = document.getElementById('modal-cancel-button');

// --- State Variables ---
let currentPostData = null;
let currentUser = null;
let isEditingComment = false;
let editingCommentId = null;
let commentCursor = null; // 댓글 로딩용 커서
let isLoadingComments = false; // 댓글 로딩 중복 방지
let hasMoreComments = true; // 다음 댓글 페이지 존재 여부

// --- Modal Logic ---
let confirmCallback = null; // Store the action to perform on confirm

function showModal(message, onConfirm) {
    modalMessage.textContent = message;
    confirmCallback = onConfirm;
    modalOverlay.style.display = 'flex';
    document.body.classList.add('modal-open');
}

function hideModal() {
    modalOverlay.style.display = 'none';
    document.body.classList.remove('modal-open');
    confirmCallback = null; // Reset callback
}

modalConfirmButton.addEventListener('click', () => {
    if (confirmCallback) {
        confirmCallback(); // Execute the stored action
    }
    hideModal();
});

modalCancelButton.addEventListener('click', hideModal);

// --- Rendering Functions ---

function renderPost(postData) {
    currentPostData = postData; // 전역 상태 저장

    postTitle.textContent = postData.title;
    postAuthorProfile.src = postData.user.profileImageUrl || '/images/default-profile.png';
    postAuthorNickname.textContent = postData.user.nickname;
    postCreatedAt.textContent = formatDateTime(postData.createdAt);
    postContent.innerHTML = ''; // 이전 내용 지우기

    // --- 게시글 내용 렌더링 ---
    const contentParagraphs = postData.content.split('\n');
    contentParagraphs.forEach(pText => {
        if (pText.match(/\.(jpeg|jpg|gif|png)$/i) && pText.startsWith('http')) {
             const img = document.createElement('img');
             img.src = pText;
             img.alt = "게시글 이미지";
             postContent.appendChild(img);
        } else if (pText.trim() !== '') {
            const p = document.createElement('p');
            p.textContent = pText;
            postContent.appendChild(p);
        }
    });
    // --- 첨부 이미지 렌더링 ---
    if(postData.images && postData.images.length > 0) {
        postData.images.forEach(imageUrl => {
            const img = document.createElement('img');
            img.src = imageUrl;
            img.alt = "첨부 이미지";
            postContent.appendChild(img);
        });
    }

    // --- 통계 및 좋아요 버튼 업데이트 ---
    likeCountSpan.textContent = `좋아요 ${formatCount(postData.likeCount || 0)}`;
    viewCountSpan.textContent = `조회수 ${formatCount(postData.viewCount || 0)}`;

    // 댓글 수 업데이트
    const initialCommentCount = postData.commentCount || 0;
    commentCountHeader.textContent = initialCommentCount;
    commentCountDisplay.textContent = `댓글 ${formatCount(initialCommentCount)}`;

    if (postData.isLiked) {
        likeButton.classList.add('liked');
    } else {
        likeButton.classList.remove('liked');
    }

    // --- 수정/삭제 버튼 렌더링 ---
    postActions.innerHTML = '';
    if (currentUser && postData.isAuthor) {
        const editButton = document.createElement('button');
        editButton.textContent = '수정';
        editButton.onclick = () => { window.location.href = `/post-editor.html?postId=${postData.postId}`; };
        const deleteButton = document.createElement('button');
        deleteButton.textContent = '삭제';
        deleteButton.onclick = handleDeletePost;
        postActions.appendChild(editButton);
        postActions.appendChild(deleteButton);
    }
}

function createCommentElement(comment) {
    const li = document.createElement('li');
    li.className = 'comment-item';
    li.dataset.commentId = comment.commentId; // Store comment ID

    const authorProfile = comment.user.profileImageUrl || '/images/default-profile.png';
    const isCommentAuthor = currentUser && comment.isAuthor; // Assumes API sends isAuthor for comments

    li.innerHTML = `
        <div class="comment-author-profile">
            <img src="${authorProfile}" alt="${comment.user.nickname}">
        </div>
        <div class="comment-main">
            <div class="comment-header">
                <div class="comment-author-info">
                    <span>${comment.user.nickname}</span>
                    <span class="comment-timestamp">${formatDateTime(comment.createdAt)}</span>
                </div>
                <div class="comment-actions">
                    ${isCommentAuthor ? '<button class="edit-comment-button">수정</button>' : ''}
                    ${isCommentAuthor ? '<button class="delete-comment-button">삭제</button>' : ''}
                </div>
            </div>
            <p class="comment-content">${comment.content}</p>
        </div>
    `;

    // Add event listeners for edit/delete buttons if they exist
    const editBtn = li.querySelector('.edit-comment-button');
    const deleteBtn = li.querySelector('.delete-comment-button');

    if (editBtn) {
        editBtn.onclick = () => handleEditCommentStart(comment);
    }
    if (deleteBtn) {
        deleteBtn.onclick = () => handleDeleteComment(comment.commentId);
    }

    return li;
}

// --- Event Handlers ---

// backButton.addEventListener('click', () => {
//     history.back();
// });

function handleDeletePost() {
    showModal("게시글을 정말로 삭제하시겠습니까?", async () => {
        try {
            await deletePost(currentPostData.postId);
            alert("게시글이 삭제되었습니다.");
            window.location.href = '/index.html'; // Redirect to list after deletion
        } catch (error) {
            console.error("게시글 삭제 실패:", error);
            alert(`게시글 삭제 중 오류 발생: ${error.message}`);
        }
    });
}

likeButton.addEventListener('click', async () => {
    if (!isLoggedIn()) {
        alert("로그인이 필요합니다.");
        window.location.href = '/login.html';
        return;
    }
    if (!currentPostData) return;

    const currentlyLiked = likeButton.classList.contains('liked');
    const postId = currentPostData.postId;
    let originalLikeCount = currentPostData.likeCount || 0; // 현재 좋아요 수 저장

    // API 호출 전 버튼 임시 비활성화
    likeButton.disabled = true;

    try {
        let updatedLikeCount;
        let updatedIsLiked;

        if (currentlyLiked) {
            // --- 좋아요 취소 로직 ---
            const response = await unlikePost(postId); // 취소 API 호출

            if (response && response.status === 'success') {
                updatedIsLiked = false;
                updatedLikeCount = Math.max(0, originalLikeCount - 1);
            } else {
                 throw new Error("좋아요 취소 응답 형식이 올바르지 않습니다.");
            }

        } else {
            const response = await likePost(postId);

            if (response && response.data && typeof response.data.likeCount === 'number' && typeof response.data.isLiked === 'boolean') {
                updatedLikeCount = response.data.likeCount;
                updatedIsLiked = response.data.isLiked;
            } else {
                throw new Error("좋아요 응답 형식이 올바르지 않습니다.");
            }
        }

        // 좋아요 숫자 업데이트
        likeCountSpan.textContent = `좋아요 ${formatCount(updatedLikeCount)}`;

        // 버튼 스타일 업데이트
        if (updatedIsLiked) {
            likeButton.classList.add('liked');
        } else {
            likeButton.classList.remove('liked');
        }

        // 내부 상태 업데이트
        currentPostData.likeCount = updatedLikeCount;
        currentPostData.isliked = updatedIsLiked;

    } catch (error) {
        console.error("좋아요 처리 실패:", error);
        alert(`좋아요 처리 중 오류 발생: ${error.message}`);
    } finally {
        // 버튼 다시 활성화
        likeButton.disabled = false;
    }
});

commentInput.addEventListener('input', () => {
    const content = commentInput.value.trim();
    commentSubmitButton.disabled = !content;
});

commentForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!isLoggedIn()) {
        alert("로그인이 필요합니다.");
        window.location.href = '/login.html';
        return;
    }

    const content = commentInput.value.trim();
    if (!content) return;

    const postId = currentPostData.postId;
    commentSubmitButton.disabled = true;
    commentSubmitButton.textContent = isEditingComment ? '수정 중...' : '등록 중...';

    try {
        let response;
        if (isEditingComment) {
            // Update comment API call
            response = await updateComment(editingCommentId, { content });
             // Find and update the comment in the list (or reload comments)
             const commentElement = commentList.querySelector(`li[data-comment-id="${editingCommentId}"]`);
             if(commentElement) {
                 commentElement.querySelector('.comment-content').textContent = response.data.content;
             }
             // Reset editing state
             isEditingComment = false;
             editingCommentId = null;
             commentInput.value = '';
             commentSubmitButton.textContent = '댓글 등록';

        } else {
            // Create comment API call
            response = await createComment(postId, { content });
            // Add the new comment to the list
            commentList.appendChild(createCommentElement(response.data));
            // Update counts
            const currentCount = parseInt(commentCountHeader.textContent || '0') + 1;
            commentCountHeader.textContent = currentCount;
            commentCountDisplay.textContent = `댓글 ${formatCount(currentCount)}`;
            commentInput.value = ''; // Clear input
        }
    } catch (error) {
        console.error("댓글 처리 실패:", error);
        alert(`댓글 처리 중 오류 발생: ${error.message}`);
    } finally {
        commentSubmitButton.disabled = true; // Disable after submit/edit
        if (!isEditingComment) { // Only reset text if not editing
             commentSubmitButton.textContent = '댓글 등록';
        }
    }
});

function handleEditCommentStart(comment) {
    isEditingComment = true;
    editingCommentId = comment.commentId;
    commentInput.value = comment.content; // Populate textarea
    commentSubmitButton.textContent = '댓글 수정'; // Change button text
    commentSubmitButton.disabled = false; // Enable button
    commentInput.focus(); // Focus the textarea
}

function handleDeleteComment(commentId) {
     showModal("댓글을 정말로 삭제하시겠습니까?", async () => {
        try {
            await deleteComment(currentPostData.postId, commentId);
            const commentElement = commentList.querySelector(`li[data-comment-id="${commentId}"]`);
            if (commentElement) commentElement.remove();

            const currentCount = Math.max(0, parseInt(commentCountHeader.textContent || '1') - 1);
            commentCountHeader.textContent = currentCount;
            commentCountDisplay.textContent = `댓글 ${formatCount(currentCount)}`;
        } catch (error) { 
            console.error("댓글 삭제 실패:", error);
            alert(`댓글 삭제 중 오류 발생: ${error.message}`);
        }
    });
}

// --- 댓글 로딩 함수 ---
async function loadComments() {
    // Check loading/end state
    if (isLoadingComments || !hasMoreComments) {
         if (!hasMoreComments && commentList.children.length > 0) {
              commentLoadingIndicator.textContent = '모든 댓글을 불러왔습니다.';
              commentLoadingIndicator.style.display = 'block';
         } else if (!hasMoreComments && commentList.children.length === 0) {
              commentLoadingIndicator.textContent = '댓글이 없습니다.';
              commentLoadingIndicator.style.display = 'block';
         }
        return;
    }

    isLoadingComments = true;
    commentLoadingIndicator.style.display = 'block';
    commentLoadingIndicator.textContent = '댓글을 불러오는 중...';

    try {
        const postId = currentPostData.postId;
        // Make sure getComments sends postId as first argument, then cursor
        const response = await getComments(postId, commentCursor);

        // Verify the response structure (adjust keys if necessary)
        // Assuming response structure: { data: { comments: [...], cursor: { nextCursor, hasNext }, pagination?: { totalElements } } }
        if (response && response.data && response.data.cursor && Array.isArray(response.data.commentList)) {
            const comments = response.data.commentList;
            const cursorInfo = response.data.cursor;

            if (comments.length > 0) {
                comments.forEach(comment => {
                    // Set isAuthor based on fetched currentUser
                    comment.isAuthor = currentUser && currentUser.userId === comment.user.userId;
                    commentList.appendChild(createCommentElement(comment));
                });
                commentCursor = cursorInfo.nextCursor; // Update cursor for next request
            } else {
                 // No more comments received
                 if (commentList.children.length === 0) { // If list was empty initially
                     commentLoadingIndicator.textContent = '댓글이 없습니다.';
                 } else { // If list had comments before
                     commentLoadingIndicator.textContent = '댓글이 더 없습니다.';
                 }
                commentCursor = null; // No next cursor
            }

            hasMoreComments = cursorInfo.hasNext; // Update hasNext status

            if (!hasMoreComments) { // If this was the last page
                 if (comments.length > 0 || commentList.children.length > 0) {
                    commentLoadingIndicator.textContent = '모든 댓글을 불러왔습니다.';
                 } else {
                     commentLoadingIndicator.textContent = '댓글이 없습니다.'; 
                 }
            }

            // Update total comment count (only reliable on first load if API provides it)
            const paginationInfo = response.data.pagination;
            // Use totalElements only on the very first load (commentCursor is null)
            if (commentCursor === null && paginationInfo && typeof paginationInfo.totalElements === 'number') {
                const totalComments = paginationInfo.totalElements;
                commentCountHeader.textContent = totalComments;
                commentCountDisplay.textContent = `댓글 ${formatCount(totalComments)}`;
            } else {
                 // For subsequent loads or if no total count, update with current visible count
                 const loadedCommentCount = commentList.children.length;
                 // Avoid overwriting a potentially correct total count from first load
                 if (commentCursor !== null || !paginationInfo?.totalElements) {
                    //  commentCountHeader.textContent = loadedCommentCount;
                 } else if (commentCursor === null && comments.length === 0){ // First load, 0 comments
                     commentCountHeader.textContent = 0;
                     commentCountDisplay.textContent = `댓글 0`;
                 }
            }

        } else {
            console.error("잘못된 댓글 API 응답 형식:", response);
            commentLoadingIndicator.textContent = '댓글 데이터를 불러오는데 실패했습니다.';
            hasMoreComments = false;
        }

    } catch (error) {
        console.error("댓글 로딩 실패:", error);
        commentLoadingIndicator.textContent = `댓글 로딩 중 오류 발생: ${error.message}`;
        hasMoreComments = false;
         if (error.message.includes('401')) { // Handle unauthorized during comment load
             clearToken();
             window.location.href = '/login.html';
         }
    } finally {
        isLoadingComments = false;
        if (hasMoreComments) {
            // 다음 페이지가 있으면 로딩 완료 후 숨김
            // commentLoadingIndicator.style.display = 'none';
        } else {
            // 다음 페이지가 없으면 마지막 메시지 표시 (block 유지)
            commentLoadingIndicator.style.display = 'block';
            commentObserver.unobserve(commentLoadingIndicator); 
        }
    }
}

// --- ✅ 댓글용 Intersection Observer (신규) ---
const commentObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting && hasMoreComments) {
        loadComments();
    }
}, { threshold: 0.8 });


// --- Initial Load ---
async function initializePage() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postid');

    if (!postId) {
        alert("잘못된 접근입니다.");
        window.location.href = '/index.html';
        return;
    }

    try {
        //  Fetch user info first to check login status and get user ID
        let userResponse = null;
        if (isLoggedIn()) {
             try { // getUserInfo 실패 가능성 고려
                userResponse = await getUserInfo();
                currentUser = userResponse.data;
             } catch (userError) {
                console.error("getUserInfo 실패:", userError);
                if (userError.message.includes('401')) { // 토큰 만료 시 처리
                    clearToken();
                    window.location.href = '/login.html';
                    return;
                }
            }
        }
        await updateUserProfileHeader(userProfileImg, userResponse); // Update header based on login status

        // Fetch post details (this needs to return comments too, or fetch separately)
        const postResponse = await getPostDetail(postId);
        currentPostData = postResponse.data; 
        renderPost(currentPostData); // 게시글 내용 렌더링

        // 첫 댓글 페이지 로드 시작
        commentList.innerHTML = '';
        hasMoreComments = true;
        commentCursor = null;
        await loadComments();

        // ✅ 댓글 로딩 감지 시작
        if(hasMoreComments) {
             commentObserver.observe(commentLoadingIndicator);
        }

    } catch (error) {
        console.error("페이지 로딩 실패:", error);
        alert(`페이지 로딩 중 오류 발생: ${error.message}`);
         if (error.message.includes('401')) { // Handle token expiration during load
             clearToken();
             window.location.href = '/login.html';
         } else if (error.message.includes('404')) { // Handle post not found
             postTitle.textContent = "게시글을 찾을 수 없습니다.";
             postContent.innerHTML = "<p>삭제되었거나 존재하지 않는 게시글입니다.</p>";
         }
         // Hide or disable interaction elements if loading fails
         likeButton.disabled = true;
         commentForm.style.display = 'none';
    }
}

document.addEventListener('DOMContentLoaded', initializePage);