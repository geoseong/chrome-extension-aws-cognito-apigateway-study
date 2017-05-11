

//
// function show() {
//   return this.userNm;
// }

var user='';

// 1. chrome.runtime.onMessage.addListener
function messageListener(message) {
    console.log('[messageListener] : param message :');
    console.log(message);
    console.log('[messageListener] : userId :');
    console.log(this.user);

    let isUserId=false, userNm;

    // background.js와 통신하여 WIK node.js 서버 안의 회원정보가 있는지 판별.
    try{
        if(message.name.length > 0){
          isUserId = true;
          userNm = message.name;
        }
    }catch(e){
        console.log(e);
    }

    console.log('[messageListener isUserId] : ' + isUserId);
    console.log('[messageListener userNm] : ' + userNm);

    console.log('[messageListener message] : ');
    console.log(message);

    try{
        if(message.data.wik){
            spreadWords(message.data);
        }
    }catch(e){
        console.log(e);
    }
    // Promise 패턴. then 부분은 callback.
    initSetting(isUserId, userNm).then(() => {
        console.log('[Promise initSetting]userId : ');
        console.log(this.user);
        document.getElementById('facebook-signin').onclick = () => { getUserInfo("facebook"); };
        document.getElementById('google-signin').onclick = () => { getUserInfo("google"); };
    }).catch(() => {
        document.getElementById('signout').onclick = () => { revoke(); };
    });
}

// 2. 단어 목록 뿌리기
function spreadWords(context){
    console.log('[spreadWords]wik');
    console.log(context);
    let wik = context.wik;
    let iknow = context.iknow;
    let wordwik=''
    for(var i=0; i<wik.length; i++){
        let checked='';
        if(iknow[i])    checked='checked';
        wordwik += `
            <div id="row${i}">
                <span id="spanWord">
                    <input type="checkbox" id="chkbox${i}" value="${i}" ${checked}>
                    <label for="chkbox${i}">
                        <span id="word">${wik[i]}</span>
                        <span id="repeatCnt">몇번</span>
                    </label>
                </span>
            </div>`;
    } //end for
    document.getElementById('divTable').innerHTML = wordwik;
}

// 3. 소셜 로그인 부분
function initSetting(userId, userNm){
    return new Promise((resolve, reject) => {
      // userId 값이 존재하면 background.js에서 DB로 조회한 userName을 출력시킨다.
      if(userId){
          console.log('[initSetting] true -- userNm');
          htmls =
              `${userNm} 님, 환영합니다~!
              <br>
              <button id="signout">로그아웃</button>`;
        reject();
     }else{
          console.log('[initSetting] false -- userId');
          console.log(userId);
          htmls =
              `
            <div class = "socialtbl">
                <div class="social">
                    <div id="social_cell">                
                        <div id="facebook-signin">
                            <span id="icon"></span>
                            <span id="buttonText">Facebook에 연결</span>
                        </div>
                    </div>
                    <div id="social_cell">    
                        <div id="google-signin" class="customGPlusSignIn">
                            <span id="icon"></span>
                            <span id="buttonText">Google에 연결</span>
                        </div>
                    </div>
                </div>
            </div>
              `;
          // Promise 패턴의 callback 실행(initSetting을 다 훑고 실행)
          resolve();
      } //end if
      htmls += `
          <div id="loginmsg">
            <p>아는단어는 iPhone, Android 앱스토어에서 다운로드 받을 수 있습니다.<br>
            회원정보 수정은 아는단어 앱에서 하실 수 있습니다.</p>
          </div>
      `;
      document.querySelector('#loginarea').innerHTML = htmls;
      console.log('html 추가 후');

      // document.getElementById('revoke').onclick = revoke;
    });
}

// 4. 소셜로그인 버튼 눌렀을 때 : chrome.runtime.sendMessage 로 보내서 background.js에서 로직처리
function getUserInfo(provider, intractive=true) {
    console.log('[getuserinfo]provider : ' + provider);
    console.log('[getuserinfo]userId : ');
    console.log(this.user);
    chrome.runtime.sendMessage({"type": "getUserInfo", provider, "interactive": intractive, "userId" : this.user});
}

// 5. 로그아웃 버튼 눌렀을 때
function revoke() {
    chrome.runtime.sendMessage({"type": "removeCachedToken"});
    // show();
}

// 0. 맨 첫 실행 부분.
function veryfirst(){
    return new Promise((resolve, reject) => {
        chrome.storage.sync.get(function (data) {
            console.log('###index.js storage### data.userId : ');
            console.log(data.userId);
            this.user = data.userId;
            // background.js 로 메시지 보냄 ( Node.js 서버에서 회원정보 조회를 위함 )
            chrome.runtime.sendMessage({userId: data.userId});
            chrome.runtime.onMessage.addListener(messageListener);
            console.log('chrome.storage.sync - this.userId 할당');
            console.log(this.user);
            resolve(this.user);
        });
    });
};

window.onload = () => {
    // 맨 처음 chrome.storage.sync.get 작업을 마무리 한 이후에 runtime 메시지 받는 메소드로 이동.
    veryfirst().then((userId) => {
        console.log('[window.onload] userId');
        console.log(userId);
        this.user = userId;
        messageListener();
    });
};
