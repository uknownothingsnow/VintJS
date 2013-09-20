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