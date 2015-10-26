//  This script is heavily based on the following code snippet:
//  http://joelb.me/blog/2011/code-snippet-accessing-clipboard-images-with-javascript/

var app = app || {};

(function () {
    'use strict';

    //  TODO: use marionette Object for this
    app.paste_image = {
        getTargetCells: function () {
            return $('.hot-customer-image-cell').filter(function (index, element) {
                return $(element).hasClass('current') || $(element).hasClass('area');
            });
        },
        focusPasteCatcher: function () {
            console.log( 'focus on paste_catcher' );
            var self = app.paste_image;
            var $target_cells = self.getTargetCells();

            if ( self.$paste_catcher && $target_cells.length !== 0 ) {
                self.$paste_catcher.trigger('focus');
            } else {
                console.log( 'focus condition is not fulfilled' );
            }
        },
        appendPasteCatcher: function () {
            console.log( 'appending paste catcher' );

            this.$paste_catcher = $('<div id="paste-catcher" class="paste-catcher" />')
                .attr('contenteditable', '').appendTo('body');

            console.log( this.$paste_catcher );

            // this.focusPasteCatcher();
            // $(document).on('click', this.focusPasteCatcher);
        },
        onPaste: function (e) {
            console.log( 'trigger onpaste event', e );
            var self = app.paste_image;

            // if ( e.via_proxy === true ) {
            //     return;
            // }

            //  Check if we catch the right event (on our catcher)
            if ( self.$paste_catcher && e.target === self.$paste_catcher.get(0) ) {
                console.log( 'got the correct event!' );
            } else {
                console.log( 'got the wrong event' );
                return;
            }

            // var $target_cells = $('.hot-customer-image-cell').filter(function (index, element) {
            //     return $(element).hasClass('current') || $(element).hasClass('area');
            // });

            // if ( $target_cells.length !== 0 ) {
            //     // return;
            //     // self.focusPasteCatcher();
            //     // self.$paste_catcher.trigger(_.extend({}, e, { via_proxy: true }));
            //     // self
            // } else {
            //     return;
            // }

            // console.log( 'target cells', $target_cells );

            if ( e.originalEvent.clipboardData && e.originalEvent.clipboardData.items ) {
                console.log( 'event has clipboardData', e.originalEvent.clipboardData );
                self.getClipboardData(e.originalEvent.clipboardData);
            } else {
                console.log( 'event has NO clipboardData' );
                setTimeout(function () {
                    console.log( self );
                    self.getContenteditableData();
                }, 10);
            }
        },
        getClipboardData: function (data) {
            console.log( 'getClipboardData', data );

            // Get the items from the clipboard
            var items = data.items;

            console.log( 'items', items );

            if ( items ) {
                // Loop through all items, looking for any kind of image
                for (var i = 0; i < items.length; i++) {
                    if ( items[i].type.indexOf('image') !== -1 ) {
                        // We need to represent the image as a file,
                        var blob = items[i].getAsFile();
                        // and use a URL or webkitURL (whichever is available to the browser)
                        // to create a temporary URL to the object
                        var URLObj = window.URL || window.webkitURL;
                        var source = URLObj.createObjectURL(blob);

                        // The URL can then be used as the source of an image
                        // createImage(source);
                        // console.log( source );
                        this.processImage(source);
                    }
                }
            }
        },
        getContenteditableData: function () {
            console.log( 'getContenteditableData' );

            console.log( this );

            // Store the pasted content in a variable
            // var child = pasteCatcher.childNodes[0];
            var child = this.$paste_catcher.get(0).childNodes[0];
            // var $child = this.$paste_catcher.children().first().clone();

            // console.log( this.$paste_catcher );
            // console.log( this.$paste_catcher.children() );

            console.log( 'child', child );

            // Clear the inner html to make sure we're always
            // getting the latest inserted content
            // pasteCatcher.innerHTML = "";

            this.$paste_catcher.empty();

            if ( child ) {
                // If the user pastes an image, the src attribute
                // will represent the image as a base64 encoded string.
                if ( child.tagName === 'IMG' ) {
                    // createImage(child.src);
                    this.processImage(child.src);
                    // console.log( 'image source', child.src );
                }
            }

        },
        processImage: function (source) {
            console.log( 'process image', source );
            var pastedImage = new Image();
            // pastedImage.onload = function() {
            //     // You now have the image!
            // };
            pastedImage.src = source;
            console.log( pastedImage );
            // $('body').append( pastedImage );

            app.vent.trigger('paste_image', source);
        },
        initialize: function () {
            var self = this;
            this.$paste_catcher = null;

            if ( !window.Clipboard ) {
                console.log( 'we dont have a Clipboard support' );
                this.appendPasteCatcher();
            }

            // $(document).on('paste', '.paste-catcher', function (e) {
            //     console.log( 'catcher got a paste event', e );
            // });

            // $(document).on('keydown', '.copyPaste', function (e) {
            //     console.log( 'pressing a key on the textarea' );
            // });

            //  Intercept focus from
            $(document).on('focus', '.copyPaste', function (e) {
                console.log( 'intercepting focus from the textarea!' );
                self.focusPasteCatcher();
            });

            $(window).on('paste', this.onPaste);
            // $(window).on('copyPaste', this.onPaste);
        }
    };

    //  TODO: move this to app.js
    setTimeout(function () {
        app.paste_image.initialize();
    }, 100);
})();
