
var user='';
var recur=0;
var contextLength=0;

// 1. chrome.runtime.onMessage.addListener
function messageListener(message) {
    console.log('[index.js]\n', message);
    let isUserId=false, userNm;
    // background.js와 통신하여 WIK node.js 서버 안의 회원정보가 있는지 판별.
    try{
        if(!message.data) {
            document.getElementById('divTable').innerHTML = '';
        }
        if(message.name.length > 0){
            isUserId = true;
            userNm = message.name;
            spreadWords(message.data, 0);
            contextLength = message.data.length;    // 추출단어 갯수 전역변수로 저장
        }
    }catch(e){
        // console.log(e);
    }

    // Promise 패턴. then 부분은 callback.
    initSetting(isUserId, userNm).then(() => {
        document.getElementById('facebook-signin').onclick = () => { getUserInfo("facebook"); };
        document.getElementById('google-signin').onclick = () => { getUserInfo("google"); };
    }).catch(() => {
        document.getElementById('signout').onclick = () => { revoke();  };
    });
}

// 2. 단어 목록 뿌리기
function spreadWords(context, pageStart){
        var wordwik = '';
        var paginghtml = '';
        var paginglistCnt = 15;
        var pageEnd = pageStart + paginglistCnt;
        var gotoPrev = pageStart - paginglistCnt;

        if (context.length <= pageEnd) {
            pageEnd = context.length
        }
        paginghtml = `
            <p id="pageCnt"><label1>아는 단어</label1> <label2>모르는 단어</label2></p>
            <div style="float: right;">
                ${pageStart + 1} - ${pageEnd}&nbsp;&nbsp;
                <button type="button" name="pagingBtn" value="${gotoPrev}" id="btnPrev"><</button>
                <button type="button" name="pagingBtn" value="${pageStart + paginglistCnt}" id="btnNext">></button>
            </div>
        `;
        document.getElementById('paging').innerHTML = paginghtml;
        document.getElementById('btnPrev').onclick = () => {    // 이전 화살표 누를때
            if (gotoPrev < 0) {
                return;
            }
            var temp = document.getElementById('btnPrev').value;
            temp = Number(temp);
            spreadWords(context, temp);
        };
        document.getElementById('btnNext').onclick = () => {    // 다음 화살표 누를때
            if (context.length <= pageStart + paginglistCnt) {
                return;
            }
            var temp = document.getElementById('btnNext').value;
            temp = Number(temp);
            spreadWords(context, temp);
        };

        for (var i = pageStart; i < pageEnd; i++) {
            let checked = '';
            if (context[i].know) checked = 'checked';
            wordwik += `
            <div id="row${i}">
                <span id="spanWord${i}" class="spanWord">
                    <input type="checkbox" id="chkbox${i}" value="${i}" ${checked}>
                    <label for="chkbox${i}">
                        <span id="word">${context[i].word}</span>
                        <span id="repeatCnt">${context[i].count}</span>
                    </label>
                </span>
            </div>`;
        } //end for
        // 조합된 html을 divTable에 적용 = 단어리스트들을 화면에 뿌려줌.
        document.getElementById('divTable').innerHTML = wordwik;

        // for문으로 하면 각 리스트의 onclick이벤트가 안 걸려서 재귀함수로 구현.
        var allocateId = function(params){
            if(params.start === params.end)  return;
            var bomid = "spanWord" + params.start;
            document.getElementById(bomid).onclick = () => {
                switchWordStatus(params.start, params.context);
            };
            if (params.start < params.end){
                allocateId({start: params.start + 1, end: params.end, context: params.context});
            }
        }
        // 각 리스트에 onclick 이벤트를 걸어줌 시작..
        allocateId({start: pageStart, end: pageEnd, context: context});
} //end spreadWords();

