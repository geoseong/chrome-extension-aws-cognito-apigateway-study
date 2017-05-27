// User Contents Info
var userId, userNm, context, title, tag, provider, accesstoken;
// AWS Connection Info
var apigClient
var additionalParams;

chrome.runtime.onMessage.addListener(onload);
console.log('awsCognito');

// auto token refresh
function getTokenRefreshed(inputCredential){
    AWS.config.region = "ap-northeast-2";
    AWS.config.credentials = new AWS.CognitoIdentityCredentials(inputCredential);
    AWS.config.credentials.refresh((error) => {
        if (error) {
            console.error(error);
        } else {
            console.log('Successfully logged!');
            console.log("[[getTokenRefreshed:Amazon Cognito credentials]]\n");
            console.log(AWS.config.credentials);

            var cred = AWS.config.credentials;

            apigClient = apigClientFactory.newClient({
                accessKey: cred.accessKeyId,
                secretKey: cred.secretAccessKey,
                sessionToken: cred.sessionToken,
                region: "ap-northeast-2"
            });
        }
    });
}

function onload(message){
    try{
        let msg = JSON.stringify(message);
        console.log('[awsCognito.js: msg]', msg);

        if (!message.accesstoken){
            console.log('[awsCognito] !message.accesstoken');
            messageListener();
            return;
        }else if(message.expiration_time){
            startAWSCognito({provider:message.provider, accesstoken:message.accesstoken}).then(getTokenRefreshed);
            return;
        }
    }catch(e){
        console.error(e);
        // console.log('[awsCognito] !message.accesstoken');
        messageListener();
        return;
    }
    // 전역변수
    provider = message.provider;
    accesstoken = message.accesstoken;
    userNm = message.name;

    console.log('[[awsCognito.js]] onload message!!');
    console.log(message);
	console.log('paramTitle', title);	console.log('paramTag', tag);

    let htmls = `
          <p style="width: 100%; text-align:center">로딩 중..잠시 기다려 주세요...</p>
      `;
    document.querySelector('#loginarea').innerHTML = htmls;

    startAWSCognito({provider, accesstoken})
        .then(setAWSCognito)
        .then(getAWSCredential);

}
// paramTitle, paramTag 값 setter
function setcontentTitleTag(paramTitle, paramTag){
	title = paramTitle;
	tag = paramTag;
}

function startAWSCognito(param){
    return new Promise((resolve, reject) => {
        var inputCredential;
        // 전역변수 provider
        provider = param.provider;
        chrome.storage.sync.get(function (data) {
            console.log('[startAWSCognito:data]\n', data);

            // 전역변수 context
            context = data.context;

            if (param.provider==="facebook") {
                userId = data.userId.facebook;
                inputCredential = {
                    IdentityPoolId: "ap-northeast-2:33a21208-23c8-4cc2-a59d-5cdd166c6554",   // yaenedeul
                    Logins: {
                        'graph.facebook.com': param.accesstoken     // message.access_token
                    }
                };
            } else {
                userId = data.userId.google;
                inputCredential = {
                    IdentityPoolId: "ap-northeast-2:33a21208-23c8-4cc2-a59d-5cdd166c6554",   // yaenedeul
                    Logins: {
                        'accounts.google.com': param.accesstoken
                    }
                };
            }
            console.log('[startAWSCognito:inputCredential]', inputCredential);
            resolve(inputCredential);
        });
    });
}

function setAWSCognito(inputCredential) {
    return new Promise((resolve, reject) => {
        AWS.config.region = "ap-northeast-2";
        AWS.config.credentials = new AWS.CognitoIdentityCredentials(inputCredential);
        AWS.config.update({customUserAgent: 'MobileHub v0.1'});

        var credentials = AWS.config.credentials;
        credentials.get(function (err) {
            if (err) {
                console.log("Error: \n", err);
                return;
            }
            var accessKeyId = credentials.accessKeyId;
            var secretAccessKey = credentials.secretAccessKey;
            var sessionToken = credentials.sessionToken;
            var identityId = credentials.identityId;
            var n = identityId.indexOf(":");
            identityId = identityId.substring(n+1,identityId.length).toString();   // ':' 가 '%3A' 로 바뀌는 issue떄문에 ':' 다음문장부터 id로 지정.

            // Cognito Identity에 생성된 사용자 identity Id를 storage에 저장.
            sendIdentityId(identityId);

            console.log("[[getAWSCredential:Amazon Cognito credentials]]\n");
            console.log(credentials);

            resolve({accessKeyId, secretAccessKey, sessionToken, identityId});
        });
    });
}

