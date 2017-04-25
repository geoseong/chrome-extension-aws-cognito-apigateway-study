// Registers a listener that receives messages inside the browser
chrome.extension.onMessage.addListener(function(request, sender) {
    if (request.action == "getSource") {
        document.body.innerText = request.source;
    }
});

// Inject 'getSource.js' into a web page loaded in the current tab, and execute it
function onWindowLoad() {
    chrome.tabs.executeScript(null, {
        file: "getSource.js"
    }, function(result) {
        alert("내용물 :\n"+result);
        if (chrome.extension.lastError) {
            document.body.innerText = 'There was an error injecting script : \n' + chrome.extension.lastError.message;
        }
        // Call method: post inner text to server with token
        post(result.toString(), token_);
    });
}

window.onload = onWindowLoad;

// Get user's token
var token_ = "";
chrome.identity.getAuthToken({
    interactive: true
}, function(token) {
    alert("구글 토큰:\n"+token);
    token_ = token;
    if (chrome.runtime.lastError) {
        alert(chrome.runtime.lastError.message);
        return;
    }
    // Get user's information
    // var x = new XMLHttpRequest();
    // x.open('GET', 'https://www.googleapis.com/oauth2/v2/userinfo?alt=json&access_token=' + token);
    // x.onload = function() {
    //     alert(x.response);
    // };
    // x.send();
});

// Call server API
function post(text, token){
    alert("POST 내용물:\n"+text);
    alert("POST 토큰:\n"+token);
    var xhttp = new XMLHttpRequest();
    xhttp.open("POST", "http://localhost:8000/api/test", true);
    xhttp.setRequestHeader("Content-type", "application/json");
    xhttp.send(JSON.stringify({text:text, token:token}));
}

// function hello() {
//     chrome.tabs.executeScript({
//         file: 'alert.js'
//     });
// }
//
// document.getElementById('clickme').addEventListener('click', hello);