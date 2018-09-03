import program from 'commander'

/*
    1.src dest folder and ftp config
    2.task,upload origin or zip
*/

program
    .option('-c, --config <config>','choose which config to use, default config1')
    .parse(process.argv)

export default program