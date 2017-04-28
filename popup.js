//var isAgree = confirm("모바일로 내용을 보내시겠습니까?");

var isAgree=true;
if(isAgree){
	window.onload = runPackage;
}else{
	document.body.innerText="취소되었습니다.";
}

	// Registers a listener that receives messages inside the browser
	function exec(){
		chrome.extension.onMessage.addListener(function(request, sender) {
			// 실행순서 3
			if (request.action == "getSource") {
				document.body.innerText = request.source;
			}
			
		});
	}
// Inject 'getSource.js' into a web page loaded in the current tab, and execute it
    function onWindowLoad() {
		// 실행순서 1
        chrome.tabs.executeScript(null, {
            file: "getSource.js"
        }, function(result) {
			//exec();
            alert("내용물 :\n"+result);
            if (chrome.extension.lastError) {
                document.body.innerText = 'There was an error injecting script : \n' + chrome.extension.lastError.message;
            }
            // Call method: post inner text to server with token
            if(result.toString().length == 0){
                alert("텍스트가 없습니다.")
            } else {
				//document.body.innerText="완료되었습니다.";
                //post(result.toString(), token_);
            }
        });
    }
	function runPackage(){
		onWindowLoad();
		interactiveSignIn();
		exec();
	}
	
    

	// 0. Sign in
	function interactiveSignIn() {
    //changeState(STATE_ACQUIRING_AUTHTOKEN);

    // @corecode_begin getAuthToken
    // @description This is the normal flow for authentication/authorization
    // on Google properties. You need to add the oauth2 client_id and scopes
    // to the app manifest. The interactive param indicates if a new window
    // will be opened when the user is not yet authenticated or not.
    // @see http://developer.chrome.com/apps/app_identity.html
    // @see http://developer.chrome.com/apps/identity.html#method-getAuthToken
		chrome.identity.getAuthToken({ 'interactive': true }, function(token) {
		  if (chrome.runtime.lastError) {
			// chrome.runtime.lastError.message : "Invalid OAuth2 Client ID."
			alert(chrome.runtime.lastError.message);
			//changeState(STATE_START);
		  } else {
			alert('Token acquired:\n\t'+token+
			  '\n\t. See chrome://identity-internals for details.');
			//changeState(STATE_AUTHTOKEN_ACQUIRED);
		  }
		});
		// @corecode_end getAuthToken
	} // end interactiveSignIn
	
	// 1. Get User Info
	function getUserInfo(interactive) {
		xhrWithAuth('GET',
					'https://www.googleapis.com/plus/v1/people/me',
					interactive,
					onUserInfoFetched);
	}
	// @corecode_end getProtectedData


	// Code updating the user interface, when the user information has been
	// fetched or displaying the error.
	function onUserInfoFetched(error, status, response) {
		if (!error && status == 200) {
		  //changeState(STATE_AUTHTOKEN_ACQUIRED);
		  alert('onUserInfoFetched] ' + response);
		  var user_info = JSON.parse(response);
		  alert('onUserInfoFetched] ' + user_info);
		  populateUserInfo(user_info);
		} else {
		  //changeState(STATE_START);
		}
	} //end onUserInfoFetched

	function populateUserInfo(user_info) {
		//user_info_div.innerHTML = "Hello " + user_info.displayName;
		alert('populateUserInfo] ' + user_info);
		alert('populateUserInfo] ' + user_info.displayName);
		//fetchImageBytes(user_info);
	} //end populateUserInfo
	
	
/** 예전 실습 
	// GetAccounts
	chrome.identity.getAccounts(function(accounts) {
		alert(accounts);
	});
	
// Get user's token
    var token_ = "";
	// 실행순서 2
    chrome.identity.getAuthToken({
        interactive: true
    }, function(token) {
        alert("구글 토큰:\n"+token);
        token_ = token;
		
        if (chrome.runtime.lastError) {
            alert(chrome.runtime.lastError.message);
            return;
        }
    });
// 사용자 이메일과 id를 불러옴.
	chrome.identity.getProfileUserInfo(function(result){
		alert('email : ' + result.email + ', id : ' + result.id);
	});
	
// Call server API
    function post(text, token){
        // alert("POST 내용물:\n"+text);
        // alert("POST 토큰:\n"+token);

        var xhttp2 = new XMLHttpRequest();
		
        xhttp2.onreadystatechange = function() {
			// readyState가 1, 2, 3, 4 하면서 그 숫자 슬롯에 정보가 들어있는듯.
			
            if (xhttp2.readyState === 4) {
                var xhttp = new XMLHttpRequest();
				var textJson = JSON.stringify({
						text:text, 
						user_id:xhttp2.response.substring(10,31)
					});
				alert('user_info] ' + xhttp2.response);	
					
                xhttp.open("POST", "http://localhost:8000/api/test", true);
                xhttp.setRequestHeader("Content-type", "application/json");
                xhttp.send(textJson);
            }
        };
        xhttp2.open("GET", "https://www.googleapis.com/oauth2/v2/userinfo?alt=json&access_token="+token, true);
        xhttp2.setRequestHeader("Content-type", "application/json");
        xhttp2.send('');
    }

	
// token Caching
	// callback = function (error, httpStatus, responseText);
	function authenticatedXhr(method, url, callback) {
	  var retry = true;
	  function getTokenAndXhr() {
		chrome.identity.getAuthToken({//-- details --//},
									 function (access_token) {
		  if (chrome.runtime.lastError) {
			callback(chrome.runtime.lastError);
			return;
		  }

		  var xhr = new XMLHttpRequest();
		  xhr.open(method, url);
		  xhr.setRequestHeader('Authorization',
							   'Bearer ' + access_token);

		  xhr.onload = function () {
			if (this.status === 401 && retry) {
			  // This status may indicate that the cached
			  // access token was invalid. Retry once with
			  // a fresh token.
			  retry = false;
			  chrome.identity.removeCachedAuthToken(
				  { 'token': access_token },
				  getTokenAndXhr);
			  return;
			}

			callback(null, this.status, this.responseText);
		  }
		});
	  }
	}
	
// Token 로컬과 서버에서 없애기
function revokeToken() {

  chrome.identity.getAuthToken({ 'interactive': false },
  function(current_token) {
    if (!chrome.runtime.lastError) {

      // @corecode_begin removeAndRevokeAuthToken
      // @corecode_begin removeCachedAuthToken
      // Remove the local cached token
      chrome.identity.removeCachedAuthToken({ token: current_token },
        function() {});
      // @corecode_end removeCachedAuthToken

      // Make a request to revoke token in the server
      var xhr = new XMLHttpRequest();
      xhr.open('GET', 'https://accounts.google.com/o/oauth2/revoke?token=' +
               current_token);
      xhr.send();
      // @corecode_end removeAndRevokeAuthToken

      // Update the user interface accordingly

      $('#revoke').get(0).disabled = true; 
      console.log('Token revoked and removed from cache. '+
        'Check chrome://identity-internals to confirm.');
    }
  });
}
**/