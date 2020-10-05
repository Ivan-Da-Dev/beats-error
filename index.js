const botconfig = require("./botconfig.json")
const key = botconfig.default

const Discord = require("discord.js")
const fetch = require("node-superfetch")
const moment = require("moment")
const ytdl = require("ytdl-core")
const prettyMilliseconds = require('pretty-ms');
const YouTube = require('simple-youtube-api');
const youtube = new YouTube(key);
const moodSet = new Set()

const adding = new Set();
const queue = new Map()
let loopNum = new Map()
let recents = new Set();
let recent = new Discord.Collection();
const client = new Discord.Client()
const gold = "#FFD700"

const PREFIX = "-"

client.on("guildCreate", guild => {
  client.guilds.cache.get("758454783979159574").channels.cache.get("761086887678181386")
  .send(`**${guild.owner.user.tag}** just invited me to **${guild.name}** that has a total of **${guild.members.cache.size}** members!`)
})

client.on("voiceStateUpdate", (oldState,newState) => {
if(oldState.channelID !== oldState.channelID) return;
const serverQueue = queue.get(newState.guild.id)
if(!serverQueue) return;

if(oldState.member.id === client.user.id && oldState.channel && !newState.channel && queue.get(oldState.guild.id)) return queue.delete(oldState.guild.id)

if(newState.member.id === client.user.id){
  if(!serverQueue.textChannel.permissionsFor(newState.guild.me).has(["SEND_MESSAGES"])) return;

  if(newState.serverMute === true) return serverQueue.textChannel.send("**NOTE** I can't speak in the channel").catch(err => { if(err) return serverQueue.textChannel.send(errorEmbed).then(console.log(err)) })
}

if(oldState.member.id !== client.user.id && oldState.channel && !newState.channel && queue.get(oldState.guild.id) && oldState.channel.members.filter(member => !member.user.bot).size < 1){
  queue.delete(oldState.guild.id)
  oldState.channel.leave()
}

if(queue.get(newState.guild.id)){
  if(oldState.member.user.id === queue.get(newState.guild.id).lockId){
    queue.get(newState.guild.id).lockId = null
    queue.get(newState.guild.id).lock = false
  }
}
})

client.on("guildDelete", guild => {
  if(queue.get(guild.id)) return queue.delete(guild.id)
})

client.on('ready', function() {
  client.user.setPresence({
    activity: {
      name: `-help | ${client.users.cache.filter(user => !user.bot).size} Users | ${client.guilds.cache.size} Servers`,
      type: "LISTENING"
    },
    status: "idle"
  })
console.log("Logged in")

setInterval(() => {
  client.user.setPresence({
    activity: {
      name: `-help | ${client.users.cache.filter(user => !user.bot).size} Users | ${client.guilds.cache.size} Servers`,
      type: "LISTENING"
    },
    status: "idle"
  })
}, 600000);
})

