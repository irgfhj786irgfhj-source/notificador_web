const express = require('express');
const webpush = require('web-push');
const fs = require('fs');
const path = require('path');
const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname,'public')));
const server = app.listen(process.env.PORT||3000,()=>console.log('Servidor en puerto',process.env.PORT||3000));

const {Server} = require('socket.io');
const io = new Server(server,{cors:{origin:'*'}});
io.on('connection',s=>console.log('Cliente conectado',s.id));

// broadcast modal
app.post('/broadcast-modal',(req,res)=>{
 const {title='Aviso', text='Mensaje'} = req.body;
 io.emit('show-modal',{title,text});
 res.json({ok:true});
});

// VAPID
const vapidPath = path.join(__dirname,'vapid.json');
let vapid;
if(fs.existsSync(vapidPath)) vapid = JSON.parse(fs.readFileSync(vapidPath));
else{ const keys = webpush.generateVAPIDKeys(); fs.writeFileSync(vapidPath,JSON.stringify(keys)); vapid=keys; }
webpush.setVapidDetails('mailto:admin@example.com',vapid.publicKey,vapid.privateKey);

const subs = new Set();
app.get('/vapidPublicKey',(req,res)=> res.json({publicKey:vapid.publicKey}));
app.post('/subscribe',(req,res)=>{ subs.add(JSON.stringify(req.body)); res.json({ok:true}); });
app.post('/push', async (req,res)=>{
 const {title,body,url} = req.body;
 const payload = JSON.stringify({title,body,url});
 const results=[];
 for(const s of [...subs]){
  const sub = JSON.parse(s);
  try{ await webpush.sendNotification(sub,payload); results.push({ok:true}); }
  catch(e){ subs.delete(s); results.push({ok:false}); }
 }
 res.json({sent:results.length});
});
