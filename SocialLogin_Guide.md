# `Chrome Extension의 소셜로그인은 XMLHttpRequest클래스를 통해 통신함`

페북 소셜로그인 인증하기
============================

## 0. 페북 Developer 사이트에서 새 앱을 만든다.
<https://developers.facebook.com/>
* 앱 생성 후 `client_id(앱 ID)`와 `client_secret(앱 시크릿 코드)` 정보를 알아 두고 있자.


## 1. Access_token 얻기 - 액세스 토큰의 코드 교환
    
        GET https://graph.facebook.com/oauth/access_token?
            client_id={app-id}
            &redirect_uri={redirect-uri}
            &client_secret={app-secret}
            &code={code-parameter}

## 1.1. 예제
* Request

        https://graph.facebook.com/oauth/access_token?
        client_id=1210960172364453
        &client_secret=1f71e53272217e2d71ff6d654039001d
        &redirect_uri=https%3A%2F%2Fojbbgdlcojgalkkbpjlicimimcifipjm.chromiumapp.org%2Fprovider_cb
        &code=AQBNTaLE6EUL5-Mh2M_ojSE7OdLySz6BRwjL28HzE5PLAhZBL2EHe1ih_Z90OvlHmdi0qNrN6mvbBh00fn8_K8xg73NYuGcc29u3dB44LbBIkg4I9G6GaOCoQgOf_nw0xcYwll5CaClaz0IdtwUSkIG1hXtza2_WEHjGJQQ7aLG2iBQbiVS9icazMlLF_emCPTcZAv6HP1jIIYx8_v81mSQcaFcskM5bJXEt29N0833QjCs7Fw95D0VM5fQgLrLRytMFLQBsTeg6T8CPvqHZL-TX6KDt75lqRgfp6LLDh5NH8-4aQUeR513Mh2N_OOZf3BBk1YPpafBr_nk28e80EoLS

* Response

        {
        "access_token":"EAARNXKLpMqUBAGV3MFrA7DZA88aoh4FuM2kWO7FZCo5lAn43lLDv7sZCcq2Q6nZC27AZBEGO4aH6bx0peXHwV7VHl7lH0eiw9VCgtrzdZCD4VoZAbIf7CiMZCDgpyth1lADvjx2K6QEHre85iqpZAcDQINy53A0E0cX8ZD"
        ,"token_type":"bearer"
        ,"expires_in":5143082
        }
        
- - -
## 2. 사용자의 현재 권한 확인
        GET https://graph.facebook.com/{user-id}/permissions
    
## 2.1. 예제
* Request

        https://graph.facebook.com/1303598603041450/permissions?
        access_token=EAARNXKLpMqUBAGV3MFrA7DZA88aoh4FuM2kWO7FZCo5lAn43lLDv7sZCcq2Q6nZC27AZBEGO4aH6bx0peXHwV7VHl7lH0eiw9VCgtrzdZCD4VoZAbIf7CiMZCDgpyth1lADvjx2K6QEHre85iqpZAcDQINy53A0E0cX8ZD

* Response

        {
           "data": [
              {
                 "permission": "user_friends",
                 "status": "granted"
              },
              {
                 "permission": "public_profile",
                 "status": "granted"
              }
           ]
        }
        
- - -
## 3. 현재 로그인 된 사용자의 id, name, picture까지 보이게하기
        GET https://graph.facebook.com/me?
            access_token={access_token}
            &fields=name,picture

## 3.1. 예제
* Request

        https://graph.facebook.com/me?
        access_token=EAARNXKLpMqUBAGV3MFrA7DZA88aoh4FuM2kWO7FZCo5lAn43lLDv7sZCcq2Q6nZC27AZBEGO4aH6bx0peXHwV7VHl7lH0eiw9VCgtrzdZCD4VoZAbIf7CiMZCDgpyth1lADvjx2K6QEHre85iqpZAcDQINy53A0E0cX8ZD
        &fields=name,picture

* Response

        {
           "name": "\ubc15\ud0dc\uc131",
           "picture": {
              "data": {
                 "is_silhouette": false,
                 "url": "https://scontent.xx.fbcdn.net/v/t1.0-1/c0.8.50.50/p50x50/16425960_1221949207873057_2228976596700665410_n.jpg?oh=956a055a6a6ffec806f8b05ca9c5da8a&oe=597C1246"
              }
           },
           "id": "1303598603041450"
        }

- - -
구글 소셜로그인 인증하기
============================
- - -
## 0. 구글 개발자 콘솔 사이트에 들어간다.
<https://console.developers.google.com/>

## 0.1. 웹 애플리케이션의 클라이언트 ID 만들기.
`사용자 인증 정보 만들기` 파란색 버튼 클릭 -> `OAuth 클라이언트 ID` 를 차례로 클릭한다.

이후 애플리케이션 유형은 `웹 어플리케이션`을 선택하여 `이름`을 채워넣고, `승인된 자바스크립트 원본`, `승인된 리디렉션 URI`를 넣은 뒤 `저장`한다.