client.on("message", async message => {
if(!message.guild) return;
let args = message.content.substring(PREFIX.length).split(/ +/);
const command = args[0].toLowerCase()

if(message.mentions.users.first() && !args[1]){
  if(message.mentions.users.first().id !== "724289228686753844") return;

  if(!message.channel.permissionsFor(message.guild.me).has(["SEND_MESSAGES"])) return message.author.send("Hey! I'm missing `send messages` permission.Please contact someone to give me those permission").catch(err => { if(err) return; })

  message.channel.send(`My prefix is **${PREFIX}**`)
}

if(!message.content.startsWith(PREFIX)) return;
if(message.author.bot) return;

if(!message.channel.permissionsFor(message.guild.me).has(["SEND_MESSAGES"])) return message.author.send("Hey! I'm missing `send messages` permission.Please contact someone to give me those permission").catch(err => { if(err) return; })

if(args[1]) commandFirstArgs = args[1].toLowerCase()

const errorEmbed = new Discord.MessageEmbed()
.setDescription(`**OOPS** Looks like a error occured with the **${args[0]}** command.Please report it at our [support server](https://discord.gg/Gwj92qA)`)
.setColor(gold)

function send(input){
  message.channel.send(input).catch(err => { if(err) return message.channel.send(errorEmbed).then(console.log(err)) })
}

if(command === "help"){
  const helpEmbed = new Discord.MessageEmbed()
  .setDescription(`\`||\` Means **or**\n\`<>\` Bracket means **optional data**\nNeed more help? Join my [Support Server](https://discord.gg/3D6d8cT)` +
  "\n```css\n" +
  "-about       || -ab    -donate    || -dn\n"+
  "-play        || -p     -queueinfo || -qi\n" +
  "-skip        || -s     -manual    || -m\n" +
  "-stop        || -st\n" +
  "-pause       || -pa\n" +
  "-resume      || -re\n" +
  "-queue       || -q\n" +
  "-remove      || -r\n" +
  "-nowplaying  || -np\n" +
  "-info        || -i\n" +
  "-lyrics      || -l\n" +
  "-lock        || -lk\n" +
  "-volume      || -vol\n" +
  "-loop        || -lo\n" +
  "-shuffle     || -sh\n" +
  "-queueloop   || -ql\n" +
  "-queuesearch || -qs\n" +
  "\n```")
  .setFooter("Type -help <command name> to get further help")
  .setColor(gold)

  if(!args[1]) return send(helpEmbed)

  if(args[1]){

    function sendMoreInfo(title,description,require,name){
      const help = new Discord.MessageEmbed()
      .setTitle(title)
      .setDescription(`${description}\n**Requires:**\`\`\`css\n${require}\`\`\`\nNeed more help? Join my [Support Server](https://discord.gg/3D6d8cT)`)
      .setFooter(
        "||  Means or\n" +
        "<>  Bracket means optional data"
        )
      .setColor(gold)

      const reg = name
      if(reg.test(message.content.slice("-help ".length)) === true) return send(help)
    }
    sendMoreInfo("-about || -ab","Shows information about the bot","nothing",/^-?ab(out)?$/)
    sendMoreInfo("-play || -p","Plays the given song or url","<Song Name> || <Song url> || <Song playlist url>",/^-?p(lay)?$/)
    sendMoreInfo("-skip || -s","Skips the current playing song","A song must be playing",/^-?s(kip)?$/)
    sendMoreInfo("-stop || -st","Stops playing the song and clears the queue then leaves the channel","One or more songs in the queue",/^-?st(op)?$/)
    sendMoreInfo("-pause || -pa","Pauses the current playing song","A song must be playing",/^-?pa(use)?$/)
    sendMoreInfo("-resume || -re","Resumes the paused song","A song must be paused",/^-?re(sume)?$/)
    sendMoreInfo("-queue || -q","Shows all the song in the queue","One or more songs must be in the queue",/^-?q(ueue)?$/)
    sendMoreInfo("-remove || -r","Removes a song fro the queue","The index number / position number of the song",/^-?r(emove)?$/)
    sendMoreInfo("-nowplaying || -np","Shows how long the current song has been played","A song must be playing",/^-?(np|nowplaying)$/)
    sendMoreInfo("-info || -i","Shows the information about the current playing song","A song must be playing",/^-?i(nfo)?$/)
    sendMoreInfo("-lyrics || -l","Shows the lyrics of the current playing song or searched song","current playing song || <search term>",/^-?l(yrics)?$/)
    sendMoreInfo("-lock || -lk","Locks the current queue","Only one user can be in the voice channel || The user must have Administrator || Manage Messages permission",/^-?(lk|lock)$/)
    sendMoreInfo("-volume || -vol","Increases || decreases the current volume","A song must be playing",/^-?vol(ume)?$/)
    sendMoreInfo("-loop || -lo","Loops the current playing song","Only one user can be in the voice channel || The user must have Administrator || Manage Messages permission\nA song must be playing",/^-?lo(op)?$/)
    sendMoreInfo("-shuffle || -sh","Shuffles the current queue","One or more songs must be in the queue\n#It won't stop you from using the shuffle command even if theres only one song in the queue but there will be no difference",/^-?sh(uffle)?$/)
    sendMoreInfo("-queueloop || -ql","Loops all the songs in the queue","One or more songs must be playing",/^-?(ql|queueloop)$/)
    sendMoreInfo("-queuesearch || -qs","Searches a song in the queue","The searched song must be in the queue\n#Note: You don't need to type the whole song title",/^-?(qs|queuesearch)$/)
    sendMoreInfo("-donate || -dn","Shows info about donations","none",/^-?(dn|donate)$/)
    sendMoreInfo("-queueinfo || -qi","Shows you all the information about the current queue","A current queue must be avaiable",/^-?(qi|queueinfo)$/)
    sendMoreInfo("-manual || -m","Shows the manual","none",/^-?(m|manual)$/)
  }
}

function sendErrorEmbed(input){

  message.channel.send("<:redX:760038173932912650>" + input).catch(err => { if(err) return message.channel.send(errorEmbed).then(console.log(err)) })
}

function sendSuccessEmbed(input){

  message.channel.send("<:greenCheck:760038190655471637>" + input).catch(err => { if(err) return message.channel.send(errorEmbed).then(console.log(err)) })
}

function sendActivityEmbed(input){

  message.channel.send("▶️ " + input).catch(err => { if(err) return message.channel.send(errorEmbed).then(console.log(err)) })
}

const serverQueue = queue.get(message.guild.id);

if(command === "about" || command === "ab"){
  const about = new Discord.MessageEmbed()
  .setColor(gold)
  .setDescription(`**${client.user.username}** is a music bot.Its very simple to use and comes with alot of unique commands.Its 100% free so why don't invite it? So just sit back and chill while we provide you with our finest service`+
  "```css\n"+
  `Servers          || ${client.guilds.cache.size} \n`+
  `Humans           || ${client.users.cache.filter(user => !user.bot).size}\n`+
  `Bots             || ${client.users.cache.filter(user => user.bot).size}\n`+
  `Users            || ${client.users.cache.size}\n`+
  `Uptime (Minutes) || ${~~(client.uptime / 1000 / 60)}`+
  "```\n"+
  "Need help? Why don't join my [Support Server?](https://discord.gg/3D6d8cT)\n"+
  "[Invite me](https://discord.com/oauth2/authorize?client_id=724289228686753844&scope=bot&permissions=37080384) to your server!")
  send(about)
}

if(command === "manual" || command === "m"){
  const manual = new Discord.MessageEmbed()
  .setDescription("Things you know when using the bot")
  .addField("Symbol meanings",
  "There are 3 symbols that you may have seen:\n"+
  "`||` `<>` `?`\n"+
  "`||` Means **or** for example: apples **||** orange = apples **or** orange\n"+
  "`<>` Means you need to give it a optional data for example: **<number>** means you need to give it a **number**\n"+
  "`?` Means you eihter need to give it a **true** or **false** or it would return **true** or **false**")
  .addField("Playing songs",
  "When playing a song,you either need to provide a **youtube** song title or a song / playlist url.If the url given is a youtube playlist,it will need a few minutes for it to load the song(s) in the playlist depending on the quantity of the songs in the playlist")
  .addField("Cooldowns",
  "If you used a **stop** command,you need to wait 10 seconds before requesting songs again,this prevents a user from spamming the queue and youtube api")
  .setColor(gold)
  send(manual)
}

if(command === "play" || command === "p" || command === "stop" || command === 'st') {
  if(adding.has(message.author.id)) return sendErrorEmbed("**Please wait for your songs to be fully loaded before making requests**")

  if(command === 'stop' || command === "st"){
    if(adding.has(message.author.id)) return sendErrorEmbed("**You can't stop us from adding songs**")
    let serverQueue = queue.get(message.guild.id)
    if(!message.member.voice.channel) return sendErrorEmbed("**You need to be in a voice channel**")
    if(message.guild.me.voice.channel){
      if(message.guild.me.voice.channel.id !== message.member.voice.channel.id) return sendErrorEmbed('**You need to be in the same vc as me**')
    }

    if(!serverQueue || !message.guild.me.voice.channel) return sendErrorEmbed('Theres no song currently being played')

    if(serverQueue.lock === true && serverQueue.lockId !== message.author.id && !message.member.hasPermission(["ADMINISTRATOR"]) && !message.member.hasPermission(["MANAGE_MESSAGES"])) return sendErrorEmbed("**The song queue was locked**")


    if(serverQueue.connection.dispatcher === null){
      if(message.guild.me.voice.channel){
        message.guild.me.voice.channel.leave()
      }

      queue.delete(message.guild.id)
      message.channel.send("**Looks like an error occured.Please report it at our support server**\nhttps://discord.gg/Gwj92qA")
    } else {

    queue.delete(message.guild.id)

      if(loopNum.get(message.guild.id)) loopNum.delete(message.guild.id)
      message.member.voice.channel.leave()
      sendSuccessEmbed("**Queue stopped**")

      if (!recent.has(message.author.id)) {
        recent.set(message.author.id, new Discord.Collection())
      }
    }


      const timestamps = recent.get(message.author.id);

      const now = Date.now()
      const cooldownAMT = (command.cooldown || 10) * 1000;
      const expirationTime = timestamps.get(message.author.id) + cooldownAMT;
      if (timestamps.has(message.author.id)) {

        if (now < expirationTime) {
          const timeLeft = (expirationTime - now) / 1000

          return send(`⏰ **Your making requests too fast! please wait **${timeLeft.toFixed(1)}** seconds`)
        }
      }

      timestamps.set(message.author.id, now);
      setTimeout(() => timestamps.delete(message.author.id), cooldownAMT);
  } else {


  if(!message.guild.me.hasPermission(["CONNECT"])) return sendErrorEmbed("**I need the `connect` permission enabled in order to join the voice channel**")
  if(!message.guild.me.hasPermission(["SPEAK"])) return sendErrorEmbed("**I need the `speak` permission enabled in order to join the voice channel**")
  if(!message.member.voice.channel) return sendErrorEmbed("**You need to be in a voice channel**")

  if(!args[1]) return sendErrorEmbed("You need to give me a video **title** / **Link** / **Playlist Link**")

  if(message.guild.me.voice.channel){
    if(message.guild.me.voice.channel.id !== message.member.voice.channel.id) return sendErrorEmbed("**I'm already playing a song in another channel**")
  }

  if (!recent.has(message.author.id)) {
    recent.set(message.author.id, new Discord.Collection())
  }


  const timestamps = recent.get(message.author.id);

  const now = Date.now()
  const cooldownAMT = (command.cooldown || 5) * 1000;
  const expirationTime = timestamps.get(message.author.id) + cooldownAMT;
  if (timestamps.has(message.author.id)) {

    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000

      return send(`⏰ Your making requests too fast! please wait **${timeLeft.toFixed(1)}** seconds`)
    }
  }

  //checkPlaylistURL(old)/^https:\/\/(?:www\.)?youtube\.com\/watch\?((v=[^&\s]*&list=[^&\s]*)|(list=[^&\s]*&v=[^&\s]*))(&[^&\s]*)*$/
  let vidURL = /(youtu\.be\/|youtube\.com\/(watch\?(.*&)?v=|(embed|v)\/))([^\?&"'>]+)$/
  let playlistURL = /^.*(youtu.be\/|list=)([^#\&\?]*).*/

  let checkURL = vidURL.test(message.content.slice(`${args[0]} `.length))
  let checkURLP = playlistURL.test(message.content.slice(`${args[0]} `.length).trim())

  let vidTit = message.content.slice(`${args[0]} `.length).trim().split(" ").join("+")
  if(checkURL === true) vidTit = message.content.slice(`${args[0]} https://www.youtube.com/watch?v=`.length)

  let url = ""
  let yt = ""

  if(checkURLP === true){
     url = new URL(args[1])
     yt = new URLSearchParams(url.search)
  }
  if(checkURLP === true) vidTit = yt.get('list')
  //https://www.youtube.com/playlist?list=PLuL3g-gXJLrGX_1jiaUYkJAXU-g8Ctj8b

  let searchQuery = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${vidTit}&key=${key}&maxResults=1&type=video`

  if(checkURL === true) searchQuery = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${vidTit}&key=${key}&maxResults=1&type=videoId`
  if(checkURLP === true) searchQuery = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&key=${key}&playlistId=${vidTit}&maxResults=50`

  console.log(vidTit)
  let youtubeLink = await fetch.get(searchQuery)
  .catch(() => sendErrorEmbed("Can't find that video"));
  if(!youtubeLink.body.items[0]) return sendErrorEmbed("Cant find that video")
  let serverQueue = queue.get(message.guild.id)

  let resnum = 0
  if(checkURLP === true){
    if(adding.has(message.author.id)) return sendErrorEmbed("We're currently adding one please try again when we're done")
    send("Please wait a few minutes while we load your playlist!")
    adding.add(message.author.id)
    const playlist = await youtube.getPlaylist(message.content.slice(`${args[0]} `.length))
    const videosArr = await playlist.getVideos()
    for (let i = 0; i < videosArr.length; i++) {
      if (videosArr[i].raw.status.privacyStatus == 'private') {
        continue;
      } else {
        try {
          const vidInfo = await videosArr[i].fetch();

          const publishedAt = new Date(vidInfo.raw.snippet.publishedAt).toLocaleString()
          resnum = videosArr.length
          let sec = vidInfo.duration.seconds
          let min = vidInfo.duration.minutes
          let hr = vidInfo.duration.hours

          let durCon = `${hr} hours ${min} minutes ${sec} seconds`
          if(hr === 0) durCon = `${min} minutes ${sec} seconds`
          if(min === 0) durCon = `${sec} seconds`

          let HrtoMs = hr * 60000 * 60
          let MintoMs = min * 60000
          let SectoMs = sec * 1000
          let rawDur = HrtoMs + MintoMs + SectoMs

          let song = {
            url: `https://www.youtube.com/watch?v=${vidInfo.raw.id}`,
            title: vidInfo.raw.snippet.title,
            author: vidInfo.raw.snippet.channelTitle,
            requestedBy: message.author.tag,
            Duration: durCon,
            RawDur: rawDur,
            description: vidInfo.raw.snippet.description,
            channelId : vidInfo.raw.snippet.channelId,
            publishedDate: publishedAt,
            thumbnail: vidInfo.raw.snippet.thumbnails.high.url
          }

          if (!queue.has(message.guild.id)) {
            const queueContruct = {
              textChannel: message.channel,
              voiceChannel: message.member.voice.channel,
              connection: null,
              songs: [],
              dispatcher: null,
              volume: 1,
              playing: true,
              loop: false,
              lock: false,
              lockId: null,
              shuffle: false,
              queueloop: false
             };

             queue.set(message.guild.id, queueContruct);
        }

        serverQueue = queue.get(message.guild.id)
        serverQueue.songs.push(song);
        } catch (err) {
          return console.error(err);
        }
      }
    }

    if(!message.guild.me.voice.channel || serverQueue.connection === null){
      try {
        console.log("replayed")

        adding.delete(message.author.id)

        sendSuccessEmbed(`**${resnum}** songs were loaded`)
        let connection = await message.member.voice.channel.join();
        serverQueue.connection = connection;
        play(message.guild, serverQueue.songs[0], { filter: "audioonly" });
       } catch (err) {
       if(err) console.log(err)
        if(loopNum.get(message.guild.id)) loopNum.delete(message.guild.id)
        sendErrorEmbed("**Failed to play this song!**")
        message.guild.me.voice.channel.leave()
        queue.delete(message.guild.id)
       }

    } else {
      sendSuccessEmbed(`**${resnum}** songs were added to the queue`)
      console.log("replayed1")
    }


  } else {
    let vidInfo = youtubeLink.body.items[0]
    let vidId = youtubeLink.body.items[0].id.videoId

    let getDuration = await fetch.get(`https://www.googleapis.com/youtube/v3/videos?id=${vidId}&part=contentDetails&key=${key}`)

    let getDur = getDuration.body.items[0]

    let DurMSec = ~~(moment.duration(getDur.contentDetails.duration).asMilliseconds())

    Dur = prettyMilliseconds(DurMSec, {verbose: true})

    //https://www.googleapis.com/youtube/v3/playlists/?part=snippet&key=${key}&id=RD5Wiio4KoGe8

    let publishedAt = new Date(vidInfo.snippet.publishedAt).toLocaleString()
    let song = {
      url: `https://www.youtube.com/watch?v=${vidId}`,
      title: vidInfo.snippet.title,
      author: vidInfo.snippet.channelTitle,
      requestedBy: message.author.tag,
      Duration: Dur,
      RawDur: moment.duration(getDur.contentDetails.duration).asMilliseconds(),
      description: vidInfo.snippet.description,
      channelId : vidInfo.snippet.channelId,
      publishedDate: publishedAt,
      thumbnail: vidInfo.snippet.thumbnails.high.url
    }

    if (!queue.has(message.guild.id)) {
      const queueContruct = {
        textChannel: message.channel,
        voiceChannel: message.member.voice.channel,
        connection: null,
        songs: [],
        dispatcher: null,
        volume: 1,
        playing: true,
        loop: false,
        lock: false,
        lockId: null,
        shuffle: false,
        queueloop: false
       };
       console.log("here")
       queue.set(message.guild.id, queueContruct);
       serverQueue = queue.get(message.guild.id)
       queueContruct.songs.push(song);
  } else {
    console.log("here1")
    serverQueue = queue.get(message.guild.id)
    serverQueue.songs.push(song);
    return sendSuccessEmbed(`**${song.title}** by ` + "**__" + song.author + "__**" + ` has been added to the queue`)
  }

     try {

      let connection = await message.member.voice.channel.join();
      serverQueue.connection = connection;
      play(message.guild, serverQueue.songs[0], { filter: "audioonly" });
      console.log("replayed2")
     } catch (err){
       console.log(err)
      if(loopNum.get(message.guild.id)) loopNum.delete(message.guild.id)
      sendErrorEmbed("**Failed to play this song!**")
      message.guild.me.voice.channel.leave()
      queue.delete(message.guild.id)
     }
    }

     async function play(guild) {
      const serverQueue = queue.get(message.guild.id)
      console.log("here5")
      if (!serverQueue.songs[0]) {
      serverQueue.voiceChannel.leave();
      queue.delete(message.guild.id);
      return;
      }

      try {

        console.log("replayed3")
        serverQueue.connection.dispatcher = await serverQueue.connection.play(ytdl(serverQueue.songs[0].url, { filter: "audioonly" }));
        serverQueue.dispatcher = await serverQueue.connection.play(ytdl(serverQueue.songs[0].url, { filter: "audioonly" }));
      } catch (err){
        console.log(err)
       if(loopNum.get(message.guild.id)) loopNum.delete(message.guild.id)
       sendErrorEmbed("**Failed to play this song!**")
       message.guild.me.voice.channel.leave()
       queue.delete(message.guild.id)
      }
      serverQueue.connection.dispatcher.on("finish", () => {
        if(serverQueue.loop === true){

          try {
            if(!serverQueue) return;
            play(guild, serverQueue.songs[0]);
            console.log("replayed4")
          } catch (err){
            console.log(err)
           if(loopNum.get(message.guild.id)) loopNum.delete(message.guild.id)
           sendErrorEmbed("**Failed to play this song!**")
           message.guild.me.voice.channel.leave()
           queue.delete(message.guild.id)
          }
        } else {

        if(serverQueue.queueloop === true){

          let numlp = {
            num: 1
          }
          loopNum.set(message.guild.id,numlp)

         let loopnums = loopNum.get(message.guild.id)
         let num = loopnums.num
          if(!serverQueue.songs[num]){

            try {

              play(guild, serverQueue.songs[0], { filter: "audioonly" });
              console.log("replayed6")
              sendActivityEmbed(`Now playing **${serverQueue.songs[loopnums.num].title}**` + " by requested **__" + serverQueue.songs[loopnums.num].requestedBy + "__**")
              loopnums.num = loopnums.num + 1
            } catch (err){
              console.log(err)
             if(loopNum.get(message.guild.id)) loopNum.delete(message.guild.id)
             sendErrorEmbed("**Failed to play this song!**")
             message.guild.me.voice.channel.leave()
             queue.delete(message.guild.id)
            }

          } else {
            try {

              play(guild, serverQueue.songs[num], { filter: "audioonly" });
              console.log("replayed7")
              sendActivityEmbed(`Now playing **${serverQueue.songs[num].title}**` + " by requested **__" + serverQueue.songs[num].requestedBy + "__**")
              loopnums.num = loopnums.num + 1
            } catch (err){
              console.log(err)
             if(loopNum.get(message.guild.id)) loopNum.delete(message.guild.id)
             sendErrorEmbed("**Failed to play this song!**")
             message.guild.me.voice.channel.leave()
             queue.delete(message.guild.id)
            }
          }
        } else {

          serverQueue.songs.shift();
          if(serverQueue.shuffle === true){


            let sum = serverQueue.songs.length

            let num = Math.floor((Math.random() * sum) + 0)

            try {

              play(guild, serverQueue.songs[num], { filter: "audioonly" });
              console.log("replayed8")
              sendActivityEmbed(`Now playing **${serverQueue.songs[num].title}**` + " by requested **__" + serverQueue.songs[num].requestedBy + "__**")
            } catch (err){
              console.log(err)
             if(loopNum.get(message.guild.id)) loopNum.delete(message.guild.id)
             sendErrorEmbed("**Failed to play this song!**")
             message.guild.me.voice.channel.leave()
             queue.delete(message.guild.id)
            }
          } else {
            if(!serverQueue.songs[0]){
              if(loopNum.get(message.guild.id)) loopNum.delete(message.guild.id)
              message.guild.me.voice.channel.leave()
              queue.delete(message.guild.id)
            } else {
              try {
                if(!serverQueue) return;
                play(guild, serverQueue.songs[0], { filter: "audioonly" });
                console.log("replayed9")
                sendActivityEmbed(`Now playing **${serverQueue.songs[0].title}**` + " by requested **__" + serverQueue.songs[0].requestedBy + "__**")
              } catch (err){
                console.log(err)
               if(loopNum.get(message.guild.id)) loopNum.delete(message.guild.id)
               sendErrorEmbed("**Failed to play this song!**")
               message.guild.me.voice.channel.leave()
               queue.delete(message.guild.id)
              }
            }
          }
        }
    }
      });
      }

      try {
        if(serverQueue.connection.dispatcher.streamTime > 1000) return;
        if(!serverQueue) return;

        serverQueue.connection
        .play(ytdl(serverQueue.songs[0].url, { filter: "audioonly" }))
        console.log("replayed10")
        sendActivityEmbed(`Started playing **${serverQueue.songs[0].title}**` + " requested by **__" + serverQueue.songs[0].requestedBy + "__**")

        if(serverQueue.dispatcher === null){
          serverQueue.dispatcher = await serverQueue.connection.play(ytdl(serverQueue.songs[0].url, { filter: "audioonly" }));
        }
      } catch (err){
        console.log(err)
       if(loopNum.get(message.guild.id)) loopNum.delete(message.guild.id)
       sendErrorEmbed("**Failed to play this song!**")
       message.guild.me.voice.channel.leave()
       queue.delete(message.guild.id)
      }
}
}

