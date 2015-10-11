module.exports = function (grunt) {
    var vendor_js_files = [
        'jquery/dist/jquery.min.js',
        'handlebars/handlebars.runtime.min.js',
        'underscore/underscore-min.js',
        'backbone/backbone-min.js'
    ];

    grunt.initConfig({
        sourceUrl: 'static/source',
        buildUrl: 'static/public',
        bowerUrl: 'bower_components',

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
                    namespace: 'Templates',
                    processName: function(filePath) {
                        return filePath.replace(/^source\/templates\//, '').replace(/\.hbs$/, '');
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
                    }
                ]
            }
        },

        uglify: {
            vendor: {
                options: {
                    mangle: false,
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

        clean: {
            build: ['<%= buildUrl %>/**'],
        },

        watch: {
            less: {
                files: ['<%= sourceUrl %>/less/*.less'],
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
                        '<%= buildUrl %>/css/styles.css',
                        '<%= buildUrl %>/css/login.css',
                        '<%= buildUrl %>/js/*.js',
                        '<%= buildUrl %>/*.html'
                        ]
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-less');
    grunt.loadNpmTasks('grunt-contrib-handlebars');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-contrib-uglify');

    grunt.registerTask('default', ['watch']);
    grunt.registerTask('build', [
        'clean:build', 'handlebars:build', 'copy:build', 'copy:vendor',
        'less:build', 'uglify:vendor'
    ]);
};
