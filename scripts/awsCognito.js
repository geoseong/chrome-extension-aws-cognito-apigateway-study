// User Contents Info
var userId, userNm, userPic, context, title, tag, provider, accesstoken;
// AWS Connection Info
var apigClient
var additionalParams;
var syncClient;

// paramTitle, paramTag 값 setter
function setcontentTitleTag(paramTitle, paramTag){
    title = paramTitle;
    tag = paramTag;
}

chrome.runtime.onMessage.addListener(onload);
function onload(message){
    console.log('[awsCognito.js:message]', message);
    try{
        if (!message.accesstoken){
            messageListener();
            return;
        }else if(message.expiration_time){
            startAWSCognito({provider:message.provider, accesstoken:message.accesstoken}).then(getTokenRefreshed);
            return;
        }
    }catch(e){
        console.error(e);
        messageListener();
        return;
    }
    // 전역변수
    provider = message.provider;
    accesstoken = message.accesstoken;
    userNm = message.name;
    userId = message.userId;
    userPic = message.picture;

    let htmls = `
          <p style="width: 100%; text-align:center">로딩 중..잠시 기다려 주세요...</p>
    `;
    document.querySelector('#loginarea').innerHTML = htmls;

    getAllFederatedIdentities(true).then((IdentityPoolId)=>{
        console.log('[awsCognito.js:IdentityPoolId]', IdentityPoolId);
        // 본래 코드
        startAWSCognito({IdentityPoolId, provider, accesstoken})
            .then(setAWSCognito)
            .then(getAWSCredential);
    })


} //end onload()

// auto token refresh
function getTokenRefreshed(inputCredential){
    AWS.config.region = "ap-northeast-2";
    AWS.config.credentials = new AWS.CognitoIdentityCredentials(inputCredential);
    AWS.config.credentials.refresh((error) => {
        if (error) {
            console.error(error);
        } else {
            console.log('token refreshed');
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

function startAWSCognito(param){
    return new Promise((resolve, reject) => {
        var inputCredential;
        // 전역변수 provider
        provider = param.provider;
        chrome.storage.sync.get(function (data) {
            // 전역변수 context
            context = data.context;

            if (param.provider==="facebook") {
                // userId = data.facebook.id;
                inputCredential = {
                    IdentityPoolId: param.IdentityPoolId,   // yaenedeul
                    Logins: {
                        'graph.facebook.com': param.accesstoken     // message.access_token
                    }
                };
            } else {
                // userId = data.google.id;
                inputCredential = {
                    IdentityPoolId: param.IdentityPoolId,   // yaenedeul
                    Logins: {
                        'accounts.google.com': param.accesstoken
                    }
                };
            }
            resolve(inputCredential);
            console.log('[awsCognito.js:inputCredential]', inputCredential);
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
            // cognito Federated Identity Dataset에 자료 넣기.
            insertDataSet({userId: userId, userNm: userNm, picture: userPic});

            var accessKeyId = credentials.accessKeyId;
            var secretAccessKey = credentials.secretAccessKey;
            var sessionToken = credentials.sessionToken;
            var identityId = credentials.identityId;
            var n = identityId.indexOf(":");
            identityId = identityId.substring(n+1,identityId.length).toString();   // ':' 가 '%3A' 로 바뀌는 issue떄문에 ':' 다음문장부터 id로 지정.

            // Cognito Identity에 생성된 사용자 identity Id를 storage에 저장.
            sendIdentityId(identityId);
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

            // DynamoDB 데이터넣기
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

function insertDataSet(params){
    console.log('[insertDataSet:params]', params);
    // 이미 소셜로그인을 한 상태이면 로그아웃 안 한 상태로 창이 새로 띄워질때 넘겨받는 파라미터가 name뿐이므로,
    // userId와 profilePic 정보가 dataset에서 제거된다. 그래서 userId와 picture가 undefined면 return.
    if(!params.userId || !params.picture)   return;

    // parameter : params.userId, params.userNm, params.picture
    syncClient = new AWS.CognitoSyncManager();

    // 없으면 만든다.
    syncClient.openOrCreateDataset('userInfo', function(err, dataset) {
        if(err) {
            console.error(err);
            return;
        }
        // 사용자 pool id의 dataset 내용 가져오기.
        dataset.get('userInfo', function(err, dataset) {
            if(err) console.log('[insertDataSet:err]', err);
            console.log('[insertDataSet:dataset.get]', dataset);
        });
        // 사용자 pool id의 dataset 내용 수정/삽입하기
        var subject, contents;
        subject = 'userInfo';
        contents = JSON.stringify({
            'userId' : params.userId,
            'userName' : params.userNm,
            'profilePic' : params.picture
        });
        dataset.put(subject, contents, function(err, record){
            if(err) {
                console.log('[dataset.put error]', err);
                return;
            }
            console.log('dataset.record', record);
            dataset.synchronize({
                onSuccess: function(data, newRecords) {
                    // Your handler code here
                    console.log('onSuccess:data', data);
                    console.log('onSuccess:newRecords', newRecords);
                },
                onFailure: function(err) {
                    console.log('onFailure', err);
                },
                onConflict: function(dataset, conflicts, callback) {
                    var resolved = [];
                    console.log(dataset);
                    console.log('onConflict', conflicts);
                    // for (var i=0; i<conflicts.length; i++) {
                    //     console.log(conflicts[i]);
                    // }
                    dataset.resolve(resolved, function() {
                        // return callback(true);
                        console.log('resolve', resolved);
                    });
                },
                onDatasetDeleted: function(dataset, datasetName, callback) {
                    console.log('onDatasetDeleted');
                    // return callback(true);
                },
                onDatasetsMerged: function(dataset, datasetNames, callback) {
                    console.log('onDatasetsMerged');
                    // return callback(false);
                }
            });
        });
    });
}
