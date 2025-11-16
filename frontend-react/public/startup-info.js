// Log de inicializacao do frontend
(function() {
  const startTime = new Date();
  
  // Funcao para detectar IP local
  function detectarIPLocal(callback) {
    const pc = new RTCPeerConnection({iceServers: []});
    const ips = [];
    
    pc.createDataChannel('');
    pc.createOffer()
      .then(offer => pc.setLocalDescription(offer))
      .catch(err => console.log('[FRONTEND] Erro ao detectar IP:', err));
    
    pc.onicecandidate = function(ice) {
      if (!ice || !ice.candidate || !ice.candidate.candidate) {
        if (ips.length === 0) {
          callback('N/A');
        }
        return;
      }
      
      const parts = ice.candidate.candidate.split(' ');
      const ip = parts[4];
      
      if (ip && ips.indexOf(ip) === -1 && ip !== '0.0.0.0') {
        ips.push(ip);
        callback(ip);
      }
    };
    
    // Timeout caso nao detecte em 2 segundos
    setTimeout(() => {
      if (ips.length === 0) {
        callback('N/A');
      }
    }, 2000);
  }
  
  // Exibir informacoes iniciais
  console.log('='.repeat(60));
  console.log('FRONTEND - Sistema de Gestao de Vistorias Nauticas');
  console.log('='.repeat(60));
  console.log('Inicializado em:', startTime.toLocaleString('pt-BR'));
  console.log('URL Atual:', window.location.href);
  console.log('Protocolo:', window.location.protocol);
  console.log('Host:', window.location.host);
  console.log('Porta:', window.location.port || '(padrao)');
  
  // Detectar IP local
  detectarIPLocal(function(ip) {
    console.log('IP Local Detectado:', ip);
    console.log('URL Rede Local:', window.location.protocol + '//' + ip + ':' + (window.location.port || '3001'));
    console.log('='.repeat(60));
  });
  
  // Informacoes da API
  const apiUrl = window.REACT_APP_API_URL || 'http://localhost:3000';
  console.log('API Backend:', apiUrl);
  console.log('Navegador:', navigator.userAgent.split('(')[0].trim());
  console.log('='.repeat(60));
})();

