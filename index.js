
// function revoke() {
//   chrome.runtime.sendMessage({"type": "removeCachedToken"});
//   show();
// }
//
// function show() {
//   return this.userNm;
// }

function spreadWords(context){
    console.log('[spreadWords]wik');
    console.log(context);
    let wik = context.wik;
    let wordwik='';// = `<th id="chk">chk</th><th id="wordlist">단어리스트</th><th id="cycle">단어반복횟수</th>`;
    for(var i=0; i<wik.length; i++){
        // wordwik +=
        //   `<tr id="wiktr${i}">
        //     <td id="wordlist${i}"><p id="wikword${i}">${wik[i]}</p></td><td id="chk${i}"><input type="checkbox" id="chkbox${i}" value="${i}"></td><td id="cycle${i}"><p>몇번</p></td>
        //   </tr>`;
        wordwik += `
        <div id="row${i}">
            <span id="divWord"><p>${wik[i]}</p></span>
            <span id="chk"></span>
            <span id="cycle"><p>몇번</p></div>
        </div>`;
    } //end for

    document.getElementById('divTable').innerHTML = wordwik;
}

function addClass(num){
    // DOM의 클래스 추가하는 함수로직 : 무언가를 클릭했을때 이벤트 지정이 필요함.
    // var divelement = document.getElementById('row'+num);
    // var att = document.createAttribute("class");
    // att.value = "iknow";
    // divelement.setAttributeNode(att);
}

function messageListener(message) {
    console.log('[message] : ');
    console.log(message);
    // background.js와 통신하여 WIK node.js 서버 안의 회원정보가 있는지 판별.
    let isUserId=false, userNm;
    if(message.name){
      isUserId = true;
      userNm = message.name;
    }
    console.log('[messageListener isUserId] : ' + isUserId);
    console.log('[messageListener userNm] : ' + userNm);
    console.log('[messageListener message]');
    console.log(message);

    if(message.wik){
        spreadWords(message.wik);
    }
    // Promise 패턴. then 부분은 callback.
    initSetting(isUserId, userNm).then(() => {
        document.getElementById('facebook-signin').onclick = () => { getUserInfo("facebook"); };
        document.getElementById('google-signin').onclick = () => { getUserInfo("google"); };
    });
}

function getUserInfo(provider, intractive=true) {
    chrome.runtime.sendMessage({"type": "getUserInfo", provider, "interactive": intractive});
}

function initSetting(userId, userNm){
    return new Promise((resolve, reject) => {
      // userId 값이 존재하면 background.js에서 DB로 조회한 userName을 출력시킨다.
      if(userId){
          console.log('[initSetting] true : userNm-');
          htmls =
              `${userNm} 님, 환영합니다~!`;
      }else{
          console.log('[initSetting] false : userId -');
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