if(command === 'skip' || command === 's'){
  if(adding.has(message.author.id)) return sendErrorEmbed("**You can't skip while we're adding songs**")
  if(!message.member.voice.channel) return sendErrorEmbed("**You need to be in a voice channel**")

  if(message.guild.me.voice.channel){
    if(message.guild.me.voice.channel.id !== message.member.voice.channel.id) return sendErrorEmbed('**You need to be in the same vc as me**')
  }

  if(!serverQueue) return sendErrorEmbed('**Theres no song currently being played**')

  if(serverQueue.lock === true && serverQueue.lockId !== message.author.id && !message.member.hasPermission(["ADMINISTRATOR"]) && !message.member.hasPermission(["MANAGE_MESSAGES"])) return sendErrorEmbed("**The song queue was locked**")

  if(serverQueue.loop === true) serverQueue.loop = false
  serverQueue.connection.dispatcher.end()
  message.react("✅")
  console.log(serverQueue.connection.dispatcher)
}

if(command === "queuesearch" || command === "qs"){
  if(!serverQueue || !message.guild.me.voice.channel) return sendErrorEmbed('Theres no song currently being played')
  if(!args[1]) return sendErrorEmbed("**You need to provide a song title**")

  var arr = serverQueue.songs
  var input = message.content.slice(`${args[0]} `.length).trim().split(" ")

  for (var i = 0; i < input.length; i++){

      let res = arr.find(x => x.title.toLowerCase().includes(input[i]))
      if(!res) return sendErrorEmbed("**This song is not in the queue**")

      let index = arr.filter(arr => arr.title === res.title).map((val) => arr.indexOf(val) + 1)
      let length = arr.filter(arr => arr.title === res.title).length
      let con = ""

      if(arr.filter(arr => arr.title === res.title).length > 1){
        con =
        `Duplicated Songs      || ${length}\n`+
        `Song Positions        || ${index}\n`
      }

      let some = false
      if(arr.filter(arr => arr.title === res.title).length > 1) some = true

      let searchRes = new Discord.MessageEmbed()
      .setAuthor(res.title, message.author.displayAvatarURL({dynamic: true}))
      .setTitle(res.title)
      .setURL(res.url)
      .setColor(gold)
      .setDescription(
      `[${res.author}](https://www.youtube.com/channel/${res.channelId})\n`+
      "```css\n"+
      `Duration              || ${res.Duration}\n`+
      `Requested By          || ${res.requestedBy}\n`+
      `Publised Date         || ${res.publishedDate}\n`+
      `Queue position        || ${arr.indexOf(res) + 1}\n`+
      `Duplicated?           || ${some}\n`+
      `${con}`+
      "\n```")
      .setColor(gold)
      .setFooter("Note that it returns the first results it gets")
      send(searchRes)
      break;
  }
}
if(command === "queue" || command === 'q'){

  if(!serverQueue || !message.guild.me.voice.channel) return sendErrorEmbed('Theres no song currently being played')

  let num = Number(args[1])
  if(!Number(args[1]) || Number(args[1]) < 1) num = 1
  let times = (num - 1) * 10

  let a = 0 + times
  let b = 1 + times
  let c = 2 + times
  let d = 3 + times
  let e = 4 + times
  let f = 5 + times
  let g = 6 + times
  let h = 7 + times
  let i = 8 + times
  let j = 9 + times

  let first = ""
  let second = ""
  let third = ""
  let fourth = ""
  let fifth = ""
  let sixth = ""
  let seventh = ""
  let eight = ""
  let nine = ""
  let thenth = ""

 if(!serverQueue.songs[a]) return sendErrorEmbed("**Theres no such queue**")

 if(serverQueue.songs[a]) first = `\`${a + 1}\` [${serverQueue.songs[a].title}](${serverQueue.songs[a].url})\n - **${serverQueue.songs[a].requestedBy}** \`${serverQueue.songs[a].Duration}\`\n====================\n`
 if(serverQueue.songs[b]) second = `\`${b + 1}\` [${serverQueue.songs[b].title}](${serverQueue.songs[b].url})\n - **${serverQueue.songs[b].requestedBy}** \`${serverQueue.songs[b].Duration}\`\n====================\n`
 if(serverQueue.songs[c]) third = `\`${c + 1}\` [${serverQueue.songs[c].title}](${serverQueue.songs[c].url})\n - **${serverQueue.songs[c].requestedBy}** \`${serverQueue.songs[c].Duration}\`\n====================\n`
 if(serverQueue.songs[d]) fourth = `\`${d + 1}\` [${serverQueue.songs[d].title}](${serverQueue.songs[d].url})\n - **${serverQueue.songs[d].requestedBy}** \`${serverQueue.songs[d].Duration}\`\n====================\n`
 if(serverQueue.songs[e]) fifth = `\`${e + 1}\` [${serverQueue.songs[e].title}](${serverQueue.songs[e].url})\n - **${serverQueue.songs[e].requestedBy}** \`${serverQueue.songs[e].Duration}\`\n====================\n`
 if(serverQueue.songs[f]) sixth = `\`${f + 1}\` [${serverQueue.songs[f].title}](${serverQueue.songs[f].url})\n - **${serverQueue.songs[f].requestedBy}** \`${serverQueue.songs[f].Duration}\`\n====================\n`
 if(serverQueue.songs[g]) seventh = `\`${g + 1}\` [${serverQueue.songs[g].title}](${serverQueue.songs[g].url})\n - **${serverQueue.songs[g].requestedBy}** \`${serverQueue.songs[g].Duration}\`\n====================\n`
 if(serverQueue.songs[h]) eight = `\`${h + 1}\` [${serverQueue.songs[h].title}](${serverQueue.songs[h].url})\n - **${serverQueue.songs[h].requestedBy}** \`${serverQueue.songs[h].Duration}\`\n====================\n`
 if(serverQueue.songs[i]) nine = `\`${i + 1}\` [${serverQueue.songs[i].title}](${serverQueue.songs[i].url})\n - **${serverQueue.songs[i].requestedBy}** \`${serverQueue.songs[i].Duration}\`\n====================\n`
 if(serverQueue.songs[j]) thenth = `\`${j + 1}\` [${serverQueue.songs[j].title}](${serverQueue.songs[j].url})\n - **${serverQueue.songs[j].requestedBy}** \`${serverQueue.songs[j].Duration}\`\n====================\n`

 let all = serverQueue.songs.length //1
 let page = ~~(all / 10) //1
 if(all % 10 !== 0){
   page = ~~(all / 10) + 1
 }
  let queueE = new Discord.MessageEmbed()
  .setTitle(`${serverQueue.songs.length} Songs`)
  .setDescription(`${first}${second}${third}${fourth}${fifth}${sixth}${seventh}${eight}${nine}${thenth}`)
  .setFooter(num + "/" + page)
  .setColor(gold)
  send(queueE)
}

