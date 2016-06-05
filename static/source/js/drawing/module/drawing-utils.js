var app = app || {};

// Utils for DrawingModule

(function () {
    'use strict';

    app.DrawingModuleUtils = function (builder)
    {

        var module = builder;

        return {
            getSashParams: function (sectionData) {
                var fill = {};

                if (_.includes(['full-flush-panel', 'exterior-flush-panel'], sectionData.fillingType) &&
                    !module.getState('openingView')
                ) {
                    fill.x = sectionData.openingParams.x - sectionData.sashParams.x;
                    fill.y = sectionData.openingParams.y - sectionData.sashParams.y;
                    fill.width = sectionData.openingParams.width;
                    fill.height = sectionData.openingParams.height;
                } else if (_.includes(['full-flush-panel', 'interior-flush-panel'], sectionData.fillingType) &&
                            module.getState('openingView')
                ) {
                    fill.x = 0;
                    fill.y = 0;
                    fill.width = sectionData.sashParams.width;
                    fill.height = sectionData.sashParams.height;
                } else {
                    fill.x = sectionData.glassParams.x - sectionData.sashParams.x;
                    fill.y = sectionData.glassParams.y - sectionData.sashParams.y;
                    fill.width = sectionData.glassParams.width;
                    fill.height = sectionData.glassParams.height;
                }

                return fill;
            }
        };
    };

})();
