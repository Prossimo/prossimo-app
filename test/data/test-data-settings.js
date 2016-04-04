var app = app || {};

$(document).ready(function () {
    'use strict';

    app.settings.profiles.add([
        {
            name: 'Pinnacle uPVC (test)',
            frame_width: 70,
            mullion_width: 92,
            sash_frame_width: 82,
            sash_frame_overlap: 34,
            sash_mullion_overlap: 12,
            system: 'Pinnacle uPVC Window',
            no_backend: true
        },
        {
            name: 'Pinnacle Entry Door (test)',
            unit_type: 'Patio Door',
            frame_width: 84,
            mullion_width: 92,
            sash_frame_width: 120,
            sash_frame_overlap: 34,
            sash_mullion_overlap: 12,
            low_threshold: true,
            threshold_width: 20,
            system: 'Pinnacle uPVC Entry Door',
            no_backend: true
        },
        {
            name: 'PE 78N HI Entry Door (test)',
            unit_type: 'Entry Door',
            frame_width: 74,
            mullion_width: 94,
            sash_frame_width: 126,
            sash_frame_overlap: 28,
            sash_mullion_overlap: 12,
            system: 'Ponzio PE 78N HI',
            low_threshold: true,
            threshold_width: 20,
            no_backend: true
        }
    ]);
});
