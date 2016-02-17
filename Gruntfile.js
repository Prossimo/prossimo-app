module.exports = function (grunt) {
    'use strict';

    var vendor_js_files = [
        'jquery/dist/jquery.min.js',
        'handlebars/handlebars.runtime.min.js',
        'underscore/underscore-min.js',
        'backbone/backbone-min.js',
        'backbone.marionette/lib/backbone.marionette.min.js',
        'handsontable/dist/handsontable.full.min.js',
        'bootstrap/js/dropdown.js',
        'bootstrap/js/tooltip.js',
        'bootstrap/js/popover.js',
        'bootstrap/js/modal.js',
        'bootstrap-select/dist/js/bootstrap-select.min.js',
        'konva/konva.min.js',
        'decimal.js/decimal.min.js'
    ];

    var vendor_css_files = [
        'handsontable/dist/handsontable.full.min.css',
        'bootstrap-select/dist/css/bootstrap-select.min.css'
    ];

    var js_files = [
        'backbone-extensions.js',
        'backbone-safesync.js',
        'router.js',
        'dialogs.js',
        'utils.js',
        'paste-image.js',
        'hot-renderers.js',
        'core/models/user.js',
        'core/models/session.js',
        'core/models/unit.js',
        'core/models/accessory.js',
        'core/models/profile.js',
        'core/models/project.js',
        'core/models/project-file.js',
        'core/models/filling-type.js',
        'core/models/settings.js',
        'core/collections/unit-collection.js',
        'core/collections/accessory-collection.js',
        'core/collections/profile-collection.js',
        'core/collections/project-collection.js',
        'core/collections/project-file-collection.js',
        'core/collections/filling-type-collection.js',
        'core/views/main-navigation-view.js',
        'core/views/units-table-view.js',
        'core/views/units-table-total-prices-view.js',
        'core/views/project-selector-view.js',
        'core/views/no-project-selected-view.js',
        'core/views/status-panel-view.js',
        'units-table/views/main-units-table-view.js',
        'docs-import/views/main-docs-import-view.js',
        'docs-import/views/document-selector-view.js',
        'docs-import/views/document-list-view.js',
        'drawing/views/main-drawing-view.js',
        'drawing/views/drawing-view.js',
        'drawing/views/drawing-sidebar-view.js',
        'drawing/views/drawing-glazing-view.js',
        'quote/views/main-quote-view.js',
        'quote/views/quote-item-view.js',
        'quote/views/quote-extras-item-view.js',
        'quote/views/quote-header-view.js',
        'quote/views/quote-table-view.js',
        'quote/views/quote-extras-table-view.js',
        'settings/views/main-settings-view.js',
        'settings/views/profiles-table-view.js',
        'settings/views/filling-types-table-view.js',
        'settings/views/pricing-grids-table-view.js',
        'settings/views/ui-settings-view.js',
        'supplier-request/views/main-supplier-request-view.js',
        'supplier-request/views/supplier-request-header-view.js',
        'dialogs/views/base-dialog-view.js',
        'dialogs/views/login-dialog-view.js',
        'app.js'
    ];

    var test_data_js_files = [
        'test/data/customer-images.js',
        'test/data/test-settings.js',
        'test/data/test-project.js'
    ];

    grunt.initConfig({
        sourceUrl: 'static/source',
        buildUrl: 'static/public',
        bowerUrl: 'bower_components',
        credentials: grunt.file.readJSON('credentials.json'),
        // hash: '<%= ((new Date()).valueOf().toString()) + (Math.floor((Math.random()*1000000)+1).toString()) %>',

        gitinfo: {},
        hash: '<%= gitinfo.local.branch.current.shortSHA %>',

        less: {
            dev: {
                options: {
                    modifyVars: {
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
                    processName: function(filePath) {
                        return filePath.replace(/^static\/source\/templates\//, '').replace(/\.hbs$/, '');
                    },
                    processPartialName: function(filePath) {
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
                    processName: function(filePath) {
                        return filePath.replace(/^static\/source\/templates\//, '').replace(/\.hbs$/, '');
                    },
                    processPartialName: function(filePath) {
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
            pdfjs: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= bowerUrl %>/pdfjs/build/generic/',
                        src: ['**'],
                        dest: '<%= buildUrl %>/pdfjs/',
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
                            if ( req.url === '/docs/' || req.url === '/drawing/' ||
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
            // uglify: {
            //     files: ['<%= sourceUrl %>/js/**/*.js'],
            //     tasks: ['gitinfo', 'uglify:build']
            // },
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
            }
        },

        sshexec: {
            update_staging: {
                command: 'cd /var/www/prossimo && ./update.sh staging',
                options: {
                    host: '<%= credentials.staging.host %>',
                    username: '<%= credentials.staging.username %>',
                    password: '<%= credentials.staging.password %>'
                }
            },
            update_production: {
                command: 'cd /var/www/prossimo && ./update.sh production',
                options: {
                    host: '<%= credentials.production.host %>',
                    username: '<%= credentials.production.username %>',
                    password: '<%= credentials.production.password %>'
                }
            }
        },

        eslint: {
            options: {
                configFile: '.eslintrc'
            },
            target: ['<%= sourceUrl %>/js/**/*.js']
        },

        jscs: {
            src: '<%= sourceUrl %>/js/**/*.js',
            options: {
                config: '.jscsrc',
                verbose: true,
                force: true
            }
        },

        replace: {
            //  A cheap hack to trick pdfjs building script, it comes without
            //  its own `.git` directory because it's installed via bower, so
            //  building fails being unable to find certain SHA in the git
            //  history. We just replace the SHA with our own number
            pdfjs: {
                options: {
                    patterns: [
                        {
                            match: 'hash',
                            replacement: '<%= hash %>'
                        }
                    ]
                },
                files: [
                    {
                        src: '<%= sourceUrl %>/pdfjs.config.tpl',
                        dest: '<%= bowerUrl %>/pdfjs/pdfjs.config'
                    }
                ]
            },
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
                            replacement: 'http://127.0.0.1:8000/api'
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
            all: ['test/**/*.html']
        },

        shell: {
            build_pdfjs: {
                options: {
                    execOptions: {
                        cwd: '<%= bowerUrl %>/pdfjs/'
                    }
                },
                command: [
                    'npm install',
                    'node make generic'
                ].join('&&')
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
    grunt.loadNpmTasks('grunt-ssh');
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-replace');
    grunt.loadNpmTasks('grunt-gitinfo');
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.loadNpmTasks('grunt-shell');
    grunt.loadNpmTasks('grunt-jscs');

    grunt.registerTask('pdfjs', ['gitinfo', 'replace:pdfjs', 'shell:build_pdfjs', 'copy:pdfjs']);

    //  README: pdf building is commented out due to this issue:
    //  https://bitbucket.org/prossimo/prossimo-app/issues/137
    //  This is a temporary change
    grunt.registerTask('build', [
        'gitinfo', 'clean:build', 'handlebars:build', 'copy:vendor', 'uglify:build',
        'copy:images', 'less:build', 'uglify:vendor', 'cssmin:vendor', 'replace:build'//, 'pdfjs'
    ]);

    grunt.registerTask('dev', [
        'clean:build', 'handlebars:dev', 'copy:dev', 'copy:vendor', 'copy:images',
        'less:dev', 'uglify:vendor_dev', 'cssmin:vendor_dev', 'replace:dev'//, 'pdfjs'
    ]);

    grunt.registerTask('test', ['jscs', 'eslint', 'qunit']);
    grunt.registerTask('deploy_staging', ['test', 'sshexec:update_staging']);
    grunt.registerTask('deploy_production', ['test', 'sshexec:update_production']);
    grunt.registerTask('deploy', ['deploy_staging']);
    grunt.registerTask('default', ['dev', 'connect', 'watch']);
};
