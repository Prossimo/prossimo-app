var app = app || {};

(function () {
    'use strict';

    app.UndoManager = function (opts) {
        var undoManager = new Backbone.UndoManager(opts);
        var buttons = {
            undo: null,
            redo: null
        };

        function checkButtons(type) {
            switch (type) {
                case 'undo':
                    if (!undoManager.isAvailable('undo') && buttons.undo !== null && !buttons.undo.prop('disabled')) {
                        buttons.undo.prop('disabled', true);
                    }

                    if (undoManager.isAvailable('redo') && buttons.redo !== null && buttons.redo.prop('disabled')) {
                        buttons.redo.prop('disabled', false);
                    }

                break;
                case 'redo':
                    if (!undoManager.isAvailable('redo') && buttons.redo !== null && !buttons.redo.prop('disabled')) {
                        buttons.redo.prop('disabled', true);
                    }

                    if (undoManager.isAvailable('undo') && buttons.undo !== null && buttons.undo.prop('disabled')) {
                        buttons.undo.prop('disabled', false);
                    }

                break;
            }
        }

        function registerButton(type, button) {
            buttons[type] = button;

            checkButtons(type);
        }

        //  Call update event on model to persist changes to server
        if ( opts && opts.register && opts.register instanceof Backbone.Model ) {
            var model = opts.register;

            model.off('undo redo').on('undo redo', function () {
                if ( !model.isNew() ) {
                    model.sync('update', model, {});
                }
            });
        }

        //  FIXME: this is inefficient because it is fired on all objects
        //  in our registry (currently we're using it in a way when we only
        //  have one object in it at a time, but there will be problems when
        //  we'll want to have per-collection undo actions), and has two loops,
        //  because they have two ways of storing objects in this plugin
        /* eslint-disable max-nested-callbacks */
        undoManager.on('all', function (event) {
            _.each(this.objectRegistry.cidIndexes, function (cid) {
                var object = this.objectRegistry.registeredObjects[cid];

                object.trigger(event);
            }, this);

            _.each(this.objectRegistry.registeredObjects, function (object) {
                object.trigger(event);
            }, this);
        });
        /* eslint-enable max-nested-callbacks */

        undoManager.on('all', checkButtons);
        undoManager.stack.on('add', function () {
            if (buttons.undo !== null && undoManager.isAvailable('undo')) {
                buttons.undo.prop('disabled', false);
            }

            if (buttons.redo !== null && !undoManager.isAvailable('redo')) {
                buttons.redo.prop('disabled', true);
            }
        });

        return {
            manager: undoManager,
            handler: {
                undo: function () {
                    undoManager.undo();
                },
                redo: function () {
                    undoManager.redo();
                }
            },
            isAvailable: {
                undo: function () {
                    return undoManager.isAvailable('undo');
                },
                redo: function () {
                    return undoManager.isAvailable('redo');
                }
            },
            registerButton: registerButton
        };
    };

})();
