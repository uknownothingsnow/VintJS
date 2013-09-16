/**
 * User: Vincent Ting
 * Date: 13-9-7
 * Time: 下午5:42
 */

(function ($) {

    'use strict';

    var root = this,
        /**
         * 检测当前是否有全局变量 VintJS 存在。
         */
            Vt = root['VintJS'] || function () {
            this.init.apply(this, arguments);
        } ,

        /**
         * @name VintJS.console
         * @object
         * @description
         * 当浏览器版本较低不支持console的时候防止报错。具体使用同浏览器原生console。
         * api 详情 https://developers.google.com/chrome-developer-tools/docs/console-api。
         */
            console = Vt.console = root.console || (function () {
            var cl = {} , attr_list = ['assert', 'clear', 'constructor', 'count', 'debug', 'dir', 'dirxml',
                'error', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile',
                'profileEnd', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
            for (var i = 0; i < attr_list.length; i++) {
                cl[attr_list[i]] = $.noop;
            }
            return cl;
        })(),

        /**
         * @name VintJS.isType
         * @function
         * @description
         * 判断对象 obj 是否为 type 类型。
         * @return {boolean}
         */
            isType = Vt.isType = function (obj, type) {
            return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === type.toLowerCase();
        },

        /**
         * @name VintJS.has
         * @function
         * @description
         * 判断对象 obj 是否含有属性 attr。
         * @return {boolean}
         */
            has = Vt.has = function (obj, attr) {
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
        /**
         * @private
         * @name VintJS.getKeys
         * @description
         * 获取对象所有的属性名称。
         * @example
         * console.log(VintJS.getKeys({'name':'VintJS','author':'Vincent Ting'}));
         * 输出 => ['name','author']
         * @return {array}
         */
            getKeys = Vt.getKeys = nativeKeys || function (obj) {
            if (obj !== Object(obj)) throw new TypeError('Invalid object');
            var keys = [];
            forEach(obj, function (value, key) {
                keys.push(key);
            }, this);
            return keys;
        },

        __temp_array = [],
        /**
         * @private
         * @name _getTempArray
         * @description
         * 为节约内存，所有临时的数组都不会单独实例化Array对象，调用该方法生成临时的Array对象。
         * var args = _getTempArray('VintJS', 'AngularJs');
         * args => ['VintJS', 'AngularJs']
         * @return {array}
         */
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
        /**
         * @private
         * @name eventAnalyze
         * @function
         * @description
         * 分析事件相关函数传入的参数。
         * @return {boolean}
         */
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

    /**
     * @name VintJS.prototype.on
     * @function
     * @param name 需绑定的时间名称，支持字符串以及对象、列表。
     * @param callback 回调函数，当name为对象的时候该参数可为空。
     * @param context 回调函数执行时的上下文。
     * @description
     * 绑定事件。
     * @returns {object}
     */
    Vt.fn.on = function (name, callback, context) {
        if (!eventAnalyze(this, 'on', name, [callback, context]) || !callback) return this;
        this.__events || (this.__events = {});
        var events = this.__events[name] || (this.__events[name] = []);
        events.push({callback: callback, context: context, ctx: context || this});
        return this;
    };

    /**
     * @name VintJS.prototype.off
     * @function
     * @param name 需绑定的时间名称，支持字符串以及对象、列表、以及正则，可选。
     * @param callback 回调函数，可选。
     * @param context 回调函数执行时的上下文，可选。
     * @description
     * 取消绑定事件。只有在回调函数和上下文同时满足的时候，才能够取消绑定。
     * 如果参数为空则删除所有绑定。如果只有name则删除该name下所有绑定事件。
     * @returns {object}
     */
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

    /**
     * @name VintJS.prototype.trigger
     * @function
     * @param name 触发的名称。
     * @description
     * 事件触发方法。name为必须值，后面可以追加参数，所追加的参数最终最为参数在回调函数中使用。
     * @example
     * var vt = new VintJS;
     * vt.on('sleep',function(){console.log(arguments)});
     * vt.trigger('sleep','arg1','arg2')
     * 输出 => ['sleep','arg1','arg2']
     * @returns {object}
     */
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