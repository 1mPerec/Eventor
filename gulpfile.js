var gulp = require('gulp');
var concat = require('gulp-concat');
var sass = require('gulp-sass');

gulp.task('concatJs', function () {
    return gulp.src([
        'node_modules/sweetalert2/dist/sweetalert2.js',
        'node_modules/leaflet/dist/*.js',
        'node_modules/leaflet-routing-machine/dist/*.js',
        'app/js/*.js'
        ])
        .pipe(concat('bundle.js'))
        .pipe(gulp.dest('www'));
});

gulp.task('concatCss', function () {
    return gulp.src([
        'node_modules/leaflet/dist/*.css',
        'node_modules/leaflet-routing-machine/dist/*.css',
        'node_modules/sweetalert2/dist/sweetalert2.css'
    ])
        .pipe(concat('bundle.css'))
        .pipe(gulp.dest('www'));
});

gulp.task('copyfiles', function() {
    gulp.src('node_modules/leaflet/dist/images/*.{png,svg}')
        .pipe(gulp.dest('www/images'));
});

gulp.task('sass', function () {
    gulp.src('./scss/*.scss')
        .pipe(sass('main.css'))
        .pipe(gulp.dest('www/css'));
});

gulp.task('watch', function () {
    gulp.watch('scss/**/*.scss', ['sass']);
    gulp.watch('app/js/*.js', ['concatJs']);
});
