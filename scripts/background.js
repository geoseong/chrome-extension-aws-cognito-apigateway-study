/*********** start : 소셜로그인 facebook , google **********/
var access_token;
var context;
var provider;
var expiration_time;
var refresh = false;
/*
this.info에 저장되는 속성
1. name
2. picture
3. id
 */

let providers = {
  facebook: {
      // 본 서버용
        clientId: '1852978631608698',
        clientSecret: '051ec6b3adb90ee7cf5d1042710e293d',
      // 로컬 테스트용
      // clientId: '1210960172364453',
      // clientSecret: '1f71e53272217e2d71ff6d654039001d',
    token: null,
    user_info: null,

    clear() {
      this.user_info = null;
      this.token = null;
        // index.js에 유저명 보내기
        chrome.storage.sync.set({
            "context":"",
            "facebook":{"id": "", "name" : ""},
            "id_token":""
        });
        chrome.runtime.sendMessage({"name":"", "accesstoken": ""});
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
        let xhr = new XMLHttpRequest();
        xhr.open('GET', url);
        xhr.onload = (e) => {
            let r = e.target;
            if (r.status === 200) {
                let response = JSON.parse(r.responseText);
                console.log('[facebook:response]\n', response);
                // 전역변수 정의
                provider = "facebook";
                access_token = response.access_token;
                expiration_time = response.expires_in;  // facebook 만료시간
                this.token = access_token;    // xhrWithAuth의 첫째 파라미터가 this이고, authorize에서 this.token을 검사해서 중간에 짤라먹는 역할을 한다.

                resolve(access_token);
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
      return new Promise((resolve, reject) => {
        if (params.get("error")) {
          reject(new Error(params.get("error_description")));
        } else if (params.get("access_token")) {
          access_token = params.get("access_token");
          this.token = access_token;    // xhrWithAuth의 첫째 파라미터가 this이고, authorize에서 this.token을 검사해서 중간에 짤라먹는 역할을 한다.
          console.log('[facebook:token]\n', access_token);
          resolve(access_token);
        } else if (params.get("code")) {
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
          resolve({userNm: this.user_info.name});
          return;
        } else
        if (!interactive) {
          reject(new Error("user not logged in"));
          return;
        }

        xhrWithAuth(this, 'GET', 'https://graph.facebook.com/me?fields=name,picture', interactive).then(response => {
            // this.info에 저장되는 속성
            // 1. name
            // 2. picture
            // 3. id
            this.user_info = JSON.parse(response.response);
            console.log('[xhrWithAuth: response]');
            console.log(response);
            resolve({userNm: this.user_info.name, provider: provider, accesstoken: access_token, data: context});
        });
      });
    }
  },
  google: {
      // 본 서버용
      // clientId: "26122187730-71od7jattiiac5nh4okifrnk91odga1j.apps.googleusercontent.com",
      // client_secret: "nqgUKMSiZRzdHRRd1ivlHSzF",
      // 로컬 테스트용
      clientId: "775980557340-18c360oopd9ifnf6oit5jmv5lp355gft.apps.googleusercontent.com",
      client_secret: "uo_LV0aA45aT04ofGnpDdeUy",
      token: null,
      user_info: null,      // this.user_info 로 쓰임.
      scopes: ["openid", "email", "profile"],

      clear() {
          this.user_info = null;
          this.token = null;
          // index.js에 유저명 보내기
          chrome.storage.sync.set({
              "context":"",
              "google":{"id": "", "name" : ""},
              "id_token":""
          });
          chrome.runtime.sendMessage({"name":"", "accesstoken": ""});
      },

      getAuthURL(redirectURL) {
          return 'https://accounts.google.com/o/oauth2/v2/auth' +
              '?client_id=' + this.clientId +
              '&response_type=code' +
              '&redirect_uri=' + encodeURIComponent(redirectURL) +
              '&scope=' + encodeURIComponent(this.scopes.join(' '));
              // '&access_type=offline';   // 로그인 할때마다 계정 선택할 수 있게 해줌.
      },

      verifyToken(token) {
          return new Promise((resolve, reject) => {
            let url = 'https://www.googleapis.com/oauth2/v3/tokeninfo?access_token=' + token;
            let xhr = new XMLHttpRequest();
            xhr.open('GET', url);
            xhr.onload = (e) => {
                let r = e.target;
                if (r.status === 200) {
                    // 전역변수 정의
                    provider = "google";
                    // access_token = r.responseText;
                    console.log('[verifyToken:responseText]');
                    console.log(r.responseText);
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

      exchangeCode(code, redirectUri){
          return new Promise((resolve, reject) => {
              let url = 'https://www.googleapis.com/oauth2/v4/token';
              let request =
                'code=' + code +
                '&client_id=' + this.clientId +
                '&client_secret=' + this.client_secret +
                '&redirect_uri=' + encodeURIComponent(redirectUri) +
                '&grant_type=authorization_code';
              console.log('[ exchangeCode - request ]', request);
              let xhr = new XMLHttpRequest();
              xhr.open('POST', url);
              xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
              xhr.onreadystatechange = function() {//Call a function when the state changes.
                  if(xhr.readyState == 4){
                      if(xhr.status == 200){
                          provider = "google";  // 전역변수 정의
                          var response = JSON.parse(xhr.response);
                          console.log('[exchangeCode (JSON):response]\n', response);
                          // chrome.storage에 id_token 저장
                          var id_token = response.id_token;
                          chrome.storage.sync.set({	"id_token": id_token	});
                          // 전역변수
                          expiration_time = response.expires_in;    // google toke 만료시간
                          access_token = id_token;    // xhrWithAuth의 첫째 파라미터가 this이고, authorize에서 this.token을 검사해서 중간에 짤라먹는 역할을 한다.
                          var googlaccess_token = response.access_token;
                          this.token = googlaccess_token;
                          resolve(googlaccess_token);
                      }else if(xhr.status === 400) {
                          console.log('[exchangeCode 400 :responseText]', xhr);
                          // "error": "invalid_grant", "error_description": "Code was already redeemed."
                          chrome.storage.sync.get(function (data) {
                              var id_token = data.id_token;
                              resolve(id_token);
                          });
                      }else{
                          reject([xhr.status, xhr.responseText]);
                      }
                  }
              };
              xhr.send(request);
              xhr.onerror = (e) => {
                  let r = e.target;
                  let response = JSON.parse('"'+r.responseText+'"');
                  reject([r.status, response]);
              };

          });
      },

      authResult(params, redirectUri) {
          return new Promise((resolve, reject) => {

            if (params.get("error")) {
                reject(new Error(params.get("error_description")));
            } else if (params.get("code")) {
                let code = params.get("code");
                this.exchangeCode(code, redirectUri).then(access_token => {
                    resolve(access_token);  // xhrWithAuth XMLHttpRequest에 보낼 token.\
                });
            } else if (params.get("id_token")) {
                  console.log('authResult --- id_token', params.get("id_token"));
                  this.token = params.get("id_token");  // xhrWithAuth의 첫째 파라미터가 this이고, authorize에서 this.token을 검사해서 중간에 짤라먹는 역할을 한다.
                  resolve(this.token);
            } else if (params.get("access_token")) {
                  let token = params.get("access_token");
                  console.log('authResult --- access_token', token);
                  this.verifyToken(token).then(verified => {
                      console.log('[authResult: verified]');    console.log(verified);
                      this.token = token;   // xhrWithAuth의 첫째 파라미터가 this이고, authorize에서 this.token을 검사해서 중간에 짤라먹는 역할을 한다.
                      resolve(this.token);  // xhrWithAuth XMLHttpRequest에 보낼 token.\
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
            resolve({userNm: this.user_info.name});
            return;
          } else
          if (!interactive) {
              reject(new Error("user not logged in"));
              return;
          }
          xhrWithAuth(this, 'GET', 'https://www.googleapis.com/oauth2/v1/userinfo?alt=json', interactive).then(response => {
              // this.info에 저장되는 속성
              // 1. name
              // 2. picture
              // 3. id
              this.user_info = JSON.parse(response.response);
              console.log('[xhrWithAuth: response]');
              console.log(response);
              console.log('[xhrWithAuth: token],', this.token);
              resolve({userNm: this.user_info.name, provider: provider, accesstoken: access_token, data: context});
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
    return new Promise((resolve, reject) => {
      authorize(provider, interactive).then((token) => {
          let xhr = new XMLHttpRequest();
          xhr.open(method, url);
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
  return new Promise((resolve, reject) => {
    if (provider.token) {
      console.log('[authorize]token: ' + provider.token);
      resolve(provider.token);
      return;
    }
    let options = {
      interactive: interactive,
      url: provider.getAuthURL(redirectUri)
    };

    chrome.identity.launchWebAuthFlow(options, function(redirectURL) {
          console.log('[chrome.identity.launchWebAuthFlow] redirectURL : \n', redirectURL);
          if (chrome.runtime.lastError) {
            chrome.runtime.sendMessage({name: ''});
            reject(new Error(chrome.runtime.lastError.message));
            return;
          }
          // #access_token={value}&refresh_token={value} or #code={value}
          let params = parseSearchParams(redirectURL);
          provider.authResult(params, redirectUri).then(resolve);
    });
  });
}

// token 없애기 - Revoking a token
// https://accounts.google.com/o/oauth2/revoke?token={token}

/** Google인지 Facebook인지 판단 후 DB에 회원정보 있는지 판단하기. */
function googleOrfacebook(message){
    chrome.storage.sync.get(function (data) {
        console.log('[googleOrfacebook] data');
        console.log(data);
        console.log('[googleOrfacebook] message : ');
        console.log(message);
        // 전역변수
        context = data.context;
        try{
            // 현재 facebook or google에 로그인 한 이력이 있으면 if문에 빠져돌어감.
            // else. 한번도 로그인 한 적 없으므로 가입버튼 이벤트가 화면에 보이게 index.js로 넘김.
            if(message.provider === "facebook" || message.provider === "google" ){ //   && user_id.facebook.length > 0
                getSocialAccount(message);
                return;
            }else{
                console.log('[googleOrfacebook] facebook도 google도 없다')
                sendData(data.context);
            } //end if
        }catch(e) {
            console.log('[googleOrfacebook catch]');
            sendData(data.context);
            return;
        }
    });
}

/** provider 알아내서 Facebook, Google 계정받기 */
function getSocialAccount(message) {
    // providers[message.provider].getUserInfo(message.interactive).then(function (user) {
    providers[message.provider].getUserInfo(true).then(function (user) {
        sendData(user);
    });
}

/** AWS Cognito identity pool token auto refresh **/
function autoRefresh(clear){
    refresh = false;
    var before_expiration = 0;
    // 1000밀리초 = 1초
    // 60초 = 1분
    // 60분 = 1시간
    // 24시간 = 1일
    // 30일 = 1달
    if(provider==="facebook"){
        before_expiration = Number(1000*60*60*24);
        console.log('facebook: expiration_time: %d, before_expiration: %d, (expiration_time*1000)-before_expiration', expiration_time, before_expiration, (expiration_time*1000)-before_expiration);
    }else{
        // provider = google
        before_expiration = Number(1000*60*5);
        console.log('google before_expiration: %d, before_expiration: %d, (expiration_time*1000)-before_expiration', expiration_time, before_expiration, (expiration_time*1000)-before_expiration);
    }
    var interval = setInterval(refreshToken, (expiration_time*1000)-before_expiration);     // Interval 시작
    function refreshToken(){
        try{
            if(clear){
                console.log('clear true!!!');
                clearInterval(interval);        // Interval 종료
            }else {
                console.log('######refresh########');
                providers[provider].user_info = null;
                providers[provider].getUserInfo(true).then(function () {
                    chrome.runtime.sendMessage({
                        provider: provider,
                        accesstoken: access_token,
                        expiration_time: expiration_time
                    });
                });
            }
        }catch(e){
            console.log(e);
            clearInterval(interval);        // Interval 종료
        }
    }
}

/** index.html에 내용출력 위한 바인딩데이터 보내기 */
function sendData(params){
    console.log('[sendData] params : ');
    console.log(params);
    if(refresh){
        autoRefresh(false);  // auto Refresh 시작. 해당 메소드 실행된 이후에는 다음번 sendData때 더이상 실행되지 않게 하기 위해 autoRefresh 안의 전역변수 refresh를 false로 스위칭
    }
    if(!provider)   refresh = true;     // provider 로그인 이력이 전무할때 flag를 바꿔서 다음에 로그인 시에는 token autoRefresh가 가능하게 설정.
    chrome.runtime.sendMessage({data: params.data, name: params.userNm, provider: provider, accesstoken: access_token});
}

/** 가장 첫 시작 부분 */
function notify(message) {
  switch(message.type) {
    case "getUserInfo":
        console.log('[notify getUserInfo]');
        console.log(message.provider);
        googleOrfacebook(message);
      break;
    case "removeCachedToken":
        console.log('[notify removeCachedToken]');
        providers["facebook"].clear();
        providers["google"].clear();
        provider = null;
        autoRefresh(true);
      break;
    default:
		try{
			console.log('[notify default:message]\n', message);
			provider = message.provider;    // 전역변수
			if(message.paramTitle.length>0){
				googleOrfacebook(message);
			}
		}catch(e){
			console.log(e);
		}
  } //end switch
}
chrome.runtime.onMessage.addListener(notify);
/*********** end : 소셜로그인 facebook , google ***********/