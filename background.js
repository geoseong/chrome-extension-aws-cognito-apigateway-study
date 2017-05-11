/** start : Context Menu 구현 & 선택데이터 서버통신 부분 */
// Set up context menu tree at install time.

var xapikey = "NaM54LLwRs3wUq3LA14mh4U4NSDq6GPq97O1BgYQ";

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
    chrome.storage.sync.set({
        userId: {"facebook" : "", "google" : ""}
    });
});

// The onClicked callback function.
chrome.contextMenus.onClicked.addListener(function (clickData) {
    console.log('clickData.menuItemId == ' + clickData.menuItemId);
    console.log('clickData.selectionText == ' + clickData.selectionText);

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

    // 우측하단 알림팝업 변수
    var notifOptions = {};
    if (clickData.menuItemId == "WIK" && clickData.selectionText) {
        var selectedText = clickData.selectionText;

        // index.js로 데이터 보내기 위한 바인딩작업
        // chrome.storage.sync.set({	context: selectedText	});

    /** start : node.js 서버에서 처리할 로직 테스트. */
        // // selectedText를 index.js로 넘기기
        // var arraywik = selectedText.trim().replace(/[^a-zA-Z]/g , '_').replace(/_{2,}/g , '_').split('_');
        // console.log('[서버로직.displaywik]');
        // console.log(arraywik);
        // var jsonwik = { wik : [], iknow : [] };
        // // 단어반복횟수
        // let repeatcnt=0;
        // // 화면에 보여지게 할 단어 데이터 조합.
        // for(var i=0; i<arraywik.length; i++){
        //     let isBool = false;
        //     if(i%2===0)  {
        //         isBool = true;
        //     }
        //     if(arraywik[i] != ''){
        //         jsonwik.wik.push(arraywik[i]);
        //         jsonwik.iknow.push(isBool);
        //     }
        // }
        // console.log('[서버로직.JSON:jsonwik]');
        // console.log(jsonwik);
        // // this.jsonwik = jsonwik;
        // chrome.storage.sync.set({	context: jsonwik	});
    /** end : node.js 서버에서 처리할 로직 테스트. */


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
      // 본 서버용
    // clientId: '1852978631608698',
    // clientSecret: '051ec6b3adb90ee7cf5d1042710e293d',
      // 로컬 테스트용
      clientId: '1210960172364453',
      clientSecret: '1f71e53272217e2d71ff6d654039001d',
    token: null,
    user_info: null,

    clear() {
      this.user_info = null;
      this.token = null;
        // index.js에 유저명 보내기
        chrome.runtime.sendMessage({"name":""});
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

        xhrWithAuth(this, 'GET', 'https://graph.facebook.com/me?fields=name,picture', interactive).then(response => {
            console.log('[callback: xhrWithAuth]this:');
            console.log(this);
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
      // 본서버용
      // clientId: "775980557340-kp178tjs9lpn3qtq7m391kbescvu5c7t.apps.googleusercontent.com",
      // client_secret: "fApCmLx-bukU5tBgSC0tUj39",
      // 로컬 테스트용
      clientId: "775980557340-18c360oopd9ifnf6oit5jmv5lp355gft.apps.googleusercontent.com",
      client_secret: "uo_LV0aA45aT04ofGnpDdeUy",
      token: null,
      user_info: null,
      scopes: ["openid", "email", "profile"],

      clear() {
          this.user_info = null;
          this.token = null;
          // index.js에 유저명 보내기
          chrome.runtime.sendMessage({"name":""});
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
            console.log('[callback: xhrWithAuth]this:');
            console.log(this);
            console.log('[getUserInfo > xhrWithAuth]response : ');
            console.log(response);
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
          console.log('[xhr]');
          console.log(xhr);
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

/** WIK node.js 서버 접속해서 chrome.storage의 id와 비교하기 */
function checkWIKAccount(userId, userNm){
    return new Promise((resolve, reject) => {
        // let url = "http://localhost:8080/api/users/getName/"+userId;
        let url = "https://6p5fe3dege.execute-api.ap-northeast-2.amazonaws.com/beta/getUserInfo/" + userId;
        console.log('[checkWIKAccount]url : ' + url);
        let xhttpr = new XMLHttpRequest();
        xhttpr.open('GET', url);
        xhttpr.setRequestHeader("Content-type", "application/json");
        xhttpr.setRequestHeader("x-api-key", xapikey);
        xhttpr.onload = (e) => {
            let r = e.target;
            console.log('[checkWIKAccount]xhttpr.onload 이후 response');
            console.log(r);
            if (r.status === 200) {
                var response = JSON.parse(r.responseText);
                console.log('[checkWIKAccount Promise 200:checkWIKAccount]response');
                console.log(response);
                chrome.storage.sync.get(function (data) {
                    var context = data.context;
                    console.log('[checkWIKAccount:200] chrome.storage context');
                    console.log(context);
                    // [실전에선 이거 써야함]
                    saveContext(context, response.name).then(resolve);
                    // // 디버그용, 서버로직 완성되면 이거 안씀
                    // sendData(context, response.name);
                    return;
                });
            } else {
                chrome.storage.sync.get(function (data) {
                    var context = data.context;
                    console.log('[checkWIKAccount:404 or else] chrome.storage context');
                    console.log(context);
                    if(!userNm){
                        // resolve(context);
                        return;
                    }
                    console.log('[checkWIKAccount Promise is not 404:checkWIKAccount]response');
                    console.log(r.response);
                    var errormsg = JSON.parse(r.response);
                    console.log('[checkWIKAccount Promise is not 404:checkWIKAccount]errormsg');
                    console.log(errormsg.error);
                // 회원가입 ㄱㄱ
                    sigInUser(userId, userNm, context).then(resolve);
                });
            }
        };
        xhttpr.onerror = (e) => {
            let r = e.target;
            let response = JSON.parse(r.responseText);
            console.log('[error:checkWIKAccount]r');
            console.log(r);
            reject(new Error("user not logged in"));
        };
        xhttpr.send();

        console.log('[checkWIKAccount]---- after xhr.send ----(그치만 정작 이 로그 직후에 send가 된다는;;)');
        console.log(xhttpr);
        // resolve(userNm);
    });
}
/** index.html에 내용출력 위한 바인딩데이터 보내기 */
function sendData(data, userNm){
    console.log('[sendData] data');
    console.log(data);
    console.log('[sendData] userNm');
    console.log(userNm);
    chrome.runtime.sendMessage({data: data, name: userNm});
}
/** 유저가 지정한 블록지정데이터를 userId와 함께 서버에 저장요청 */
function saveContext(context, userNm){
    return new Promise((resolve, reject) => {
        // 단어들 서버로 전송 - Node.js서버에 선택된 단어 보내기
        var xhttp = new XMLHttpRequest();
        // xhttp.open("POST", "http://localhost:8080/api/texts", true);
        xhttp.open("POST", "https://6p5fe3dege.execute-api.ap-northeast-2.amazonaws.com/beta/createUser", true);
        xhttp.setRequestHeader("Content-type", "application/json");
        xhttp.setRequestHeader("x-api-key", xapikey);
        // xhttp.send(JSON.stringify({text: context, user_id: this.userId}));
        xhttp.send(JSON.stringify({user_id: this.userId}));
        console.log('[단어 추가. xhttp]');
        console.log(xhttp);
        resolve(context, userNm);
    });
}
/** 회원가입하기. */
function sigInUser(userId, userNm, context){
    return new Promise((resolve, reject) => {
        let url = "https://6p5fe3dege.execute-api.ap-northeast-2.amazonaws.com/beta/createUser";
        let userInfo = JSON.stringify({
            user_id: userId, name: userNm
        });
        console.log('[sigInUser]userid-' + userId + ', userNm-' + userNm);
        let xhttp_sign = new XMLHttpRequest();
        xhttp_sign.open('POST', url);
        xhttp_sign.setRequestHeader("Content-type", "application/json");
        xhttp.setRequestHeader("x-api-key", xapikey);

        console.log('[sigInUser userInfo]');
        console.log(userInfo);
        xhttp_sign.send(userInfo);

        console.log('[sigInUser]');
        console.log(xhttp_sign);
        resolve(context, userNm);
    });
}



/** 가장 첫 시작 부분 */
function notify(message) {
    try{
        console.log('[notify] message : ');
        console.log(message);
        // chrome.runtime.message에 userId가 아얘 없다면 catch로 넘어감.
        var user_id = message.userId;
        console.log('[notify] user_id : ');
        console.log(user_id);

        /** start : facebook, google 로그인 버튼을 눌렀을 때 */
        // 현재 facebook or google에 로그인 한 이력이 있으면 if문에 빠져돌어감.
        // else. 한번도 로그인 한 적 없으므로 가입버튼 이벤트가 화면에 보이게 index.js로 넘김.
        if(message.provider === "facebook" && user_id.facebook.length > 0){
            this.userId = user_id.facebook;
            console.log('[notify] userId : ' + userId);
            checkWIKAccount(userId).then(sendData);
        }else if(message.provider === "google" && user_id.google.length > 0){
            this.userId = user_id.google;
            console.log('[notify] userId : ' + userId);
            checkWIKAccount(userId).then(sendData);
        }
        else if(!user_id || user_id.facebook.length <= 0 && user_id.google.length <= 0){
            console.log('[notify] facebook도 google도 없다')
            chrome.storage.sync.get((data) => {
                sendData(data.context);
            });
        } //end if
    }catch(e) {
        chrome.storage.sync.get((data) => {
            sendData(data.context);
        });
        return;
    }
    console.log('[notify] message.type switch 들어가기 직전');
  switch(message.type) {
    case "getUserInfo":
      console.log(message.provider);
      providers[message.provider].getUserInfo(message.interactive).then(function(user){
        console.log('[notify: user info]');
        console.log(user);
          console.log('[notify:switch] message : ');
          console.log(message);
          // 크롬 스토리지에 (provider에 따른) 입력값을 저장한다.
          if(message.provider === "facebook"){
            chrome.storage.sync.set(
                {
                    userId: {"facebook" : user.id, "google" : ""}
                }
            );
          }else{
            chrome.storage.sync.set(
                {
                    userId: {"facebook" : "", "google" : user.id}
                }
            );
          } //end if
      });
      break;
    case "removeCachedToken":
      console.log('[removeCachedToken]');
      providers["facebook"].clear();
      providers["google"].clear();
      break;
  } //end switch
}
chrome.runtime.onMessage.addListener(notify);
/** end : 소셜로그인 facebook , google */