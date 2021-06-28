# danktial
Handles racing league administration, moderation and creation.

# Setup
- [Invite this bot](https://discord.com/oauth2/authorize?client_id=790922694156877846&scope=bot&permissions=8) to your server
- Once invited, enter `-setup` to start the setup.
- Follow the prompts given to create your tiers and teams.
- Once tier setup is complete, you can add drivers to specific teams and tiers via `-setdriver`

# Commands
- danktial also has some built-in commands like `-poll`, `-attendance` and `-ticket`. Poll usage is the same as [Simple Poll](https://top.gg/bot/simplepoll).

- Once you have setup the tiers, teams and drivers, you also have the option to create and advanced attendance `-advancedattendance` which gives you a [list of drivers attending](https://prnt.sc/wlgwfo). They can mark in and out and the attendance will change according to availability of each driver.
Orange signifies unknown, Green signifies attending and Red signifies not attending.

- You can setup a ticket panel `-ticketpanel` for drivers to react and create a ticket. This is optional and you can still create a ticket via `-new` or `-ticket`
- `-newcount` will create a member count channel, channel count channel, a role count channel, or all of the above depending on the parameter given.

- `-dupetier` will duplicate an existing tier with the same teams but without its drivers. You will need to use `-setdriver` in order to set the drivers to each team in the new tier.

- `-tiers` will list you all the tiers in the league and if you give a tier name as a parameter, will list the teams and drivers of that tier.

- `-editteam` will allow you to edit a team from a particular tier, whether it be the name or the drivers in that team.

- `-setprefix` will set the prefix of the bot to your desired prefix.

- `-setmodlog` will set the mod-log of the server. Please make this channel only visible to staff members or administrators!

- `-help` if you need the list of available commands!