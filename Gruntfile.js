module.exports = function (grunt) {
    'use strict';

    var API_HOST = grunt.option('api_host') || '127.0.0.1';
    var API_PORT = grunt.option('api_port') || '8000';
    var API_URL = API_HOST + (API_PORT ? ':' + API_PORT : '');
    var PRINTER_HOST = grunt.option('printer_host') || '127.0.0.1';
    var PRINTER_PORT = grunt.option('printer_port') || '8080';
    var PRINTER_URL = PRINTER_HOST + (PRINTER_PORT ? ':' + PRINTER_PORT : '');

    var vendor_js_files = [
        'jquery/dist/jquery.js',
        'handlebars/handlebars.runtime.js',
        'underscore/underscore.js',
        'backbone/backbone.js',
        'backbone.radio/build/backbone.radio.js',
        'backbone.marionette/lib/backbone.marionette.js',
        'handsontable/dist/handsontable.full.js',
        'bootstrap/js/dropdown.js',
        'bootstrap/js/tooltip.js',
        'bootstrap/js/popover.js',
        'bootstrap/js/modal.js',
        'bootstrap-datepicker/dist/js/bootstrap-datepicker.js',
        'bootstrap-select/dist/js/bootstrap-select.js',
        'bootstrap-toggle/js/bootstrap-toggle.js',
        'konva/konva.js',
        'decimal.js/decimal.js',
        'Backbone.Undo.js/Backbone.Undo.js',
        'backbone.KonvaView/backbone.KonvaView.js',
        'spin.js/spin.js',
        'mousetrap/mousetrap.js',
        'backbone.marionette.keyshortcuts/backbone.marionette.keyshortcuts.js',
        'Sortable/Sortable.js',
        'Sortable/jquery.binding.js',
        'blueimp-load-image/js/load-image.all.min.js',
        'blueimp-canvas-to-blob/js/canvas-to-blob.min.js',
        'blueimp-file-upload/js/vendor/jquery.ui.widget.js',
        'blueimp-file-upload/js/jquery.iframe-transport.js',
        'blueimp-file-upload/js/jquery.fileupload.js',
        'blueimp-file-upload/js/jquery.fileupload-process.js',
        'blueimp-file-upload/js/jquery.fileupload-image.js',
        'blueimp-file-upload/js/jquery.fileupload-audio.js',
        'blueimp-file-upload/js/jquery.fileupload-video.js',
        'blueimp-file-upload/js/jquery.fileupload-validate.js'
    ];

    var vendor_css_files = [
        'handsontable/dist/handsontable.full.min.css',
        'bootstrap-select/dist/css/bootstrap-select.min.css',
        'bootstrap-toggle/css/bootstrap-toggle.min.css',
        'bootstrap-datepicker/dist/css/bootstrap-datepicker3.standalone.min.css'
    ];

    var js_files = [
        'backbone-extensions.js',
        'backbone-safesync.js',
        'router.js',
        'dialogs.js',
        'utils.js',
        'schema.js',
        'paste-image.js',
        'hot-renderers.js',
        'undomanager.js',
        //  Inlined models and collections
        'core/models/inline/pricing-grid.js',
        'core/models/inline/filling-type-to-profile.js',
        'core/models/inline/dictionary-entry-to-profile.js',
        'core/collections/inline/pricing-grid-collection.js',
        'core/collections/inline/filling-type-to-profile-collection.js',
        'core/collections/inline/dictionary-entry-to-profile-collection.js',
        //  Regular models
        'core/models/user.js',
        'core/models/session.js',
        'core/models/unit.js',
        'core/models/accessory.js',
        'core/models/profile.js',
        'core/models/project.js',
        'core/models/project-settings.js',
        'core/models/project-file.js',
        'core/models/filling-type.js',
        'core/models/options-dictionary.js',
        'core/models/options-dictionary-entry.js',
        'core/models/settings.js',
        //  Collections
        'core/collections/unit-collection.js',
        'core/collections/accessory-collection.js',
        'core/collections/profile-collection.js',
        'core/collections/project-collection.js',
        'core/collections/project-file-collection.js',
        'core/collections/filling-type-collection.js',
        'core/collections/options-dictionary-collection.js',
        'core/collections/options-dictionary-entry-collection.js',
        //  Core and Generic viws
        'core/views/base/base-toggle-view.js',
        'core/views/base/base-input-view.js',
        'core/views/base/base-select-view.js',
        'core/views/base/sidebar-list-item-view.js',
        'core/views/base/sidebar-list-view.js',
        'core/views/main-navigation-view.js',
        'core/views/units-table-view.js',
        'core/views/units-table-total-prices-view.js',
        'core/views/project-selector-view.js',
        'core/views/no-project-selected-view.js',
        'core/views/status-panel-view.js',
        'core/views/project-settings-panel-view.js',
        'core/views/spinner-view.js',
        'core/views/top-bar-view.js',
        //  Units table screen
        'units-table/views/main-units-table-view.js',
        //  Drawing module
        'drawing/module/handle-data.js',
        'drawing/module/konva-clip-patch.js',
        'drawing/module/drawing-module.js',
        'drawing/module/layer-manager.js',
        'drawing/module/unit-drawer.js',
        'drawing/module/trapezoid-unit-drawer.js',
        'drawing/module/metrics-drawer.js',
        //  Drawing screen
        'drawing/views/main-drawing-view.js',
        'drawing/views/drawing-view.js',
        'drawing/views/drawing-sidebar-view.js',
        'drawing/module/glazing-drawer.js',
        'drawing/views/drawing-glazing-view.js',
        //  Quote screen
        'quote/views/main-quote-view.js',
        'quote/views/quote-item-view.js',
        'quote/views/quote-extras-item-view.js',
        'quote/views/quote-header-view.js',
        'quote/views/quote-table-view.js',
        'quote/views/quote-extras-table-view.js',
        //  Settings screen
        'settings/views/per-profile-pricing-grids-editor-view.js',
        'settings/views/main-settings-view.js',
        'settings/views/profiles-table-view.js',
        'settings/views/pricing-grids-table-view.js',
        'settings/views/profile-connections-table-item-view.js',
        'settings/views/profile-connections-table-view.js',
        'settings/views/filling-types-view.js',
        'settings/views/filling-type-view.js',
        'settings/views/options-view.js',
        'settings/views/options-dictionary-entries-item-view.js',
        'settings/views/options-dictionary-entries-table-view.js',
        'settings/views/options-dictionary-view.js',
        //  Supplier Request screen
        'supplier-request/views/main-supplier-request-view.js',
        'supplier-request/views/supplier-request-header-view.js',
        //  Dashboard screen
        'dashboard/views/project-totals-view.js',
        'dashboard/views/project-info-view.js',
        'dashboard/views/project-documents-view.js',
        'dashboard/views/main-dashboard-view.js',
        //  Dialogs
        'dialogs/views/base-dialog-view.js',
        'dialogs/views/login-dialog-view.js',
        'dialogs/views/items-profiles-table-dialog-view.js',
        'components/file-uploader-view.js',
        'dialogs/views/create-project-dialog-view.js',
        //  App entry
        'app.js'
    ];

    var test_data_js_files = [
        'test/data/test-data-no-backend-fixtures.js'
    ];

    grunt.initConfig({
        sourceUrl: 'static/source',
        buildUrl: 'static/public',
        fontsUrl: 'static/fonts',
        bowerUrl: 'bower_components',

        gitinfo: {},
        hash: '<%= gitinfo.local.branch.current.shortSHA %>',

        less: {
            dev: {
                options: {
                    modifyVars: {
                        fontsPath: '"../../<%= fontsUrl %>"',
                        bowerPath: '"../../<%= bowerUrl %>"'
                    }
                },
                files: {
                    '<%= buildUrl %>/css/styles.dev.css': '<%= sourceUrl %>/less/styles.less',
                    '<%= buildUrl %>/css/print.dev.css': '<%= sourceUrl %>/less/print.less'
                }
            },
            build: {
                options: {
                    modifyVars: {
                        fontsPath: '"../../<%= fontsUrl %>"',
                        bowerPath: '"../../<%= bowerUrl %>"'
                    }
                },
                files: {
                    '<%= buildUrl %>/css/styles.<%= hash %>.css': '<%= sourceUrl %>/less/styles.less',
                    '<%= buildUrl %>/css/print.<%= hash %>.css': '<%= sourceUrl %>/less/print.less'
                }
            }
        },

        handlebars: {
            dev: {
                files: {
                    '<%= buildUrl %>/js/templates.dev.js': ['<%= sourceUrl %>/**/*.hbs']
                },
                options: {
                    namespace: 'app.templates',
                    partialsUseNamespace: true,
                    partialRegex: /.*/,
                    partialsPathRegex: /\/partials\//,
                    processName: function (filePath) {
                        return filePath.replace(/^static\/source\/templates\//, '').replace(/\.hbs$/, '');
                    },
                    processPartialName: function (filePath) {
                        return filePath.replace(/^static\/source\/templates\//, '').replace(/\.hbs$/, '');
                    }
                }
            },
            build: {
                files: {
                    '<%= buildUrl %>/js/templates.<%= hash %>.js': ['<%= sourceUrl %>/**/*.hbs']
                },
                options: {
                    namespace: 'app.templates',
                    partialsUseNamespace: true,
                    partialRegex: /.*/,
                    partialsPathRegex: /\/partials\//,
                    processName: function (filePath) {
                        return filePath.replace(/^static\/source\/templates\//, '').replace(/\.hbs$/, '');
                    },
                    processPartialName: function (filePath) {
                        return filePath.replace(/^static\/source\/templates\//, '').replace(/\.hbs$/, '');
                    }
                }
            }
        },

        copy: {
            dev: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= sourceUrl %>/js/',
                        src: ['**'],
                        dest: '<%= buildUrl %>/js/',
                        filter: 'isFile'
                    }
                ]
            },
            vendor: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= bowerUrl %>',
                        src: vendor_js_files,
                        dest: '<%= buildUrl %>/js/vendor/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: '<%= bowerUrl %>',
                        src: vendor_css_files,
                        dest: '<%= buildUrl %>/css/vendor/',
                        filter: 'isFile'
                    },
                    {
                        expand: true,
                        cwd: '<%= bowerUrl %>/bootstrap/fonts',
                        src: ['**'],
                        dest: '<%= buildUrl %>/fonts/',
                        filter: 'isFile'
                    }
                ]
            },
            images: {
                expand: true,
                cwd: '<%= sourceUrl %>/img/',
                src: ['**'],
                dest: '<%= buildUrl %>/img/',
                filter: 'isFile'
            }
        },

        cssmin: {
            vendor_dev: {
                files: {
                    '<%= buildUrl %>/css/vendor.dev.min.css':
                        vendor_css_files.map(function (component) {
                            return '<%= bowerUrl %>/' + component;
                        })
                }
            },
            vendor: {
                files: {
                    '<%= buildUrl %>/css/vendor.<%= hash %>.min.css':
                        vendor_css_files.map(function (component) {
                            return '<%= bowerUrl %>/' + component;
                        })
                }
            }
        },

        uglify: {
            vendor_dev: {
                options: {
                    mangle: false,
                    compress: false,
                    banner: '/*! Full list of vendor libraries: \n' +
                    vendor_js_files.map(function (component) {
                        return '<%= buildUrl %>/js/vendor/' + component;
                    }).join('\n') + '*/\n'
                },
                files: {
                    '<%= buildUrl %>/js/vendor.dev.min.js':
                        vendor_js_files.map(function (component) {
                            return '<%= bowerUrl %>/' + component;
                        })
                }
            },
            vendor: {
                options: {
                    mangle: false,
                    compress: false,
                    banner: '/*! Full list of vendor libraries: \n' +
                    vendor_js_files.map(function (component) {
                        return '<%= buildUrl %>/js/vendor/' + component;
                    }).join('\n') + '*/\n'
                },
                files: {
                    '<%= buildUrl %>/js/vendor.<%= hash %>.min.js':
                        vendor_js_files.map(function (component) {
                            return '<%= bowerUrl %>/' + component;
                        })
                }
            },
            build: {
                options: {
                    screwIE8: true
                },
                files: {
                    '<%= buildUrl %>/js/application.<%= hash %>.min.js':
                        js_files.map(function (component) {
                            return '<%= sourceUrl %>/js/' + component;
                        })
                }
            }
        },

        connect: {
            server: {
                options: {
                    port: 9987,
                    base: '.',
                    middleware: function (connect, options, middlewares) {
                        middlewares.unshift(function (req, res, next) {
                            res.setHeader('Access-Control-Allow-Origin', '*');

                            if ( req.url === '/dashboard/' || req.url === '/drawing/' ||
                                req.url === '/quote/' || req.url === '/settings/' ||
                                req.url === '/supplier/' || req.url === '/units/'
                            ) {
                                require('fs').createReadStream('index.html').pipe(res);
                            } else {
                                return next();
                            }
                        });

                        return middlewares;
                    }
                }
            }
        },

        clean: {
            build: ['<%= buildUrl %>/**']
        },

        watch: {
            replace: {
                files: ['<%= sourceUrl %>/*.tpl'],
                tasks: ['gitinfo', 'replace:dev']
            },
            less: {
                files: ['<%= sourceUrl %>/less/**/*.less'],
                tasks: ['gitinfo', 'less:dev']
            },
            copy: {
                files: ['<%= sourceUrl %>/js/**/*.js'],
                tasks: ['copy:dev']
            },
            handlebars: {
                files: ['<%= sourceUrl %>/templates/**/*.hbs'],
                tasks: ['handlebars:dev']
            },
            livereload: {
                options: { livereload: true },
                files: [
                    '<%= buildUrl %>/css/*.css',
                    '<%= buildUrl %>/js/**/*.js',
                    '*.html'
                ]
            },
            qunit: {
                files: ['test/*.js', 'test/*.html'],
                tasks: ['qunit:basic']
            }
        },

        eslint: {
            options: {
                configFile: '.eslintrc'
            },
            target: ['<%= sourceUrl %>/js/**/*.js']
        },

        replace: {
            dev: {
                options: {
                    patterns: [
                        {
                            match: 'hash',
                            replacement: 'dev'
                        },
                        {
                            match: 'scripts',
                            replacement: js_files.map(function (component) {
                                return '<script src="/' + '<%= buildUrl %>/js/' + component + '"></script>';
                            }).join('\n    ') + '\n    ' + test_data_js_files.map(function (test_component) {
                                return '<script src="/' + test_component + '"></script>';
                            }).join('\n    ')
                        },
                        {
                            match: 'api_base_path',
                            replacement: 'http://' + API_URL + '/api'
                        },
                        {
                            match: 'pdf_api_base_path',
                            replacement: 'http://' + PRINTER_URL + '/print'
                        },
                        {
                            match: 'favicon',
                            replacement: 'favicon-dev.png'
                        }
                    ]
                },
                files: [
                    {
                        src: '<%= sourceUrl %>/index.html.tpl',
                        dest: './index.html'
                    }
                ]
            },
            build: {
                options: {
                    patterns: [
                        {
                            match: 'hash',
                            replacement: '<%= hash %>'
                        },
                        {
                            match: 'scripts',
                            replacement: '<script src="/static/public/js/application.<%= hash %>.min.js"></script>'
                        },
                        {
                            match: 'api_base_path',
                            replacement: '/api/api'
                        },
                        {
                            match: 'pdf_api_base_path',
                            replacement: '/print'
                        },
                        {
                            match: 'favicon',
                            replacement: 'favicon.png'
                        }
                    ]
                },
                files: [
                    {
                        src: '<%= sourceUrl %>/index.html.tpl',
                        dest: './index.html'
                    }
                ]
            }
        },

        qunit: {
            basic: ['test/*.html'],
            visual: ['test/visual-test-runner/test-visual.html']
        },

        shell: {
            deploy_staging: {
                options: {
                    execOptions: {
                        cwd: '../prossimo-deployment/'
                    }
                },
                command: 'ansible-playbook --private-key=files/id_rsa_root --inventory-file=hosts deploy.yml -e env=staging'
            },
            deploy_production: {
                options: {
                    execOptions: {
                        cwd: '../prossimo-deployment/'
                    }
                },
                command: 'ansible-playbook --private-key=files/id_rsa_root --inventory-file=hosts deploy.yml -e env=production'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-handlebars');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-connect');
    grunt.loadNpmTasks('grunt-contrib-cssmin');
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-gitinfo');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-shell');

    grunt.registerTask('build', [
        'gitinfo', 'clean:build', 'handlebars:build', 'copy:vendor', 'uglify:build',
        'copy:images', 'less:build', 'uglify:vendor', 'cssmin:vendor', 'replace:build'
    ]);

    grunt.registerTask('dev', [
        'clean:build', 'handlebars:dev', 'copy:dev', 'copy:vendor', 'copy:images',
        'less:dev', 'uglify:vendor_dev', 'cssmin:vendor_dev', 'replace:dev'
    ]);

    grunt.registerTask('test', ['eslint', 'qunit:basic']);
    grunt.registerTask('test_visual', ['qunit:visual']);
    grunt.registerTask('test_all', ['test', 'test_visual']);

    grunt.registerTask('deploy_staging', ['test', 'shell:deploy_staging']);
    grunt.registerTask('deploy_production', ['test', 'shell:deploy_production']);
    grunt.registerTask('deploy', ['deploy_staging']);
    grunt.registerTask('default', ['dev', 'connect', 'watch']);
};
