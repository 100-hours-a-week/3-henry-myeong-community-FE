import { signup, checkEmailAvailability, checkNicknameAvailability } from '/js/common/api.js';

// DOM 요소 가져오기
const signupForm = document.getElementById('signup-form');
const profileImageInput = document.getElementById('profileImage');
const profilePreview = document.getElementById('profile-preview');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const passwordConfirmInput = document.getElementById('passwordConfirm');
const nicknameInput = document.getElementById('nickname');
const signupButton = document.getElementById('signup-button');

// 에러 메시지 요소 가져오기
const profileError = document.getElementById('profile-error');
const emailError = document.getElementById('email-error');
const passwordError = document.getElementById('password-error');
const passwordConfirmError = document.getElementById('passwordConfirm-error');
const nicknameError = document.getElementById('nickname-error');
const formError = document.getElementById('form-error'); // 일반 폼 에러

// 유효성 상태 추적
const validationState = {
    email: false,
    password: false,
    passwordConfirm: false,
    nickname: false,
};

// --- 유효성 검사 함수 ---
function validateEmail(email) {
    if (!email) return { valid: false, message: "이메일을 입력해주세요" };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return { valid: false, message: "올바른 이메일 주소 형식을 입력해주세요" };
    // 중복 검사는 API 호출로 처리 (onBlur 시)
    return { valid: true };
}

function validatePassword(password) {
    if (!password) return { valid: false, message: "비밀번호를 입력해주세요" };
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,20}$/;
    if (!passwordRegex.test(password)) return { valid: false, message: "비밀번호는 8자 이상, 20자 이하이며, 대문자, 소문자, 숫자, 특수문자를 각각 최소 1개 포함해야 합니다." };
    return { valid: true };
}

function validatePasswordConfirm(password, confirm) {
    if (!confirm) return { valid: false, message: "비밀번호 확인을 입력해주세요" };
    if (password !== confirm) return { valid: false, message: "비밀번호가 다릅니다" };
    return { valid: true };
}

function validateNickname(nickname) {
    if (!nickname) return { valid: false, message: "닉네임을 입력해주세요" };
    if (/\s/.test(nickname)) return { valid: false, message: "띄어쓰기를 없애주세요" };
    if (nickname.length > 10) return { valid: false, message: "닉네임은 최대 10자까지 작성 가능합니다" };
    // 중복 검사는 API 호출로 처리 (onBlur 시)
    return { valid: true };
}

// 에러 표시/숨김 함수
function showError(element, message) {
    element.textContent = message;
    element.style.display = 'block';
    // 해당 input에 에러 클래스 추가 (선택 사항)
    const inputId = element.id.replace('-error', '');
    document.getElementById(inputId)?.classList.add('error');
}

function hideError(element) {
    element.textContent = '';
    element.style.display = 'none';
     // 해당 input에서 에러 클래스 제거 (선택 사항)
    const inputId = element.id.replace('-error', '');
    document.getElementById(inputId)?.classList.remove('error');
}

// 모든 필드의 유효성 상태를 기반으로 버튼 상태 업데이트
function updateButtonState() {
    const allValid = Object.values(validationState).every(isValid => isValid);
    signupButton.disabled = !allValid;
    signupButton.style.backgroundColor = allValid ? '#7F6AEE' : '#ACA0EB';
}

// --- 이벤트 리스너 ---

// 프로필 이미지 미리보기
profileImageInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            profilePreview.src = e.target.result;
        }
        reader.readAsDataURL(file);
        hideError(profileError);
    }
});

// 이메일 유효성 검사 (onBlur - 포커스 아웃 시) + 중복 확인
emailInput.addEventListener('blur', async () => {
    const email = emailInput.value.trim();
    const result = validateEmail(email);
    if (!result.valid) {
        showError(emailError, result.message);
        validationState.email = false;
    } else {
        try {
            // 이메일 중복 확인 API 호출 (api.js에 구현 필요)
            const availableResult = await checkEmailAvailability(email); // 예시 함수
            if (!availableResult.data) {
                showError(emailError, "중복된 이메일입니다");
                validationState.email = false;
            } else {
                hideError(emailError);
                validationState.email = true;
            }
        } catch (error) {
            console.error("이메일 중복 확인 실패:", error);
            showError(formError, "이메일 중복 확인 중 오류 발생");
            validationState.email = false; // 오류 시 비활성
        }
    }
    updateButtonState();
});

// 비밀번호 유효성 검사 (onInput - 입력 시)
passwordInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const result = validatePassword(password);
    validationState.password = result.valid;
    if (!result.valid && password) { // 입력 중일 때는 에러 메시지 표시 안 함 (UX 고려)
        hideError(passwordError);
    } else if (!result.valid) {
        showError(passwordError, result.message);
    } else {
        hideError(passwordError);
    }
    // 비밀번호 확인 필드도 다시 검사
    const confirmResult = validatePasswordConfirm(password, passwordConfirmInput.value);
    validationState.passwordConfirm = confirmResult.valid;
    if (!confirmResult.valid && passwordConfirmInput.value) {
         showError(passwordConfirmError, confirmResult.message);
    } else {
         hideError(passwordConfirmError);
    }
    updateButtonState();
});

