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