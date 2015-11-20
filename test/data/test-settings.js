var app = app || {};

$(document).ready(function () {
    'use strict';

     app.settings.profiles.add([
        {
            name: 'Default Profile (test)',
            frameWidth: 70,
            mullionWidth: 92,
            sashFrameWidth: 82,
            sashFrameOverlap: 34,
            sashMullionOverlap: 12,
            system: 'Gealan S9000'
        },
        {
            name: 'Alternative Profile (test)',
            unitType: 'Patio Door',
            frameWidth: 90,
            mullionWidth: 112,
            sashFrameWidth: 102,
            sashFrameOverlap: 36,
            sashMullionOverlap: 14,
            lowThreshold: true,
            thresholdWidth: 20,
            system: 'Gealan S9000'
        }
    ]);
});
