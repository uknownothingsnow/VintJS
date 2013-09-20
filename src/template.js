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