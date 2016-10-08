var app = app || {};

(function () {
    'use strict';

    app.UndoManager = function (opts) {
        var undo_manager = new Backbone.UndoManager(opts);
        var buttons = {
            undo: null,
            redo: null
        };

        function checkButtons() {
            if ( buttons.undo !== null && buttons.undo.length ) {
                if ( undo_manager.isAvailable('undo') ) {
                    buttons.undo.prop('disabled', false);
                } else {
                    buttons.undo.prop('disabled', true);
                }
            }

            if ( buttons.redo !== null && buttons.redo.length ) {
                if ( undo_manager.isAvailable('redo') ) {
                    buttons.redo.prop('disabled', false);
                } else {
                    buttons.redo.prop('disabled', true);
                }
            }
        }

        function registerButton(type, button) {
            buttons[type] = button;
            checkButtons();
        }

        //  Add custom processing for Undo/Redo events to persist them
        //  correctly to our backend.
        undo_manager.changeUndoType('add', {
            undo: function (collection, ignore, model) {
                model.destroy();
            },
            redo: function (collection, ignore, model, options) {
                // Redo add = add
                if (options.index) {
                    options.at = options.index;
                }

                if ( model.id ) {
                    delete model.id;
                }

                if ( model.attributes.id ) {
                    delete model.attributes.id;
                }

                var new_object = collection.add(model, options);

                if ( new_object.hasOnlyDefaultAttributes() === false ) {
                    model.persist({}, {
                        validate: true,
                        parse: true
                    });
                }
            },
            on: function (model, collection, options) {
                return {
                    object: collection,
                    before: undefined,
                    after: model,
                    options: _.clone(options)
                };
            }
        });

        undo_manager.changeUndoType('change', {
            undo: function (model, before, after, options) {
                if (_.isEmpty(before)) {
                    _.each(_.keys(after), model.unset, model);
                } else {
                    model.persist(before, {
                        validate: true,
                        parse: true
                    });

                    if (options && options.unsetData && options.unsetData.before && options.unsetData.before.length) {
                        _.each(options.unsetData.before, model.unset, model);
                    }
                }
            },
            redo: function (model, before, after, options) {
                if (_.isEmpty(after)) {
                    _.each(_.keys(before), model.unset, model);
                } else {
                    model.persist(after, {
                        validate: true,
                        parse: true
                    });

                    if (options && options.unsetData && options.unsetData.after && options.unsetData.after.length) {
                        _.each(options.unsetData.after, model.unset, model);
                    }
                }
            },
            on: function (model, options) {
                var afterAttributes = model.changedAttributes();
                var keysAfter = _.keys(afterAttributes);
                var previousAttributes = _.pick(model.previousAttributes(), keysAfter);
                var keysPrevious = _.keys(previousAttributes);
                var unsetData = (options || (options = {})).unsetData = {
                    after: [],
                    before: []
                };

                if (keysAfter.length !== keysPrevious.length) {
                    // There are new attributes or old attributes have been unset
                    if (keysAfter.length > keysPrevious.length) {
                        // New attributes have been added
                        _.each(keysAfter, function (val) {
                            if (!(val in previousAttributes)) {
                                unsetData.before.push(val);
                            }
                        }, this);
                    } else {
                        // Old attributes have been unset
                        _.each(keysPrevious, function (val) {
                            if (!(val in afterAttributes)) {
                                unsetData.after.push(val);
                            }
                        });
                    }
                }

                if ( !(unsetData.before.length === 1 && unsetData.before[0] === 'id') ) {
                    return {
                        object: model,
                        before: previousAttributes,
                        after: afterAttributes,
                        options: _.clone(options)
                    };
                }
            }
        });

        undo_manager.changeUndoType('remove', {
            undo: function (collection, model, ignore, options) {
                if ('index' in options) {
                    options.at = options.index;
                }

                if ( model.id ) {
                    delete model.id;
                }

                if ( model.attributes.id ) {
                    delete model.attributes.id;
                }

                collection.add(model, options);
                model.persist({}, {
                    validate: true,
                    parse: true
                });
            },
            redo: function (collection, model) {
                model.destroy();
            },
            on: function (model, collection, options) {
                return {
                    object: collection,
                    before: model,
                    after: undefined,
                    options: _.clone(options)
                };
            }
        });

        undo_manager.on('all', checkButtons);
        undo_manager.stack.on('add', function () {
            checkButtons();
        });

        return {
            manager: undo_manager,
            handler: {
                undo: function () {
                    undo_manager.undo();
                },
                redo: function () {
                    undo_manager.redo();
                }
            },
            isAvailable: {
                undo: function () {
                    return undo_manager.isAvailable('undo');
                },
                redo: function () {
                    return undo_manager.isAvailable('redo');
                }
            },
            registerButton: registerButton
        };
    };
})();
