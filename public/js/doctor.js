$(document).ready(function () 
{
    getWatsonResponse("Hello");
});

$(document).on('click', '#sendResponse', function (e)
 {
    e.preventDefault();
    var newDiv = document.createElement('div');
    $(newDiv).css("overflow", "hidden");
    var userName = getCookieValue('username');
    if (userName == '') {
        alert('Sorry your session has expired');
        window.location = './';
    }
    newDiv.innerHTML = '<div class="chatMessage right"><div class="user">' + userName + ": " + '</div><div class="message_right">' + $('#userResponse').val() + '</div></div>';
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

var markers;

function myMap() {
    var mapProp = {
        center: new google.maps.LatLng(28.453660, 77.056458),
        zoom: 13,
    };
    var map = new google.maps.Map(document.getElementById("map"), mapProp);

    for (var i = 0, marker; marker = markers[i]; i++) {
        marker.setMap(map);
        google.maps.event.addListener(marker,'click',function() {
            getWatsonResponse(this.getTitle());
            });
        
    }
}
function getWatsonResponse(input) 
{
    $.ajax({
        url: "/conversationDoctor",
        data: { userResponse: input }
    }).done(function (data) 
    {
        debugger;
        document.cookie = 'username=' + data.username;
        if (data.responseAction == 'map') 
        {
            markers = new Array();
            for (var i = 0; i < data.response[1].length; i++) {
                markers.push(new google.maps.Marker({ position: new google.maps.LatLng(data.response[1][i].lat, data.response[1][i].long), label: (i + 1).toString(), title: data.response[1][i].name }));
            }
            myMap();
        }
        var newDiv = document.createElement('div');
        $(newDiv).css("overflow", "hidden");
        newDiv.innerHTML = '<div class="chatMessage left"><div class="watson">My Lab Assistant:</div><div class="message_left">' + data.response[0] + '</div></div>';
        $('.chatHistory').append(newDiv);
        var objDiv = document.getElementById("chatHistory");
        objDiv.scrollTop = objDiv.scrollHeight;
    });
}

function getCookieValue(a) {
    var b = document.cookie.match('(^|;)\\s*' + a + '\\s*=\\s*([^;]+)');
    return b ? b.pop() : '';
}