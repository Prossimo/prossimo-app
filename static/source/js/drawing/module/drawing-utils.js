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
            getCornerPoints: function (sectionData, isAbsolute) {
                isAbsolute = isAbsolute || false;

                var fill = this.getSashParams(sectionData, isAbsolute);
                var corners = [];
                var sash = 0; // Sash frame width

                if (sectionData.sashType !== 'fixed_in_frame') {
                    sash = module.get('model').profile.get('sash_frame_width');
                }

                // top-left
                corners[0] = {x: 0 + sash, y: 0 + sash};
                // top-right
                corners[1] = {x: fill.width + sash, y: 0 + sash};
                // bottom-right
                corners[2] = {x: fill.width + sash, y: fill.height + sash};
                // bottom-left
                corners[3] = {x: 0 + sash, y: fill.height + sash};

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
            getCornerExternality: function (sectionData) {
                var corners = [true, true, true, true];

                _.each(sectionData.mullionEdges, function (edgeValue, edge) {
                    if (edgeValue) {
                        switch (edge) {
                            case 'top':
                                corners[0] = false;
                                corners[1] = false;
                            break;
                            case 'right':
                                corners[1] = false;
                                corners[2] = false;
                            break;
                            case 'bottom':
                                corners[2] = false;
                                corners[3] = false;
                            break;
                            case 'left':
                                corners[3] = false;
                                corners[0] = false;
                            break;
                            default:
                            break;
                        }
                    }
                });

                return corners;
            },
            getExternalCorners: function (corners, externality) {
                return _.filter(corners, function (val, i) {
                            return externality[i];
                        });
            },
            getMainFrameKinks: function (root) {
                var sections = [];
                var corners = [];

                // First of all, lets find all sections without childs
                // Because only sections without childs have a trapezoid params (not zeroPoints)
                function findSectionWithoutChilds(section) {
                    if (section.sections.length) {
                        _.each(section.sections, function (child) {
                            findSectionWithoutChilds(child);
                        });
                    } else {
                        sections.push(section);
                    }
                }
                // And collect it into sections array
                findSectionWithoutChilds(root);

                // Next step: getCornerPoints with absolute position
                _.each(sections, function (section) {
                    var _corners;

                    _corners = this.getCornerPoints(section, true);

                    console.log(_corners);

                    // Apply trapezoid params
                    _.each(_corners, function (corner, i) {
                        _corners[i].x += section.trapezoid[i].x;
                        _corners[i].y += section.trapezoid[i].y;
                    });
                    // Save results into corners array
                    corners = corners.concat(_corners);
                }.bind(this));

                // And finally, we need to find convex hull of points:
                // 1. Sort X
                corners.sort(app.utils.convex_hull.compareX);
                // 2. Sort Y
                corners.sort(app.utils.convex_hull.compareY);
                // 3. Find convex hull
                var hull = app.utils.convex_hull.find(corners);

                // @TODO: Fix it. Now it works bad :(
                console.log('<', corners);
                console.log('>', hull);
                console.log('=', app.utils.vector2d.clockwiseSort(hull));
            }
        };
    };

})();
