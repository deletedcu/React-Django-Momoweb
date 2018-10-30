debug('START WORKER');

var MOMO_API_HOST = process.env.MOMO_API_HOST || 'http://localhost/';

var request = require('request');
var socket = init_socket();
var tickers_data = [];

function init_socket() {
    debug('init socket');
    var socket = require('socket.io-client')('http://api.momo.mometic.com', {forceNew: true});
    // localStorage.debug = '*';
    socket.emit('subscribe', 'basic-industries');
    socket.emit('subscribe', 'capital-goods');
    socket.emit('subscribe', 'consumer-goods');
    socket.emit('subscribe', 'consumer-services');
    socket.emit('subscribe', 'energy');
    socket.emit('subscribe', 'finance');
    socket.emit('subscribe', 'health-care');
    socket.emit('subscribe', 'public-utilities');
    socket.emit('subscribe', 'technology');
    socket.emit('subscribe', 'transportation');
    socket.emit('subscribe', 'miscellaneous');
    socket.emit('deviceUuid', 'tGOcrIsfP5n8gpsEmZmlyDDFTd8fC0uZ');
    socket.emit('deviceToken', {"DeviceToken":"cb885350fe38300a34d323f9fa9c70346943a15afa960f40e16bae41d305956d","Platform":"iOS:9.3.1","DeviceModel":"iPhone8,2","Uuid":"tGOcrIsfP5n8gpsEmZmlyDDFTd8fC0uZ"});
    socket.emit('subscriptionValidated', {"expiration_time":199588981015,"product_id":"com.mometic.momo.ios.subscription.monthly"});

    var onevent = socket.onevent;
    socket.onevent = function (packet) {
        var args = packet.data || [];
        onevent.call (this, packet);    // original call
        packet.data = ["*"].concat(args);
        onevent.call(this, packet);      // additional call to catch-all
    };
    //socket.on("*",function(event,data) {});
    //socket.on('connect', function(){});
    //socket.on('event', function(data){});

    socket.on('disconnect', function(){ debug('disconnect socket event');});
    socket.on('reconnect_failed', function(){ debug('reconnect_failed event');});
    socket.on('reconnect_error', function(){ debug('reconnect_error event');});
    socket.on('reconnecting', function(num){ debug('reconnecting: ', num);});
    socket.on('compressedUpdate', function(msg) {
        var msg = msg[0];
        var lows = msg[1];
        var highs = msg[2];
    //    console.log('on update', msg);

        for (var i = lows.length - 1; i >= 0; i--) {
            setTarget('high', lows[i]);
        }

        for (var i = highs.length - 1; i >= 0; i--) {
            setTarget('low', highs[i]);
        }
    });

    return socket;
}

function setTarget(target, msg){
    tickers_data.push({
        ticker: msg[0],
        type: target,
        count: msg[2],
        price: msg[1]
    });
}

function debug() {
    var args = [].slice.call(arguments);
    args.unshift('[' + (new Date()).toString() + ']');
    console.log.apply(console, args);
}

setInterval(function() {
    var current_data = tickers_data;
    tickers_data = [];
    if (current_data.length) {
        debug('flush data', current_data)
        request.post({
            url: MOMO_API_HOST + 'alert/send/',
            json: current_data
        }, function(error, response, body) {
            debug('Resp code:', response && response.statusCode, 'body:', body, 'error:', error);
        });
    }
}, 4000);

setInterval(function() {
    debug('alive', process.memoryUsage());
}, 300000);

setInterval(function() {
    try {
        socket.close();
        socket = false;
    } catch(e) {
        debug('cant close socket', e);
    }
    socket = init_socket();

}, 3600*1000*3);
