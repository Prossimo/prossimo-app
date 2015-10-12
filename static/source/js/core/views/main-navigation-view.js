var app = app || {};

(function () {
    'use strict';

    app.MainNavigationView = Marionette.ItemView.extend({
        tagName: 'div',
        template: app.templates['core/main-navigation-view'],
        onRender: function () {
            this.$el.off('click');
            this.$list = this.$el.find('ul');

            //  Append each navigation item and execute its callback on click
            if ( this.options ) {
                _.forEach(this.options, function (item, key) {
                    item.class_name = key;
                    var item_tpl = app.templates['core/main-navigation-item-view'](item);
                    var $item = $(item_tpl);
                    this.$list.append($item);

                    this.$el.on('click', '.' + key, function (e) {
                        var $this = $(this);
                        e.preventDefault();
                        item.showCallback.apply();
                        $this.addClass('active').siblings().removeClass('active');
                    });
                }, this);
            }
        }
    });
})();
