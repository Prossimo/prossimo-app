import UndoManager from 'backbone-undo';
import _ from 'underscore';
import clone from 'clone';

export default function (opts) {
    const undo_manager = new UndoManager(opts);
    const buttons = {
        undo: null,
        redo: null,
    };

    function checkButtons() {
        if (buttons.undo !== null && buttons.undo.length) {
            if (undo_manager.isAvailable('undo')) {
                buttons.undo.prop('disabled', false);
            } else {
                buttons.undo.prop('disabled', true);
            }
        }

        if (buttons.redo !== null && buttons.redo.length) {
            if (undo_manager.isAvailable('redo')) {
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
        undo(collection, ignore, model) {
            model.destroy();
        },
        redo(collection, ignore, model, options) {
            const redo_options = clone(options);
            const redo_model = model;

            // Redo add = add
            if (redo_options.index) {
                redo_options.at = redo_options.index;
            }

            if (redo_model.id) {
                delete redo_model.id;
            }

            if (redo_model.attributes.id) {
                delete redo_model.attributes.id;
            }

            const new_object = collection.add(redo_model, redo_options);

            if (new_object.hasOnlyDefaultAttributes() === false) {
                redo_model.persist({}, {
                    validate: true,
                    parse: true,
                });
            }
        },
        on(model, collection, options) {
            return {
                object: collection,
                before: undefined,
                after: model,
                options: clone(options),
            };
        },
    });

    undo_manager.changeUndoType('change', {
        undo(model, before, after, options) {
            if (_.isEmpty(before)) {
                _.each(_.keys(after), model.unset, model);
            } else {
                model.persist(before, {
                    validate: true,
                    parse: true,
                });

                if (options && options.unsetData && options.unsetData.before && options.unsetData.before.length) {
                    _.each(options.unsetData.before, model.unset, model);
                }
            }
        },
        redo(model, before, after, options) {
            if (_.isEmpty(after)) {
                _.each(_.keys(before), model.unset, model);
            } else {
                model.persist(after, {
                    validate: true,
                    parse: true,
                });

                if (options && options.unsetData && options.unsetData.after && options.unsetData.after.length) {
                    _.each(options.unsetData.after, model.unset, model);
                }
            }
        },
        on(model, options) {
            const redo_options = clone(options) || {};

            const afterAttributes = model.changedAttributes();
            const keysAfter = _.keys(afterAttributes);
            const previousAttributes = _.pick(model.previousAttributes(), keysAfter);
            const keysPrevious = _.keys(previousAttributes);
            const unsetData = {
                after: [],
                before: [],
            };

            redo_options.unsetData = unsetData;

            if (keysAfter.length !== keysPrevious.length) {
                // There are new attributes or old attributes have been unset
                if (keysAfter.length > keysPrevious.length) {
                    // New attributes have been added
                    _.each(keysAfter, (val) => {
                        if (!(val in previousAttributes)) {
                            unsetData.before.push(val);
                        }
                    }, this);
                } else {
                    // Old attributes have been unset
                    _.each(keysPrevious, (val) => {
                        if (!(val in afterAttributes)) {
                            unsetData.after.push(val);
                        }
                    });
                }
            }

            if (!(unsetData.before.length === 1 && unsetData.before[0] === 'id')) {
                return {
                    object: model,
                    before: previousAttributes,
                    after: afterAttributes,
                    options: redo_options,
                };
            }

            return undefined;
        },
    });

    undo_manager.changeUndoType('remove', {
        undo(collection, model, ignore, options) {
            const undo_options = clone(options);
            const undo_model = model;

            if ('index' in undo_options) {
                undo_options.at = undo_options.index;
            }

            if (undo_model.id) {
                delete undo_model.id;
            }

            if (undo_model.attributes.id) {
                delete undo_model.attributes.id;
            }

            collection.add(undo_model, undo_options);
            undo_model.persist({}, {
                validate: true,
                parse: true,
            });
        },
        redo(collection, model) {
            model.destroy();
        },
        on(model, collection, options) {
            return {
                object: collection,
                before: model,
                after: undefined,
                options: clone(options),
            };
        },
    });

    undo_manager.on('all', checkButtons);
    undo_manager.stack.on('add', () => {
        checkButtons();
    });

    return {
        manager: undo_manager,
        handler: {
            undo() {
                undo_manager.undo();
            },
            redo() {
                undo_manager.redo();
            },
        },
        isAvailable: {
            undo() {
                return undo_manager.isAvailable('undo');
            },
            redo() {
                return undo_manager.isAvailable('redo');
            },
        },
        registerButton,
    };
}
