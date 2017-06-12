// User Contents Info
var userId, userNm, userPic, context, title, tag, provider, accesstoken;
// AWS Connection Info
var apigClient
var additionalParams;
var syncClient;
// see if login user is already exist
var isNew = false;

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
                var params = {IdentityPoolId : IdentityPoolId, provider:message.provider, accesstoken:message.accesstoken};
                startAWSCognito(params).then(getTokenRefreshed);
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

        // Promise function
        startAWSCognito({IdentityPoolId, provider, accesstoken})
            .then(setAWSCognito)
            .then(insertDataSet)
            .then(getAWSCredential);
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
                inputCredential = {
                    IdentityPoolId: param.IdentityPoolId,   // yaenedeul
                    Logins: {
                        'graph.facebook.com': param.accesstoken     // message.access_token
                    }
                };
            } else {
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
        console.log('setAWSCognito: inputCredential', inputCredential);

        AWS.config.region = "ap-northeast-2";
        AWS.config.update({customUserAgent: 'MobileHub v0.1'});

        // Initially Unauthenticated User & Switch to Authenticated User
        var cognitocreds = new AWS.CognitoIdentityCredentials(inputCredential);
        AWS.config.credentials = cognitocreds;
        cognitocreds.expired = true;

        // var providerid;
        // for(var key in inputCredential.Logins){
        //     providerid = key;
        //     console.log('inputCredential.Logins -', providerid);
        // }
        // var webIdentitycreds = new AWS.WebIdentityCredentials({
        //     RoleArn: 'arn:aws:iam::804067700506:role/wik_auth_MOBILEHUB_1094472491',
        //     ProviderId: providerid, // Omit this for Google
        //     WebIdentityToken: inputCredential.Logins[providerid] // Access token from identity provider
        // });
        // AWS.config.credentials = webIdentitycreds;
        // // Result : Not authorized to perform sts:AssumeRoleWithWebIdentity

        syncClient = new AWS.CognitoSyncManager();
        var credentials = AWS.config.credentials;
        console.log('setAWSCognito: AWS.config.credentials', credentials);
        credentials.get(function (err) {
            if (err) {
                console.log("Error: \n", err);
                return;
            }
            // Cognito Identity에 생성된 사용자 identity Id를 storage에 저장.
            var identityId = credentials.identityId;
            sendIdentityId(identityId);

            var apigClientFactory = {
                accessKeyId : credentials.accessKeyId,
                secretAccessKey : credentials.secretAccessKey,
                sessionToken : credentials.sessionToken,
                identityId : identityId
            };
            // cognito Federated Identity Dataset에 자료 넣기.
            resolve({apigClientFactory: apigClientFactory, userId: userId, userNm: userNm, picture: userPic});  //insertDataSet

        }); //end credentials.get();

    }); //end Promise
}


function insertDataSet(params){
    console.log('[insertDataSet: params]', params);
    return new Promise((resolve, reject) => {
        // parameter : apigClientFactory: apigClientFactory, userId: userId, userNm: userNm, picture: userPic

        // 없으면 만든다.
        syncClient.openOrCreateDataset('userInfo', function (err, dataset) {

            // federated identities의 dataset 안의 모든 내용 가져오기.
            dataset.getAllRecords(function (err, dataINdataset) {
                if (err) console.log('[insertDataSet:err]', err);
                console.log('[insertDataSet: userInfo 안의 data..]', dataINdataset);    // 배열로 리턴됨.
                if(dataINdataset.length === 0){
                    isNew = true;
                    console.log('dataINdataset.length = 0 / isNew = true;');
                }
                // if (isNew){
                    // 사용자 pool id의 dataset 내용 수정/삽입하기
                    var subject, contents;
                    var userInfo = new Array(); // or just []
                    userInfo['userId'] = params.userId;
                    userInfo['userName'] = params.userNm;
                    userInfo['profilePic'] = params.picture;
                    for (var k in userInfo) {
                        if (userInfo.hasOwnProperty(k)) {
                            subject = k;
                            contents = userInfo[k];
                            console.log('key is: ' + k + ', value is: ' + userInfo[k]);
                            dataset.put(subject, contents, function (err, record) {
                                if (err) {
                                    console.log('[dataset.put error]', err);
                                    return;
                                }
                                dataset.synchronize({
                                    onSuccess: function (data, newRecords) {
                                        console.log('onSuccess', data);
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
                            }); // dataset.put()
                        }
                    } //end for
                // } //end if
            }); // end dataset.getAllRecords()

            resolve({apigClientFactory: params.apigClientFactory, isNew: isNew});  // getAWSCredential
        }); //end syncClient.openOrCreateDataset()
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

        console.log('identityId -', identityId);
        console.log('[getAWSCredential:params.isNew]', params.isNew);
        console.log('context : ', context);

        // createUser(USER_CONTENTS, USER_WORDS putItem) 후 postTextUser
        if(params.isNew){
            let params_createUser = {
            };
            let body_createUser = {
                user_id : identityId
            }

            apigClient.createUserPost(params_createUser, body_createUser, additionalParams)
                .then(function (result) {
                    console.log('createUserPost');
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
	var param_userId = userId;
	var param_body = body;
    let params = {
        user_id : userId
    }
    apigClient.updateWordStatusUserIdPatch(params, body, additionalParams)
        .then(function (result) {
            // index.js messsageListener(message)에 파라미터 전달하여 단어뿌리기작업 실시
            console.log('[updateWordStatusUserIdPatch]result', result);
        }).catch(function (result) {
            // background.js 로 메시지 보냄 ( token을 다시 받아서 security token refresh를 위함. )
            chrome.runtime.sendMessage({provider: provider, type: 'getUserInfo'}, () =>{
				updateWordStatusUserIdPatch(param_userId, param_body);
			});
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