// 비밀번호 확인 검사 (onInput - 입력 시)
passwordConfirmInput.addEventListener('input', () => {
    const password = passwordInput.value;
    const confirm = passwordConfirmInput.value;
    const result = validatePasswordConfirm(password, confirm);
    validationState.passwordConfirm = result.valid;
    if (!result.valid && confirm) {
        showError(passwordConfirmError, result.message);
    } else {
        hideError(passwordConfirmError);
    }
    updateButtonState();
});

// 닉네임 유효성 검사 (onBlur - 포커스 아웃 시) + 중복 확인
nicknameInput.addEventListener('blur', async () => {
    const nickname = nicknameInput.value.trim();
    const result = validateNickname(nickname);
    if (!result.valid) {
        showError(nicknameError, result.message);
        validationState.nickname = false;
    } else {
        try {
            // 닉네임 중복 확인 API 호출 (api.js에 구현 필요)
            const availableResult = await checkNicknameAvailability(nickname); // 예시 함수
            if (!availableResult.data) {
                showError(nicknameError, "중복된 닉네임입니다");
                validationState.nickname = false;
            } else {
                hideError(nicknameError);
                validationState.nickname = true;
            }
        } catch (error) {
            console.error("닉네임 중복 확인 실패:", error);
            showError(formError, "닉네임 중복 확인 중 오류 발생");
            validationState.nickname = false; // 오류 시 비활성
        }
    }
    updateButtonState();
});

// 초기 버튼 상태 설정
updateButtonState();

// 폼 제출 처리
signupForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    hideError(formError); // 이전 일반 에러 숨김

    // 최종 유효성 재확인 (혹시 모를 경우 대비)
    const emailResult = validateEmail(emailInput.value);
    const passwordResult = validatePassword(passwordInput.value);
    const confirmResult = validatePasswordConfirm(passwordInput.value, passwordConfirmInput.value);
    const nicknameResult = validateNickname(nicknameInput.value);

    // 에러 표시 및 상태 업데이트
    validationState.email = emailResult.valid;
    if (!emailResult.valid) showError(emailError, emailResult.message); else hideError(emailError);
    validationState.password = passwordResult.valid;
    if (!passwordResult.valid) showError(passwordError, passwordResult.message); else hideError(passwordError);
    validationState.passwordConfirm = confirmResult.valid;
    if (!confirmResult.valid) showError(passwordConfirmError, confirmResult.message); else hideError(passwordConfirmError);
    validationState.nickname = nicknameResult.valid;
    if (!nicknameResult.valid) showError(nicknameError, nicknameResult.message); else hideError(nicknameError);

    // 모든 필드가 유효하지 않으면 중단
    if (!Object.values(validationState).every(isValid => isValid)) {
        updateButtonState(); // 버튼 상태 다시 업데이트
        showError(formError, "입력 내용을 다시 확인해주세요.");
        return;
    }

    const userData = {
        email: emailInput.value.trim(),
        password: passwordInput.value,
        nickname: nicknameInput.value.trim(),
        // profileImageUrl: null // 또는 아예 생략 (백엔드 DTO 설계에 따라)
    };


    // 회원가입 API 호출
    try {
        signupButton.disabled = true; // 중복 제출 방지
        signupButton.textContent = '가입 처리 중...';

        // signup 함수는 FormData를 처리하도록 수정 필요 (api.js)
        await signup(userData);

        // 성공 시 로그인 페이지로 이동
        alert("회원가입이 완료되었습니다. 로그인 페이지로 이동합니다.");
        window.location.href = '/login.html';

    } catch (error) {
        console.error('회원가입 실패:', error);
        // 백엔드에서 온 에러 메시지 처리 (중복 등)
        if (error.response && error.response.data && error.response.data.errors) {
            // errors 배열을 순회하며 해당하는 필드에 에러 표시
             error.response.data.errors.forEach(err => {
                 if (err.field === 'email') showError(emailError, err.reason === 'already_exists' ? '중복된 이메일입니다' : '유효하지 않은 이메일');
                 if (err.field === 'nickname') showError(nicknameError, err.reason === 'already_exists' ? '중복된 닉네임입니다' : '유효하지 않은 닉네임');
                 // 필요한 다른 필드 에러 처리...
             });
             showError(formError, "입력 내용을 확인해주세요."); // 일반 에러 메시지
        } else {
            showError(formError, error.message || "회원가입 중 오류가 발생했습니다.");
        }
        signupButton.disabled = false; // 버튼 다시 활성화
        signupButton.textContent = '회원가입';
    }
});