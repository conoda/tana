import { createSpinner } from 'nanospinner'
// import { check_existing } from '@/utils/check_existing'
// import { create_directory } from '@/utils/create_directory'
// import { create_file } from '@/utils/create_file'

export async function init() { // can't use "new" as it's a reserved word
    const spinner = createSpinner('task: create .gild folder').start();

    // // check for existing folder
    // const { exitCode: gf_exitCode } = await check_existing(process.platform, '.gild')

    // if (gf_exitCode === 0) {
    //     spinner.error()
    //     console.log('\nfolder already exists in current directory')
    //     process.exit(1)
    // }

    // // create directory
    // const { exitCode: gd_exitCode } = await create_directory('.gild')

    // if (gd_exitCode !== 0) {
    //     spinner.error()
    //     console.log('\nerror creating new folder')
    //     process.exit(1)
    // }

    // // create configuration file
    // const { exitCode: gcf_exitCode } = await create_file('.gild', 'infra.toml', 'toml')

    // if (gcf_exitCode !== 0) {
    //     spinner.error()
    //     console.log('\nerror creating configuration file')
    //     process.exit(1)
    // }

    spinner.success()
    process.exit(0)
}