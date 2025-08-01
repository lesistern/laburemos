/**
 * Device Fingerprinting Utility
 * Genera un fingerprint único del dispositivo basado en características del navegador
 */

interface FingerprintData {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
  cookieEnabled: boolean;
  onlineStatus: boolean;
  hardwareConcurrency: number;
  colorDepth: number;
  pixelRatio: number;
  localStorage: boolean;
  sessionStorage: boolean;
  indexedDB: boolean;
  webGL: string;
  canvas: string;
}

/**
 * Genera un hash simple a partir de una cadena
 */
function simpleHash(str: string): string {
  let hash = 0;
  if (str.length === 0) return hash.toString();
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36);
}

/**
 * Obtiene características del canvas para fingerprinting
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';
    
    canvas.width = 200;
    canvas.height = 50;
    
    // Dibujar texto con diferentes estilos
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('LaburAR Fingerprint', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Device Detection', 4, 35);
    
    return simpleHash(canvas.toDataURL());
  } catch (error) {
    return 'canvas-error';
  }
}

/**
 * Obtiene características de WebGL
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) return 'no-webgl';
    
    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    const vendor = debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown';
    const renderer = debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown';
    
    return simpleHash(`${vendor}|${renderer}`);
  } catch (error) {
    return 'webgl-error';
  }
}

/**
 * Verifica disponibilidad de tecnologías de almacenamiento
 */
function checkStorageSupport() {
  const testLocalStorage = (): boolean => {
    try {
      localStorage.setItem('test', 'test');
      localStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  };

  const testSessionStorage = (): boolean => {
    try {
      sessionStorage.setItem('test', 'test');
      sessionStorage.removeItem('test');
      return true;
    } catch {
      return false;
    }
  };

  const testIndexedDB = (): boolean => {
    return typeof indexedDB !== 'undefined';
  };

  return {
    localStorage: testLocalStorage(),
    sessionStorage: testSessionStorage(),
    indexedDB: testIndexedDB()
  };
}

/**
 * Recopila todas las características del dispositivo
 */
function collectFingerprintData(): FingerprintData {
  const storage = checkStorageSupport();
  
  return {
    userAgent: navigator.userAgent,
    language: navigator.language || 'unknown',
    platform: navigator.platform || 'unknown',
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    cookieEnabled: navigator.cookieEnabled,
    onlineStatus: navigator.onLine,
    hardwareConcurrency: navigator.hardwareConcurrency || 0,
    colorDepth: screen.colorDepth || 0,
    pixelRatio: window.devicePixelRatio || 1,
    localStorage: storage.localStorage,
    sessionStorage: storage.sessionStorage,
    indexedDB: storage.indexedDB,
    webGL: getWebGLFingerprint(),
    canvas: getCanvasFingerprint()
  };
}

/**
 * Genera un device fingerprint único
 */
export function generateDeviceFingerprint(): string {
  try {
    const data = collectFingerprintData();
    
    // Crear string único combinando todas las características
    const fingerprintString = [
      data.userAgent,
      data.language,
      data.platform,
      data.screenResolution,
      data.timezone,
      data.cookieEnabled.toString(),
      data.onlineStatus.toString(),
      data.hardwareConcurrency.toString(),
      data.colorDepth.toString(),
      data.pixelRatio.toString(),
      data.localStorage.toString(),
      data.sessionStorage.toString(),
      data.indexedDB.toString(),
      data.webGL,
      data.canvas
    ].join('|');
    
    // Generar hash final con prefijo identificador
    const hash = simpleHash(fingerprintString);
    return `fp_${hash}_${Date.now().toString(36)}`;
    
  } catch (error) {
    console.warn('Error generando device fingerprint:', error);
    // Fallback: usar timestamp + random
    return `fp_fallback_${Date.now().toString(36)}_${Math.random().toString(36).substring(2)}`;
  }
}

/**
 * Obtiene la IP del cliente (depende del backend)
 */
export function getClientIP(): Promise<string> {
  return new Promise((resolve) => {
    // Esta función depende de que el backend retorne la IP
    // Por ahora retornamos 'unknown' ya que la IP se detecta en el backend
    resolve('unknown');
  });
}

/**
 * Verifica si el fingerprint está en localStorage para persistencia
 */
export function getCachedFingerprint(): string | null {
  try {
    return localStorage.getItem('laburar_device_fp');
  } catch {
    return null;
  }
}

/**
 * Guarda el fingerprint en localStorage
 */
export function cacheFingerprint(fingerprint: string): void {
  try {
    localStorage.setItem('laburar_device_fp', fingerprint);
  } catch {
    // Silently fail if localStorage is not available
  }
}

/**
 * Obtiene o genera un device fingerprint con cache
 */
export function getOrGenerateFingerprint(): string {
  const cached = getCachedFingerprint();
  if (cached) {
    return cached;
  }
  
  const newFingerprint = generateDeviceFingerprint();
  cacheFingerprint(newFingerprint);
  return newFingerprint;
}