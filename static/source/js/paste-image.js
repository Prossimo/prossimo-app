//  This script is heavily based on the following code snippet:
//  http://joelb.me/blog/2011/code-snippet-accessing-clipboard-images-with-javascript/

//  It works in the following way:
//  - if we have a native window.Clipboard (in Chrome), we use that
//  - if we don't (in Firefox), we append an invisible contenteditable div to
//    catch pasted content
//  - we piggyback on the existing Handsontable instance. It uses the similar
//    technique (invisible textarea) to catch pasted content for its table
//    cells, so we observe `focus` event on that textarea and intercept the
//    focus when the data is going to be pasted to *certain* cells
//  - when we got an image, we trigger a `paste_image` event, and
//    `UnitsTableView` is listening to that event and processing its data

var app = app || {};

(function () {
    'use strict';

    app.PasteImageHelper = Marionette.Object.extend({
        getTargetCells: function () {
            return $('.hot-customer-image-cell').filter(function (index, element) {
                return $(element).hasClass('current') || $(element).hasClass('area');
            });
        },
        focusPasteCatcher: function () {
            var $target_cells = this.getTargetCells();

            if ( this.$paste_catcher && $target_cells.length !== 0 ) {
                this.$paste_catcher.trigger('focus');
            }
        },
        appendPasteCatcher: function () {
            this.$paste_catcher = $('<div id="paste-catcher" class="paste-catcher" />')
                .attr('contenteditable', '').appendTo('body');
        },
        onPaste: function (e) {
            var self = this;

            //  Check if we catch the right event (on our catcher)
            if ( !this.$paste_catcher || e.target !== this.$paste_catcher.get(0) ) {
                return;
            }

            if ( e.originalEvent.clipboardData && e.originalEvent.clipboardData.items ) {
                this.getClipboardData(e.originalEvent.clipboardData);
            } else {
                setTimeout(function () {
                    self.getContenteditableData();
                }, 10);
            }
        },
        processWithFileReader: function (blob) {
            var reader = new FileReader();
            var self = this;

            reader.onload = function ( event ) {
                self.processImage(event.target.result);
            };

            reader.readAsDataURL(blob);
        },
        getClipboardData: function (data) {
            // Get the items from the clipboard
            var items = data.items;

            if ( items ) {
                // Loop through all items, looking for any kind of image
                for (var i = 0; i < items.length; i++) {
                    if ( items[i].type.indexOf('image') !== -1 ) {
                        // We need to represent the image as a file
                        var blob = items[i].getAsFile();

                        this.processWithFileReader(blob);
                    }
                }
            }
        },
        getContenteditableData: function () {
            // Store the pasted content in a variable
            var child = this.$paste_catcher.get(0).childNodes[0];

            // Clear the inner html to make sure we're always
            // getting the latest inserted content
            this.$paste_catcher.empty();

            if ( child ) {
                // If the user pastes an image, the src attribute
                // will represent the image as a base64 encoded string.
                if ( child.tagName === 'IMG' ) {
                    this.processImage(child.src);
                }
            }
        },
        processImage: function (source) {
            var pastedImage = new Image();

            pastedImage.onload = function () {
                app.vent.trigger('paste_image', source);
            };

            pastedImage.src = source;
        },
        initialize: function () {
            var self = this;

            this.$paste_catcher = null;

            if ( !window.Clipboard ) {
                this.appendPasteCatcher();
            }

            //  Intercept focus from Handsontable textarea. We only do this
            //  when we're about to paste something into Customer Image cells
            $(document).on('focus', '.copyPaste', function () {
                self.focusPasteCatcher();
            });

            $(window).on('paste', function (e) {
                self.onPaste(e);
            });
        }
    });
})();
