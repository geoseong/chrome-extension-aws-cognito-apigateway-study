var contextMenuItem = {
    "id" : "wik",
    "title" : "WIK",
    "contexts" : ["selection"]
};

chrome.contextMenus.create(contextMenuItem);

chrome.contextMenus.onClicked.addListener(function (clickData) {

    if(clickData.menuItemId == "wik" && clickData.selectionText){

        var auth = false;
        if(auth) {
            // 인증 X 경우
            // 알림
            var notifOptions = {
                type: "basic",
                iconUrl: "sample-48.png",
                title: "Login",
                message: "Login is required."
            };
            chrome.notifications.create('notifLogin', notifOptions);
        } else {
            // 인증 OK 경우
            var splited_text0 = clickData.selectionText.trim().replace(/[^a-zA-Z]/g,'_').replace(/_{2,}/g,'_');
            var splited_text;
            // 맨앞 or 맨뒤 특수문자가 있을 경우 split하면 공백이 나오기 때문에 제거
            if(splited_text0.charAt(0).valueOf() === '_' && splited_text0.charAt(splited_text0.length-1).valueOf() !== '_') {
                splited_text = splited_text0.substring(1, splited_text0.length).split('_');
            } else if(splited_text0.charAt(0).valueOf() !== '_' && splited_text0.charAt(splited_text0.length-1).valueOf() === '_') {
                splited_text = splited_text0.substring(0, splited_text0.length-1).split('_');
            } else if(splited_text0.charAt(0).valueOf() === '_' && splited_text0.charAt(splited_text0.length-1).valueOf() === '_') {
                splited_text = splited_text0.substring(1, splited_text0.length-1).split('_');
            } else {
                splited_text = splited_text0.split('_');
            }

            // 단어들 서버로 전송
            var xhttp = new XMLHttpRequest();
            xhttp.onreadystatechange = function() {
                if (xhttp.readyState === 4) {

                    // storage 저장
                    var items = {words: JSON.parse(xhttp.response).text.split(","), count:[1,2,3,4,5]}; //카운트:더미데이터
                    chrome.storage.local.set(items, function() {
                        console.log('저장 되었습니다.');
                    });

                    // 알림
                    var notifOptions = {
                        type: "basic",
                        iconUrl: "sample-48.png",
                        title: "Word Extraction",
                        message: "Word extraction succeeded."
                    };
                    chrome.notifications.create('notifImport', notifOptions);

                    // 팝업창 생성
                    chrome.windows.create({
                        url : "popup.html",
                        width : 300,
                        height: 700,
                        left : 100,
                        top : 100,
                        focused : true,
                        type : "popup"
                    });
                }
            };
            // POST - 서버
            xhttp.open("POST", "http://localhost:8000/api/test", true);
            xhttp.setRequestHeader("Content-type", "application/json");
            xhttp.send(JSON.stringify({text:splited_text, user_id:"123"}));

        }
    }
});