if(command === "shuffle" || command === "sh"){
  if(!message.member.voice.channel) return sendErrorEmbed("**You need to be in a voice channel**")
  if(message.guild.me.voice.channel){
    if(message.guild.me.voice.channel.id !== message.member.voice.channel.id) return sendErrorEmbed('**You need to be in the same vc as me**')
  }

  if(!serverQueue) return sendErrorEmbed('Theres no song currently being played')

  serverQueue.shuffle = true
  sendSuccessEmbed("Shuffle **Enabled**")
}

if(command === "remove" || command === "r"){
  if(!message.member.voice.channel) return sendErrorEmbed("**You need to be in a voice channel**")
  if(message.guild.me.voice.channel){
    if(message.guild.me.voice.channel.id !== message.member.voice.channel.id) return sendErrorEmbed('**You need to be in the same vc as me**')
  }

  if(!serverQueue) return sendErrorEmbed('Theres no song currently being played')

  if(serverQueue.lock === true && serverQueue.lockId !== message.author.id && !message.member.hasPermission(["ADMINISTRATOR"]) && !message.member.hasPermission(["MANAGE_MESSAGES"])) return sendErrorEmbed("**The song queue was locked**")

  if(!serverQueue.songs[1]) return sendErrorEmbed("**You need to have atleast __2__ songs in the queue**")

  const num = Number(args[1]) - 1
  if(!serverQueue.songs[num]) return sendErrorEmbed("Theres no such song in the queue")

  sendSuccessEmbed(`${serverQueue.songs[num].title} has been removed`)

  serverQueue.songs.splice(num,1)
}

