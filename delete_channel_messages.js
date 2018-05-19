var https = require('https');

// CONFIGURATION #######################################################################################################

var token          = process.env.SLACK_TOKEN;
var privateChannel = false;
var delay          = 100; // delay between delete operations in millisecond

// GLOBALS #############################################################################################################

var channelApi    = privateChannel ? 'groups' : 'channels';
var baseApiUrl    = 'https://slack.com/api/';
var listChannelUri = baseApiUrl + channelApi + '.list?token=' + token;
var messages      = [];

// ---------------------------------------------------------------------------------------------------------------------
function getChannelListAndDelete(){
    https.get(listChannelUri, function (res) {

        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function(){
            var response = JSON.parse(body);
            response.channels? deleteAllMessages(response.channels, 0):console.log("Error ", response);
        });
    }).on('error', function (e) {
        console.log("Got an error: ", e);
    });
}
function deleteMessage(deleteApiUrl) {

    if (messages.length == 0) {
        return;
    }
    if (!deleteApiUrl) {
        return;
    }
    deleteAllMessages
    var ts = messages.shift();

    https.get(deleteApiUrl + ts, function (res) {

        var body = '';

        res.on('data', function (chunk) {
            body += chunk;
        });

        res.on('end', function(){
            var response = JSON.parse(body);
            if (response.ok === true) {
                console.log(deleteApiUrl+ts + ' deleted!');
            } else if (response.ok === false) {
                messages.push(ts);
            }

            setTimeout(deleteMessage, delay);
        });
    }).on('error', function (e) {
        console.log("Got an error: ", e);
    });
}

function deleteAllMessages(channels, iter) {

    if(iter < channels.length) {
        const channel = channels[iter].id.trim();
        var historyApiUrl = baseApiUrl + channelApi + '.history?token=' + token + '&count=1000&channel=' + channel;
        var deleteApiUrl  = baseApiUrl + 'chat.delete?token=' + token + '&channel=' + channel + '&ts='

        https.get(historyApiUrl, function(res) {
            var body = '';
            
            res.on('data', function (chunk) {
                body += chunk;
            });
            
            res.on('end', function () {
                
                var response = JSON.parse(body);
                if(response.ok){
                for (var i = 0; i < response.messages.length; i++) {
                    messages.push(response.messages[i].ts);
                }
                    deleteMessage(deleteApiUrl);
                    deleteAllMessages(channels, iter);
                }
                else{
                	console.log("Error:", response);
                }
                });
            }).on('error', function (e) {
                console.log("Got an error: ", e);
            });
    }
}
// ---------------------------------------------------------------------------------------------------------------------

getChannelListAndDelete();