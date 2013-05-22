KISSY.config({
    packages: {
        mobile: {
            base: 'http://a.tbcdn.cn/s/kissy',
            tag: +new Date()
        }
    }
});

var app = {},
    NS = {};

(function(S){

    if(mobile == 'true'){
        var exec = /&key=(\d+)/.exec(location.hash);
        window.key = exec ? exec[1] : undefined;
        alert('Key is ' + window.key);
    }else{
        window.key = S.now() + '' + S.guid();
//        window.key = 1;
    }

    S.log('Key is ' + window.key);

})(KISSY);

KISSY.use('mobile/app/1.0/,dom,event', function (S, MS, D, E) {

    var $ = S.all;
    var logoEl = $('#J_Logo'),
        backEl = $('#J_Back');

    var app = MS({
        viewpath: 'main.html',
        forceReload: true,
        fullRangeWidth: false,
        pageCache: true,
        webkitOptimize: true,
        positionMemory: true,
        animWrapperAutoHeightSetting: true,
        containerHeighTimmer: false,
        hideURIbar: true
    });

    NS = app;

    NS.toggleNav = function (el) {
        if (el === 'logo') {
            logoEl.fadeIn(0.2);
            backEl.fadeOut(0.2);
        } else {
            backEl.fadeIn(0.2);
            logoEl.fadeOut(0.2);
        }
    };

    var url = location.protocol + '//' + location.hostname;
    var socket = io.connect(url + ':7920');

    var curPage = app.get('viewpath');

//    if(curPage){
//        if(!/&key=(\d+)/.test(location.hash)){
//            location.hash = location.hash + '&key=' + window.key;
//        }
//    }

    if(mobile == 'true'){
        S.log('this is mobile client.');

        socket.emit("send", {
            key: window.key,
            act: "pair",
            page: curPage
        });

        E.on(window, 'hashchange', function(){
            socket.emit("send", {
                key: window.key,
                act: "pair",
                page: app.get('viewpath')
            });
        });
    }else{
        S.log('start to listen to socket.');
        socket.on('get_response', function (data) {
            var combine = data.key + '_' + data.act;
            var d = data.data;

            switch (combine) {
                case key + '_pair':
                    S.log('Device paired.');
                    D.hide('#J_QRWrapper');
                    S.log('forward to: ' + data.page);
                    if(app.get('viewpath') != data.page){
                        // TODO control.html ²»ÄÜforward
                        app.forward(data.page);
                    }
                    break;
                case key + '_reset':
                    break;
                case key + '_next':
                    break;
                case key + '_prev':
                    break;
                case key + '_move':
                    if(app.get('viewpath') !== 'main.html'){
                        var curPos = d.curPos;
                        var startPos = d.startPos;
                        var yOffset = curPos.y - startPos.y;
                        if(yOffset < -180){
                            yOffset = 360 - startPos.y + curPos.y;
                        }else if(yOffset > 180){
                            yOffset = -(360 - curPos.y + startPos.y);
                        }
                        var a = Math.abs((curPos.z - startPos.z) / 90) + 1;
                        var left = (1 - yOffset / 90) * (D.viewportWidth() / 2) * a;
                        var top = (1 - (curPos.x * 2 > 90 ? 90 : curPos.x * 2 - startPos.x) / 90) * (D.viewportHeight() / 2) * a;

                        left = left > D.viewportWidth() - 20 ? -9999 : left;
                        top = top > D.viewportHeight() - 20 ? -9999 : top;

                        D.css('#J_ScreenPointer', {
                            'top': top,
                            'left': left
                        });
                        var msg = [
                            'z: ' + curPos.z,
                            'start z: ' + startPos.z,
                            'left: ' + left,
                            '',
                            'y: ' + curPos.y,
                            'start y: ' + startPos.y,
                            '',
                            'x: ' + curPos.x,
                            'start x: ' + startPos.x,
                            'top: ' + top,
                            '',
                            'a: ' + a

                        ].join('\n');
                        console.log(msg);
                    }
                    break;
                case key + '_pointer':
                    var pointer = D.get('#J_ScreenPointer');
                    if(pointer){
                        D.show(pointer);
                        D.css(pointer, {
                            'position': 'absolute',
                            'left': D.viewportWidth() / 2 - 10,
                            'top': D.viewportHeight() / 2 - 10
                        });
                    }
                    break;
                case key + '_pointer_stop':
                    D.hide(pointer);
                    break;
            }
        });
    }

    window.socket = socket;
    window.curPage = curPage;

});