if(command === "donate" || command === "dn"){
const don = new Discord.MessageEmbed()
.setColor(gold)
.setTitle("Donate Page")
.setDescription("Looks like you're interested in the donation page.I accept [paypal](https://www.paypal.me/iVanTaNzW)")
.addField("Why donate?","Donate is a optional choice for those who want to support the bot financially,as you may know I use a free vps called heroku and it sounds fine but if lets say 100 servers were listening to songs at the same time,the audio quality will be laggy.",false)
.addField("Ins't the bot __100%__ free?","Yes! The bot is 100% free,no commands nor functions require any payment.",false)
.addField("What does donators get?","Donators get a special donator role in the server and a shoutout.", false)
.addField("What will you do with the donations?","I'll buy a better vps if we've reached a decent amount of money and work on big projects too!", false)
send(don)
}

if(command === 'queueloop' || command === "ql"){
  if(!message.member.voice.channel) return sendErrorEmbed("**You need to be in a voice channel**")
  if(message.guild.me.voice.channel){
    if(message.guild.me.voice.channel.id !== message.member.voice.channel.id) return sendErrorEmbed('**You need to be in the same vc as me**')
  }

  if(!serverQueue) return sendErrorEmbed('Theres no song currently being played')

  if(serverQueue.lock === true && serverQueue.lockId !== message.author.id && !message.member.hasPermission(["ADMINISTRATOR"]) && !message.member.hasPermission(["MANAGE_MESSAGES"])) return sendErrorEmbed("**The song queue was locked**")

  if(serverQueue.queueloop === true){
    serverQueue.queueloop = false
    sendSuccessEmbed("**Queue Unlooped**")
  } else {
    serverQueue.queueloop = true
    sendSuccessEmbed("**Queue Looped**")
  }
}

