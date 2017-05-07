
# 페북 소셜로그인 인증하기

### ID 확인 > 액세스 토큰의 코드 교환
GET https://graph.facebook.com/v2.9/oauth/access_token?
   client_id={app-id}
   &redirect_uri={redirect-uri}
   &client_secret={app-secret}
   &code={code-parameter}
   
* Request *
https://graph.facebook.com/oauth/access_token?
client_id=1210960172364453
&client_secret=1f71e53272217e2d71ff6d654039001d
&redirect_uri=https%3A%2F%2Fojbbgdlcojgalkkbpjlicimimcifipjm.chromiumapp.org%2Fprovider_cb
&code=AQBNTaLE6EUL5-Mh2M_ojSE7OdLySz6BRwjL28HzE5PLAhZBL2EHe1ih_Z90OvlHmdi0qNrN6mvbBh00fn8_K8xg73NYuGcc29u3dB44LbBIkg4I9G6GaOCoQgOf_nw0xcYwll5CaClaz0IdtwUSkIG1hXtza2_WEHjGJQQ7aLG2iBQbiVS9icazMlLF_emCPTcZAv6HP1jIIYx8_v81mSQcaFcskM5bJXEt29N0833QjCs7Fw95D0VM5fQgLrLRytMFLQBsTeg6T8CPvqHZL-TX6KDt75lqRgfp6LLDh5NH8-4aQUeR513Mh2N_OOZf3BBk1YPpafBr_nk28e80EoLS

* Response *
{
"access_token":"EAARNXKLpMqUBAGV3MFrA7DZA88aoh4FuM2kWO7FZCo5lAn43lLDv7sZCcq2Q6nZC27AZBEGO4aH6bx0peXHwV7VHl7lH0eiw9VCgtrzdZCD4VoZAbIf7CiMZCDgpyth1lADvjx2K6QEHre85iqpZAcDQINy53A0E0cX8ZD"
,"token_type":"bearer"
,"expires_in":5143082
}

# 구글 소셜로그인 인증하기

-