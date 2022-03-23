# Vouch Plus
## Table Of Contents
- [Story](#story)
- [Features](#features)
- [Commands](#commands)
- [Setup](#setup)
- [License](#license)

## Story
I run a discord server that relies on reputation to function, and one of the main issues we faced was loosing our reputation. In the past, we would rely on a discord channel full of reputation messages from all of our customers, however this posed some challenges. We had our reputation channel deleted a few times, which meant all of our reputation we had built up was lost. We decided it was best to look into options to save our reputation. We came across a popular vouch bot that checked all the criteria we had established, so we chose them. Things were great for about 6 months, but we had some issues with the owner deleting some reputation and banning a few of our exchangers, so we again had to find an alternative. This is when I started work on this bot.

## Features
- Embedded messages
- User self-serve profile creation
- Paginated vouch lists

## Commands
`+profile` - View your own profile 

`+profile [user tag or id]` - View another user's profile 

`+profile setup` - Setup your profile 

`+rep [user tag] [message]` - Leave a positive reputation on a user's profile 

`-rep [user tag] [message]` - Leave a negative reputation on a user's profile 

`+vouches [user tag] (page number)` - View a list of a user's vouches
 
`+help` - View this message 

`+ping` - View this bot's latency

## Setup
1. Create a new `.env` file in the root folder, and fill in the parameters listed in `config.js`
2. `npm install`
3. `node server/index.js`

## License
This repository is licensed under GNU General Public License v3.0