if(command === "pause" || command === "pa"){
  if(!message.member.voice.channel) return sendErrorEmbed("**You need to be in a voice channel**")
  if(message.guild.me.voice.channel){
    if(message.guild.me.voice.channel.id !== message.member.voice.channel.id) return sendErrorEmbed('**You need to be in the same vc as me**')
  }

  if(!serverQueue) return sendErrorEmbed('Theres no song currently being played')

  if(serverQueue.lock === true && serverQueue.lockId !== message.author.id && !message.member.hasPermission(["ADMINISTRATOR"]) && !message.member.hasPermission(["MANAGE_MESSAGES"])) return sendErrorEmbed("**The song queue was locked**")

  if(serverQueue.connection.dispatcher === null){
    if(message.guild.me.voice.channel){
      message.guild.me.voice.channel.leave()
    }

    queue.delete(message.guild.id)
    message.channel.send("**Looks like an error occured.Please report it at our support server**\nhttps://discord.gg/Gwj92qA")
  } else {
    serverQueue.connection.dispatcher.pause()
    serverQueue.playing = false
    send("⏸️ **PAUSED**")
  }
}

if(command === "resume" || command === "re"){
  if(!message.member.voice.channel) return sendErrorEmbed("**You need to be in a voice channel**")
  if(message.guild.me.voice.channel){
    if(message.guild.me.voice.channel.id !== message.member.voice.channel.id) return sendErrorEmbed('**You need to be in the same vc as me**')
  }

  if(serverQueue.lock === true && serverQueue.lockId !== message.author.id && !message.member.hasPermission(["ADMINISTRATOR"]) && !message.member.hasPermission(["MANAGE_MESSAGES"])) return sendErrorEmbed("**The song queue was locked**")


  if(!serverQueue) return sendErrorEmbed('Theres no song currently being played')

  if(serverQueue.connection.dispatcher === null){
    if(message.guild.me.voice.channel){
      message.guild.me.voice.channel.leave()
    }

    queue.delete(message.guild.id)
    message.channel.send("**Looks like an error occured.Please report it at our support server**\nhttps://discord.gg/Gwj92qA")
  } else {
  if(serverQueue.connection.dispatcher.paused === false) return sendErrorEmbed("**Song is not paused**")

  serverQueue.connection.dispatcher.resume()
  serverQueue.playing = true
  sendSuccessEmbed("**RESUMED**")
  }
}

