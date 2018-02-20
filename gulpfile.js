// Gulpfile
const gulp = require('gulp'); 
const minify = require('gulp-minify');
const size = require('gulp-filesize');
const filenames = require("gulp-filenames");
const path = require('path');
const foreach = require('gulp-foreach');
const through = require('through2');
const imageop = require('gulp-image');
const clean = require('gulp-clean');
const concat = require('gulp-concat');
const chalk = require('chalk');
gulp.task('compress', function() {
  let filePath,folderSparator = "\\",increaseVersion = 0;
  const filesIndex = process.argv.indexOf("--files");
  const pathIndex = process.argv.indexOf("--path");
  if(!process.platform === "win32")
    folderSparator = "/";
  let jsFiles = [];
  if(filesIndex > -1) {
     jsFiles = process.argv[filesIndex + 1].split(',');
     if(!jsFiles.length) {
        console.log(chalk.bold.rgb(216, 19, 45)("Provided file(s) doesn't exist"));
     }
  }
  else
    console.log(chalk.bold.rgb(216, 19, 45)("Please Enter file(s) Name. Hint: --files <list of files separated by comma.>"));
   if(pathIndex > -1) {
      rootPath = process.argv[pathIndex + 1];
   }
  if(process.argv.indexOf("--increase") > -1 && jsFiles.length == 1)
     increaseVersion = 1;
  let filesPartList = [];
  jsFiles.forEach((fileName) => {
      filePath = fileName.split('/');
      fileName =  filePath.pop();
      filePath = filePath.join(folderSparator);
      filePath = (filePath.length ? filePath+=folderSparator:"");
      filesPartList[fileName] =filePath;
    new Promise(function(resolve, reject) {
      gulp.src(`${rootPath}${folderSparator}${filesPartList[fileName]}${fileName}-*.js`).pipe(require('gulp-filelist')('temp.json', { removeExtensions: true },{flatten: true}))
      .on('error', reject).pipe(gulp.dest('temp')).on('end', resolve);
    }).then(function () {
      const fs = require('fs');
      let latestVersion = JSON.parse(fs.readFileSync('temp/temp.json')).toString();
      latestVersion  = Math.max.apply(null, latestVersion.match(/\d+/g));
      gulp.src(`${rootPath}${folderSparator}${filesPartList[fileName]}${fileName}-0${latestVersion}.js`).pipe(size());
      gulp.src(`${rootPath}${folderSparator}${filesPartList[fileName]}${fileName}-0${latestVersion}.js`).pipe(minify({
          ext:{
              min: (increaseVersion ? [`${fileName}-0${latestVersion}.js`, `${fileName}-0${latestVersion+1}.min.js`] : '.min.js')
          },
          ignoreFiles: ['.min.js'],
          noSource: true
      })).pipe(gulp.dest(`${rootPath}${folderSparator}${filesPartList[fileName]}`)).on('error',function() {gulp.src(`${rootPath}${folderSparator}${filesPartList[fileName]}${fileName}-0${(latestVersion + increaseVersion)}.min.js`).pipe(size())});
    }).catch(function(err) {console.log(err)});
  });
});

gulp.task('copy', function() {
  gulp.src('index.html')
  .pipe(gulp.dest('assets'))
});

gulp.task('getpath', function() {
  const s = size();
  gulp.src(["images/**/*.jpg", "images/**/*.png", "images/**/*.gif"].concat([]))
  .pipe(size());
});

gulp.task('optimizepng', function() {
    let path = "./all";
    if(process.argv.indexOf("--folder")> -1) {
      path = process.argv[process.argv.indexOf("--folder") +1];
    }
    gulp.src([path+"/**/*.png","!"+"+path+"+"/**/*-logo-*.png"]).pipe(imageop({
      pngquant: true,
      optipng: false,
      zopflipng: false,
      jpegRecompress: false,
      jpegoptim: false,
      mozjpeg: false,
      guetzli: false,
      gifsicle: false,
      svgo: false,
      concurrent: 10
    })).pipe(gulp.dest("./public/"));
});

gulp.task('optimizejpg', function() {
    let path = "./all";
    if(process.argv.indexOf("--folder")> -1) {
      path = process.argv[process.argv.indexOf("--folder") +1];
    }
    gulp.src([path+"/**/*.jpg",path+"/**/*.jpeg"]).pipe(imageop({
      pngquant: false,
      optipng: false,
      zopflipng: false,
      jpegRecompress: false,
      jpegoptim: true,
      mozjpeg: false,
      guetzli: false,
      gifsicle: false,
      svgo: false,
      concurrent: 10
    })).pipe(gulp.dest("./public/"));
});

gulp.task('rminactive', function() {
    return gulp.src('test/**', {read: false}).pipe(clean());
});
gulp.task('bundleall', function() {
    let latestVersion;
    new Promise(function(resolve, reject) {
      gulp.src('./dist/scorecard-create-*.js').pipe(require('gulp-filelist')('temp.json', { removeExtensions: true },{flatten: true}))
      .on('error', reject).pipe(gulp.dest('temp')).on('end', resolve);
    }).then(function () {
      const fs = require('fs');
      let v = "0";
      latestVersion = JSON.parse(fs.readFileSync('temp/temp.json')).toString();
      latestVersion  = Math.max.apply("1", latestVersion.match(/\d+/g));
      if(isFinite(latestVersion))
      v = `0${latestVersion}`;
      if(process.argv.indexOf("--increase")> -1) {
        v = `0${latestVersion + 1 }`;
      }
      let fileName = 'scorecard-create-';
      if(process.argv.indexOf("--fileName")> -1) {
        fileName = process.argv[process.argv.indexOf("--fileName") + 1]
      }
      return gulp.src(['./url_search_params.js', './dist/inline.bundle.js', './dist/polyfills.bundle.js','./dist/vendor.bundle.js', './dist/main.bundle.js'])
      .pipe(concat(`${fileName}${v}.js`))
      .pipe(gulp.dest('./dist/'));
    }).catch(function(err) {console.log(err)});
    
    
});
