var gulp = require('gulp');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var child_process = require('child_process');
var runSequence = require('run-sequence');
var notifier = require('node-notifier');

gulp.task('concatJs', function () {
    return gulp.src([
        'node_modules/sweetalert2/dist/sweetalert2.js',
        'node_modules/leaflet/dist/*.js',
        'node_modules/leaflet-routing-machine/dist/*.js',
        'node_modules/leaflet-search/dist/leaflet-search.min.js',
        'app/js/*.js'
        ])
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('www'));
});

gulp.task('concatCss', function () {
    return gulp.src([
        'www/css/**/*.css',
        'node_modules/leaflet/dist/*.css',
        'node_modules/leaflet-routing-machine/dist/*.css',
        'node_modules/sweetalert2/dist/sweetalert2.css',
        'node_modules/leaflet-search/dist/leaflet-search.min.css'
    ])
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest('www'));
});

gulp.task('copyfiles', function() {
    gulp.src('node_modules/leaflet/dist/images/*.{png,svg}')
        .pipe(gulp.dest('www/images'));
});

gulp.task('sass', function () {
    return gulp.src('./app/scss/**/*.scss')
        .pipe(sass())
        .pipe(gulp.dest('./www/css'));
});

gulp.task('runios', function (done) {
    console.log('build phonegap build ios');
    child_process.execFile('phonegap', ['build', 'ios'], function () {
        console.log('done phonegap build ios');
        notifier.notify({ title: 'IOS Build', message: 'Done' });
        done();
    });
});

gulp.task('assets', function (callback) {
    runSequence('sass',
            ['concatJs', 'concatCss', 'copyfiles'],
            'runios',
    callback
    )
});

gulp.task('build', ['assets']);

gulp.task('watch', function () {
    gulp.watch('app/scss/*.scss', ['sass']);
    gulp.watch('app/js/*.js', ['concatJs']);
});
