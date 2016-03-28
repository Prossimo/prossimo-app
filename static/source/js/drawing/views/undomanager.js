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

        undoManager.on('all', checkButtons);
        undoManager.stack.on('add', function () {
            if (buttons.undo !== null && undoManager.isAvailable('undo')) {
                buttons.undo.prop('disabled', false);
            }

            if (buttons.redo !== null && !undoManager.isAvailable('redo')) {
                buttons.redo.prop('disabled', true);
            }
        });

        $(window).on('keydown', function (event) {
            var keyCode = event.keyCode || event.which;

            if (keyCode === 90 && ( event.ctrlKey || event.metaKey ) && !event.shiftKey ) {
                undoManager.undo();
            }

            if (keyCode === 90 && ( event.ctrlKey || event.metaKey ) && event.shiftKey) {
                undoManager.redo();
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
