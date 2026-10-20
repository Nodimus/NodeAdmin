/**
 * push-notification.service.ts
 * Implementação do Prompt 15:
 * - Gerenciamento de Web Push API com chaves VAPID
 * - Solicita permissão APENAS após login no admin
 * - Suporte a desativação voluntária
 * - Detecção do requisito do iOS (app instalado na tela inicial como PWA)
 */

export interface PushStatus {
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  requiresPWAInstallOnIOS: boolean;
}

class PushNotificationService {
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async getStatus(): Promise<PushStatus> {
    if (typeof window === 'undefined') {
      return {
        supported: false,
        permission: 'default',
        subscribed: false,
        isIOS: false,
        isStandalone: false,
        requiresPWAInstallOnIOS: false,
      };
    }

    const ua = window.navigator.userAgent.toLowerCase();
    const isIOS = /iphone|ipad|ipod/.test(ua);
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;

    // No iOS, Web Push API só está disponível quando o app está adicionado à tela inicial (standalone)
    const requiresPWAInstallOnIOS = isIOS && !isStandalone;
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    const permission = typeof Notification !== 'undefined' ? Notification.permission : 'default';

    let subscribed = false;
    if (supported && 'serviceWorker' in navigator) {
      try {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        subscribed = !!sub;
      } catch {
        subscribed = false;
      }
    }

    return {
      supported,
      permission,
      subscribed,
      isIOS,
      isStandalone,
      requiresPWAInstallOnIOS,
    };
  }

  async subscribe(token: string): Promise<boolean> {
    const status = await this.getStatus();
    if (!status.supported) {
      throw new Error('Web Push não é suportado neste navegador.');
    }

    if (status.requiresPWAInstallOnIOS) {
      throw new Error('No iPhone/iPad, as notificações push exigem que o aplicativo esteja instalado na Tela de Início.');
    }

    // 1. Solicita permissão ao usuário
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      throw new Error('Permissão de notificações não concedida pelo usuário.');
    }

    // 2. Busca chave pública VAPID do servidor
    const resVapid = await fetch('/api/admin/push/vapid-public-key', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!resVapid.ok) {
      throw new Error('Não foi possível obter a chave pública VAPID do servidor.');
    }
    const { publicKey } = await resVapid.json();

    // 3. Obtém inscrição do PushManager
    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();
    if (!subscription) {
      const convertedVapidKey = this.urlBase64ToUint8Array(publicKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey as BufferSource,
      });
    }

    // 4. Envia inscrição para o servidor associando ao usuário e dispositivo
    const deviceId = localStorage.getItem('optoclin_device_id') || `dev_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    localStorage.setItem('optoclin_device_id', deviceId);

    const resSave = await fetch('/api/admin/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subscription: subscription.toJSON(),
        deviceId,
        userAgent: navigator.userAgent,
      }),
    });

    if (!resSave.ok) {
      const err = await resSave.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao registrar inscrição no servidor.');
    }

    return true;
  }

  async unsubscribe(token: string): Promise<boolean> {
    const deviceId = localStorage.getItem('optoclin_device_id');
    try {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await sub.unsubscribe();
        }
      }

      await fetch('/api/admin/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ deviceId }),
      });

      return true;
    } catch (e) {
      console.error('Erro ao cancelar inscrição push:', e);
      return false;
    }
  }

  async sendTestPush(token: string): Promise<any> {
    const res = await fetch('/api/admin/push/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Erro ao enviar notificação de teste.');
    }
    return res.json();
  }
}

export const pushNotificationService = new PushNotificationService();
