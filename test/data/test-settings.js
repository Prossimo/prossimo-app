var app = app || {};

$(document).ready(function () {
    'use strict';

     app.settings.profiles.add([
        {
            name: 'Default Profile (test)',
            frame_width: 70,
            mullion_width: 92,
            sash_frame_width: 82,
            sash_frame_overlap: 34,
            sash_mullion_overlap: 12,
            system: 'Gealan S9000'
        },
        {
            name: 'Alternative Profile (test)',
            unit_type: 'Patio Door',
            frame_width: 90,
            mullion_width: 112,
            sash_frame_width: 102,
            sash_frame_overlap: 36,
            sash_mullion_overlap: 14,
            low_threshold: true,
            threshold_width: 20,
            system: 'Gealan S9000'
        }
    ]);
});
