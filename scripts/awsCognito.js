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

function revokeSocialLogin(){
    provider = null;
    accesstoken = null;
}

chrome.runtime.onMessage.addListener(onload);
function onload(message){
    console.log('[awsCognito.js]\n', message);
    chrome.storage.sync.get(function (data) {
        if(data.accesstoken) {
            accesstoken = data.accesstoken; // 전역변수
        }else{
            accesstoken = null;
        }
        var IdentityPoolId = 'ap-northeast-2:33a21208-23c8-4cc2-a59d-5cdd166c6554';
        try{
            if (!accesstoken){
                messageListener();
                return;
            }else if(message.expiration_time){
                // getAllFederatedIdentities(true).then((IdentityPoolId)=>{
                    var params = {IdentityPoolId : IdentityPoolId, provider:message.provider, accesstoken:message.accesstoken};
                    startAWSCognito(params).then(getTokenRefreshed);
                // });
                return;
            }
        }catch(e){
            console.error(e);
            messageListener();
            return;
        }

        // 전역변수
        provider = message.provider;
        userNm = message.name;
        userId = message.userId;
        userPic = message.picture;

        let htmls = `
              <p style="width: 100%; text-align:center">로딩 중..잠시 기다려 주세요...</p>
        `;
        document.querySelector('#loginarea').innerHTML = htmls;

        // getAllFederatedIdentities(true).then((IdentityPoolId)=>{
        //     console.log('[awsCognito.js:IdentityPoolId]', IdentityPoolId);
            startAWSCognito({IdentityPoolId, provider, accesstoken})
                .then(setAWSCognito)
                .then(insertDataSet)
                .then(getAWSCredential);
        // });
    });
} //end onload()

// auto token refresh
function getTokenRefreshed(inputCredential){
    console.log('[getTokenRefreshed]');
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
    console.log('[startAWSCognito:param]\n', param);
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
            // Cognito Identity에 생성된 사용자 identity Id를 storage에 저장.
            var identityId = credentials.identityId;
            var n = identityId.indexOf(":");
            identityId = identityId.substring(n+1,identityId.length).toString();   // ':' 가 '%3A' 로 바뀌는 issue떄문에 ':' 다음문장부터 id로 지정.
            sendIdentityId(identityId);

            var apigClientFactory = {
                accessKeyId : credentials.accessKeyId,
                secretAccessKey : credentials.secretAccessKey,
                sessionToken : credentials.sessionToken,
                identityId : identityId
            };

            // cognito Federated Identity Dataset에 자료 넣기.\
            resolve({apigClientFactory: apigClientFactory, userId: userId, userNm: userNm, picture: userPic});  //insertDataSet
        });
    });
}


function insertDataSet(params){
    console.log('[insertDataSet: params]', params);
    return new Promise((resolve, reject) => {
        // parameter : apigClientFactory: apigClientFactory, userId: userId, userNm: userNm, picture: userPic
        syncClient = new AWS.CognitoSyncManager();
        var isNew = false;

        // 없으면 만든다.
        syncClient.openOrCreateDataset('userInfo', function (err, dataset) {
            if (err) {
                console.error(err);
                return;
            }
            // 사용자 pool id의 dataset 내용 가져오기.
            dataset.get('userInfo', function (err, dataset) {
                if (err) console.log('[insertDataSet:err]', err);
                console.log('[insertDataSet: dataset.get]', dataset);
                if (!dataset)   {
                    isNew = true;
                    console.log('[insertDataSet: isNew]', isNew);
                }
            });

            resolve({apigClientFactory: params.apigClientFactory, isNew: isNew});  // getAWSCredential

            // 이미 소셜로그인을 한 상태이면 로그아웃 안 한 상태로 창이 새로 띄워질때 넘겨받는 파라미터가 name뿐이므로,
            // userId와 profilePic 정보가 dataset에서 제거된다. 그래서 userId와 picture가 undefined면 return.
            if (!params.userId || !params.picture)   return;

            // 사용자 pool id의 dataset 내용 수정/삽입하기
            var subject, contents;
            var userInfo = new Array(); // or just []
            a['userId'] = params.userId;
            a['userName'] = params.userNm;
            a['profilePic'] = params.picture;
            for (var k in userInfo) {
                if (a.hasOwnProperty(k)) {
                    subject = k;
                    contents = userInfo[k];
                    console.log('key is: ' + k + ', value is: ' + a[k]);
                    dataset.put(subject, contents, function (err, record) {
                        if (err) {
                            console.log('[dataset.put error]', err);
                            return;
                        }
                        dataset.synchronize({
                            onSuccess: function (data, newRecords) {
                                // Your handler code here
                            },
                            onFailure: function (err) {
                                console.log('onFailure', err);
                            },
                            onConflict: function (dataset, conflicts, callback) {
                                var resolved = [];
                                console.log('onConflict', conflicts);
                                // for (var i=0; i<conflicts.length; i++) {
                                //     console.log(conflicts[i]);
                                // }
                                dataset.resolve(resolved, function () {
                                    // return callback(true);
                                });
                            },
                            onDatasetDeleted: function (dataset, datasetName, callback) {
                                console.log('onDatasetDeleted');
                                // return callback(true);
                            },
                            onDatasetsMerged: function (dataset, datasetNames, callback) {
                                console.log('onDatasetsMerged');
                                // return callback(false);
                            }
                        });
                    });
                }
            }

        });
    });
}

// Cognito Federated Identity
function getAWSCredential(params){
    return new Promise((resolve, reject) => {
        // use API-Gateway with Cognito
        apigClient = apigClientFactory.newClient({
            accessKey: params.apigClientFactory.accessKeyId,
            secretKey: params.apigClientFactory.secretAccessKey,
            sessionToken: params.apigClientFactory.sessionToken,
            region: "ap-northeast-2"
        });

        // DynamoDB 데이터넣기
        var identityId = params.apigClientFactory.identityId;
        additionalParams = {
            headers: {
                'Content-Type': 'application/json; charset="UTF-8"'
            },
            queryParams: {}
        };
        console.log('[getAWSCredential:params.isNew]', params.isNew);
        // 사용자가 없으면 createUser 후 postTextUser
        if(params.isNew){
            let params_createUser = {
            };
            let body_createUser = {
                user_id : identityId
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
                    postTextUserIdPost(parms_postTextUserId, body_postTextUserId, additionalParams).then(messageListener);
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
            postTextUserIdPost(parms_postTextUserId, body_postTextUserId, additionalParams).then(messageListener);
        }
    });
    return identityId;
}

function postTextUserIdPost(params, body, additionalParams) {
    console.log('[postTextUserIdPost:params]\n', params);
    console.log('[postTextUserIdPost:body]\n', body);
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

