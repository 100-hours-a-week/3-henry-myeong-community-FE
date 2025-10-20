// 공통 API 함수 가져오기
import { login } from '/js/common/api.js';
import { saveToken } from '/js/common/auth.js';

// DOM 요소 가져오기
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const loginButton = loginForm.querySelector('button[type="submit"]');
const errorMessageElement = document.getElementById('error-message');

// 초기 버튼 상태 설정 (비활성화)
loginButton.disabled = true;
loginButton.style.backgroundColor = '#ACA0EB'; // 비활성 색상

// --- 유효성 검사 함수 ---
// 이메일 유효성 검사 (간단한 정규식)
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}
// 비밀번호 유효성 검사 (조건 확인)
function validatePassword(password) {
    // 8~20자, 대문자, 소문자, 특수문자 포함
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    return passwordRegex.test(password);
}

// 오류 메시지 표시 함수
function displayError(message) {
    errorMessageElement.textContent = message;
    errorMessageElement.style.display = 'block';
}

// 오류 메시지 숨김 함수
function hideError() {
    errorMessageElement.textContent = '';
    errorMessageElement.style.display = 'none';
}

// 버튼 상태 업데이트 함수
function updateButtonState() {
    const isEmailValid = validateEmail(emailInput.value);
    const isPasswordPotentiallyValid = passwordInput.value.length >= 8; // 최소 길이만 우선 체크 (UX 고려)

    if (isEmailValid && isPasswordPotentiallyValid) {
        loginButton.disabled = false;
        loginButton.style.backgroundColor = '#7F6AEE'; // 활성 색상
    } else {
        loginButton.disabled = true;
        loginButton.style.backgroundColor = '#ACA0EB'; // 비활성 색상
    }
}

// --- 이벤트 리스너 ---

// 이메일 입력 시 유효성 검사 및 버튼 상태 업데이트
emailInput.addEventListener('input', () => {
    hideError(); // 입력 시작 시 이전 오류 메시지 숨김
    if (!validateEmail(emailInput.value) && emailInput.value.length > 0) {
        // 간단히 실시간 피드백을 줄 수 있으나, 요구사항은 submit 시점에 가까움
    }
    updateButtonState();
});

// 비밀번호 입력 시 버튼 상태 업데이트 (실시간 상세 검사는 UX 저해 가능)
passwordInput.addEventListener('input', () => {
    hideError(); // 입력 시작 시 이전 오류 메시지 숨김
    updateButtonState();
});

// 폼 제출 이벤트 처리
loginForm.addEventListener('submit', async (event) => {
    event.preventDefault(); // 기본 폼 제출 동작 방지
    hideError(); // 이전 오류 메시지 숨김

    const email = emailInput.value;
    const password = passwordInput.value;

    // 최종 유효성 검사
    if (!email) {
        displayError("올바른 이메일 주소를 입력해주세요");
        return;
    }
    if (!validateEmail(email)) {
        displayError("올바른 이메일 주소를 입력해주세요");
        return;
    }
    if (!password) {
        displayError("비밀번호를 입력해주세요");
        return;
    }
    // 상세 비밀번호 조건 검사는 제출 시점에 수행
    if (!validatePassword(password)) {
        displayError("비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 포함해야합니다.");
        return;
    }

    // 로그인 API 호출
    try {
        const result = await login(email, password); // api.js의 login 함수 호출

        // 로그인 성공 처리
        if (result && result.data && result.data.accessToken) {
            saveToken(response.data.accessToken);
            console.log("로그인 성공! Access Token:", result.data.accessToken);

            // 성공 후 /index.html (게시글 목록 페이지)로 이동
            window.location.href = '/index.html';
        } else {
            // API 응답 구조가 예상과 다른 경우 (예외적 상황)
            displayError("로그인 처리 중 오류가 발생했습니다.");
        }

    } catch (error) {
        // 로그인 실패 처리 (API 호출 실패)
        console.error('로그인 실패:', error);
        // 401 Unauthorized 에러 등을 구분하여 처리할 수 있습니다.
        // 여기서는 모든 실패를 동일하게 처리합니다.
         displayError(error.message || "로그인 실패. 이메일 또는 비밀번호를 확인해주세요.");
    }
});