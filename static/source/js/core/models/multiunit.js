var app = app || {};

(function () {
    'use strict';

    var self;

    var MULTIUNIT_PROPERTIES = [
        { name: 'multiunit_subunits', title: 'Subunits', type: 'array' }
    ];

    var CONNECTOR_DEFAULTS = {
        width: 20,
        facewidth: 40
    };

    function getSectionDefaults() {
        return {
            id: _.uniqueId(),
            connectors: []
        };
    }

    app.Multiunit = Backbone.Model.extend({
        schema: _.defaults(app.schema.createSchema(MULTIUNIT_PROPERTIES), app.Unit.schema),
        defaults: function () {
            var defaults = app.Unit.prototype.defaults.apply(this, arguments);

            _.each(MULTIUNIT_PROPERTIES, function (item) {
                defaults[item.name] = this.getDefaultValue(item.name, item.type);
            }, this);

            return defaults;
        },
        // Start TODO implement / remove methods
        setProfile: function () {
            this.profile = null;

            //  Assign the default profile id to a newly created unit
            if ( app.settings && !this.get('profile_id') && !this.get('profile_name') ) {
                this.set('profile_id', app.settings.getDefaultProfileId());
            }

            if ( app.settings ) {
                this.profile = app.settings.getProfileByIdOrDummy(this.get('profile_id'));
            }

            //  Store profile name so in case when profile was deleted we can
            //  have its old name for the reference
            if ( this.profile && !this.hasDummyProfile() ) {
                this.set('profile_name', this.profile.get('name'));
            }

            this.validateUnitOptions();
        },
        hasDummyProfile: function () {
            return this.profile && this.profile.get('is_dummy');
        },
        validateUnitOptions: function () {
            var default_options = this.getDefaultUnitOptions();
            var current_options = this.get('unit_options');
            var current_options_parsed;

            function getValidatedUnitOptions(model, currents, defaults) {
                var options_to_set = [];

                if ( app.settings ) {
                    app.settings.dictionaries.each(function (dictionary) {
                        var dictionary_id = dictionary.id;
                        var profile_id = model.profile && model.profile.id;

                        if ( dictionary_id && profile_id ) {
                            var current_option = _.findWhere(currents, { dictionary_id: dictionary_id });
                            var default_option = _.findWhere(defaults, { dictionary_id: dictionary_id });
                            var target_entry = current_option &&
                                dictionary.entries.get(current_option.dictionary_entry_id);

                            if ( current_option && target_entry ) {
                                options_to_set.push(current_option);
                            } else if ( default_option ) {
                                options_to_set.push(default_option);
                            }
                        }
                    });
                }

                return options_to_set;
            }

            if ( _.isString(current_options) ) {
                try {
                    current_options_parsed = JSON.parse(current_options);
                } catch (error) {
                    // Do nothing
                }

                if ( current_options_parsed ) {
                    this.set('unit_options', getValidatedUnitOptions(this, current_options_parsed, default_options));
                    return;
                }
            }

            if ( !_.isObject(current_options) ) {
                this.set('unit_options', default_options);
            } else {
                this.set('unit_options', getValidatedUnitOptions(this, current_options, default_options));
            }
        },
        getDefaultUnitOptions: function () {
            var default_options = [];

            if ( app.settings ) {
                app.settings.dictionaries.each(function (dictionary) {
                    var dictionary_id = dictionary.id;
                    var profile_id = this.profile && this.profile.id;
                    var rules = dictionary.get('rules_and_restrictions');
                    var is_optional = _.contains(rules, 'IS_OPTIONAL');

                    if ( !is_optional && dictionary_id && profile_id ) {
                        var option = app.settings.getDefaultOrFirstAvailableOption(dictionary_id, profile_id);

                        if ( option && option.id && dictionary.id ) {
                            default_options.push({
                                dictionary_id: dictionary.id,
                                dictionary_entry_id: option.id
                            });
                        }
                    }
                }, this);
            }

            return default_options;
        },
        validateOpeningDirection: function () {
            if ( !app.settings ) {
                return;
            }

            if ( !_.contains(app.settings.getOpeningDirections(), this.get('opening_direction')) ) {
                this.set('opening_direction', app.settings.getOpeningDirections()[0]);
            }
        },
        //  TODO: this function should be improved
        //  The idea is to call this function on model init (maybe not only)
        //  and check whether root section could be used by our drawing code or
        //  should it be reset to defaults.
        validateRootSection: function () {
            var root_section = this.get('root_section');
            var root_section_parsed;

            if ( _.isString(root_section) ) {
                try {
                    root_section_parsed = JSON.parse(root_section);
                } catch (error) {
                    // Do nothing
                }

                if ( root_section_parsed ) {
                    this.set('root_section', this.validateSection(root_section_parsed, true));
                    return;
                }
            }

            if ( !_.isObject(root_section) ) {
                this.set('root_section', this.getDefaultValue('root_section'));
            }
        },
        //  Check if some of the section values aren't valid and try to fix that
        validateSection: function (current_section, is_root) {
            return current_section;
        },
        //  Check if this unit belongs to the project which is currently active
        isParentProjectActive: function () {
            var is_active = false;

            if ( app.current_project && this.collection && this.collection.options.project &&
                this.collection.options.project === app.current_project
            ) {
                is_active = true;
            }

            return is_active;
        },
        getRelation: function () {
            return 'multiunit';
        },
        isMultiunit: function () {
            return true;
        },
        isSubunit: function () {
            return false;
        },
        getId: function () {
            return this.get('root_section').id;
        },
        getSashList: function () {
            return undefined;
        },
        getInMetric: function (attr, metric) {
            if (!metric || (['mm', 'inches'].indexOf(metric) === -1)) {
                throw new Error('Set metric! "mm" or "inches"');
            }

            if (metric === 'inches') {
                return this.get(attr);
            }

            return app.utils.convert.inches_to_mm(this.get(attr));
        },
        /* trapezoid start */
        isTrapezoid: function () {
            return false;
        },
        leftMetricCount: function () {
            return 0;
        },
        isArchedWindow: function () {
            return false;
        },
        rightMetricCount: function () {
            return 0;
        },
        isOpeningDirectionOutward: function () {
            return this.get('opening_direction') === 'Outward';
        },
        getTitles: function (names) {
            var name_title_hash = this.getNameTitleTypeHash(names);

            return _.pluck(name_title_hash, 'title');
        },
        hasBaseFilling: function () {
            return false;
        },
        //  Get linear and area size stats for various parts of the window.
        //  These values could be used as a base to calculate estimated
        //  cost of options for the unit
        getLinearAndAreaStats: function () {

            var result = {
                frame: {
                    linear: 0,
                    linear_without_intersections: 0,
                    area: 0,
                    area_both_sides: 0
                },
                sashes: {
                    linear: 0,
                    linear_without_intersections: 0,
                    area: 0,
                    area_both_sides: 0
                },
                glasses: {
                    area: 0,
                    area_both_sides: 0,
                    weight: 0
                },
                openings: {
                    area: 0
                },
                mullions: {
                    linear: 0,
                    area: 0,
                    area_both_sides: 0
                },
                glazing_bars: {
                    linear: 0,
                    linear_without_intersections: 0,
                    area: 0,
                    area_both_sides: 0
                },
                profile_total: {
                    linear: 0,
                    linear_without_intersections: 0,
                    area: 0,
                    area_both_sides: 0,
                    weight: 0
                },
                unit_total: {
                    weight: 0
                }
            };

            return result;
        },
        getRefNum: function () {
            return this.collection ? this.collection.indexOf(this) + 1 : -1;
        },
        // after full calulcalation section will be something like:
        // {
        //     id: 123,
        //     connectors: [Array]
        // }
        generateFullRoot: function (rootSection, openingParams) {
            rootSection = rootSection || JSON.parse(JSON.stringify(this.get('root_section')));

            return rootSection;
        },
        // End TODO implement / remove methods
        getDefaultValue: function (name) {
            var value;
            var defaults = {
                root_section: getSectionDefaults()
            };

            if (Object.keys(defaults).indexOf(name) !== -1) {
                value = defaults[name];
            } else {
                value = app.Unit.prototype.getDefaultValue.apply(this, arguments);
            }

            return value;
        },
        initialize: function () {
            self = this;

            app.Unit.prototype.initialize.apply(this, arguments);

            this.on('add', function () {
                self.listenTo(self.collection, 'update', function (event) {
                    self.updateSubunitsCollection();
                    self.updateConnectorsLength();
                });
                self.listenTo(self.collection.subunits, 'update', function (event) {
                    self.updateSubunitsCollection();
                    self.updateConnectorsLength();
                });
                self.listenTo(self.collection.subunits, 'remove', function (unit) {
                    if (unit.isSubunitOf(self)) {
                        self.removeSubunit(unit);
                    }
                });
            });
        },
        getUnitPrice: function () {
            var price = this.subunits.reduce(function (priceSum, subunit) {
                return priceSum + subunit.getUnitPrice();
            }, 0);

            return price;
        },
        /**
         * this.subunits is a backbone collection that holds respective subunit models, the very same models that exist
         * in multiunit's primary parent collection.
         */
        updateSubunitsCollection: function () {
            if (!this.subunits) {
                this.subunits = new app.UnitCollection();
                this.listenTo(this.subunits, 'change', function () {  // trigger self change if any subunit changes
                    self.trigger.apply(this, ['change'].concat(Array.prototype.slice.call(arguments)));
                });
            }

            var subunitsIds = this.getSubunitsIds();

            this.subunits.add(
                subunitsIds
                    .map(function (id) { return self.getSubunitById(id); })
                    .filter(function (subunit) { return !_.isUndefined(subunit); })
                    .filter(function (subunit) { return self.subunits.indexOf(subunit) === -1; })
            );
        },
        hasOnlyDefaultAttributes: function () {
            var has_only_defaults = true;

            _.each(this.toJSON(), function (value, key) {
                if ( key !== 'position' && has_only_defaults ) {
                    var property_source = _.findWhere(MULTIUNIT_PROPERTIES, { name: key });
                    var type = property_source ? property_source.type : undefined;

                    if ( key === 'profile_id' ) {
                        if ( app.settings && app.settings.getDefaultProfileId() !== value ) {
                            has_only_defaults = false;
                        }
                    } else if ( key === 'profile_name' ) {
                        var profile = app.settings && app.settings.getProfileByIdOrDummy(this.get('profile_id'));

                        if ( profile && profile.get('name') !== value ) {
                            has_only_defaults = false;
                        }
                    } else if ( key === 'root_section' ) {
                        if ( JSON.stringify(_.omit(value, 'id')) !==
                            JSON.stringify(_.omit(this.getDefaultValue('root_section'), 'id'))
                        ) {
                            has_only_defaults = false;
                        }
                    } else if ( key === 'unit_options' ) {
                        if ( JSON.stringify(this.getDefaultUnitOptions()) !== JSON.stringify(value) ) {
                            has_only_defaults = false;
                        }
                    } else if ( this.getDefaultValue(key, type) !== value ) {
                        has_only_defaults = false;
                    }
                }
            }, this);

            return has_only_defaults;
        },
        //  Return { name: 'name', title: 'Title' } pairs for each item in
        //  `names` array. If the array is empty, return all possible pairs
        getNameTitleTypeHash: function (names) {
            var name_title_hash = [];

            if ( !names ) {
                names = _.pluck( MULTIUNIT_PROPERTIES, 'name' );
            }

            _.each(MULTIUNIT_PROPERTIES, function (item) {
                if ( _.indexOf(names, item.name) !== -1 ) {
                    name_title_hash.push({ name: item.name, title: item.title, type: item.type });
                }
            });

            return name_title_hash;
        },
        getSubunitById: function (id) {
            return this.collection.subunits.getById(id);
        },
        addSubunit: function (subunit) {
            if (!(subunit instanceof app.Unit)) { return; }

            var subunitsIds = this.get('multiunit_subunits');
            var subunitId = subunit.getId();

            if (!_.contains(subunitsIds, subunitId)) {
                subunitsIds.push(subunitId);
                this.updateSubunitsCollection();
                this.recalculateSizes();
            }
        },
        removeSubunit: function (subunit) {
            if (!(subunit.isSubunitOf && subunit.isSubunitOf(this))) { return; }

            var subunitsIds = this.get('multiunit_subunits');
            var subunitId = subunit.getId();
            var subunitIndex = subunitsIds.indexOf(subunitId);

            if (subunitIndex !== -1) {
                subunitsIds.splice(subunitIndex, 1);
                this.removeConnector(this.getParentConnector(subunitId).id);
                this.updateSubunitsCollection();
                this.recalculateSizes();
            }
        },
        recalculateSizes: function () {  // updates multiunit width/height from subunit changes
            var subunitPositionsTree = this.getSubunitsCoordinatesTree();

            var minX = 0;
            var maxX = 0;
            var minY = 0;
            var maxY = 0;
            this.subunitsTreeForEach(subunitPositionsTree, function (node) {
                minX = Math.min(minX, node.x);
                maxX = Math.max(maxX, node.x + node.width);
                minY = Math.min(minY, node.y);
                maxY = Math.max(maxY, node.y + node.height);
            });
            var multiunitWidth = app.utils.convert.mm_to_inches(maxX - minX).toFixed(5);
            var multiunitHeight = app.utils.convert.mm_to_inches(maxY - minY).toFixed(5);
            this.set('width', multiunitWidth);
            this.set('height', multiunitHeight);

            return { width: multiunitWidth, height: multiunitHeight };
        },
        getSubunitNode: function (subunitId) {
            var subunitPositionsTree = this.getSubunitsCoordinatesTree();
            var subunitNode;
            this.subunitsTreeForEach(subunitPositionsTree, function (node) {
                if (node.unit.getId() === subunitId) {
                    subunitNode = node;
                }
            });
            
            return subunitNode;
        },
        getSubunitCoords: function (subunitId) {
            var subunitNode = this.getSubunitNode(subunitId);
            var coords;
            if (subunitNode) {
                coords = {
                    x: subunitNode.x,
                    y: subunitNode.y
                };
            }
            
            return coords;  // mm
        },
        /**
         * Subunit tree consists of nodes corresponding to subunits.
         * Each node has 3 fields:
         * unit - points to the unit model associated with this node
         * parent - points to the parent node
         * children - points to array of child nodes
         */
        getSubunitsTree: function () {
            var subunitsIds = this.getSubunitsIds();  // prepare flat array of node templates
            var nodeTemplates = subunitsIds.map(function (subunitId) {
                var unitId = subunitId;
                var parentId = self.getParentSubunitId(subunitId);
                var childrenIds = self.getChildSubunitsIds(subunitId);
                var node = {
                    unit: unitId,
                    parent: parentId,
                    children: childrenIds
                };
                return node;
            });

            var originId = this.getOriginSubunitId();  // bootstrap tree
            var originNode = nodeTemplates.filter(function (node) {
                return (node.unit === originId);
            })[0];
            originNode.unit = self.getSubunitById(originNode.unit);
            var subunitsTree = originNode;
            var processableLeafNodes = [];
            processableLeafNodes[0] = subunitsTree;

            while (processableLeafNodes.length > 0) {  // build tree by appending nodes from array
                var currentNode = processableLeafNodes.pop();
                currentNode.children.forEach(function (subunitId, childIndex) {
                    var childNode = nodeTemplates.filter(function (node) {  // append a node
                        return (node.unit === subunitId);
                    })[0];
                    currentNode.children[childIndex] = childNode;

                    childNode.unit = self.getSubunitById(subunitId);  // render node to its final form
                    childNode.parent = currentNode;

                    if (childNode.children.length > 0) {  // earmark for later processing
                        processableLeafNodes.push(childNode);
                    }
                });
            }

            return subunitsTree;
        },
        // Returns subunit tree with coordinate information at each node, in mm
        getSubunitsCoordinatesTree: function () {
            var subunitsTree = this.getSubunitsTree();
            this.subunitsTreeForEach(subunitsTree, function (node) {
                var isOrigin = self.isOriginId(node.unit.getId());

                if (isOrigin) {
                    node.width = node.unit.getInMetric('width', 'mm');
                    node.height = node.unit.getInMetric('height', 'mm');
                    node.x = 0;
                    node.y = 0;
                } else {
                    var width = node.unit.getInMetric('width', 'mm');
                    var height = node.unit.getInMetric('height', 'mm');
                    var parentX = node.parent.x;
                    var parentY = node.parent.y;
                    var parentWidth = node.parent.unit.getInMetric('width', 'mm');
                    var parentHeight = node.parent.unit.getInMetric('height', 'mm');
                    var parentConnector = self.getParentConnector(node.unit.getId());
                    var gap = parentConnector.width;
                    var side = parentConnector.side;

                    node.width = width;
                    node.height = height;

                    if (side && side === 'top') {
                        node.x = parentX;
                        node.y = parentY - gap - height;
                    } else if (side && side === 'right') {
                        node.x = parentX + parentWidth + gap;
                        node.y = parentY;
                    } else if (side && side === 'bottom') {
                        node.x = parentX;
                        node.y = parentY + parentHeight + gap;
                    } else if (side && side === 'left') {
                        node.x = parentX - gap - width;
                        node.y = parentY;
                    }
                }
            });

            return subunitsTree;
        },
        subunitsTreeForEach: function (subunitNode, func) {
            if (!subunitNode || !_.isFunction(func)) { return; }

            var children = subunitNode.children;  // start at node and apply down
            func.call(this, subunitNode);
            if (children && children.length > 0) {
                children.forEach(function (node) {  // recursive walk
                    self.subunitsTreeForEach(node, func);
                });
            }
        },
        getSubunitRelativePosition: function (subunit) {
            return this.subunits.indexOf(subunit);
        },
        getSubunitsIds: function () {
            return this.get('multiunit_subunits').slice();
        },
        getOriginSubunitId: function () {
            return this.get('multiunit_subunits')[0];
        },
        isOriginId: function (subunitId) {
            return (subunitId === this.getOriginSubunitId())
        },
        getParentSubunitId: function (subunitId) {
            if (_.isUndefined(subunitId)) { return; }
            if (this.isOriginId(subunitId)) { return; }

            var parentConnectorId = this.getParentConnector(subunitId).id;
            var parentSubunitId = this.getConnectorParentSubunitId(parentConnectorId);

            return parentSubunitId;
        },
        getChildSubunitsIds: function (subunitId) {
            if (_.isUndefined(subunitId)) { return; }

            var childConnectors = this.getChildConnectors(subunitId);
            var childSubunitsIds = childConnectors.map(function (connector) {
                return self.getConnectorChildSubunitId(connector.id);
            });

            return childSubunitsIds;
        },
        /**
         * = Conceptual connector model:
         *
         * The multiunit is a tree of subunits. Each connection is
         * parent subunit <- connector <- child subunit.
         *
         * Connector connects to parent on a side.
         * Connector adds a gap between parent and child, but may itself appear thicker than that gap.
         *
         * = Connector format:
         * {
         *     id: '<id>',                       // Multiunit-scope unique numeric ID for the connector
         *     side: '<top|right|bottom|left>',  // Attach connector to parent side
         *     connects: [                       // IDs of subunits connected
         *         '<id>',                           // Parent subunit ID
         *         '<id>'                            // Child subunit ID
         *     ],
         *     width: <number>,                  // Actual gap between connected units, mm
         *     facewidth: <number>               // How wide the connector drawing appears, mm
         *     length: <number>,                 // Connector length, mm
         * }
         *
         * = Example:
         * { id: '17', side: 'right', connects: ['123', '124'], width: 20, facewidth: 40 }
         */
        getConnectors: function () {
            var connectors = this.get('root_section').connectors.slice();

            return connectors;
        },
        getConnectorById: function (id) {
            if (_.isUndefined(id)) { return; }

            return this.getConnectors().find(function (connector) { return connector.id === id; });
        },
        getParentConnector: function (subunitId) {
            if (_.isUndefined(subunitId)) { return; }

            var parentConnector = this.getConnectors()
                .filter(function (connector) {
                    return (connector.connects[1] === subunitId);
                })[0];

            return parentConnector;
        },
        getChildConnectors: function (subunitId) {
            if (_.isUndefined(subunitId)) { return; }

            var childConnectors = this.getConnectors()
                .filter(function (connector) {
                    return (connector.connects[0] === subunitId);
                });

            return childConnectors;
        },
        getConnectorParentSubunitId: function (connectorId) {
            if (_.isUndefined(connectorId)) { return; }

            var parentSubunitId = this.getConnectorById(connectorId).connects[0];
            
            return parentSubunitId;
        },
        getConnectorChildSubunitId: function (connectorId) {
            if (_.isUndefined(connectorId)) { return; }

            var childSubunitId = this.getConnectorById(connectorId).connects[1];
            
            return childSubunitId;
        },
        addConnector: function (options) {
            if (!(options && options.connects && options.side)) { return; }

            var parentSubunit = this.getSubunitById(options.connects[0]);
            var connectors = this.get('root_section').connectors;
            var newChildSubunit;

            var highestId = connectors
                .map(function (connector) { return connector.id; })
                .reduce(function (lastHighestId, currentId) { return Math.max(currentId, lastHighestId); }, 0);

            if (!options.connects[1]) {
                newChildSubunit = new app.Unit({
                    width: parentSubunit.get('width'),
                    height: parentSubunit.get('height')
                });
                options.connects[1] = parentSubunit.collection.add(newChildSubunit).getId();
            }

            var connector = {
                id: highestId + 1,
                connects: options.connects,
                side: options.side,
                width: options.width || CONNECTOR_DEFAULTS.width,
                facewidth: options.facewidth || CONNECTOR_DEFAULTS.facewidth
            };

            connectors.push(connector);
            this.updateConnectorLength(connector);
            if (newChildSubunit) { this.addSubunit(newChildSubunit); }
            return connector;
        },
        removeConnector: function (id) {
            if (_.isUndefined(id)) { return; }

            var connectors = this.get('root_section').connectors;
            var connector;

            var connectorIndex = connectors.indexOf(this.getConnectorById(id));

            if (connectorIndex !== -1) {
                connector = connectors.splice(connectorIndex, 1)[0];
            }
            // FIXME implement
            return connector;
        },
        setConnectorProperties: function (id, options) {
            if (_.isUndefined(id)) { return; }
            if (!options || options.constructor !== Object) { return; }

            var connector = this.getConnectorById(id);

            if (connector) {
                Object.keys(options).forEach(function (key) {
                    connector[key] = options[key];
                });
            }
            // FIXME implement
            return connector;
        },
        updateConnectorLength: function (connector) {
            if (_.isUndefined(connector)) { return; }

            var parent = this.getSubunitById(connector.connects[0]);
            var child = this.getSubunitById(connector.connects[1]);
            var parentSide;
            var childSide;

            if (!(parent || child)) { return; }

            if (connector.side === 'top' || connector.side === 'bottom') {
                parentSide = parent.getInMetric('width', 'mm');
                childSide = child.getInMetric('width', 'mm');
            } else {
                parentSide = parent.getInMetric('height', 'mm');
                childSide = child.getInMetric('height', 'mm');
            }

            connector.length = Math.min(parentSide, childSide);

            return connector;
        },
        updateConnectorsLength: function () {
            var connectors = this.get('root_section').connectors;

            connectors.forEach(function (connector) {
                self.updateConnectorLength(connector);
            });
        }
    });
})();
