module.exports = function (grunt) {
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concat: {
            options: {
                separator: '\n'
            },
            dist: {
                src: [
                    'src/vintjs.js',
                    'src/location.js',
                    'src/route.js',
                    'src/template.js'
                ],
                dest: 'Vintjs.js'
            }
        },
        uglify: {
            build: {
                options: { livereload: true },
                src: 'Vintjs.js',
                dest: 'Vintjs.min.js'
            }
        },
        watch: {
            src: {
                files: ['src/*.js', 'src/*/*.js'],
                tasks: ['development']
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-watch');

    grunt.registerTask('default', ['concat', 'uglify', 'watch']);
    grunt.registerTask('development', ['concat', 'watch']);

};