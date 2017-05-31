var maxresult = 60;    // Member must have value less than or equal to 60

function getAllFederatedIdentities(justgetPoolId){
    return new Promise((resolve, reject) => {

        // 기능 : 현재 로그인된 아마존 사용자계정(관리자)이 갖고있는 Cognity Identity Pool 정보를 불러오기
        var credentials = new AWS.Credentials({        // 현 유저의 IAM user -> seurity credentials
            accessKeyId: '',
            secretAccessKey : ''
        });
        var cognitoidentity = new AWS.CognitoIdentity({
            region: "ap-northeast-2",
            credentials: credentials
        });
        var IdentityPoolId;
        cognitoidentity.listIdentityPools({MaxResults: maxresult}, function (err, data) {
            if (err) console.log(err, err.stack); // an error occurred
            else {  // successful response
                if(justgetPoolId){
                    IdentityPoolId = data.IdentityPools[0].IdentityPoolId;
                    resolve(IdentityPoolId);//    return;
                }
            }
            // 기능 : 현재 로그인된 아마존 사용자계정(관리자)이 갖고있는 Cognity Identity Pool 의 모든 Identity IDs 불러오기
            var params = {
                IdentityPoolId: IdentityPoolId, /* required */
                MaxResults: maxresult, /* required */
                HideDisabled: false
            };
            cognitoidentity.listIdentities(params, function (err, data) {
                if (err) console.log(err, err.stack); // an error occurred
                else     console.log(data);           // successful response
            });
        });
    });
}
