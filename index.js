/**
 *
 * @author: éÙ×Ó<daxingplay@gmail.com>
 * @time: 13-4-26 15:08
 * @description:
 */

var fs = require('fs');
var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
var cons = require('consolidate');
var mobileDetect = require('./libs/mobile-detect');

server.listen(7920);

app.engine('html', cons.ejs);
app.set('view engine', 'html');
app.set('views', __dirname + '/views');

app.use('/assets', express.static(__dirname + '/assets'));

app.use(function(req, res, next){
    var isMobile = req.query && req.query.mobile == 'true' || mobileDetect.test(req.headers['user-agent']);
    var exec = /^\/(.+?)\.html/.exec(req.url);
    var page = req.url == '' || req.url == '/' || req.url.match(/^\/\?/) ? 'index' : (exec ? exec[1] : '');
    if(page){
        res.render(page, {
            'isMobile': isMobile,
            'key': req.query.key
        });
    }else{
        next();
    }
});

io.sockets.on('connection', function(socket){

    socket.on('send', function(data){
        if(/_client$/.test(data.act)){
            io.sockets.emit('mobile_get_response', data);
        }else{
            io.sockets.emit('get_response', data);
        }
    });

});

