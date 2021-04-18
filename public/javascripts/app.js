var allParas = document.getElementsByTagName('a');
var loginLink = document.querySelector("footer");

function getAllParaElems() {
    var num = allParas.length;
    // alert('There are ' + num + ' a tags');
    allParas[4].onclick = function() {
        alert("Clicked");
        req.session.returnTo = req.originalUrl;
    };
}


window.addEventListener("load", function(){
    getAllParaElems();
});
// window.onload = getAllParaElems();

document.getElementsByTagName("a").onclick = function() {
    console.log("stored session");
    // req.session.returnTo = req.originalUrl;
    alert('hello');
}