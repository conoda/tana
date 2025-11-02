# tana-cli

this will be the server application that spins up a tana node. it will enable all of the functionality listed below

the tana system will be modelled after the linux filesystem

if ethereum is a globally distributed state machine, tana is a globally distributed computer system

## blockchain contents

/users - user accounts
/orgs - organization accounts
/pages - single page apps, storefronts, etc
/system - global code, a sort of standard library, can be imported by contracts
/contracts - user published code that can be executed when sent a transaction, organized by user or org it's published under
/wiki - global public commons of information on various topics, weather, points of interest, historical facts, etc

## transactions

when a user or account submits a transaction to /pending, it must reference what content they are modifying.


## name resolution

there needs to be a mechanism that translates friendly name to most current CID. this will be helpful in translating:

-usernames to profile CID
-domain names to pages
