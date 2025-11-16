// Configuracao de rede do frontend
export const getLocalIPAddress = async (): Promise<string> => {
  return new Promise((resolve) => {
    try {
      const pc = new RTCPeerConnection({ iceServers: [] });
      const ips: string[] = [];

      pc.createDataChannel('');
      
      pc.createOffer()
        .then(offer => pc.setLocalDescription(offer))
        .catch(() => resolve('N/A'));

      pc.onicecandidate = (ice) => {
        if (!ice || !ice.candidate || !ice.candidate.candidate) {
          if (ips.length === 0) {
            resolve('N/A');
          }
          return;
        }

        const parts = ice.candidate.candidate.split(' ');
        const ip = parts[4];

        if (ip && ips.indexOf(ip) === -1 && ip !== '0.0.0.0') {
          ips.push(ip);
          resolve(ip);
          pc.close();
        }
      };

      // Timeout de 2 segundos
      setTimeout(() => {
        if (ips.length === 0) {
          resolve('N/A');
        }
        pc.close();
      }, 2000);
    } catch (error) {
      console.error('[NETWORK] Erro ao detectar IP:', error);
      resolve('N/A');
    }
  });
};

export const getNetworkInfo = async () => {
  const ip = await getLocalIPAddress();
  const port = window.location.port || '3001';
  const protocol = window.location.protocol;
  
  return {
    ip,
    port,
    protocol,
    urlLocal: `${protocol}//localhost:${port}`,
    urlRede: `${protocol}//${ip}:${port}`,
    host: window.location.host,
    origin: window.location.origin
  };
};

// Exibir informacoes de rede no console ao inicializar
export const logNetworkInfo = async () => {
  const info = await getNetworkInfo();
  
  console.log('='.repeat(60));
  console.log('INFORMACOES DE REDE - FRONTEND');
  console.log('='.repeat(60));
  console.log('IP Local:', info.ip);
  console.log('Porta:', info.port);
  console.log('URL Local:', info.urlLocal);
  console.log('URL Rede:', info.urlRede);
  console.log('Host:', info.host);
  console.log('Origin:', info.origin);
  console.log('='.repeat(60));
};


