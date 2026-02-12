let socket;
window.addEventListener('load',()=>{
  socket = io();
  socket.on('show-modal', data => {
    document.getElementById('modal-title').textContent = data.title;
    document.getElementById('modal-text').textContent = data.text;
    document.getElementById('modal').style.display='flex';
    const ding=document.getElementById('ding'); ding.currentTime=0; ding.play().catch(()=>{});
  });
});

document.getElementById('btn-modal-broadcast').onclick = async ()=>{
  await fetch('/broadcast-modal',{
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({title:'Aviso GLOBAL', text:'Este es un modal enviado a TODOS'})
  });
};

// Local modal
const ding=document.getElementById('ding');
document.getElementById('btn-modal').onclick=()=>{
 document.getElementById('modal-title').textContent='Aviso LOCAL';
 document.getElementById('modal-text').textContent='Modal en este dispositivo';
 document.getElementById('modal').style.display='flex';
 ding.currentTime=0; ding.play().catch(()=>{});
};
