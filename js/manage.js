$("#config-form").submit(ajaxForm);
$("#restorebackup").submit(backupForms);
$("#deletebackup").submit(backupForms);

function backupForms(data)
{
    if(window.confirm("Are you sure?"))
    {
        ajaxForm(data);
        $(this).parent().parent().remove();
    } else {
        data.preventDefault();
    }
}

function ajaxForm(formEvent)
{
    formEvent.preventDefault();

    var form = $(this);
    var url = form.attr('action');

    $.ajax({
        type: "POST",
        url: url,
        data: form.serialize(),
        success: function(data) {
            $("div.FormOutput").remove();
            form.after("<div class=\"FormOutput\">" + data + "</div>");
        }
    });
}

$(".server-command").on('click touchend', function(e) {
    e.preventDefault();

    sendServerCommand($(this).attr('data-command'));
});

var websocket = null;

function connect() {
    websocket = new WebSocket("wss://rustyshosting.io:8081/wsp?address=" + wsString);
    websocket.onmessage = onMessage; 
}

function sendServerCommand(command)
{
    $.ajax({
        type: "POST",
        url: 'servicecommand.php',
        data: {
            'command' : command,
            'service_id' : serverID
        },
        success: function(data) {
            alert(data);
        }
    });
}

function onMessage(event) {
    var textbox = $("#console");
    console.log(event.data);
    var data = JSON.parse(event.data);
    if(data.Type === "Chat")
    {
        var message = JSON.parse(data.Message);
        addMessageToConsole(message.Username + ": " + message.Message);
    } else if(data.Type === "Generic" && !data.Message.startsWith("[CHAT]"))
    {
        addMessageToConsole(data.Message);
    }
}

function addMessageToConsole(message)
{
    var console = $("#console");
    if(!console.val())
    {
        console.val(message);
    } else {
        if(console.val().endsWith('\n'))
        {
            console.val(console.val() + message);
        } else {
            console.val(console.val() + "\n" + message);
        }
    }
}

function send()
{
    var message = $("#command").val();
    $("#command").val("");
    var packet = {
        Identifier: 1,
        Message: message,
        Name: "WebRcon"
    };
    websocket.send(JSON.stringify(packet));
}


function checkConnection() {
    if(websocket != null)
    {
        if(websocket.readyState  == WebSocket.OPEN)
        {
            $("#status").html("Status: connected");
        } else if(websocket.readyState == WebSocket.CLOSED) {
            $("#status").html("Status: disconnected");
        } else if (websocket.readyState == WebSocket.CONNECTING) {
            $("#status").html("Status: connecting");
        }
    }
}

function pingServer()
{
    $.ajax({
        type: "POST",
        url: 'serverstatus.php',
        dataType: 'html',
        timeout: 5000,
        data: {
            'service_id' : serverID,
            'action' : "ping"
        },
        success: function(data) {

            if(data.indexOf("Running") > -1)
            {
                $("#serverStatus").html(data);
                $("#serverStatus").css({'color': '#a2964e'});
            } else if(data.indexOf("Dead") > -1){
                $("#serverStatus").html("Stopped");
                $("#serverStatus").css({'color': '#812719'});
            } else {
                $("#serverStatus").html(data);
                $("#serverStatus").css({'color': '#a2964e'});
            }
        },
        error: function() {
            $("#serverStatus").html("Stopped");
            $("#serverStatus").css({'color': '#812719'});
        }
    });
}

$("#backupsTable").fancyTable({
    sortColumn:0,
    sortOrder:'descending',
    sortable:true,
    pagination:true,
    searchable:true,
    globalSearch:true,
    inputStyle:"width: 30%; color: black;",
    paginationClass:"pagination",
    paginationClassActive:"paginationActive"
});

function updateServerLogs()
{
    $.ajax({
        type: "POST",
        url: 'serverstatus.php',
        dataType: 'html',
        timeout: 5000,
        data: {
            'service_id' : serverID,
            'action' : "logs"
        },
        success: function(data) {
            $("#server-logs").html(data.replace());
        }
    });

    var serverLogs = $("#server-logs");
    if(serverLogs.length)
        serverLogs.scrollTop(serverLogs[0].scrollHeight - serverLogs.height());
}

pingServer();
updateServerLogs();

setInterval(updateServerLogs, 30000);
setInterval(pingServer, 100);
setInterval(checkConnection, 3000);