if(command === "nowplaying" || command === "np"){

  if(!serverQueue) return sendErrorEmbed('Theres no song currently being played')

  if(serverQueue.connection.dispatcher === null){
    if(message.guild.me.voice.channel){
      message.guild.me.voice.channel.leave()
    }

    queue.delete(message.guild.id)
    message.channel.send("**Looks like an error occured.Please report it at our support server**\nhttps://discord.gg/Gwj92qA")
  } else {
  let stream = serverQueue.connection.dispatcher.streamTime
  if(!serverQueue.connection.dispatcher.streamTime) return sendErrorEmbed("**Couldn't get details for this song**")
  let length = serverQueue.songs[0].RawDur

  let ori = serverQueue.songs[0].RawDur / 10
  let one = ori * 1
  let two = ori * 2
  let three = ori * 3
  let four = ori * 4
  let five = ori * 5
  let six = ori * 6
  let seven = ori * 7
  let eight = ori * 8
  let nine = ori * 9
  let ten = ori * 10

  let display = "🔵▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬"
  if(stream > one && stream < two)     display = "[▬▬](https://discord.gg/7JV74qb)🔵▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬"
  if(stream > two && stream < three)   display = "[▬▬▬▬▬▬](https://discord.gg/7JV74qb)🔵▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬"
  if(stream > three && stream < four)  display = "[▬▬▬▬▬▬▬▬▬▬](https://discord.gg/7JV74qb)🔵▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬"
  if(stream > four && stream < five)   display = "[▬▬▬▬▬▬▬▬▬▬▬▬▬▬](https://discord.gg/7JV74qb)🔵▬▬▬▬▬▬▬▬▬▬▬▬▬▬"
  if(stream > five && stream < six)    display = "[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬](https://discord.gg/7JV74qb)🔵▬▬▬▬▬▬▬▬▬▬"
  if(stream > six && stream < seven)   display = "[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬](https://discord.gg/7JV74qb)🔵▬▬▬▬▬▬▬▬"
  if(stream > seven && stream < eight) display = "[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬](https://discord.gg/7JV74qb)🔵▬▬▬▬▬▬"
  if(stream > eight && stream < nine)  display = "[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬](https://discord.gg/7JV74qb)🔵▬▬▬▬"
  if(stream > nine && stream < ten)    display = "[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬](https://discord.gg/7JV74qb)🔵▬▬"
  if(stream > ten)                     display = "[▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬](https://discord.gg/7JV74qb)🔵"

  stream = prettyMilliseconds(stream, {verbose: true});
  length = prettyMilliseconds(length, {verbose: true});

  const npE = new Discord.MessageEmbed()
  .setTitle(serverQueue.songs[0].title)
  .setDescription("**" + stream + "/" + length + "**\n" + "**" + display + "**")
  .setColor(gold)
  send(npE)
  }
}

