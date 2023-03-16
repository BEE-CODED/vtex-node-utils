// Include gulp
const gulpfile = require('gulp');
const gutil = require('gulp-util'),
    colors = gutil.colors,
    run = require('gulp-run'),
    pjson = require('./package.json');

gulpfile.task('tag:commit', function () {
    const version = pjson.version;
    console.log(colors.bgWhite.black.bold(' \nTagging the version ' + version + ' \n'));
    return run('git tag ' + version).exec();
});