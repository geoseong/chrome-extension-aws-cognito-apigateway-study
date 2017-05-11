var result;

function get_source(document_body){
    // 웹페이지의 내용물
    result = document_body.innerText;
    return "완료되었습니다.";
}

chrome.extension.sendMessage({
    action: "getSource",
    source: get_source(document.body)
});

result;