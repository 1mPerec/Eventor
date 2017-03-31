var gulp = require('gulp');
var concat = require('gulp-concat');
var sass = require('gulp-sass');
var child_process = require('child_process');
var runSequence = require('run-sequence');
var notifier = require('node-notifier');
var webpack = require('gulp-webpack');
const autoprefixer = require('gulp-autoprefixer');

gulp.task('concatJs', function () {
    return gulp.src([
        'node_modules/sweetalert2/dist/sweetalert2.js',
        'node_modules/leaflet/dist/*.js',
        'node_modules/leaflet-routing-machine/dist/*.js',
        'node_modules/leaflet-search/dist/leaflet-search.min.js',
        'tmp/*.js'
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
            ['autoprefix', 'concatJs', 'concatCss', 'copyfiles'],
    callback
    )
});

gulp.task("webpack", function() {
    return gulp.src(['app/js/app.js'])
      .pipe(webpack({
          watch: true,
          output: {
              filename: '[name].js'
          },
          devtool: 'source-map',
          module: {
              loaders: [
                  {
                      test: /\.js$/,
                      loader: 'babel-loader'
                  }
              ]
          }
      }))
      .pipe(gulp.dest('tmp/'))
});

gulp.task('build', ['assets']);

gulp.task('watch', function () {
    gulp.watch('app/scss/*.scss', ['sass']);
    gulp.watch('app/js/*.js', ['concatJs']);
});

gulp.task('autoprefix', () =>
    gulp.src('app/scss/main.scss')
        .pipe(autoprefixer({
            browsers: ['last 2 versions'],
            cascade: false
        }))
        .pipe(gulp.dest('app/scss'))
);