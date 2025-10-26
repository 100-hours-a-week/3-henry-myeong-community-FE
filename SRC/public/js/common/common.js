import { isLoggedIn } from "./auth.js";
import { getUserInfo } from "./api.js";

export function formatCount(count) {
    if (count >= 1000) {
        return (count / 1000).toFixed(1) + 'K';
    }
    return count;
}

// 날짜/시간 포맷팅 (yyyy-mm-dd hh:mm:ss)
export function formatDateTime(isoString) {
    const date = new Date(isoString);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const hh = String(date.getHours()).padStart(2, '0');
    const min = String(date.getMinutes()).padStart(2, '0');
    const ss = String(date.getSeconds()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd} ${hh}:${min}:${ss}`;
}

export async function updateUserProfileHeader(profileImgElement, userInfoResponse) {
    if (!profileImgElement) {
        console.warn("updateUserProfileHeader: Profile image element not provided.");
        return false; // 요소 없으면 처리 불가
    }

    if (isLoggedIn()) {
        try {
            // const userInfoResponse = await getUserInfo();
            if (userInfoResponse && userInfoResponse.data) {
                profileImgElement.src = userInfoResponse.data.profileImageUrl || '/images/default-profile.png';
                profileImgElement.alt = `${userInfoResponse.data.nickname} 프로필`;
                return true; // 로그인 및 정보 로드 성공
            } else {
                 throw new Error("User info data is missing");
            }
        } catch (error) {
            console.error("사용자 정보 로딩 실패:", error);
            profileImgElement.src = '/images/default-profile.png'; // 에러 시 기본 이미지
            profileImgElement.alt = '프로필 로딩 실패';
            if (error.message.includes('401')) {
                 clearToken();
                 window.location.href = '/login.html'; // 401이면 로그인으로
            }
            return false; // 로그인 실패 또는 에러
        }
    } else {
        // 로그인 안 된 상태 처리 (예: 기본 이미지 설정 또는 로그인 버튼 표시)
        profileImgElement.src = '/images/default-profile.png';
        profileImgElement.alt = '로그인 필요';
        // profileImgElement.parentElement.innerHTML = '<a href="/login.html">로그인</a>';
        return false; // 로그인 안 됨
    }
}