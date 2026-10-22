document.getElementById('year').textContent=new Date().getFullYear();
const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')}),{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
// macOS/Windows todavía no tienen paquete — sus botones de descarga son
// solo un aviso de "Próximamente", no deben saltar al inicio de la página.
document.querySelectorAll('.is-soon').forEach(el=>el.addEventListener('click',e=>e.preventDefault()));
// Reporte de errores: sin backend propio, así que abre el cliente de correo
// del usuario con el reporte ya escrito en el cuerpo — nada de nombres,
// correos ni almacenamiento propio, solo lo que la persona escribió.
const reportForm=document.getElementById('reportForm');
if(reportForm){
  reportForm.addEventListener('submit',e=>{
    e.preventDefault();
    const text=document.getElementById('reportText').value.trim();
    if(!text) return;
    const subject=encodeURIComponent('Reporte de error - Verbo Desktop');
    const body=encodeURIComponent(text);
    window.location.href=`mailto:soporte@verbobiblia.com?subject=${subject}&body=${body}`;
  });
}
