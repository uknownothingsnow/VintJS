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
            VintJS = root['VintJS'] || {} ,

        /**
         * @name VintJS.isType
         * @function
         * @description
         * 判断对象 obj 是否为 type 类型。
         * @return {boolean}
         */
            isType = VintJS.isType = function (obj, type) {
            return Object.prototype.toString.call(obj).slice(8, -1).toLowerCase() === type.toLowerCase();
        },

        nativeForEach = Array.prototype.forEach,
        forEach = VintJS.forEach = function (obj, iterator, context) {
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
         * @name VintJS.getKeys
         * @description
         * 获取对象所有的属性名称。
         * @example
         * console.log(VintJS.getKeys({'name':'VintJS','author':'Vincent Ting'}));
         * 输出 => ['name','author']
         * @return {array}
         */
            getKeys = VintJS.getKeys = nativeKeys || function (obj) {
            if (obj !== Object(obj)) throw new TypeError('Invalid object');
            var keys = [];
            forEach(obj, function (value, key) {
                keys.push(key);
            }, this);
            return keys;
        },

        extend = VintJS.extend = function (obj) {
            forEach(Array.prototype.slice.call(arguments, 1), function (source) {
                if (source) {
                    for (var prop in source) {
                        obj[prop] = source[prop];
                    }
                }
            });
            return obj;
        },

        __temp_array = [],
        /**
         * @private
         * @name __getTempArray
         * @description
         * 为节约内存，所有临时的数组都不会单独实例化Array对象，调用该方法生成临时的即用即销毁的Array对象。
         * var args = __getTempArray('VintJS', 'AngularJs');
         * args => ['VintJS', 'AngularJs']
         */
            __getTempArray = VintJS.__getTempArray = function () {
            __temp_array.length = 0;
            forEach(arguments, function (value, i) {
                __temp_array[i] = value;
            }, this);
            return __temp_array;
        };

    /**
     * @name VintJS.console
     * @object
     * @description
     * 当浏览器版本较低不支持console的时候防止报错。具体使用同浏览器原生console。
     * api 详情 https://developers.google.com/chrome-developer-tools/docs/console-api。
     */
    VintJS.console = root.console || (function () {
        var cl = {} , attr_list = ['assert', 'clear', 'constructor', 'count', 'debug', 'dir', 'dirxml',
            'error', 'group', 'groupCollapsed', 'groupEnd', 'info', 'log', 'markTimeline', 'profile',
            'profileEnd', 'table', 'time', 'timeEnd', 'timeStamp', 'trace', 'warn'];
        for (var i = 0; i < attr_list.length; i++) {
            cl[attr_list[i]] = $.noop;
        }
        return cl;
    })();

    /**
     * @name VintJS.has
     * @function
     * @description
     * 判断对象 obj 是否含有属性 attr。
     * @return {boolean}
     */
    VintJS.has = function (obj, attr) {
        return obj.hasOwnProperty(attr);
    };

    VintJS.restObj = function (obj) {
        for (var prop in obj) {
            delete obj[prop];
        }
    };

    var __GLOBAL_CONFIG = {
        hash_prefix: '',
        getCurrentUser: function () {
            //NOT support asynchronous request currently!!
            return true;
        },
        template_url: '/static/template/',
        login_url: '/login'
    };


    VintJS.setTimeout = function (callback, time, context) {
        context = context || root;
        return setTimeout(function () {
            callback.call(context)
        }, time);
    };


    VintJS.setInterval = function (callback, time, context) {
        context = context || root;
        return setInterval(function () {
            callback.call(context)
        }, time);
    };

    VintJS.getConfig = function (key) {
        if (!arguments.length)return __GLOBAL_CONFIG;
        return __GLOBAL_CONFIG[key];
    };

    VintJS.create = function (options) {
        forEach(options, function (value, key) {
            __GLOBAL_CONFIG[key] = value;
        });
        __GLOBAL_CONFIG.hash_spliter = new RegExp('#' + VintJS.getConfig('hash_prefix') + '(.*)$');
        this.location.listen();
        return this;
    };

    //Call this function in development environment.
    VintJS.Debug = function () {
        __GLOBAL_CONFIG.debug = true;
    };

    var __event_spliter = /\s+/,
        /**
         * @private
         * @name __eventAnalyze
         * @function
         * @description
         * 分析事件相关函数传入的参数。
         * @return {boolean}
         */
            __eventAnalyze = function (obj, action, name, rest) {
            if (!name) return true;
            if (isType(name, 'object')) {
                forEach(name, function (value, key) {
                    obj[action].apply(obj, __getTempArray(key, value).concat(rest));
                }, this);
                return false;
            }
            if (__event_spliter.test(name)) {
                var names = name.split(__event_spliter);
                forEach(names, function (name) {
                    obj[action].apply(obj, __getTempArray(name).concat(rest));
                }, this);
                return false;
            }
            return true;
        };

    //事件相关方法
    var Event = VintJS.Event = {
        /**
         * @name Event.on
         * @function
         * @param name 需绑定的时间名称，支持字符串以及对象。
         * @param callback 回调函数，当name为对象的时候该参数可为空。
         * @param context 回调函数执行时的上下文。
         * @description
         * 绑定事件。
         * @returns {object}
         */
        on: function (name, callback, context) {
            if (!__eventAnalyze(this, 'on', name, [callback, context]) || !callback) return this;
            this.__events || (this.__events = {});
            var events = this.__events[name] || (this.__events[name] = []);
            events.push({callback: callback, context: context, ctx: context || this});
            return this;
        },

        /**
         * @name Event.off
         * @function
         * @param name 需绑定的时间名称，支持字符串以及对象、正则，可选。
         * @param callback 回调函数，可选。
         * @param context 回调函数执行时的上下文，可选。
         * @description
         * 取消绑定事件。只有在回调函数和上下文同时满足的时候，才能够取消绑定。
         * 如果参数为空则删除所有绑定。如果只有name则删除该name下所有绑定事件。
         * @returns {object}
         */
        off: function (name, callback, context) {
            if (!this.__events || !__eventAnalyze(this, 'off', name, [callback, context])) return this;
            if (arguments.length === 0) {
                this.__events = {};
                return this;
            }
            var names, events , retain;
            if (isType(name, 'RegExp')) {
                names = [];
                forEach(getKeys(this.__events), function (ev_name) {
                    if (name.test(ev_name)) {
                        names.push(ev_name);
                    }
                });
            } else {
                names = name ? [name] : getKeys(this.__events)
            }
            forEach(names, function (name) {
                if (events = this.__events[name]) {
                    this.__events[name] = retain = [];
                    if (callback || context) {
                        forEach(events, function (event) {
                            if ((callback && callback !== event.callback) || (context && context !== event.context)) {
                                retain.push(event);
                            }
                        });
                    }
                    if (!retain.length) {
                        delete this.__events[name];
                    } else {
                        this.__events[name] = retain;
                    }
                }
            }, this);
            return this;
        },

        /**
         * @name Event.trigger
         * @function
         * @param name 触发的名称。
         * @description
         * 事件触发方法。name为必须值，后面可以追加参数，所追加的参数最终最为参数在回调函数中使用。
         * @example
         * var VintJS = new VintJS;
         * VintJS.on('sleep',function(){console.log(arguments)});
         * VintJS.trigger('sleep','arg1','arg2')
         * 输出 => ['sleep','arg1','arg2']
         * @returns {object}
         */
        trigger: function (name) {
            if (!this.__events) return this;
            var args = Array.prototype.slice.call(arguments, 1);
            if (!__eventAnalyze(this, 'trigger', name, args)) return this;
            var events = this.__events[name];
            forEach(events, function (ev) {
                ev.callback.apply(ev.ctx, args);
            }, this);
            return this;
        }
    };

    extend(VintJS, Event);

    window['VintJS'] = VintJS;

}).call(window, jQuery);