- `승인된 자바스크립트 원본` ex) https://ojbbgdlcojgalkkbpjlicimimcifipjm.chromiumapp.org

- `승인된 리디렉션 URI` ex) https://ojbbgdlcojgalkkbpjlicimimcifipjm.chromiumapp.org/provider_cb


## 들어가기 전에..
- chrome.identity 메소드를 이용한 간단한 구글 로그인 방법도 존재한다. manifest.json에서 구글 OAuth 설정을 하는 것이다.
    - 참고 url : 
        - 1. <https://developer.chrome.com/extensions/app_identity#update_manifest>
        - 2. <https://developer.chrome.com/extensions/identity>
- 그치만 facebook과 google 소셜로그인을 둘 다 사용해야 하므로 manifest.json에서 google소셜로그인만을 위한 정보를 넣으면 에러가 뜬다.
- 하여 `chrome.identity.getRedirectURL` 과, `chrome.identity.launchWebAuthFlow` 를 통한 코딩을 한다.

- - -

## 1. Access_Token 얻기
JSON화 하여 아래처럼 변수를 지정한다.

    let options = {
      interactive: "true || false",
      url: "https://accounts.google.com/o/oauth2/v2/auth?
            client_id=775980557340-18c360oopd9ifnf6oit5jmv5lp355gft.apps.googleusercontent.com
            &response_type=token
            &redirect_uri=https%3A%2F%2Fojbbgdlcojgalkkbpjlicimimcifipjm.chromiumapp.org%2Fprovider_cb&scope=openid%20email%20profile"
    };
    
## 1.2. 예제
* Request

    위에서 정의한 `options` 변수를 `chrome.identity.launchWebAuthFlow` 의 `첫번째 파라미터`에 넣는다.

        chrome.identity.launchWebAuthFlow(options, function(redirectURL) {
            ...
        }

* Response

    `options.url`이 크롬 익스텐션의 요청 url로 바뀌며, 요청 url 파라미터에 `access_token`값이 들어가 있는데, 자세히 보면 `access_token`값을 얻은 것을 확인 할 수 있다.
 
        https://ojbbgdlcojgalkkbpjlicimimcifipjm.chromiumapp.org/provider_cb#
        access_token=ya29.GlxDBDHY8svOOoRTpm4ckDQjLN5l90b10lNZMrYDwerA_xHU6ek1RD5dp5k64OI5G2CaWSa8xoCeC9RxbGXb4gTjqSK_ywYKxlTP_PndvU1BIlc9MYarTEOoCJoPfw
        &token_type=Bearer
        &expires_in=3600
        &authuser=0
        &session_state=a8369c9c678a57668fd354e23cde46b40ee3eab9..0f10&prompt=none

- - -

## 2. Access_token의 정보 or 유효여부 확인하기.
        GET https://www.googleapis.com/oauth2/v3/tokeninfo?
            access_token={access_token}

## 2.1. 예제

* Request

        https://www.googleapis.com/oauth2/v3/tokeninfo?
        access_token=ya29.GlxDBDHY8svOOoRTpm4ckDQjLN5l90b10lNZMrYDwerA_xHU6ek1RD5dp5k64OI5G2CaWSa8xoCeC9RxbGXb4gTjqSK_ywYKxlTP_PndvU1BIlc9MYarTEOoCJoPfw

* Response
 
        {
         "id": "107789202491808307691",
         "email": "parkopp@gmail.com",
         "verified_email": true,
         "name": "taeseong park",
         "given_name": "taeseong",
         "family_name": "park",
         "link": "https://plus.google.com/107789202491808307691",
         "picture": "https://lh5.googleusercontent.com/-bABKlFiwxH4/AAAAAAAAAAI/AAAAAAAAAPE/dNiva9mABsI/photo.jpg",
         "gender": "male",
         "locale": "ko"
        }

- - -

## 3. 현재 로그인된 유저정보 확인하기
        GET https://www.googleapis.com/oauth2/v1/userinfo?
        alt=json
        &access_token={access_token}
        
## 3.1. 예제

* Request

        https://www.googleapis.com/oauth2/v1/userinfo?
        alt=json
        &access_token=ya29.GlxDBDHY8svOOoRTpm4ckDQjLN5l90b10lNZMrYDwerA_xHU6ek1RD5dp5k64OI5G2CaWSa8xoCeC9RxbGXb4gTjqSK_ywYKxlTP_PndvU1BIlc9MYarTEOoCJoPfw

* Response

        {
         "id": "107789202491808307691",
         "email": "parkopp@gmail.com",
         "verified_email": true,
         "name": "taeseong park",
         "given_name": "taeseong",
         "family_name": "park",
         "link": "https://plus.google.com/107789202491808307691",
         "picture": "https://lh5.googleusercontent.com/-bABKlFiwxH4/AAAAAAAAAAI/AAAAAAAAAPE/dNiva9mABsI/photo.jpg",
         "gender": "male",
         "locale": "ko"
        }