// 2-1. 단어 앎/모름 상태변경
function switchWordStatus(index, context) {
    // 단어리스트를 선택하면 두번 중복 실행되므로 한번만 실행되게 하기 위한 로직.
    if (recur === 0) {
        recur = recur + 1;
        return;
    }
    recur = 0;
    chrome.storage.sync.get(function (data) {
        if(context[index].know){
            context[index].know = false;
        }else{
            context[index].know = true;
        }
        var body={
            word: context[index].word,
            know: context[index].know
        };
        var userId;
        if(data.facebook.id.length > 0){
            userId = data.facebook.id
        }
        else if(data.google.id.length > 0){
            userId = data.google.id
        }else{
            alert('로그인 오류. 창을 닫고 다시 시도하세요.');
            return;
        }
        updateWordStatusUserIdPatch(userId, body, wordstatusCallback);
    });
}
// 2-1. 콜백메소드 : 단어 상태 변경 후 p#status 에 메시지 뿌리기
var wordstatusCallback = function(param){
    var html = `<b>${param.word}</b> 단어의 상태가 <b>${param.status}</b>로 변경되었습니다.`;
    document.getElementById('status').innerHTML = html;
    return false;
}
// 3. 소셜 로그인 부분
function initSetting(userId, userNm){
    return new Promise((resolve, reject) => {
      // userId 값이 존재하면 background.js에서 DB로 조회한 userName을 출력시킨다.
        var isLogin = false;
      if(userId){
          htmls =
              `${userNm} 님, 환영합니다~!
              <br>
              <button id="signout">로그아웃</button>`;
          isLogin = true;
        reject();
     }else{
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
            <!--<p id="validation" style="color: red; font-weight: bold;">로그인이 필요합니다</p>-->
              `;
          isLogin = false;
          // Promise 패턴의 callback 실행(initSetting을 다 훑고 실행)
          resolve();
      } //end if
      htmls += `
          <div id="loginmsg">
            <p>아는단어는 iPhone, Android 앱스토어에서 다운로드 받을 수 있습니다.<br>
            회원정보 수정은 아는단어 앱에서 하실 수 있습니다.</p>
            <p id="disclaimer">단어를 선택하면 상태가 자동으로 저장됩니다.</p>
        `;
      if(isLogin){
          htmls += `
            <p id="status">총 ${contextLength}개의 단어가 추출되었습니다.</p>
              </div>
          `;
      }else{
          htmls += `
            <p id="status" style="color: red; font-weight: bold;">컨텐츠 저장완료. 로그인 하시면 보실 수 있습니다</p>
          `
      }

      document.querySelector('#loginarea').innerHTML = htmls;
    });
}

// 4. 소셜로그인 버튼 눌렀을 때 : chrome.runtime.sendMessage 로 보내서 background.js에서 로직처리
function getUserInfo(provider, intractive=true) {
    let htmls = `
          <p style="width: 100%; text-align:center">로딩 중..잠시 기다려 주세요...</p>
          <img src="../pics/loading.gif">
      `;
    document.querySelector('#loginarea').innerHTML = htmls;
    chrome.runtime.sendMessage({"type": "getUserInfo", provider, "interactive": intractive, "userId" : this.user});
}

// 5. 로그아웃 버튼 눌렀을 때
function revoke() {
    document.querySelector('#divTable').innerHTML = '';
    revokeSocialLogin();    // awsCognito.js
    chrome.runtime.sendMessage({"type": "removeCachedToken"}, ()=>{
        window.close();
    });
}

// window.onload = () => {
//     sendToBackgroundJS('', '');
// };
function sendToBackgroundJS(paramTitle, paramTag){
    let htmls = `
          <p style="width: 100%; text-align:center">로딩 중..잠시 기다려 주세요...</p>
          <img src="../pics/loading.gif">
      `;
    document.querySelector('#loginarea').innerHTML = htmls;

    chrome.storage.sync.get(function (data) {
        var provider;
        if(data.facebook.id.length > 0){
            provider = "facebook";
            this.user = data.facebook.id
        }
		else if(data.google.id.length > 0){
            provider = "google";
            this.user = data.google.id
        }else{  // if(data.facebook.id.length <= 0 && data.google.id.length <= 0)
			provider = "";
		}
        // background.js 로 메시지 보냄 ( Node.js 서버에서 회원정보 조회를 위함 )
        chrome.runtime.sendMessage({userId: this.user, provider: provider, paramTitle: paramTitle, paramTag: paramTag});

    });
}