// Cognito Federated Identity
function getAWSCredential(params){
    return new Promise((resolve, reject) => {
            // use API-Gateway with Cognito
            apigClient = apigClientFactory.newClient({
                accessKey: params.accessKeyId,
                secretKey: params.secretAccessKey,
                sessionToken: params.sessionToken,
                region: "ap-northeast-2"
            });
            var identityId = params.identityId;
            var params_getUserInfo = {
                user_id: identityId
            };
            var body_getUserInfo = {};
            additionalParams = {
                headers: {
                    'Content-Type': 'application/json; charset="UTF-8"'
                },
                queryParams: {}
            };
            apigClient.getUserInfoUserIdGet(params_getUserInfo, body_getUserInfo, additionalParams)
                .then(function (result) {
                    // 사용자가 없으면 createUser 후 postTextUser
                    if(result.data.is_user === 0){
                        let params_createUser = {
                        };
                        let body_createUser = {
                            user_id : identityId,
                            name : userNm
                        }

                        apigClient.createUserPost(params_createUser, body_createUser, additionalParams)
                            .then(function (result) {
                                let parms_postTextUserId = {
                                    user_id: identityId
                                }
                                let body_postTextUserId = {
                                    text: context,
                                    tag_list: tag,
                                    title: title
                                }
                                // 사용자 단어 DynamoDB에 모두 넣은 뒤 index.js에서 단어뿌리기작업 실시
                                postTextUserIdPost(parms_postTextUserId, body_postTextUserId).then(messageListener);
                            }).catch(function (result) {
                                console.log('[createUserPost-fail]', result);
                            })
                    }
                    else{
                        let parms_postTextUserId = {
                            user_id: identityId
                        }
                        let body_postTextUserId = {
                            text: context,
                            tag_list: tag,
                            title: title
                        }

                        // 사용자 단어 DynamoDB에 모두 넣은 뒤 index.js에서 단어뿌리기작업 실시
                        postTextUserIdPost(parms_postTextUserId, body_postTextUserId).then(messageListener);
                    }
                }).catch(function (result) {
                    console.log('[getUserInfoUserIdGet-fail]', result);
                });
    });
    return identityId;
}

function postTextUserIdPost(params, body, additionalParams) {
    return new Promise((resolve, reject) => {
        apigClient.postTextUserIdPost(params, body, additionalParams)
            .then(function (result) {
                // index.js messsageListener(message)에 파라미터 전달하여 단어뿌리기작업 실시
                resolve({name: userNm, data: result.data});
            }).catch(function (result) {
                console.log('[postTextUserIdPost-fail]', result);
            });
    });
}
// from index.js
function updateWordStatusUserIdPatch(userId, body) {
    let params = {
        user_id : userId
    }
    apigClient.updateWordStatusUserIdPatch(params, body, additionalParams)
        .then(function (result) {
            // index.js messsageListener(message)에 파라미터 전달하여 단어뿌리기작업 실시
            // resolve({name: userNm, data: result.data});
        }).catch(function (result) {
            console.log('[updateWordStatusUserIdPatch-fail]', result);
            // background.js 로 메시지 보냄 ( token을 다시 받아서 security token refresh를 위함. )
            chrome.runtime.sendMessage({provider: provider, type: 'getUserInfo'});
        });
}

