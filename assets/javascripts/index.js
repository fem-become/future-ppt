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
    }else{
        window.key = (S.now() + '' + Math.random().toFixed(3) * 1000).replace(/^\d{8}/, '');
//        window.key = 1;
    }

    S.log('Key is ' + window.key);

    var url = location.href + '&key=' + window.key + '&mobile=true';
    window.qrUrl = 'http://qr.liantu.com/api.php?text=' + encodeURIComponent(url);

})(KISSY);

KISSY.use('mobile/app/1.0/,dom,event', function (S, MS, D, E) {

    var $ = S.all;
    var logoEl = $('#J_Logo'),
        backEl = $('#J_Back'),
        settingBtn = $('#J_SettingBtn');

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
        switch(el){
            case 'logo':
                logoEl.fadeIn(0.2);
                backEl.fadeOut(0.2);
                settingBtn.fadeOut(0.2);
                break;
            case 'setting':
                logoEl.fadeOut(0.2);
                backEl.fadeIn(0.2);
                settingBtn.fadeIn(.2);
                break;
            default :
                backEl.fadeIn(0.2);
                logoEl.fadeOut(0.2);
                settingBtn.fadeOut(.2);
                break;
        }
    };

    var url = location.protocol + '//' + location.hostname;
    var socket = io.connect(url + ':7920');

    var curPage = app.get('viewpath');

    var navEl = D.get('#MS-nav');
    var msContentEl = D.get('#J_MSContent');
    var msContentDivEl = D.children(msContentEl, 'div');
    var timer;
    function resize(){
        timer && clearTimeout(timer);
        timer = setTimeout(function(){
            var height = D.viewportHeight() - D.height(navEl);
            D.css(msContentEl, 'height', height);
            D.css(msContentDivEl, 'height', height);
        }, 100);
    }

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

        function hideAddressBar()
        {
//            if(!window.location.hash)
//            {
                if(document.height < window.outerHeight)
                {
                    document.body.style.height = (window.outerHeight + 50) + 'px';
                }

                setTimeout( function(){ window.scrollTo(0, 1); }, 50 );
//            }
        }

        window.addEventListener("load", function(){ if(!window.pageYOffset){ hideAddressBar(); } } );
        window.addEventListener("orientationchange", hideAddressBar );
    }else{

        resize();

        E.on(window, 'resize', resize);

        S.log('start to listen to socket.');
        socket.on('get_response', function (data) {
            var combine = data.key + '_' + data.act;
            var d = data.data;

            console.log(data);

            switch (combine) {
                case key + '_pair':
                    S.log('Device paired.');
                    D.hide('#J_QRWrapper');
                    if(app.get('viewpath') != data.page && data.page !== 'control.html'){
                        S.log('forward to: ' + data.page);
                        // TODO control.html ²»ÄÜforward
                        app.forward(data.page);
                    }
                    break;
                case key + '_reset':
                    break;
//                case key + '_next':
//                    console.log('[control] next page');
//                    if(curPage === 'play_ppt.html'){
//                        window.nextPPT();
//                    }
//                    break;
//                case key + '_prev':
//                    console.log('[control] prev page');
//                    if(curPage === 'play_ppt.html'){
//                        window.prevPPT();
//                    }
//                    break;
                case key + '_move':
                    if(app.get('viewpath') === 'play_ppt.html'){
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
                            'left': left,
                            'display': 'block'
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
                    if(app.get('viewpath') === 'play_ppt.html'){
                        var pointer = D.get('#J_ScreenPointer');
                        if(pointer){
                            D.show(pointer);
                            D.css(pointer, {
                                'position': 'absolute',
                                'left': D.viewportWidth() / 2 - 10,
                                'top': D.viewportHeight() / 2 - 10
                            });
                        }
                    }
                    break;
                case key + '_pointer_stop':
                    D.hide('#J_ScreenPointer');
                    break;
            }
        });
    }

    window.socket = socket;
    window.curPage = curPage;

});