/** start : Context Menu 구현 & 선택데이터 서버통신 부분 */
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
});

// The onClicked callback function.
chrome.contextMenus.onClicked.addListener(function (clickData) {
    console.log('clickData.menuItemId == ' + clickData.menuItemId);
    console.log('clickData.selectionText == ' + clickData.selectionText);
    // 우측하단 알림팝업 변수
    var notifOptions = {};
    if (clickData.menuItemId == "WIK" && clickData.selectionText) {
        var selectedText = clickData.selectionText;
        // 단어들 서버로 전송
        // Node.js서버에 선택된 단어 보내기
        var xhttp = new XMLHttpRequest();
        console.log('[단어 추가. xhttp]');
        console.log(xhttp);
        xhttp.open("POST", "http://localhost:8080/api/texts", true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.send(JSON.stringify({text:selectedText, user_id:"wiksample"}));

    /** start : node.js 서버에서 처리할 로직 테스트. */
        // selectedText를 index.js로 넘기기
        var arraywik = selectedText.trim().replace(/[^a-zA-Z]/g , '_').replace(/_{2,}/g , '_').split('_');
        console.log('[displaywik]');
        console.log(arraywik);
        var jsonwik = { wik : [], iknow : [] };
        // 단어반복횟수
        let repeatcnt=0;
        // 화면에 보여지게 할 단어 데이터 조합.
        for(var i=0; i<arraywik.length; i++){
            let isBool = false;
            if(i%2===0)  {
                isBool = true;
            }
            if(arraywik[i] != ''){
                jsonwik.wik.push(arraywik[i]);
                jsonwik.iknow.push(isBool);
            }
        }
        console.log('[JSON:jsonwik]');
        console.log(jsonwik);
        this.jsonwik = jsonwik;
    /** end : node.js 서버에서 처리할 로직 테스트. */

        // 팝업창 생성
        chrome.windows.create({
            url : "index.html",
            width : 500,
            height: 600,
            left : 100,
            top : 100,
            focused : true,
            type : "popup"
        });
        // 알림
        notifOptions = {
            type: "basic",
            iconUrl: "wik_48.png",
            title: "아는단어",
            message: "단어 추출 성공."
        };
    } //end if
    chrome.notifications.create('notifImport', notifOptions);
});
/** end : Context Menu 구현 & 선택데이터 서버통신 부분 */

/** start : 소셜로그인 facebook , google */
let providers = {
  facebook: {
    clientId: '1210960172364453',
    clientSecret: '1f71e53272217e2d71ff6d654039001d',
    token: null,
    user_info: null,

    clear() {
      this.user_info = null;
      this.token = null;
    },

    getAuthURL(redirectURL) {
      return 'https://www.facebook.com/dialog/oauth?client_id=' + this.clientId +
             '&reponse_type=token&access_type=online&display=popup' +
             '&redirect_uri=' + encodeURIComponent(redirectURL);
    },

    exchangeCodeForToken(code, redirectURL) {
      return new Promise((resolve, reject) => {
        let url = 'https://graph.facebook.com/oauth/access_token?' +
                  'client_id=' + this.clientId +
                  '&client_secret=' + this.clientSecret +
                  '&redirect_uri=' + encodeURIComponent(redirectURL) +
                  '&code=' + code;
        console.log('[exchangeCodeForToken] url:' + url);
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = (e) => {
            let r = e.target;
            console.log('[exchangeCodeForToken] e xhr.onload : ');
            console.log(e);
            console.log('[exchangeCodeForToken]response.status : ' + r.status);
          if (r.status === 200) {
              console.log('[exchangeCodeForToken] responseText(=response):' + r.responseText);
            let response = JSON.parse(r.responseText);
              console.log('[exchangeCodeForToken] response.access_token: ' + response.access_token);
              console.log('[exchangeCodeForToken] response.token_type: ' + response.token_type);
            //let params = new URLSearchParams(response);
            //this.token = params.get("access_token");
              this.token = response.access_token;
              console.log('[exchangeCodeForToken] this.token: ' + this.token);
            resolve(this.token);
          } else {
            reject([r.status, r.responseText]);
          }
        };
        xhr.onerror = (e) => {
          let r = e.target;
          let response = JSON.parse('"'+r.responseText+'"');
          reject([r.status, response]);
        };
        xhr.send(null);
      });
    },

    authResult(params, redirectUri) {
        console.log('[authResult] params :' + params);
      return new Promise((resolve, reject) => {
        if (params.get("error")) {
            console.log('[authResult] error :' + params.get("error"));
          reject(new Error(params.get("error_description")));
        } else if (params.get("access_token")) {
          this.token = params.get("access_token");
            console.log('[authResult] this.token :' + this.token);
          resolve(this.token);
        } else if (params.get("code")) {
            console.log('[authResult] redirectUri :' + redirectUri);
          this.exchangeCodeForToken(params.get("code"), redirectUri).then(resolve).catch(error => {
            reject(new Error(error));
          });
        } else
          reject(new Error("Invalid response, no code or token"));
      });
    },

    getUserInfo(interactive) {
      return new Promise((resolve, reject) => {
        if (this.user_info) {
            console.log('[facebook:getUserInfo] user_info');
            console.log(this.user_info);
          resolve(this.user_info);
          return;
        } else
        if (!interactive) {
          reject(new Error("user not logged in"));
          return;
        }

        xhrWithAuth(this, 'GET', 'https://graph.facebook.com/me', interactive).then(response => {
            console.log('[callback: xhrWithAuth]response:');
            console.log(response);
          this.user_info = JSON.parse(response.response);
            // 회원가입
            checkWIKAccount(this.user_info.id, this.user_info.name);
          resolve(this.user_info);
        });
      });
    }
  },
  google: {
      clientId: "775980557340-kp178tjs9lpn3qtq7m391kbescvu5c7t.apps.googleusercontent.com",
      client_secret: "fApCmLx-bukU5tBgSC0tUj39",
      token: null,
      user_info: null,
      scopes: ["openid", "email", "profile"],

      clear() {
          this.user_info = null;
          this.token = null;
      },

      getAuthURL(redirectURL) {
          return 'https://accounts.google.com/o/oauth2/v2/auth' +
              '?client_id=' + this.clientId +
              '&response_type=token' +
              '&redirect_uri=' + encodeURIComponent(redirectURL) +
              '&scope=' + encodeURIComponent(this.scopes.join(' '));
      },

      verifyToken(token) {
          return new Promise((resolve, reject) => {
            let url = 'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token;
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.onload = (e) => {
                let r = e.target;
                if (r.status === 200) {
                    resolve(JSON.parse(r.responseText));
                } else {
                    reject([r.status, r.responseText]);
                }
            };
            xhr.onerror = (e) => {
                let r = e.target;
                let response = JSON.parse('"'+r.responseText+'"');
                reject([r.status, response]);
            };
            xhr.send(null);
          });
      },

      authResult(params, redirectUri) {
          console.log('[authResult] params :' + params);
          return new Promise((resolve, reject) => {
            if (params.get("error")) {
              console.log('[authResult] error :' + params.get("error"));
              reject(new Error(params.get("error_description")));
            } else if (params.get("id_token")) {
              this.token = params.get("id_token");
              console.log('[authResult] this.token :' + this.token);
              resolve(this.token);
            } else if (params.get("access_token")) {
              let token = params.get("access_token");
              console.log('[authResult] token:'+token);
              this.verifyToken(token).then(verified => {
                  // TODO verify the data
                  // https://developers.google.com/identity/protocols/OAuth2UserAgent
                  this.verified = verified;
                  this.token = token;
                  resolve(this.token);
              });
            } else
              reject(new Error("Invalid response, no code or token"));
          });
      },

      getUserInfo(interactive) {
        return new Promise((resolve, reject) => {
          if (this.user_info) {
            console.log('[google:getUserInfo] user_info');
            console.log(this.user_info);
            resolve(this.user_info);
            return;
          } else
          if (!interactive) {
              console.log('[getUserInfo] this is not interactive : false');
              reject(new Error("user not logged in"));
              return;
          }
          xhrWithAuth(this, 'GET', 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json', interactive).then(response => {
            console.log('[getUserInfo > xhrWithAuth]response : ' + response);
            console.log('[getUserInfo > xhrWithAuth]response.response : ' + response.response);
            this.user_info = JSON.parse(response.response);
          // 회원가입
          checkWIKAccount(this.user_info.id, this.user_info.name);
            resolve(this.user_info);
          });
        });
      }
    },
};

