$(document).ready(function () {
    getWatsonResponse("Hi");
});

$(document).on('click', '#sendResponse', function (e) {
    e.preventDefault();
    var newDiv = document.createElement('div');
    $(newDiv).css("overflow", "hidden");
    var userName = getCookieValue('username');
    if (userName == '') {
        alert('Sorry your session has expired');
        window.location = './';
    }
    newDiv.innerHTML = '<div class="message right"><div class="user">' + userName + " :"+ '</div><div class="message_right">' + $('#userResponse').val() + '</div></div>';
    $('.chatHistory').append(newDiv);
    var objDiv = document.getElementById("chatHistory");
    objDiv.scrollTop = objDiv.scrollHeight;
    getWatsonResponse($('#userResponse').val());
    $('#userResponse').val("");
});

$(document).on('keyup', '#userResponse', function (e) {
    if (e.keyCode == 13) {
        $('#sendResponse').click();
    }
});

function getWatsonResponse(input) {
    $.ajax({
        url: "/conversationLabTest",
        data: { userResponse: input }
    }).done(function (data) {
        console.log(data.response[0]);
        document.cookie = 'username=' + data.username;
        var newDiv = document.createElement('div');
        $(newDiv).css("overflow", "hidden");
        newDiv.innerHTML = '<div class="message left"><div class="watson">My Lab Assistant:</div><div class="message_left">' + data.response[0] + '</div></div>';
        $('.chatHistory').append(newDiv);
        var objDiv = document.getElementById("chatHistory");
        objDiv.scrollTop = objDiv.scrollHeight;
    });
}

function getCookieValue(a) {
    var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
}