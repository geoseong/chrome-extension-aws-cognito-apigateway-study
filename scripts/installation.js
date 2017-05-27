/*********** start : Context Menu 구현 & 선택데이터 서버통신 부분 **********/
// Set up context menu tree at install time.
chrome.runtime.onInstalled.addListener(function() {
    var contextMenuItem = {
        "id" : "WIK",
        "title" : "선택된 단어는 내가 아는단어?",
        "contexts" : ["selection"]
    };
    chrome.contextMenus.create(contextMenuItem, function() {
        if (chrome.extension.lastError) {
            console.log("Got expected error: " + chrome.extension.lastError.message);
        }
    });
    console.log('아는단어를 이용하시는 여러분 환영합니다~\n아는단어는 iPhone, Android 앱스토어에서 다운로드 받을 수 있습니다.');
    chrome.storage.sync.set({
        "facebook": {"id": '', "name": ''},
        "google": {"id": '', "name": ''}
    });
});

// The onClicked callback function.
chrome.contextMenus.onClicked.addListener(function (clickData) {
    // 팝업창 생성
    chrome.windows.create({
        url : "index.html",
        width : 500,
        height: 670,
        left : 100,
        top : 100,
        focused : true,
        type : "popup"
    });
    // 우측하단 알림팝업 변수
    var notifOptions = {};
    if (clickData.menuItemId == "WIK" && clickData.selectionText) {
        var selectedText = clickData.selectionText;
        // index.js로 데이터 보내기 위한 바인딩작업
        chrome.storage.sync.set({	context: selectedText	});
        // 알림
        notifOptions = {
            type: "basic",
            iconUrl: "./logos/wik/wik_48.png",
            title: "아는단어",
            message: "단어 추출 성공."
        };
    } //end if
    chrome.notifications.create('notifImport', notifOptions);
});
/*********** end : Context Menu 구현 & 선택데이터 서버통신 부분 **********/