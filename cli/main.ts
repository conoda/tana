#!/usr/bin/env bun
import { Command } from 'commander'
import * as core from './core/index'

const program = new Command()

program
    .name('tana')
    .version('0.1.0')
    .description('https://tana.network')
  
program
    .command('new')
    .description('create a new blockchain')
    .action(async () => {
        await core.init()
    })

program
    .command('status')
    .description('info on blockchain')
    .action(async () => {
        await core.status()
    })

program
    .command('check')
    .description('validate host system')
    .action(async () => {
        await core.check()
    })

program
    .command('peers')
    .description('list current peers')
    .action(async () => {
        await core.check()
    })

// program
//     .command('get')
//     .description('fetch a remote config')
//     .action(async () => {
//         console.log('get')
//     })

// program
//     .command('login')
//     .description('authenticate with fromafri.ca')
//     .action(async () => {
//         await core.login()
//     })

program.parse()