if(command === "queueinfo" || command === "qi"){
  if(!serverQueue) return sendErrorEmbed('Theres no song currently being played')

  let lockId = null
  if(serverQueue.lockId !== null) lockId = `${serverQueue.lockId}(${message.guild.members.cache.get(serverQueue.lockId).user.tag})`
  const info = new Discord.MessageEmbed()
  .setDescription(
    "```css\n"+
    `Song(s)     || ${serverQueue.songs.length}\n`+
    `Volume      || ${serverQueue.volume}\n`+
    `playing?    || ${serverQueue.playing}\n`+
    `loop?       || ${serverQueue.loop}\n`+
    `locked?     || ${serverQueue.lock}\n`+
    `Locker?     || ${lockId}\n`+
    `shuffle?    || ${serverQueue.shuffle}\n`+
    `queue loop? || ${serverQueue.queueloop}\n`+
    "```"
  )
  .setColor(gold)
  send(info)
}

if(command === "info" || command === "i"){

  if(!serverQueue) return sendErrorEmbed('Theres no song currently being played')

  let song = serverQueue.songs[0]

  const info = new Discord.MessageEmbed()
  .setTitle(song.title)
  .setDescription(song.description)
  .setFooter(`${song.Duration} | Published at ${song.publishedDate}`)
  .setURL(song.url)
  .setThumbnail(song.thumbnail)
  .setColor(gold)

  send(info)
}

if(command === "loop" || command === "lo"){
  if(!message.member.voice.channel) return sendErrorEmbed("**You need to be in a voice channel**")
  if(message.guild.me.voice.channel){
    if(message.guild.me.voice.channel.id !== message.member.voice.channel.id) return sendErrorEmbed('**You need to be in the same vc as me**')
  }

  if(!serverQueue) return sendErrorEmbed('Theres no song currently being played')

  if(serverQueue.lock === true && serverQueue.lockId !== message.author.id && !message.member.hasPermission(["ADMINISTRATOR"]) && !message.member.hasPermission(["MANAGE_MESSAGES"])) return sendErrorEmbed("**The song queue was locked**")

  if(serverQueue.loop === false){
    serverQueue.loop = true
    sendSuccessEmbed(`**Looped enabled for ${message.member.voice.channel.name}**`)
  } else {
    serverQueue.loop = false
    sendSuccessEmbed(`**Looped disabled for ${message.member.voice.channel.name}**`)
  }
}

if(command === "lock" || command === "lk"){
  if(!message.member.voice.channel) return sendErrorEmbed("**You need to be in a voice channel**")
  if(message.guild.me.voice.channel){
    if(message.guild.me.voice.channel.id !== message.member.voice.channel.id) return sendErrorEmbed('**You need to be in the same vc as me**')
  }

  if(!serverQueue) return sendErrorEmbed('Theres no song currently being played')

  if(serverQueue.lock === false){
    serverQueue.lock = true
    serverQueue.lockId = message.author.id
    sendSuccessEmbed(`**Queue locked for ${message.member.voice.channel.name}**`)
  } else {
    serverQueue.lock = false
    serverQueue.lockId = null
    sendSuccessEmbed(`**Queue unlocked for ${message.member.voice.channel.name}**`)
  }
}

if(command === "volume" || command === "vol"){
  if(!message.member.voice.channel) return sendErrorEmbed("**You need to be in a voice channel**")
  if(message.guild.me.voice.channel){
    if(message.guild.me.voice.channel.id !== message.member.voice.channel.id) return sendErrorEmbed('**You need to be in the same vc as me**')
  }

  if(!serverQueue) return sendErrorEmbed('Theres no song currently being played')

  if(serverQueue.lock === true && serverQueue.lockId !== message.author.id && !message.member.hasPermission(["ADMINISTRATOR"]) && !message.member.hasPermission(["MANAGE_MESSAGES"])) return sendErrorEmbed("**The song queue was locked**")

  if(!Number(args[1])) return sendErrorEmbed("**You need to give me a number**")

  if(serverQueue.connection.dispatcher === null){
    if(message.guild.me.voice.channel){
      message.guild.me.voice.channel.leave()
    }

    queue.delete(message.guild.id)
    message.channel.send("**Looks like an error occured.Please report it at our support server**\nhttps://discord.gg/Gwj92qA")
  } else {
  serverQueue.connection.dispatcher.setVolume(args[1])
  sendSuccessEmbed(`Volume was set to **${args[1]}**`)
  }
}

if(command === "lyrics" || command === "l"){

  const serverQueue = queue.get(message.guild.id)

  let searchQuery = message.content.slice(`${args[0]} `.length)
  if(serverQueue && !args[1]) searchQuery = serverQueue.songs[0].title
  if(!serverQueue && !args[1]) return sendErrorEmbed("**You need to give me a song name or be listening to one**")


  let search = await fetch.get(`https://lyrics.tsu.sh/v1?q=${searchQuery}`)
  if(!search.body.content) return sendErrorEmbed("**No results found**")

  let one = search.body.content
  let two = ""

  if(search.body.content.length > 2048) one = one.slice(2049,one.length)
  if(search.body.content.length > 2048) two = search.body.content.slice(0,2048)
  if(one.length > 4096) return sendErrorEmbed("**Can't fetch lyrics for this song,searching it with words**")
  const lyric = new Discord.MessageEmbed()
  .setAuthor(search.body.song.full_title,search.body.song.icon)
  .setDescription(two)
  .setColor(gold)
  send(lyric)

  if(search.body.content.length > 2048){
    const lyric2 = new Discord.MessageEmbed()
    .setDescription(one)
    .setColor(gold)
    send(lyric2)
  }
}
});