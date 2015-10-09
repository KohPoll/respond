(function () {

    var host = this;
    var win = window;
    var doc = document;
    var docElem = doc.documentElement;
    var name = 'Respond';

    var localMatchMedia = win.matchMedia;

    var hasMediaQueries = localMatchMedia && localMatchMedia('only all').matches;
    var hasAddListener = localMatchMedia && localMatchMedia('all').addListener;


    // 维护全局变量
    var _breakpoints, _normalizedBreakpoints, _fix;
    var queries = {}, queriesCondition = {};
    var Response;


    // 切换class
    var _changeClass = function (vw) {
        var min, max, cls;
        for (var i = 0, len = _normalizedBreakpoints.length; i < len; i += 1) {
            min = _normalizedBreakpoints[i];
            max = _normalizedBreakpoints[i + 1];
            if (between(vw, min, max)) {
                cls = docElem.className.replace(/[ ]*w\d+/g, '');
                docElem.className = cls + ' w' + _breakpoints[i];
            }
        }
    };
    // 调用断点处回调
    var _callListeners = function (vw) {
        for (var k in queries) {
            var arr = queries[k], matches = Respond.match(queriesCondition[k], vw);
            for (var i = 0, len = arr.length; i < len; i += 1) {
                var item = arr[i];
                if (matches) {
                    item.mql.matches = matches;
                    item.listener.call(win, item.mql);
                }
            }
        }
    };


    var timer = null;
    var isListening = false;
    // resize处理
    function handleResize() {
        clearTimeout(timer);
        timer = setTimeout(function() {
            if (!hasMediaQueries) {
                _changeClass(viewportW());
            }
            if (!hasAddListener) {
                _callListeners(viewportW());
            }
        }, 50);
    }


    Response = {

        'hasMediaQueries': hasMediaQueries,

        'hasAddListener': hasAddListener,

        'init': function (breakpoints, fix) {
            if (breakpoints == null) {
                throw '[respond] must provide the breakpoints';
            }
            if (breakpoints.length < 2) {
                throw '[respond] the amount of break points should greater than 2';
            }

            if (fix == null) {
                fix = 20;
            }

            _fix = fix;
            _breakpoints = breakpoints;
            _normalizedBreakpoints = map(_breakpoints, function (b) { return fix + b; });

            if (!hasMediaQueries) {
                isListening = true;
                addEventListener(win, 'resize', handleResize);
                handleResize();
            }

            return this;
        },

        'match': function (condition, vw) {
            var o, media;
            if (hasMediaQueries) {
                media = condition2Media(condition, _fix);
                return localMatchMedia(media).matches;
            } else {
                vw = vw || viewportW();
                o = normalizeCondition(condition, _fix);
                return between(vw, o.min, o.max);
            }
        },

        'addListener': function (condition, listener) {
            var media = condition2Media(condition, _fix);
            var mql = {
                media: media,
                removeListener: function (listener) {
                    for (var k in queries) {
                        var arr = queries[k];
                        for (var i = 0, len = arr.length; i < len; i += 1) {
                            if (arr[i].listener === listener) {
                                arr.splice(i, 1);
                            }
                        }
                        queries[k] = arr;
                    }
                }
            };

            if (hasAddListener) {
                mql = localMatchMedia(media);
                mql.addListener(listener);
                listener.call(win, mql);
            } else {
                mql.matches = Respond.match(condition);

                if (!queries[media]) {
                    queries[media] = [];
                    queriesCondition[media] = condition;
                }
                queries[media].push({
                    mql: mql,
                    listener: listener
                });

                if (!isListening) {
                    isListening = true;
                    addEventListener(win, 'resize', handleResize);
                }
            }

            return mql;
        }

    };
    host[name] = Response;


    // 注册事件
    function addEventListener(obj, type, handler) {
        if (obj.addEventListener) {
            obj.addEventListener(type, handler, false);
        } else if (obj.attachEvent) {
            obj.attachEvent('on' + type, handler);
        } else {
            obj['on' + type] = handler;
        }
    }

    // viewport宽度
    function viewportW() {
        var a = docElem.clientWidth, b = win.innerWidth;
        return a < b ? b : a;
    }

    // 区间检测
    function between(point, min, max, closeRange) { // min < point <= max
        min = min || 0;
        return (closeRange ? (point >= min) : (point > min)) && (!max || point <= max);
    }

    // 条件转义到media query
    function condition2Media(condition, fix) {
        var mq = '';
        var o = normalizeCondition(condition || {}, fix);

        if (o.min != null) {
            mq = '(min-width: ' + o.min + 'px)';
        }
        if (o.max != null) {
            mq += ' and (max-width: ' + o.max + 'px)';
        }

        return mq;
    }
    function normalizeCondition(condition, fix) {
        var min, max;
        min = condition.min || 0;
        if (min != null) {
            min += fix;
        }
        max = condition.max;
        if (max != null) {
            max += fix;
        }
        return {min: min, max: max};
    }

    // map
    function map(arr, handler) {
        var rt = [];
        for (var i = 0, len = arr.length; i < len; i += 1) {
            rt.push(handler.call(arr, arr[i], i));
        }
        return rt;
    }


})();