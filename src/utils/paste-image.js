import $ from 'jquery';
import Marionette from 'backbone.marionette';

import { globalChannel } from '../utils/radio';

//  This script is heavily based on the following code snippet:
//  http://joelb.me/blog/2011/code-snippet-accessing-clipboard-images-with-javascript/

//  It works in the following way:
//  - we append an invisible contenteditable div to catch pasted content
//  - we piggyback on the existing Handsontable instance. It uses the similar
//    technique (invisible textarea) to catch pasted content for its table
//    cells, so we observe `focus` event on that textarea and intercept the
//    focus when the data is going to be pasted to *certain* cells
//  - when we got an image, we trigger a `paste_image` event, and
//    `UnitsTableView` is listening to that event and processing its data

export default Marionette.Object.extend({
    getTargetCells() {
        return $('.hot-customer-image-cell').filter((index, element) => $(element).hasClass('current') || $(element).hasClass('area'));
    },
    focusPasteCatcher() {
        const $target_cells = this.getTargetCells();

        if (this.$paste_catcher && $target_cells.length !== 0) {
            this.$paste_catcher.trigger('focus');
        }
    },
    appendPasteCatcher() {
        this.$paste_catcher = $('<div id="paste-catcher" class="paste-catcher" />')
            .attr('contenteditable', '').appendTo('body');
    },
    onPaste(e) {
        const self = this;

        //  Check if we catch the right event (on our catcher)
        if (!this.$paste_catcher || e.target !== this.$paste_catcher.get(0)) {
            return;
        }

        if (e.originalEvent.clipboardData && e.originalEvent.clipboardData.items) {
            this.getClipboardData(e.originalEvent.clipboardData);
        } else {
            setTimeout(() => {
                self.getContenteditableData();
            }, 10);
        }
    },
    processWithFileReader(blob) {
        const reader = new FileReader();
        const self = this;

        reader.onload = function (event) {
            self.processImage(event.target.result);
        };

        reader.readAsDataURL(blob);
    },
    getClipboardData(data) {
        // Get the items from the clipboard
        const items = data.items;

        if (items) {
            // Loop through all items, looking for any kind of image
            for (let i = 0; i < items.length; i += 1) {
                if (items[i].type.indexOf('image') !== -1) {
                    // We need to represent the image as a file
                    const blob = items[i].getAsFile();

                    this.processWithFileReader(blob);
                }
            }
        }
    },
    getContenteditableData() {
        // Store the pasted content in a variable
        const child = this.$paste_catcher.get(0).childNodes[0];

        // Clear the inner html to make sure we're always
        // getting the latest inserted content
        this.$paste_catcher.empty();

        if (child) {
            // If the user pastes an image, the src attribute
            // will represent the image as a base64 encoded string.
            if (child.tagName === 'IMG') {
                this.processImage(child.src);
            }
        }
    },
    processImage(source) {
        const pastedImage = new Image();

        pastedImage.onload = function () {
            globalChannel.trigger('paste_image', source);
        };

        pastedImage.src = source;
    },
    initialize() {
        const self = this;

        this.$paste_catcher = null;
        this.appendPasteCatcher();

        //  Intercept focus from Handsontable textarea. We only do this
        //  when we're about to paste something into Customer Image cells
        $(document).on('focus', '.copyPaste', () => {
            self.focusPasteCatcher();
        });

        $(window).on('paste', (e) => {
            self.onPaste(e);
        });
    },
});
