var app = app || {};

// Utils for DrawingModule

(function () {
    'use strict';

    app.DrawingModuleUtils = function (builder)
    {

        var module = builder;

        return {
            getSashParams: function (sectionData, isAbsolute) {
                isAbsolute = isAbsolute || false;

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

                if (isAbsolute) {
                    fill.x = sectionData.sashParams.x;
                    fill.y = sectionData.sashParams.y;
                }

                return fill;
            },
            getCornerPoints: function (sectionData, isAbsolute, withMullions) {
                isAbsolute = isAbsolute || false;
                withMullions = withMullions || false;

                var fill = this.getSashParams(sectionData);
                var corners = [];
                var add = (isAbsolute) ? {x: fill.x, y: fill.y} : {x: 0, y: 0};
                var mullAdd = (withMullions) ?
                              this.getMullionDisplacements(sectionData) : this.getMullionDisplacements(null);

                // top-left
                corners[0] = {x: 0 + add.x + mullAdd[0].x, y: 0 + add.y + mullAdd[0].y};
                // top-right
                corners[1] = {x: fill.width + add.x + mullAdd[1].x, y: 0 + add.y + mullAdd[1].y};
                // bottom-right
                corners[2] = {x: fill.width + add.x + mullAdd[2].x, y: fill.height + add.y + mullAdd[2].y};
                // bottom-left
                corners[3] = {x: 0 + add.x + mullAdd[3].x, y: fill.height + add.y + mullAdd[3].y};

                return corners;
            },
            applyRatioToPoint: function (point, ratio) {
                ratio = ratio || 1;

                return {x: point.x * ratio, y: point.y * ratio};
            },
            applyRatioToPoints: function (points, ratio) {
                _.each(points, function (corner, i) {
                    _.each(corner, function (pos, key) {
                        points[i][key] = pos * ratio;
                    });
                });

                return points;
            },
            getMullionDisplacements: function (sectionData) {
                var displacements = [
                    {x: 0, y: 0},
                    {x: 0, y: 0},
                    {x: 0, y: 0},
                    {x: 0, y: 0}
                ];

                if (sectionData !== null) {
                    var mulWidth = builder.get('model').profile.get('mullion_frame_width');

                    _.each(sectionData.mullionEdges, function (edgeVal, edge) {
                        if (edgeVal) {
                            switch (edge) {
                                case 'top':
                                    displacements[0].x -= mulWidth;
                                    displacements[1] = false;
                                break;
                                case 'right':
                                    displacements[1] = false;
                                    displacements[2] = false;
                                break;
                                case 'bottom':
                                    displacements[2] = false;
                                    displacements[3] = false;
                                break;
                                case 'left':
                                    displacements[3] = false;
                                    displacements[0] = false;
                                break;
                                default:
                                break;
                            }
                        }
                    });
                }

                return displacements;
            }
        };
    };

})();
