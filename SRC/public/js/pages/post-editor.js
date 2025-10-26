// /js/pages/post-editor.js
import { createPost, getUserInfo, updatePost, getPostDetail} from '/js/common/api.js';
import { isLoggedIn, clearToken } from '/js/common/auth.js';
import { updateUserProfileHeader } from '../common/common.js';

// --- DOM 요소 ---
const postEditorForm = document.getElementById('post-editor-form');
const titleInput = document.getElementById('title');
const editorTitleH2 = document.querySelector('.editor-title');
const contentInput = document.getElementById('content');
const titleCharCount = document.getElementById('title-char-count');
const addImageUrlButton = document.getElementById('add-image-url-button');
const imageUrlInput = document.getElementById('image-url-input');
const imageUrlList = document.getElementById('image-url-list');
const completeButton = document.getElementById('complete-button');
const titleError = document.getElementById('title-error');
const contentError = document.getElementById('content-error');
const imageError = document.getElementById('image-error');
const formError = document.getElementById('form-error');
const userProfileImg = document.getElementById('user-profile-img');

// --- 상태 변수 ---
let currentPostId = null;
let currentUser = null;
let addedImageUrls = []; // 추가/관리되는 이미지 URL 저장 배열
let isEditMode = false; // 수정 모드 여부 플래그

// --- Helper Functions ---
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
}

function hideError(element) {
    element.textContent = '';
    element.style.display = 'none';
}

// 버튼 상태 업데이트
function updateButtonState() {
    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    if (title && content) {
        completeButton.disabled = false;
        // JS에서 직접 스타일 변경 대신 클래스 추가/제거가 더 좋음
        // completeButton.style.backgroundColor = '#7F6AEE';
    } else {
        completeButton.disabled = true;
        // completeButton.style.backgroundColor = '#ACA0EB';
    }
}

// 제목 글자 수 업데이트
function updateTitleCharCount() {
    const currentLength = titleInput.value.length;
    titleCharCount.textContent = `${currentLength} / 26`;
}

// 추가된 이미지 URL 목록 UI 업데이트
function renderImageUrlList() {
    imageUrlList.innerHTML = ''; // 목록 비우기
    addedImageUrls.forEach((url, index) => {
        const li = document.createElement('li');
        li.textContent = url.length > 50 ? url.substring(0, 50) + '...' : url; // 너무 길면 자르기

        const removeButton = document.createElement('button');
        removeButton.textContent = '삭제';
        removeButton.onclick = () => {
            addedImageUrls.splice(index, 1); // 배열에서 URL 제거
            renderImageUrlList(); // 목록 다시 그리기
        };
        li.appendChild(removeButton);
        imageUrlList.appendChild(li);
    });
}

// --- Load Existing Post Data (Edit Mode) ---
async function loadPostData(postId) {
    try {
        const postResponse = await getPostDetail(postId);
        console.log('API Response:', postResponse);
        const postData = postResponse.data;
        console.log(postData)

        // 권한 확인 (서버 isAuthor 값 활용)
        if (!currentUser || !postData.isAuthor) {
             alert("수정 권한이 없습니다.");
             // 상세 페이지로 돌려보내거나 목록으로 이동
             window.location.href = `/post-detail.html?postid=${postId}`;
             return false; // 로딩 실패 플래그
        }

        // 폼 필드 채우기
        titleInput.value = postData.title;
        contentInput.value = postData.content;
        // ✅ 백엔드 응답의 이미지 목록으로 addedImageUrls 초기화 (키 이름 확인!)
        addedImageUrls = postData.images || [];

        // UI 업데이트
        updateTitleCharCount();
        renderImageUrlList();
        updateButtonState();
        return true; // 로딩 성공 플래그

    } catch (error) {
        console.error("게시글 로딩 실패:", error);
        alert(`게시글 정보를 불러오는 중 오류 발생: ${error.message}`);
        if (error.message.includes('401')) { // 토큰 만료 등
            clearToken(); window.location.href = '/login.html';
        } else { // 게시글 없음 또는 기타 에러
             window.location.href = '/index.html'; // 목록으로 이동
        }
        return false; // 로딩 실패 플래그
    }
}

// --- Event Listeners ---

