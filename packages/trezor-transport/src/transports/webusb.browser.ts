import { AbstractTransportMethodParams, AbstractTransportParams } from './abstract';
import { AbstractApiTransport } from './abstractApi';
import { UsbApi } from '../api/usb';
import { BrowserSessionsBackground } from '../sessions/background-browser';

type WebUsbTransportParams = AbstractTransportParams & {
    /** Opt in to cross-tab sessions by supplying the URL of a deployed SharedWorker. */
    sessionsBackgroundUrl?: string;
};

/**
 * WebUsbTransport
 * - chrome supported
 * - firefox not supported https://mozilla.github.io/standards-positions/#webusb
 */
export class WebUsbTransport extends AbstractApiTransport {
    public name = 'WebUsbTransport' as const;
    public apiType = 'usb' as const;

    private readonly sessionsBackgroundUrl;

    constructor({ logger, sessionsBackgroundUrl, ...rest }: WebUsbTransportParams) {
        super({
            api: new UsbApi({ usbInterface: navigator.usb, logger }),
            logger,
            ...rest,
        });
        this.sessionsBackgroundUrl = sessionsBackgroundUrl;
    }

    private async trySetSessionsBackground() {
        // AbstractApiTransport already provides local sessions. Desktop and native
        // consumers do not necessarily ship the worker used by Trezor Suite.
        if (!this.sessionsBackgroundUrl) return;

        try {
            const response = await fetch(this.sessionsBackgroundUrl, { method: 'HEAD' });
            if (!response.ok) {
                console.warn(
                    `Failed to fetch sessions-background SharedWorker from url: ${this.sessionsBackgroundUrl}`,
                );
            } else {
                this.sessionsBackground = new BrowserSessionsBackground(this.sessionsBackgroundUrl);
                // sessions client initiated with a request fn facilitating communication with a session backend (shared worker in case of webusb)
                this.sessionsClient.setBackground(this.sessionsBackground);
            }
        } catch (err) {
            console.warn(
                'Unable to load background-sharedworker. Falling back to use local module. Say bye bye to tabs synchronization. Error details: ',
                err.message,
            );
        }
    }

    public async init({ signal }: AbstractTransportMethodParams<'init'> = {}) {
        await this.trySetSessionsBackground();

        return super.init({ signal });
    }
}