function sendIdentityId(identityId){
    if (provider === "facebook") {
        chrome.storage.sync.set({
            "facebook": {"id": identityId, "name": userNm},
            "google": {"id": '', "name": ''}
        });
    } else {
        chrome.storage.sync.set({
            "google" : {"id" : identityId, "name" : userNm},
            "facebook" : {"id": '', "name": ''}
        });
    } //end if
}



// [Not Used] Called when an identity provider has a token for a logged in user
function userLoggedIn(creds, providerName, token) {
    creds.params.Logins = {};
    creds.params.Logins[providerName] = token;
// Expire credentials to refresh them on the next request
    creds.expired = true;
}

// [Not Used] cognitoUserPool 회원가입.
function cognitoUserPoolSignUp(){
    // AWSCognito.config.region = 'us-east-1';

    var poolData = {
        region : 'us-northeast-2',
        // apiGWEndpoint : '',  // Token을 얻은 후에 api를 호출할 주소
        // UserPoolId : 'ap-northeast-2_4TsUyfJmr', // Geoseong
        // ClientId : '3hfkbs0op12mg3g0dk6os1gqus'
        UserPoolId : 'ap-northeast-2_p0PZvtZzW',    // yaenedeul
        ClientId : '2k6u2eoqp8rv5votdda8qfimm2'
    };
    var userPool = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserPool(poolData);

    var userData = {
        Username : 'geoseong', // your username here
        Pool : userPool
    };

    var attributeList = [];
    var dataName = {
        Name : 'name',
        Value : 'geoseong' // your email here
    };
    var dataEmail = {
        Name : 'email',
        Value : 'geoseong@geoseong.edu' // your email here
    };
    var dataPhoneNumber = {
        Name : 'phone_number',
        Value : '01020236697' // your phone number here with +country code and no delimiters in front
    };
    var dataPicture = {
        Name : 'picture',
        Value : 'https://lh5.googleusercontent.com/-bABKlFiwxH4/AAAAAAAAAAI/AAAAAAAAAPE/dNiva9mABsI/photo.jpg'
    }
    var dataGender = {
        Name : 'gender',
        Value : 'male'
    }
    var dataBirthdate = {
        Name : 'birthdate',
        Value : '1989-01-19'
    }

    var attributeName = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataName);
    var attributeEmail = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataEmail);
    var attributePhoneNumber = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataPhoneNumber);
    var attributePicture = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataPicture);
    var attributeGender = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataGender);
    var attributeBirthdate = new AWSCognito.CognitoIdentityServiceProvider.CognitoUserAttribute(dataBirthdate);

    attributeList.push(attributeName);
    attributeList.push(attributeEmail);
    attributeList.push(attributePhoneNumber);
    attributeList.push(attributePicture);
    attributeList.push(attributeGender);
    attributeList.push(attributeBirthdate);

    console.log('[[attributeList]]');
    console.log(attributeList);

    var cognitoUser;
    // param1 : username , param2 : password, param3 : pushed attributeList above
    // userPool.signUp('username', '1234567890', attributeList, null, function(err, result){
    userPool.signUp('geoseong','1q2w#E',attributeList, null, function(err, result){
        console.log('[cognito userPool Result]');
        // result.storage에 cognito federated identity Dataset정보가 있음
        console.log(result);
        if (err) {
            alert(err);
            console.log('[cognito userPool err]');
            console.log(err);
        // [case1] app clients 생성 시 client secret에 체크하면
            // NotAuthorizedException: Unable to verify secret hash for client 29dat2kbufu1ipenf4ik8e4lk7
        // [case2] User Pools -> Policies의 비번 체크로직에 안맞으면 뜸.
            // InvalidPasswordException: Password did not conform with policy: Password not long enough
        // [case3] User Pools -> Attributes 에서 필요로 하는 정보를 체크했는데 그 정보가 안채워졌을때.
            // Error: Attributes did not conform to the schema: name: The attribute is required
            // picture: The attribute is required
            // gender: The attribute is required
            // birthdate: The attribute is require
            return;
        }
        cognitoUser = result.user;
        console.log('[cognito userPool Result]');
        console.log(result);
        console.log('user name is : ' + cognitoUser.getUsername());
    });
}