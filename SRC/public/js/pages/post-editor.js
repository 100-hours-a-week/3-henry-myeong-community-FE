// /js/pages/post-editor.js
import { createPost, getUserInfo } from '/js/common/api.js';
import { isLoggedIn, clearToken } from '/js/common/auth.js';

// --- DOM 요소 ---
const postEditorForm = document.getElementById('post-editor-form');
const titleInput = document.getElementById('title');
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

let addedImageUrls = []; // 추가된 이미지 URL 저장 배열

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

// --- Header Update ---
async function updateUserProfileHeader() {
    if (!isLoggedIn()) {
        alert("로그인이 필요합니다.");
        window.location.href = '/login.html';
        return;
    }
    try {
        // const userInfoResponse = await getUserInfo();
        if (userInfoResponse && userInfoResponse.data) {
            userProfileImg.src = userInfoResponse.data.profileImageUrl || '/images/default-profile.png';
            userProfileImg.alt = `${userInfoResponse.data.nickname} 프로필`;
        }
    } catch (error) {
        console.error("사용자 정보 로딩 실패:", error);
         if (error.message.includes('401')) {
             clearToken();
             window.location.href = '/login.html';
         }
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

// 폼 제출 시
postEditorForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // 기본 제출 동작 방지
    hideError(titleError);
    hideError(contentError);
    hideError(formError);

    const title = titleInput.value.trim();
    const content = contentInput.value.trim();

    // 최종 유효성 검사
    let isValid = true;
    if (!title) {
        showError(titleError, "제목을 입력해주세요.");
        isValid = false;
    }
    if (!content) {
        showError(contentError, "내용을 입력해주세요.");
        isValid = false;
    }

    if (!isValid) {
        showError(formError, "제목, 내용을 모두 작성해주세요.");
        updateButtonState();
        return;
    }

    // 서버로 보낼 데이터 준비
    const postData = {
        title: title,
        content: content,
        // 백엔드 API 설계에 따라 이미지 URL 리스트를 어떤 키로 보낼지 결정
        // 예: imageURLs: addedImageUrls
    };

    try {
        completeButton.disabled = true;
        completeButton.textContent = '저장 중...';

        // createPost API 호출 (api.js 함수)
        const response = await createPost(postData);

        if (response && response.data) {
            // 성공 시 생성된 게시글 상세 페이지로 이동
            alert("게시글이 성공적으로 작성되었습니다.");
            window.location.href = `/post-detail.html?postId=${response.data.postId}`;
        } else {
             throw new Error("게시글 생성 응답 형식이 올바르지 않습니다.");
        }

    } catch (error) {
        console.error("게시글 작성 실패:", error);
        showError(formError, error.message || "게시글 작성 중 오류가 발생했습니다.");
        completeButton.disabled = false;
        completeButton.textContent = '완료';
    }
});

// --- Initial Setup ---
document.addEventListener('DOMContentLoaded', () => {
    updateUserProfileHeader();
    updateButtonState(); // 초기 버튼 상태 설정
    updateTitleCharCount(); // 초기 글자 수 표시
});