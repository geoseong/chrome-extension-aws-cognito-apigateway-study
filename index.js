
function getUserInfo(provider, intractive=true) {
  chrome.runtime.sendMessage({"type": "getUserInfo", provider, "interactive": intractive});
}

function revoke() {
  chrome.runtime.sendMessage({"type": "removeCachedToken"});
  show();
}

function show() {
  return this.userNm;
}

function messageListener(message) {
  //show("<pre>" + JSON.stringify(message.error || message.user) + "</pre>");
    console.log('[message] : ');
    console.log(message);
    // background.js와 통신하여 WIK node.js 서버 안의 회원정보가 있는지 판별.
    let isUserId=false, userNm;
    if(message.name){
      isUserId = true;
      userNm = message.name;
    }
    console.log('[isUserId] : ' + isUserId);
    console.log('[userNm] : ' + userNm);

    // Promise 패턴. then 부분은 callback.
    initSetting(isUserId, userNm).then(() => {
        document.getElementById('facebook-signin').onclick = () => { getUserInfo("facebook"); };
        document.getElementById('google-signin').onclick = () => { getUserInfo("google"); };
    });
}

function initSetting(userId, userNm){
    return new Promise((resolve, reject) => {
      // userId 값이 존재하면 background.js에서 DB로 조회한 userName을 출력시킨다.
      if(userId){
          console.log('[true : userNm]');
          htmls =
              `${userNm} 님, 환영합니다~!`;
      }else{
          console.log('[false : userId]');
          console.log(userId);
          htmls =
              `
                  <button id="facebook-signin">Facebook으로 시작하기</button>
                  <button id="google-signin">Google으로 시작하기</button>
              `;
          // Promise 패턴의 callback 실행(initSetting을 다 훑고 실행)
          resolve();
      } //end if
      htmls += `
          <div id="loginmsg">
            <p>아는단어는 iPhone, Android 앱스토어에서 다운로드 받을 수 있습니다.<br>
            회원정보 수정은 아는단어 앱에서 하실 수 있습니다.</p>
          </div>
      `
      document.querySelector('#loginarea').innerHTML = htmls;
      console.log('html 추가 후');

      // document.getElementById('revoke').onclick = revoke;
    });
}

window.onload = () => {
    var userId;
    chrome.storage.sync.get(function(data){
        console.log('###index.js storage### data.userId : '+data.userId);
        userId = data.userId;
        // background.js 로 메시지 보냄 ( Node.js 서버에서 회원정보 조회를 위함)
        chrome.runtime.sendMessage({userId: userId});
        chrome.runtime.onMessage.addListener(messageListener);
        messageListener(userId);
    });
    console.log('chrome.storage.sync 이후?');

};
