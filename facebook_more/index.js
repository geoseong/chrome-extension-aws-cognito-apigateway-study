var gh = (function() {
  'use strict';

  var signin_button;
  var revoke_button;
  var user_info_div;
  var access_token;
  var User = {
    id:'',
    firstname:'',
    familyname:'',
    email:''
  };


  var tokenFetcher = (function() {
    var clientId = '1210960172364453';
    var clientSecret = '1f71e53272217e2d71ff6d654039001d';
    var redirectUri = 'https://' + chrome.runtime.id +
                      '.chromiumapp.org/provider_cb';

    var redirectRe = new RegExp(redirectUri + '[#\?](.*)');
    access_token = null;

    return {
      getToken: function(interactive, callback) {
        // In case we already have an access_token cached, simply return it.
        if (access_token) {
          callback(null, access_token);
          return;
        }
          // tspark
          var test = document.querySelector('#test').innerHTML = '<p>'+redirectUri+'</p>';

        var options = {
          'interactive': interactive,
          // url:'https://graph.facebook.com/oauth/access_token?client_id=' + clientId +
          url:'https://www.facebook.com/dialog/oauth/?client_id=' + clientId +
              '&reponse_type=token' +
              '&access_type=online' +
              '&display=popup' +
              '&redirect_uri=' + encodeURIComponent(redirectUri)
        }

          // tspark
          document.querySelector('#test').innerHTML = test + '<p>'+options.url+'</p>';

        // 새로 뜨는 팝업창이 닫히면 실행되는 듯.
        chrome.identity.launchWebAuthFlow(options, function(redirectUri) {
          // tspark
            document.querySelector('#test').innerHTML = document.querySelector('#test').innerHTML + '<p id="hi">popup closed</p>';
            console.log('[[got in launchWebAuthFlow]]');

          if (chrome.runtime.lastError) {
              // tspark
              console.log('chrome.runtime.lastError? ' + chrome.runtime.lastError.message);
            callback(new Error(chrome.runtime.lastError));
            return;
          }

          // Upon success the response is appended to redirectUri, e.g.
          // https://{app_id}.chromiumapp.org/provider_cb#access_token={value}
          //     &refresh_token={value}
          // or:
          // https://{app_id}.chromiumapp.org/provider_cb#code={value}
          var matches = redirectUri.match(redirectRe);

          if (matches && matches.length > 1){
            handleProviderResponse(parseRedirectFragment(matches[1]));
          }else{
            callback(new Error('Invalid redirect URI'));
          }
        });

        function parseRedirectFragment(fragment) {
          var pairs = fragment.split(/&/);
          var values = {};

          pairs.forEach(function(pair) {
            var nameval = pair.split(/=/);
            values[nameval[0]] = nameval[1];
          });
            console.log('[parseRedirectFragment] values \n\t' + JSON.stringify(values));
          return values;
        }

        function handleProviderResponse(values) {
          if (values.hasOwnProperty('access_token'))
            setAccessToken(values.access_token);
          else if (values.hasOwnProperty('code'))
            exchangeCodeForToken(values.code);
          else callback(new Error('Neither access_token nor code avialable.'));
        }

        function exchangeCodeForToken(code) {
          var xhr = new XMLHttpRequest();
          xhr.open('GET',
                   // 'https://www.facebook.com/dialog/oauth?'+
                   'https://graph.facebook.com/oauth/access_token?' +
                   'client_id=' + clientId +
                   '&client_secret=' + clientSecret +
                   '&redirect_uri=' + redirectUri +
                   '&code=' + code);
          xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          xhr.setRequestHeader('Accept', 'application/json');
          xhr.onload = function () {
            if (this.status === 200) {
                console.log('[exchangeCodeForToken] XMLHttpRequest.status \n\t' + this.status);
                console.log('[exchangeCodeForToken] XMLHttpRequest.response \n\t' + this.response);
                console.log('[exchangeCodeForToken] XMLHttpRequest.responseText \n\t' + this.responseText);

              //var response = JSON.parse('"'+this.responseText+'"');
              var response = JSON.parse(this.responseText);

              //response = response.substring(0,response.indexOf('&'));
              console.log('[exchangeCodeForToken] response.access_token\n\t' + response.access_token);
              response = response.access_token;

              setAccessToken(response);
              access_token = response;
            }
          };
          xhr.send();
        }

        function setAccessToken(token) {
          access_token = token;
            chrome.storage.sync.set({
                access_token: access_token
            });

          callback(null, access_token);
        }
      },

      removeCachedToken: function(token_to_remove) {
        if (access_token == token_to_remove)
          access_token = null;
      }
    }
  })();

  function xhrWithAuth(method, url, interactive, callback) {
    var retry = true;
    getToken();

    function getToken() {
      tokenFetcher.getToken(interactive, function(error, token) {
        if (error) {
          callback(error);
          return;
        }
        access_token = token;
        requestStart();
      });
    }

    function requestStart() {
      var xhr = new XMLHttpRequest();
      xhr.open(method, url);
      xhr.setRequestHeader('Authorization', 'Bearer ' + access_token);
      xhr.onload = requestComplete;
      xhr.send();
      console.log('[xhr]')
      console.log(xhr);
      console.log('[xhrWithAuth -> requestStart]');
        console.log(this);
    }

    function requestComplete() {
      if (this.status != 200 && retry) {
        retry = false;
        tokenFetcher.removeCachedToken(access_token);
        access_token = null;
        getToken();
      }else {
        console.log('[xhrWithAuth -> requestComplete] \n\t' + this.response);
        console.log(this);
        callback(null, this.status, this.response);
      }
    }
  }

  function getUserInfo(interactive) {
    xhrWithAuth('GET',
                'https://graph.facebook.com/me?'+access_token,
                interactive,
                onUserInfoFetched);
  }

  // Functions updating the User Interface:

  function showButton(button) {
    button.style.display = 'inline';
    button.disabled = false;
  }

  function hideButton(button) {
    button.style.display = 'none';
  }

  function disableButton(button) {
    button.disabled = true;
  }

  function onUserInfoFetched(error, status, response) {
    if (!error && status == 200) {
      var user_info = JSON.parse(response);
      console.log('[onUserInfoFetched]');
      console.log(user_info);
      // User.id = user_info.id;
      // User.firstname = user_info.first_name;
      // User.familyname = user_info.last_name;
      // User.email = user_info.email;
        // start : temp
        User.id = user_info.id;
        User.familyname = user_info.name;
        console.log('[User]');
        console.log(User);
        // end : temp

      document.getElementById('user_info').innerHTML = 
      "<b>Hello " + User.firstname + " " + User.familyname + "</b><br>"
            + "Your email is: " + User.email + "</b><br>" + 
            "Link to your Facebook page is:" + user_info.link;
      hideButton(signin_button);
      showButton(revoke_button);
    } else {
      showButton(signin_button);
    }
  }

  function interactiveSignIn() {
    disableButton(signin_button);
    tokenFetcher.getToken(true, function(error, access_token) {
      if (error) {
        console.log('[interactiveSignIn] isError? \n\t' + JSON.stringify(error));
        console.log('\tLet\'s go to showButton');
        showButton(signin_button);
      } else {
        console.log('Let\'s go to getUserInfo()');
        getUserInfo(true);
      }
    });
  }

  function revokeToken() {
    //We are opening the web page that allows user to revoke their token.
    //window.open('https://github.com/settings/applications');
    user_info_div.textContent = '';
    hideButton(revoke_button);
    showButton(signin_button);
    chrome.storage.sync.get(function(data){
        var token = data.access_token;
        console.log('[stornage.sync.get]');
        console.log(data);
        console.log(data.access_token);
        tokenFetcher.removeCachedToken(token);
    });
  }

  return {
    onload: function () {
      signin_button = document.querySelector('#signin');
      signin_button.onclick = interactiveSignIn;
      revoke_button = document.querySelector('#revoke');
      revoke_button.onclick = revokeToken;
      user_info_div = document.getElementById('user_info');

      showButton(signin_button);
      getUserInfo(false);
    }
  };
})();

window.onload = gh.onload;