import { UdpTransport, WebUsbTransport } from '../src';
import { WRONG_ENVIRONMENT } from '../src/errors';

describe('Node entry', () => {
    it.each([false, true])('initializes UDP with debugLink=%s', async debugLink => {
        const transport = new UdpTransport({ id: 'test', messages: {}, debugLink });

        try {
            await expect(transport.init()).resolves.toMatchObject({ success: true });
        } finally {
            transport.stop();
        }
    });

    it('retains the WebUSB stub without browser globals', async () => {
        const error = jest.spyOn(console, 'error').mockImplementation(() => {});

        try {
            const transport = new WebUsbTransport({ id: 'test', messages: {} });

            await expect(transport.init()).resolves.toMatchObject({
                success: false,
                error: WRONG_ENVIRONMENT,
            });
        } finally {
            error.mockRestore();
        }
    });
});
