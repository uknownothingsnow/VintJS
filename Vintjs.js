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
            host: 80,
            search: {}
        }, pre_url = '', docMode = document.documentMode,
        oldIE = /msie [\w.]+/.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7);
    Vt.fn.location = {
        url: function (url, replace) {
            if (!url)return this;
            if (replace) {
                root.location.replace(url);
                return this;
            }
            root.location.href = url;
            return this;
        },
        path: function (path) {
            if (path) {
                return this;
            }
            return '';

        },
        host: function () {

        },
        replace: function (path) {
            if (!path)return this;
            return this;
        },
        search: function () {

        },
        listen: function () {
            pre_url = location.href;

            return this;

        }
    };

    root['VintJS'] = Vt;

}).call(window, jQuery);