function parseSearchParams(redirectUri) {
  let m = redirectUri.match(/[#\?](.*)/);
  if (!m || m.length < 1)
    return {};
  return new URLSearchParams(m[1].split("#")[0]);
}

function xhrWithAuth(provider, method, url, interactive) {
  console.log('[xhrWithAuth.url]' + url);
    return new Promise((resolve, reject) => {
      authorize(provider, interactive).then((token) => {
          let xhr = new XMLHttpRequest();
          xhr.open(method, url);
            console.log('[xhrWithAuth.url]token: ' + token);
          xhr.setRequestHeader('Authorization', 'Bearer ' + token);
          xhr.onload = () => {
              (xhr.status == 200 ? resolve : reject)({ status: xhr.status, response: xhr.response });
          };
          xhr.onerror = () => {
              reject({ status: xhr.status, response: xhr.response });
          };
          xhr.send();
      });
    });
}

function authorize(provider, interactive) {
  let redirectUri = chrome.identity.getRedirectURL('/provider_cb');
  console.log('[authorize] redirectUri : ' + redirectUri);

  return new Promise((resolve, reject) => {
      console.log('[authorize]token: ' + provider.token);
    if (provider.token) {
      resolve(provider.token);
      return;
    }

    let options = {
      interactive: interactive,
      url: provider.getAuthURL(redirectUri)
    };
    console.log('[authorize] options : '+JSON.stringify(options));

    chrome.identity.launchWebAuthFlow(options, function(redirectURL) {
      console.log('[chrome.identity.launchWebAuthFlow] redirectURL : ' + redirectURL);

      if (chrome.runtime.lastError) {
        console.log('[err.message]' + chrome.runtime.lastError.message);
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      // #access_token={value}&refresh_token={value} or #code={value}
      let params = parseSearchParams(redirectURL);
      console.log('[chrome.identity.launchWebAuthFlow] params :' + params);
      provider.authResult(params, redirectUri).then(resolve);
    });
  });
}


// token 없애기 - Revoking a token
// https://accounts.google.com/o/oauth2/revoke?token={token}


/** 회원가입하기. */
function sigInUser(userId, userNm){
    let url = "http://localhost:8080/api/users"
    let userInfo = JSON.stringify({
        user_id: userId, name: userNm
    });
    console.log('userid-'+userId+', userNm-'+userNm);
    let xhttp_sign = new XMLHttpRequest();
    xhttp_sign.open('POST', url);
    xhttp_sign.setRequestHeader("Content-type", "application/json");
    console.log('[sigInUser userInfo]');
    console.log(userInfo);
    xhttp_sign.send(userInfo);
    console.log('[sigInUser]');
    console.log(xhttp_sign);
    checkWIKAccount(userId);
}

/** WIK node.js 서버 접속해서 chrome.storage의 id와 비교하기 */
function checkWIKAccount(userId, userNm){
    return new Promise((resolve, reject) => {
        console.log('[checkWIKAccount]userId : ' + userId);
        let url = "http://localhost:8080/api/users/"+userId;
        console.log('[checkWIKAccount]url : ' + url);
        let xhttpr = new XMLHttpRequest();
        xhttpr.open('GET', url);
        xhttpr.setRequestHeader("Content-type", "application/json");
        xhttpr.onload = (e) => {
            let r = e.target;
            if (r.status === 200) {
                let response = JSON.parse(r.responseText);
                console.log('[Promise 200:checkWIKAccount]response');
                console.log(response);
                // index.js에 유저명 보내기
                chrome.runtime.sendMessage({"name":response.name});
            } else {
                if(!userNm) return;
                console.log('[Promise is not 200:checkWIKAccount]response');
                console.log(r.response);
                var errormsg = JSON.parse(r.response);
                console.log('[Promise is not 200:checkWIKAccount]errormsg');
                console.log(errormsg.error);
                // 회원가입 ㄱㄱ
                sigInUser(userId, userNm);
            }
        };
        xhttpr.onerror = (e) => {
            let r = e.target;
            let response = JSON.parse(r.responseText);
            console.log('[error:checkWIKAccount]r');
            console.log(r);
            reject(new Error("user not logged in"));
        };
        xhttpr.send(null);
        console.log('---- after xhr.send ----');
        console.log(xhttpr);
        resolve(userNm);
    });

}

/** 사용자가 추출한 단어(=아는단어 창 열리자마자 mongoDB에 저장된 텍스트 불러옴) 출력 */
function printWords(userNm){
    if(userNm){
        console.log('[printWords] user not logged in-' + userNm);
    }else{
        console.log('[this.jsonwik]');
        console.log(this.jsonwik);
        chrome.runtime.sendMessage({wik: this.jsonwik});
    }
}

/** 가장 첫 시작 부분 */
function notify(message) {
    // chrome storage에 id값이 있는지 체크
    let userId = message.userId;
    console.log('[notify] userId : ' + userId);
    checkWIKAccount(userId).then(printWords);
    // if(userId){
    //     return;
    // }
    // }else{
    //     console.log('[notify] userId is null');

  switch(message.type) {
    case "getUserInfo":
      console.log(message.provider);
      providers[message.provider].getUserInfo(message.interactive).then(function(user){
        // chrome.runtime.sendMessage({"user": user});
        console.log('[user info]');
        console.log(user);

        // 크롬 스토리지에 입력값을 저장한다.
          chrome.storage.sync.set({
              userId: user.id
          });
      });
      break;
    case "removeCachedToken":
      providers["facebook"].clear();
      providers["google"].clear();
      break;
  } //end switch
}
chrome.runtime.onMessage.addListener(notify);
/** end : 소셜로그인 facebook , google */

/*
function openPage() {
  chrome.tabs.create({
    "url": chrome.extension.getURL("index.html")
  });
}
chrome.browserAction.onClicked.addListener(openPage);
*/