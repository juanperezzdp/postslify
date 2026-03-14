const fs = require('fs');
const path = require('path');
const http = require('http');


let cronSecret = process.env.CRON_SECRET || '';
let targetPort = Number.parseInt(process.env.PORT || '', 10);
try {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const match = envContent.match(/CRON_SECRET=(.*)/);
    if (match) {
      cronSecret = match[1].trim().replace(/['"]/g, '');
    }
    const portMatch = envContent.match(/PORT=(.*)/);
    if (!Number.isFinite(targetPort) && portMatch) {
      const value = Number.parseInt(portMatch[1].trim().replace(/['"]/g, ''), 10);
      if (Number.isFinite(value)) {
        targetPort = value;
      }
    }
  }
} catch (e) {
}

if (!cronSecret) {
  console.warn('\x1b[33m%s\x1b[0m', 'ADVERTENCIA: CRON_SECRET no encontrado en .env.local. Asegúrate de tenerlo configurado.');
} else {
}

if (!Number.isFinite(targetPort)) {
  targetPort = 3000;
}

const interval = 10 * 60 * 1000;

function triggerCron() {
  const options = {
  hostname: 'localhost',
  port: targetPort,
  path: '/api/cron/publish',
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${cronSecret}`
  }
};

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    res.on('end', () => {
      const time = new Date().toLocaleTimeString();
      if (res.statusCode === 200) {
      } else {
      }
    });
  });

  req.on('error', (error) => {
    const time = new Date().toLocaleTimeString();
    console.error(`[${time}] ❌ Error de conexión: ${error.message}`);
    console.error(`Asegúrate de que la aplicación Next.js esté corriendo en el puerto ${targetPort} (npm run dev)`);
  });

  req.end();
}

// Wait 10 seconds before first run to allow Next.js to start
setTimeout(triggerCron, 10000);

setInterval(triggerCron, interval);
