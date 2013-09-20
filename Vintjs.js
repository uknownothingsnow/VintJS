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
        VintJS.$init = $('#vint-init');
        this.template.get('base', function (content) {
            VintJS.$init.html(content);
            this.location.listen();
        }, this);
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
//URL相关处理内容
VintJS.location = {

    __path_spliter: /^([^\?#]*)?(\?([^#]*))?$/,

    __current_location: {
        root: window.location.href.indexOf('#') === -1 ? window.location.href : window.location.href.substr(0, window.location.href.indexOf('#')),
        path: '',
        search: {}
    },

    __encodeUriQuery: function (val, pctEncodeSpaces) {
        return encodeURIComponent(val).
            replace(/%40/gi, '@').
            replace(/%3A/gi, ':').
            replace(/%24/g, '$').
            replace(/%2C/gi, ',').
            replace(/%20/g, (pctEncodeSpaces ? '%20' : '+'));
    },

    __tryDecodeURIComponent: function (value) {
        try {
            return decodeURIComponent(value);
        } catch (e) {
            return value;
        }
    },

    __pre_url: null,

    __pre_path: null,

    url: function (url, replace) {
        var location = window.location;
        if (!arguments.length)return location.href;
        if (url === this.__pre_url)return this;
        if (replace) {
            location.replace(url);
            return this;
        }
        location.href = url;
        return this;
    },

    /**
     * @private
     * @name __getResultUrl
     * @function
     * @returns {string}
     * @description
     * 根据current_location的内容返回当前的地址。
     */
    __getResultUrl: function () {
        var url_search_list = VintJS.__getTempArray();
        VintJS.forEach(this.__current_location.search, function (value, key) {
            url_search_list.push(this.__encodeUriQuery(key, true) + (value === true ? '' : '=' + this.__encodeUriQuery(value, true)));
        }, this);
        return this.__current_location.root + '#' + VintJS.getConfig('hash_prefix') + this.__current_location.path + (url_search_list.length ? ('?' + url_search_list.join('&')) : '');
    },

    path: function (path) {
        if (path) {
            this.__current_location.path = path.charAt(0) == '/' ? path : '/' + path;
            this.url(this.__getResultUrl());
            return this;
        }
        return this.__current_location.path;
    },

    replace: function (path) {
        if (!path)return this;
        this.__current_location.path = path.charAt(0) == '/' ? path : '/' + path;
        this.url(this.__getResultUrl(), true);
        return this;
    },

    __checkUrl: function () {
        var now_url = window.location.href;
        if (now_url === this.__pre_url)return this;
        this.__pre_url = now_url;
        var url_hash_match = location.href.match(VintJS.getConfig('hash_spliter')),
            hash = url_hash_match ? url_hash_match[1] : '';
        if (!hash) {
            this.replace('/');
            return this;
        }
        var match = this.__path_spliter.exec(hash);
        if (match[3]) {
            var key_value , key;
            VintJS.forEach(match[3].split('&'), function (keyValue) {
                if (keyValue) {
                    key_value = keyValue.split('=');
                    if (key = this.__tryDecodeURIComponent(key_value[0])) {
                        this.__current_location.search[key] = key_value[1] ? this.__tryDecodeURIComponent(key_value[1]) : true;
                    }
                }
            }, this)
        } else {
            VintJS.restObj(this.__current_location.search);
        }
        if (match[1] && this.__pre_url !== match[1]) {
            this.__current_location.path = this.__tryDecodeURIComponent(match[1]);
            this.__pre_url = match[1];
        }
        this.trigger('urlChange');
        return this;
    },

    search: function (key, value) {
        if (arguments.length === 1) {
            if (VintJS.isType(key, 'string')) {
                return this.__current_location.search[key];
            }
            if (VintJS.isType(key, 'object')) {
                this.__current_location.search = key;
            }
        }
        if (arguments.length === 2) {
            if (value === null) {
                delete this.__current_location.search[key];
            } else {
                this.__current_location.search[key] = value;
            }
        }
        this.url(this.__getResultUrl());
        return this;
    },

    listen: function () {
        var parent = this;
        VintJS.setTimeout(this.__checkUrl, 0, this);
        var docMode = document.documentMode,
            oldIE = /msie [\w.]+/.exec(navigator.userAgent.toLowerCase()) && (!docMode || docMode <= 7);
        if (!oldIE && 'onhashchange' in window) {
            $(window).on('hashchange', function () {
                parent.__checkUrl();
            });
        } else {
            VintJS.setInterval(parent.__checkUrl, 50, this);
        }
        return this;
    }
};

VintJS.extend(VintJS.location, VintJS.Event);
VintJS.route = {

    __routers: [],

    __route_init: false,

    __otherwise: null,

    __pre_treat_role: function () {
        var old_routers = VintJS.__getTempArray.apply(this, this.__routers);
        this.__routers.length = 0;
        VintJS.forEach(old_routers, function (old_router) {
            if (!VintJS.isType(old_router.role, 'regExp')) {
                old_router.role = new RegExp('^' + old_router.role.replace(/:number/g, '(\\d+)')
                    .replace(/:string/g, '(\\w+)').replace(/:all/g, '(.+)') + '$')
            }
            this.__routers.push(old_router);
        }, this);
    },

    __use: function (router_object, params) {
        if (VintJS.isType(router_object, 'function')) {
            router_object.apply(this, params);
            return this;
        }
        if (!VintJS.isType(router_object, 'object'))return this;
        if (router_object['login_required'] && !VintJS.getConfig('getCurrentUser').call(this)) {
            if (VintJS.location.path() != '/')VintJS.location.search('redirect', VintJS.location.path());
            this.redirectTo(VintJS.getConfig('login_url'), true);
            return this;
        }
        if (router_object['redirect_to']) {
            this.redirectTo(router_object['redirect_to']);
            return this;
        }
        this.render(router_object['template'], router_object['controller'], params);
        return this;
    },

    render: function (template, controller, params) {
        console.log(params);
        //TODO It's time to render html.
        return this;
    },

    redirectTo: function (url, replace) {
        if (replace) {
            VintJS.location.replace(url);
        } else {
            VintJS.location.path(url);
        }
        return this;
    },

    when: function (role, router_object) {
        this.__routers.push({role: role, router_object: router_object});
        return this;
    },

    otherwise: function (router_object) {
        this.__otherwise = router_object;
        return this;
    },

    response: function () {
        if (!this.__route_init) {
            this.__pre_treat_role();
            this.__route_init = true;
        }
        var path = VintJS.location.path();
        for (var i = 0; i < this.__routers.length; i++) {
            var router = this.__routers[i],
                params = router.role.exec(path);
            if (params !== null) {
                params.shift();
                this.__use(router.router_object, params);
                return this;
            }
        }
        if (this.__otherwise)this.__use(this.__otherwise);

        return this;
    }

};

VintJS.location.on('urlChange', VintJS.route.response, VintJS.route);
VintJS.template = {
    __cache_sign: 'T_',
    __cache: (function () {
        if (!window.localStorage)return false;
        var storage = window.localStorage;
        //Clear old template cache.
        for (var i = 0; i < storage.length; i++) {
            var name = storage.key(i);
            if (name.indexOf('T_') === 0) {
                storage.removeItem(name);
            }
        }
        return storage;
    })() || {},

    __set: function (name, content) {
        this.__cache[name] = content;
    },

    __load: function (url, callback) {
        var parent = this;
        $.get(url, function (content) {
            callback.call(parent, content);
        });
    },

    get: function (name, callback, context) {
        callback = callback || $.noop;
        context = context || this;
        var cache_name = this.__cache_sign + name;
        if (this.__cache[cache_name] !== undefined) {
            callback(this.__cache[cache_name]);
            return this;
        }
        var parent = this;
        this.__load(VintJS.getConfig('template_url') + name + '.html', function (content) {
            parent.__set(cache_name, content);
            callback.call(context, content);
        });
        return this
    }
};