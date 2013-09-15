/**
 * User: Vincent Ting
 * Date: 13-9-7
 * Time: 下午5:42
 */

(function ($) {

    'use strict';

    var root = this,
        Vt = root['VintJS'] || function () {
            this.init.apply(this, arguments);
        } ,
        console = Vt.console = root.console || (function () {
            var cl = {} , attr_list = ['assert', 'clear', 'constructor', 'count', 'debug', 'dir', 'dirxml',
                'error', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile',
                'profileEnd', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
            for (var i = 0; i < attr_list.length; i++) {
                cl[attr_list[i]] = $.noop;
            }
            return cl;
        })(),

        isType = function (obj, type) {
            return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === type.toLowerCase();
        },

        has = function (obj, attr) {
            return obj.hasOwnProperty(attr);
        },

        nativeForEach = Array.prototype.forEach,
        forEach = Vt.forEach = function (obj, iterator, context) {
            if (obj == null) return;
            if (nativeForEach && obj.forEach === nativeForEach) {
                obj.forEach(iterator, context);
            } else if (obj.length === +obj.length) {
                for (var i = 0; i < obj.length; i++) {
                    iterator.call(context, obj[i], i, obj);
                }
            } else {
                for (var attr in obj) {
                    if (!obj.hasOwnProperty(attr))continue;
                    iterator.call(context, obj[attr], attr, obj);
                }
            }
        },

        nativeKeys = Object.keys,
        getKeys = Vt.getKeys = nativeKeys || function (obj) {
            if (obj !== Object(obj)) throw new TypeError('Invalid object');
            var keys = [];
            forEach(obj, function (value, key) {
                keys.push(key);
            }, this);
            return keys;
        },

        __temp_array = [],
        _getTempArray = function () {
            __temp_array.length = 0;
            forEach(arguments, function (value, i) {
                __temp_array[i] = value;
            }, this);
            return __temp_array;
        };

    Vt.fn = Vt.prototype;

    Vt.fn.init = function () {
        this.location.listen();
        this.__config = {
            hashPrefix: ''
        };
    };

    var event_spliter = /\s+/,
        eventAnalyze = function (obj, action, name, rest) {
            if (!name) return true;
            if (isType(name, 'object')) {
                forEach(name, function (value, key) {
                    obj[action].apply(obj, _getTempArray(key, value).concat(rest));
                }, this);
                return false;
            }
            if (event_spliter.test(name)) {
                var names = name.split(event_spliter);
                forEach(names, function (name) {
                    obj[action].apply(obj, _getTempArray(name).concat(rest));
                }, this);
                return false;
            }
            return true;
        };

    Vt.fn.on = function (name, callback, context) {
        if (!eventAnalyze(this, 'on', name, [callback, context]) || !callback) return this;
        this.__events || (this.__events = {});
        var events = this.__events[name] || (this.__events[name] = []);
        events.push({callback: callback, context: context, ctx: context || this});
        return this;
    };

    Vt.fn.off = function (name, callback, context) {
        if (!this.__events || !eventAnalyze(this, 'off', name, [callback, context])) return this;
        if (arguments.length === 0) {
            this.__events = {};
            return this;
        }
        var names, events , retain;
        if (isType(name, 'RegExp')) {
            names = [];
            forEach(getKeys(this.__events), function (ev_name) {
                if (name.test(ev_name)) {
                    names.push(name);
                }
            });
        } else {
            names = name ? [name] : getKeys(this.__events)
        }
        forEach(names, function (name) {
            if (events = this.__events[name]) {
                this.__events[name] = retain = _getTempArray();
                if (callback || context) {
                    forEach(events, function (event) {
                        if ((callback && callback !== event.callback) || (context && context !== event.context)) {
                            retain.push(event);
                        }
                    });
                }
                if (!retain.length) delete this.__events[name];
            }
        }, this);
        return this;
    };

    Vt.fn.trigger = function (name) {
        if (!this.__events) return this;
        var args = Array.prototype.slice.call(arguments, 1);
        if (!eventAnalyze(this, 'trigger', name, args)) return this;
        var events = this.__events[name];
        forEach(events, function (ev) {
            ev.callback.apply(ev.ctx, args);
        }, this);
        return this;
    };

    var current_location = {
            path: '',
            search: {}
        }, pre_url , docMode = document.documentMode,
        location = root.location, history = root.history,
        hash_spliter = new RegExp('#' + Vt.__config['hashPrefix'] + '(.*)$'),
        getHash = function () {
            var match = this.location.href.match(hash_spliter);
            return match ? match[1] : '';
        },
        oldIE = /msie [\w.]+/.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7);
    Vt.fn.location = {
        url: function (url, replace) {
            if (!arguments.length)return location.href;
            if (replace) {
                location.replace(url);
                return this;
            }
            location.href = url;
            return this;
        },
        __getResultUrl: function () {
            var url_search_list = _getTempArray();
            forEach(current_location.search, function (value, key) {
                url_search_list.push(key + '=' + value);
            }, this);
            return '#' + this.__config['hashPrefix'] + current_location.path + '?' + url_search_list.join('&');
        },
        path: function (path) {
            if (path) {
                current_location.path = path;
                this.url(this.__getResultUrl());
                return this;
            }
            return '';
        },
        replace: function (path) {
            if (!path)return this;
            current_location.path = path;
            this.url(this.__getResultUrl(), true);
            return this;
        },
        checkUrl: function () {
            var now_url = location.href;
            if (now_url === pre_url)return;
            pre_url = now_url;
            var hash_url = getHash();
            //TODO 需要完成对url的解析
            this.trigger('urlChange');
        },
        search: function (key, value) {
            if (arguments.length === 1) {
                return current_location.search[key] || null;
            }
            if (arguments.length === 2) {
                return this;
            }
            return this;
        },
        listen: function () {
            setTimeout(this.checkUrl, 0);
            if (!oldIE && 'onhashchange' in window) {
                $(window).on('hashchange', this.checkUrl);
            } else {
                setInterval(this.checkUrl, 50);
            }
            return this;
        }
    };

    root['VintJS'] = Vt;

}).call(window, jQuery);