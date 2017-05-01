function printWords() {
    var storage = chrome.storage.local;
    var keys = ["words", "count"];
    storage.get(keys, function (items) {
        var words = items.words;
        var count = items.count;

        for (var i = 0; i < words.length; i++) {
            var node = document.createElement("tr");
            var textnode = document.createTextNode(words[i]);
            node.appendChild(textnode);
            document.getElementById("words").appendChild(node);
        }

        for (var i = 0; i < count.length; i++) {
            var node = document.createElement("tr");
            var textnode = document.createTextNode(count[i]);
            node.appendChild(textnode);
            document.getElementById("count").appendChild(node);
        }
    });
}

window.onload = printWords;