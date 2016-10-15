var app = app || {};
var re = /([a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12})/i;

(function () {
    'use strict';

    app.ProjectFile = Backbone.Model.extend({
        idAttribute: 'uuid',
        defaults: {
            name: '',
            uuid: '',
            type: '',
            url: ''
        },
        initialize: function () {
            var uuid = this.get('uuid');
            var url = this.get('url');

            if (!uuid && !!url) {
                this.set('uuid', this.extractUuid(url));
            }
        },
        extractUuid: function (value) {
            // the RegEx will match the first occurrence of the pattern
            var match = re.exec(value);

            // result is an array containing:
            // [0] the entire string that was matched by our RegEx
            // [1] the first (only) group within our match, specified by the
            // () within our pattern, which contains the GUID value

            return match ? match[1] : null;
        }
    });
})();
