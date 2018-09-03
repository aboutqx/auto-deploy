import gulp from 'gulp'
import fs from 'fs'
import git from 'gulp-git'
import ftp from 'vinyl-ftp'
import * as configs from './config'
import program from './option'
import path from 'path'
import zip from 'gulp-zip'
import del from 'del'

let uploads = []
let config

if (program.config) {
    config = configs[program.config]
} else {
    config = configs['config1']
}
console.log(`use config: ${program.config}`)
const cwd = config.src

gulp.task('deploy', ['status'], function () {

    const conn = ftp.create({
        host: config.ftpOption.host,
        user: config.ftpOption.user,
        password: config.ftpOption.password,
        parallel: 10,
        log: true
    });

    if(config.zip) {
        let globs = [config.src + '/**/*']
        return gulp.src(globs,{
            base: path.join(config.src, '../')
        })
            .pipe(zip(config.zip))
            .pipe(gulp.dest(config.src))
            .pipe(conn.dest(config.dest))

    }

    //{dirPath, fileName},every dirpath stream once
    let dirObj = [] 

    uploads.map((v) => {
        let arr = v.split('/')
        let fileName = arr.pop()
        let dirPath = arr.join('/')
        let i = has(dirObj, 'dirPath', dirPath)
        if(i !== -1) {
            dirObj[i].fileName.push(fileName)
        } else {
            dirObj.push({ dirPath, 'fileName': [fileName] })
        }
    }) 
    console.log(dirObj)

    // turn off buffering in gulp.src for best performance
    dirObj.map((v) =>{
        let globs = v.fileName
        let cCwd = path.join(cwd, v.dirPath)
        let dest = path.join(config.dest, v.dirPath)

        gulp.src(globs, {
                buffer: false,
                log: true,
                cwd: cCwd
            })
            .pipe(conn.dest(dest))
    })
    

})

gulp.task('status', function () {

    return new Promise((resolve, reject) => {
        git.exec({
            args: 'show --name-status',
            cwd,
            log: false
        }, function (err, stdout) {
            if (err) throw err;
            getChanged(stdout)
            resolve()
        })
    })
})


gulp.task('default', ['deploy'], () => {
    if(!config.zip) return
    del([path.join(config.src, config.zip)], {
        'force': true 
    })
})


function getChanged(str) {
    const reg = /[A|M]\t.+/g
    let result = str.match(reg)

    result.map((v) => {
        uploads.push(v.split('\t')[1])
        console.log(v)
    })
    uploads = uploads.filter((v) => {
        if (!v.includes('panorama/src')) return true
    })
    
    let date = str.match(/Date:(.+)/)[1]
    console.log(`修改时间:${date}`)
}

function has(arr, key, value) { // array child object has key-value
    if (!arr || !arr.length) return -1
    for (let i = 0; i < arr.length; i++) {
        if (arr[i][key] === value) return i
    }
    return -1
}