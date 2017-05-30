/*
 * Copyright 2010-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License").
 * You may not use this file except in compliance with the License.
 * A copy of the License is located at
 *
 *  http://aws.amazon.com/apache2.0
 *
 * or in the "license" file accompanying this file. This file is distributed
 * on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied. See the License for the specific language governing
 * permissions and limitations under the License.
 */

var apigClientFactory = {};
apigClientFactory.newClient = function (config) {
    var apigClient = { };
    if(config === undefined) {
        config = {
            accessKey: '',
            secretKey: '',
            sessionToken: '',
            region: '',
            apiKey: undefined,
            defaultContentType: 'application/json',
            defaultAcceptType: 'application/json'
        };
    }
    if(config.accessKey === undefined) {
        config.accessKey = '';
    }
    if(config.secretKey === undefined) {
        config.secretKey = '';
    }
    if(config.apiKey === undefined) {
        config.apiKey = '';
    }
    if(config.sessionToken === undefined) {
        config.sessionToken = '';
    }
    if(config.region === undefined) {
        config.region = 'us-east-1';
    }
    //If defaultContentType is not defined then default to application/json
    if(config.defaultContentType === undefined) {
        config.defaultContentType = 'application/json';
    }
    //If defaultAcceptType is not defined then default to application/json
    if(config.defaultAcceptType === undefined) {
        config.defaultAcceptType = 'application/json';
    }

    
    // extract endpoint and path from url
    var invokeUrl = 'https://6p5fe3dege.execute-api.ap-northeast-2.amazonaws.com/beta';
    var endpoint = /(^https?:\/\/[^\/]+)/g.exec(invokeUrl)[1];
    var pathComponent = invokeUrl.substring(endpoint.length);

    var sigV4ClientConfig = {
        accessKey: config.accessKey,
        secretKey: config.secretKey,
        sessionToken: config.sessionToken,
        serviceName: 'execute-api',
        region: config.region,
        endpoint: endpoint,
        defaultContentType: config.defaultContentType,
        defaultAcceptType: config.defaultAcceptType
    };

    var authType = 'NONE';
    if (sigV4ClientConfig.accessKey !== undefined && sigV4ClientConfig.accessKey !== '' && sigV4ClientConfig.secretKey !== undefined && sigV4ClientConfig.secretKey !== '') {
        authType = 'AWS_IAM';
    }

    var simpleHttpClientConfig = {
        endpoint: endpoint,
        defaultContentType: config.defaultContentType,
        defaultAcceptType: config.defaultAcceptType
    };

    var apiGatewayClient = apiGateway.core.apiGatewayClientFactory.newClient(simpleHttpClientConfig, sigV4ClientConfig);
    
    
    
    apigClient.addWordUserIdPut = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var addWordUserIdPutRequest = {
            verb: 'put'.toUpperCase(),
            path: pathComponent + uritemplate('/addWord/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(addWordUserIdPutRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.addWordMeaningUserIdPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var addWordMeaningUserIdPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/addWordMeaning/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(addWordMeaningUserIdPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.createUserPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var createUserPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/createUser').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(createUserPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.feedDownloadUserIdPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var feedDownloadUserIdPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/feedDownload/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(feedDownloadUserIdPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.getCredGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, [], ['body']);
        
        var getCredGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/getCred').expand(apiGateway.core.utils.parseParametersToObject(params, [])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(getCredGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.getFeedDetailUserIdPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var getFeedDetailUserIdPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/getFeedDetail/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(getFeedDetailUserIdPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.getFeedListUserIdPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var getFeedListUserIdPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/getFeedList/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(getFeedListUserIdPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.getMyBookmarkDetailUserIdPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var getMyBookmarkDetailUserIdPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/getMyBookmarkDetail/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(getMyBookmarkDetailUserIdPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.getMyBookmarkListUserIdPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var getMyBookmarkListUserIdPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/getMyBookmarkList/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(getMyBookmarkListUserIdPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.getMyContentsDetailUserIdPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var getMyContentsDetailUserIdPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/getMyContentsDetail/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(getMyContentsDetailUserIdPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.getMyContentsListUserIdPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var getMyContentsListUserIdPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/getMyContentsList/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(getMyContentsListUserIdPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.getMyWordListUserIdGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var getMyWordListUserIdGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/getMyWordList/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(getMyWordListUserIdGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.getUserInfoUserIdGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var getUserInfoUserIdGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/getUserInfo/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(getUserInfoUserIdGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.getUserNameUserIdGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var getUserNameUserIdGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/getUserName/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(getUserNameUserIdGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.getWordDetailWordGet = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['word'], ['body']);
        
        var getWordDetailWordGetRequest = {
            verb: 'get'.toUpperCase(),
            path: pathComponent + uritemplate('/getWordDetail/{word}').expand(apiGateway.core.utils.parseParametersToObject(params, ['word'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(getWordDetailWordGetRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.postTextUserIdPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var postTextUserIdPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/postText/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(postTextUserIdPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.rateFeedUserIdPatch = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var rateFeedUserIdPatchRequest = {
            verb: 'patch'.toUpperCase(),
            path: pathComponent + uritemplate('/rateFeed/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(rateFeedUserIdPatchRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.shareMyContentsUserIdPost = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var shareMyContentsUserIdPostRequest = {
            verb: 'post'.toUpperCase(),
            path: pathComponent + uritemplate('/shareMyContents/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(shareMyContentsUserIdPostRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.updateUserInfoUserIdPut = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var updateUserInfoUserIdPutRequest = {
            verb: 'put'.toUpperCase(),
            path: pathComponent + uritemplate('/updateUserInfo/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(updateUserInfoUserIdPutRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.updateUserNameUserIdPut = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var updateUserNameUserIdPutRequest = {
            verb: 'put'.toUpperCase(),
            path: pathComponent + uritemplate('/updateUserName/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(updateUserNameUserIdPutRequest, authType, additionalParams, config.apiKey);
    };
    
    
    apigClient.updateWordStatusUserIdPatch = function (params, body, additionalParams) {
        if(additionalParams === undefined) { additionalParams = {}; }
        
        apiGateway.core.utils.assertParametersDefined(params, ['user_id'], ['body']);
        
        var updateWordStatusUserIdPatchRequest = {
            verb: 'patch'.toUpperCase(),
            path: pathComponent + uritemplate('/updateWordStatus/{user_id}').expand(apiGateway.core.utils.parseParametersToObject(params, ['user_id'])),
            headers: apiGateway.core.utils.parseParametersToObject(params, []),
            queryParams: apiGateway.core.utils.parseParametersToObject(params, []),
            body: body
        };
        
        
        return apiGatewayClient.makeRequest(updateWordStatusUserIdPatchRequest, authType, additionalParams, config.apiKey);
    };
    

    return apigClient;
};
