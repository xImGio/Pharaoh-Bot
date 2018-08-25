// Requerimentos

const Discord = require("discord.js"); //baixar a lib
const client = new Discord.Client(); 
const config = require("./config.json");

// Clients on

client.on("ready", () => {
  console.log(`Agora o ${client.user.username} está online!`)
  console.log(`Com ${client.users.size} usuários, em ${client.channels.size} canais, em ${client.guilds.size} servidores.`); 
  client.user.setActivity(`Eu estou em ${client.guilds.size} servidores`);
});

client.on("guildCreate", guild => {
  console.log(`O bot entrou nos servidor: ${guild.name} (id: ${guild.id}). População: ${guild.memberCount} membros!`);
  client.user.setActivity(`Estou em ${client.guilds.size} servidores`);
});

client.on("guildDelete", guild => {
  console.log(`O bot foi removido do servidor: ${guild.name} (id: ${guild.id})`);
  client.user.setActivity(`Estou em ${client.guilds.size} servidores`);
});

// Comandos do Bot e Configurações de Mensagem

client.on("message", async message => {

    if(message.author.bot) return;
    if(message.channel.type === "dm") return;
    if(!message.content.startsWith(config.prefix)) return;

  const args = message.content.slice(config.prefix.length).trim().split(/ +/g);
  const comando = args.shift().toLowerCase();
  
  // Comandos de Informações

  if(comando === "ping") {
    const m = await message.channel.send("Ping?");
    m.edit(`Pong! A Latência é ${m.createdTimestamp - message.createdTimestamp}ms.`);
  }

  // Comandos de Entretenimento

  if(comando === "say") { 
    if(!message.member.roles.some(r=>["Administrador"].includes(r.name)) )
    return message.reply("Desculpe, você não tem permissão para usar o comando!");

    let saychannel = message.mentions.channels.first();
      if(!saychannel) return message.reply("Não achei o canal de texto mencionado!");
    
    const sayMessage = args.join(" ");
    message.delete().catch(O_o=>{});  
    saychannel.send(sayMessage)
  }

  // Comandos de Moderação

  if(comando === "clear") {
    if(!message.member.roles.some(r=>["Administrador"].includes(r.name)) )
    return message.reply("Desculpe, você não tem permissão para usar o comando!");
    
    const deleteCount = parseInt(args[0], 10);
    if(!deleteCount || deleteCount < 2 || deleteCount > 100)
      return message.reply("Por favor, forneça um número entre 2 e 100 para o número de mensagens a serem excluídas");
    
    const fetched = await message.channel.fetchMessages({limit: deleteCount});
    message.channel.bulkDelete(fetched)
      .catch(error => message.reply(`Não foi possível deletar mensagens devido a: ${error}`));
  }

  if(comando === "kick") {
    if(!message.member.roles.some(r=>["Administrador"].includes(r.name)) )      
    return message.reply("Desculpe, você não tem permissão para usar o comando!");
    let member = message.mentions.members.first() || message.guild.members.get(args[0]);
    if(!member)
      return message.reply("Por favor mencione um membro válido");
    if(!member.kickable) 
      return message.reply("Impossivel kickar o usuário");
    
    let reason = args.slice(1).join(' ');
    if(!reason) reason = "Nenhuma razão fornecida";
    
    await member.kick(reason)
      .catch(error => message.reply(`Desculpe ${message.author} não consegui expulsar o membro devido o: ${error}`));
    message.reply(`${member.user.tag} foi kickado por ${message.author.tag} Motivo: ${reason}`);
    message.delete().catch();

  }

  if(comando === "ban") {
    if(!message.member.roles.some(r=>["Administrador"].includes(r.name)) )
    return message.reply("Desculpe, você não tem permissão para usar o comando!");
    let member = message.mentions.members.first();
    if(!member)
      return message.reply("Por favor mencione um membro válido deste servidor");
    if(!member.bannable) 
      return message.reply("Eu não posso banir este usuário! Eles pode ter um cargo mais alto ou eu não tenho permissões de banir?");
    let reason = args.slice(1).join(' ');
    if(!reason) reason = "Nenhuma razão fornecida";
    await member.ban(reason)
      .catch(error => message.reply(`Desculpe ${message.author} não consegui banir o membro devido o : ${error}`));
    message.reply(`${member.user.tag} foi banido por ${message.author.tag} Motivo: ${reason}`);
    message.delete().catch();
  }

  if(comando === "report"){

    let rUser = message.guild.member(message.mentions.users.first() || message.guild.members.get(args[0]));
    if(!rUser) return message.channel.send("Não achei o usuário mencionado.");
    let rreason = args.join(" ").slice(22);

    let reportEmbed = new Discord.RichEmbed()
    .setDescription("Reports")
    .setColor("#15f153")
    .addField("Usuário reportado", `${rUser} com a ID: ${rUser.id}`)
    .addField("Reportado por", `${message.author} com a ID: ${message.author.id}`)
    .addField("Canal", message.channel)
    .addField("Hora", message.createdAt)
    .addField("Razão", rreason);

    let reportschannel = message.guild.channels.find(`name`, "reports");
    if(!reportschannel) return message.channel.send("Não achei o canal de reports.");


    message.delete().catch(O_o=>{});
    reportschannel.send(reportEmbed);

    return;
  }

  if(comando === "mute"){
    if(!message.member.roles.some(r=>["Administrador"].includes(r.name)) )
      return message.reply("Desculpe, você não tem permissão para usar o comando!");
    
    let toMute = message.mentions.users.first() || message.guild.member(args[0]);
      if(!toMute) return message.channel.sendMessage("Não achei o usuário mencionado/ID do usuário")

      let role = message.guild.roles.find(r => r.name === "Muted");
      
      try{
        role = await message.guild.createRole({
          name : "Muted",
          color : "#000000",
          permissions : []
        });

      message.guild.channels.forEach(async (channel, id => {
        await channel.overwritePermissions(role, {
          SEND_MESSAGE: FALSE,
          ADD_REACTIONS: FALSE,
        });
      }));

      } catch(e) {
        console.log(e.stack)
      }

      if(!toMute.role.has(role.id)) return message.channel.sendMessage("Usuário já foi mutado!")

      await toMute.addRole(role);
      message.channel.sendMessage("Shhhh... Agora ele não pode mais falar!")
  }

  // Comandos de Usuário

  if(comando === "setrole"){
    if(!message.member.roles.some(r =>["Admnistrador"].includes(r.name)))
    return message.reply("Yeeh, comando exclusivo para Reis do Camarote! :sunglasses:")

let rMember = message.mentions.members.first();
    if(!rMember) return message.reply(' Usuário não encontrado');

let role = msgs[2];
    if(!role) return message.reply(' Cargo não encontrado');

let recebeRole = message.guild.roles.find("name", role);
    if(!recebeRole) return message.reply('Role não encontrada')
    if(rMember.roles.has(recebeRole.id)) return message.reply('Usuário já possui esse cargo')
        
rMember.addRole(recebeRole.id);    
message.channel.send(rMember + " Recebeu a role " + recebeRole);
  }

  if(comando === "mavatar"){
    if(comando === "meuavatar"){
        message.reply(message.author.avatarURL);
        message.reply('Se quiser saber o meu, use o comando !avatarbot');
    }
  }

  if(comando === "bavatar"){
      message.channel.send("Avatar do Pharaoh Bot pode ser encontrado nesse link => https://goo.gl/3kd9pe")
  }

  if(comando === "newnick"){
    message.member.setNickname(args[1]);
    message.channel.send(message.author + " Agora se chama " + args[1]);
  }

  if(comando === "botinfo"){
    let bicon = client.user.displayAvatarURL;
    let botembed = new Discord.RichEmbed()
    .setDescription("Informações do Pharaoh Bot")
    .setColor("#15f153")
    .setThumbnail(bicon)
    .addField("Nome do Bot:", client.user.username)
    .addField("Versão do Bot:", config.version)
    .addField("Criado em:", client.user.createdAt);
    
    return message.channel.send(botembed);
  }

  if(comando === "serverinfo"){
    let sicon = message.guild.iconURL;
    let serverembed = new Discord.RichEmbed()
    .setDescription("Informações do Servidor")
    .setColor("#15f153")
    .setThumbnail(sicon)
    .addField("Nome do Server:", message.guild.name)
    .addField("Criado em:", message.guild.createdAt)
    .addField("Você entrou em:", message.member.joinedAt)
    .addField("Membros no total:", message.guild.memberCount);
    
    return message.channel.send(serverembed);
  }

  if(comando === "info"){
    message.channel.send("```fix\n Comandos de informação: \n ;serverinfo \n ;botinfo```")
  }

});

// Client login em arquivo separado (./config.json)

client.login(config.token);