// 제목 입력 시
titleInput.addEventListener('input', () => {
    hideError(titleError);
    hideError(formError);
    updateTitleCharCount();
    updateButtonState();
});

// 내용 입력 시
contentInput.addEventListener('input', () => {
    hideError(contentError);
    hideError(formError);
    updateButtonState();
});

// 이미지 URL 추가 버튼 클릭 시
addImageUrlButton.addEventListener('click', () => {
    const urlToAdd = imageUrlInput.value.trim();
    // 간단한 URL 형식 검사 (더 엄격하게 하려면 정규식 사용)
    if (urlToAdd && urlToAdd.startsWith('http')) {
        addedImageUrls.push(urlToAdd);
        renderImageUrlList();
        imageUrlInput.value = ''; // 입력 필드 비우기
        hideError(imageError);
    } else {
        showError(imageError, "유효한 URL을 입력해주세요.");
    }
});

// --- Form Submit Handler (Create or Update) ---
postEditorForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError(titleError); hideError(contentError); hideError(formError);

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    // 최종 유효성 검사
    let isValid = true;
    if (!title) { showError(titleError, "제목을 입력해주세요."); isValid = false; }
    if (title.length > 26) { showError(titleError, "제목은 26자까지 작성 가능합니다."); isValid = false; }
    if (!content) { showError(contentError, "내용을 입력해주세요."); isValid = false; }

    if (!isValid) {
        showError(formError, "입력 내용을 다시 확인해주세요.");
        updateButtonState(); return;
    }

    // 서버로 보낼 데이터 (공통)
    const postData = {
        title: title,
        content: content,
        imageUrls: addedImageUrls // ✅ 이미지 URL 목록 포함 (백엔드 DTO 키 확인!)
    };

    completeButton.disabled = true;
    completeButton.textContent = isEditMode ? '수정 중...' : '저장 중...';

    try {
        let response;
        // ✅ 수정 모드와 작성 모드 분기 처리
        if (isEditMode) {
            response = await updatePost(currentPostId, postData); // 수정 API 호출
        } else {
            response = await createPost(postData); // 생성 API 호출
        }

        if (response && response.data && response.data.postId) {
            // 성공 시 생성/수정된 게시글 상세 페이지로 이동
            const message = isEditMode ? "게시글이 성공적으로 수정되었습니다." : "게시글이 성공적으로 작성되었습니다.";
            alert(message);
            window.location.href = `/post-detail.html?postid=${response.data.postId}`;
        } else {
             throw new Error(`게시글 ${isEditMode ? '수정' : '생성'} 응답 형식이 올바르지 않습니다.`);
        }

    } catch (error) {
        console.error(`게시글 ${isEditMode ? '수정' : '작성'} 실패:`, error);
        showError(formError, error.message || `게시글 ${isEditMode ? '수정' : '작성'} 중 오류가 발생했습니다.`);
        completeButton.disabled = false; // 실패 시 버튼 재활성화
        completeButton.textContent = isEditMode ? '수정 완료' : '완료';
    }
});

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', async () => {
    // 1. 로그인 확인 및 사용자 정보 로드
    const loggedIn = await updateUserProfileHeader(userProfileImg);
    if (!loggedIn) return; // 로그인 안되어 있으면 중단

    // 2. URL에서 postId 확인하여 모드 결정
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('postId');

    if (postId && !isNaN(postId)) { // postId가 있고 숫자인 경우 -> 수정 모드
        isEditMode = true;
        currentPostId = postId;
        editorTitleH2.textContent = '게시글 수정'; // 페이지 제목 변경
        completeButton.textContent = '수정 완료'; // 버튼 텍스트 변경
        // 기존 게시글 데이터 로드 시도
        const loaded = await loadPostData(postId);
        if (!loaded) return; // 데이터 로드 실패 시 중단
    } else { // postId가 없거나 유효하지 않으면 -> 작성 모드
        isEditMode = false;
        editorTitleH2.textContent = '게시글 작성';
        completeButton.textContent = '완료';
        // (작성 모드) 초기 UI 상태 설정
        updateTitleCharCount();
        updateButtonState();
        renderImageUrlList(); // 빈 목록 렌더링
    }
});