module.exports = function (grunt) {
    var vendor_js_files = [
        'jquery/dist/jquery.min.js',
        'handlebars/handlebars.runtime.min.js',
        'underscore/underscore-min.js',
        'backbone/backbone-min.js',
        'backbone.marionette/lib/backbone.marionette.min.js',
        'handsontable/dist/handsontable.full.min.js',
        'bootstrap/js/dropdown.js',
        'bootstrap-select/dist/js/bootstrap-select.min.js',
        'konva/konva.min.js'
    ];

    var vendor_css_files = [
        'handsontable/dist/handsontable.full.min.css',
        'bootstrap-select/dist/css/bootstrap-select.min.css'
    ];

    grunt.initConfig({
        sourceUrl: 'static/source',
        buildUrl: 'static/public',
        bowerUrl: 'bower_components',
        credentials: grunt.file.readJSON('credentials.json'),

        less: {
            build: {
                options: {
                    modifyVars: {
                        bowerPath: '"../../<%= bowerUrl %>"'
                    }
                },
                files: {
                    '<%= buildUrl %>/css/styles.css': '<%= sourceUrl %>/less/styles.less',
                }
            }
        },

        handlebars: {
            build: {
                files: {
                    '<%= buildUrl %>/js/templates.js': ['<%= sourceUrl %>/**/*.hbs']
                },
                options: {
                    namespace: 'app.templates',
                    processName: function(filePath) {
                        return filePath.replace(/^static\/source\/templates\//, '').replace(/\.hbs$/, '');
                    }
                }
            }
        },

        copy: {
            build: {
                files: [
                    {
                        expand: true,
                        cwd: '<%= sourceUrl %>/js/',
                        src: ['**'],
                        dest: '<%= buildUrl %>/js/',
                        filter: 'isFile',
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
                        cwd: '<%= bowerUrl %>/pdfjs/',
                        src: ['**', '!**/docs/**', '!**/test/**'],
                        dest: '<%= buildUrl %>/pdfjs/',
                        filter: 'isFile'
                    }
                ]
            }
        },

        cssmin: {
            vendor: {
                files: {
                    '<%= buildUrl %>/css/vendor.min.css':
                        vendor_css_files.map(function (component) {
                            return '<%= bowerUrl %>/' + component;
                        })
                }
            }
        },

        uglify: {
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
                    '<%= buildUrl %>/js/vendor.min.js':
                        vendor_js_files.map(function (component) {
                            return '<%= bowerUrl %>/' + component;
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
                            if ( req.url === '/docs/' || req.url === '/drawing/' || req.url === '/quote/' ) {
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
            build: ['<%= buildUrl %>/**'],
        },

        watch: {
            less: {
                files: ['<%= sourceUrl %>/less/**/*.less'],
                tasks: ['less:build']
            },
            copy: {
                files: [
                        '<%= sourceUrl %>/js/**/*.js'
                ],
                tasks: ['copy:build']
            },
            handlebars: {
                files: ['<%= sourceUrl %>/templates/**/*.hbs'],
                tasks: ['handlebars:build']
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
            update: {
                command: 'cd /var/www/prossimo && ./update.sh',
                options: {
                    host: '<%= credentials.host %>',
                    username: '<%= credentials.username %>',
                    password: '<%= credentials.password %>'
                }
            }
        },

        eslint: {
            options: {
                configFile: '.eslintrc'
            },
            target: ['<%= sourceUrl %>/js/**/*.js']
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

    grunt.registerTask('build', [
        'clean:build', 'handlebars:build', 'copy:build', 'copy:vendor',
        'copy:pdfjs', 'less:build', 'uglify:vendor', 'cssmin:vendor'
    ]);
    grunt.registerTask('test', ['eslint']);
    grunt.registerTask('deploy', ['test', 'sshexec:update']);
    grunt.registerTask('default', ['build', 'connect', 'watch']);
};
